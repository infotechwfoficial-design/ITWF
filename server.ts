import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import webpush from 'web-push';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { GoogleGenerativeAI as GoogleGenAI } from '@google/generative-ai';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

dotenv.config();

const ai = new GoogleGenAI(process.env.GEMINI_API_KEY || '');

// Note: Payment clients will be initialized dynamically per request
// using data from the 'payment_settings' table in Supabase.

// MEMÓRIA PARA MONITORAMENTO ESPORTIVO (SPORTMONKS)
let lastMatchScores: Record<number, { home: number; away: number; name: string }> = {};
let sportmonksPollingInterval: NodeJS.Timeout | null = null;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
// Backend usa service_role key para não ser afetado por RLS
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Configure web-push
const publicVapidKey = process.env.VITE_VAPID_PUBLIC_KEY || 'BHxacd_CxUxPuwPGqmyySkDTNHvop0IKLyZ3EExEmMMEDlMoFXntORvw_Ss7dI-2XNjoGRT-EZmUk5O4qEGZ76o';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || 'SchGx25Ck70ZzpiHBIB2zhiob5bSxEACbM38AqqyOIw';

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:admin@itwf.com',
  publicVapidKey,
  privateVapidKey
);

async function startServer() {
  const app = express();

  // CORS configurado para aceitar frontend na Vercel e localhost (dev)
  app.use(cors({
    origin: [
      'https://itwf.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000'
    ],
    credentials: true
  }));

  app.use(express.json());

  // Chatbot Gemini Endpoint
  app.post('/api/chat', async (req, res) => {
    try {
      const { history, message } = req.body;

      let contents = [
        {
          role: 'user',
          parts: [{ text: "System Prompt: Você é a assistente virtual da ITWF Sistemas de TI. Seu papel é educado e formal, exclusivo para auxiliar e responder dúvidas sobre RENOVAÇÕES de assinaturas, ou como criar PEDIDOS de Filmes/Séries/Conteúdos. Regra 1: o WhatsApp oficial da empresa é (84) 99676-4125 e deve ser recomendado APENAS para problemas financeiros/complexos ou quando perguntarem; Regra 2: Para renovar, o cliente deve clicar na aba Serviços e Renovação no sistema; Regra 3: Para pedir filmes/séries o cliente deve clicar na aba Fazer Novo Pedido; Regra 4: Seja curta e direta nas respostas, não elabore grandes textos maçantes; Regra 5: Sempre responda normalmente se o usuário for amigável (Olá, bom dia, etc). Baseado nisso, continue a conversa ajudando o cliente." }]
        },
        { role: 'model', parts: [{ text: "Entendido, serei curta, prestativa e gentil focada em renovações e pedidos com base nas regras da ITWF Sistemas." }] }
      ];

      if (history && history.length > 0) {
        const mappedHistory = history.map((h: any) => ({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }]
        }));
        contents = contents.concat(mappedHistory);
      }

      contents.push({ role: 'user', parts: [{ text: message }] });

      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent({ contents });
      const response = await result.response;
      res.json({ reply: response.text() });
  } catch (err: any) {
    console.error('Erro no Gemini:', err);
    res.status(500).json({ error: 'Erro ao processar mensagem com Inteligência Artificial' });
  }
});

  // Plans Endpoint
  app.get('/api/plans', async (req, res) => {
    try {
      const { data, error } = await supabase.from('plans').select('*').order('id', { ascending: true });
      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/plans', async (req, res) => {
    const { name, price, duration, features } = req.body;
    try {
      const { data, error } = await supabase.from('plans').insert([{
        name,
        price,
        duration,
        payment_link: '',
        features: JSON.stringify(features || [])
      }]).select().single();
      if (error) throw error;
      res.status(201).json({ id: data.id });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/plans/:id', async (req, res) => {
    const { id } = req.params;
    const { name, price, duration, features } = req.body;
    try {
      const { error } = await supabase.from('plans').update({
        name, price, duration, features: JSON.stringify(features || [])
      }).eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/plans/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('plans').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Create Mercado Pago Preference
  app.post('/api/create-preference', async (req, res) => {
    try {
      const { plan_id, email, provider = 'mercadopago' } = req.body;

      // 1. Buscar configurações do provedor no Banco de Dados
      const { data: setting, error: settingError } = await supabase
        .from('payment_settings')
        .select('*')
        .eq('provider', provider)
        .single();

      if (settingError || !setting || !setting.active) {
        return res.status(400).json({ error: `O provedor de pagamento ${provider} não está configurado ou ativo.` });
      }

      const credentials = setting.credentials || {};
      const token = credentials.token;

      if (!token) {
        return res.status(500).json({ error: `Credenciais do ${provider} não encontradas.` });
      }

      // 2. Buscar o plano
      const { data: plan, error: planError } = await supabase.from('plans').select('*').eq('id', plan_id).single();
      if (planError || !plan) return res.status(404).json({ error: 'Plano não encontrado no banco de dados' });

      // 3. Buscar o cliente (opcional)
      let client = null;
      if (email) {
        const { data: c } = await supabase.from('clients').select('*').eq('email', email).single();
        client = c;
      }

      const reqHost = req.get('host') ? (req.secure || req.get('host')?.includes('localhost') ? `http://${req.get('host')}` : `https://${req.get('host')}`) : '';
      const externalReference = email ? `${email}|${plan.id}` : `guest|${plan.id}`;

      // --- LOGICA POR PROVEDOR ---

      if (provider === 'mercadopago') {
        const localMpClient = new MercadoPagoConfig({ accessToken: token });
        const preference = new Preference(localMpClient);

        const response = await preference.create({
          body: {
            items: [
              {
                id: plan.id.toString(),
                title: plan.name,
                quantity: 1,
                unit_price: Number(plan.price)
              }
            ],
            payer: {
              email: client?.email || 'admin@itwf.com',
              name: client?.name || 'Cliente ITWF'
            },
            external_reference: externalReference,
            back_urls: {
              success: `${reqHost}/success`,
              failure: `${reqHost}/checkout`,
              pending: `${reqHost}/checkout`
            },
            auto_return: "approved",
            notification_url: `${reqHost}/api/webhooks/mercadopago`
          }
        });

        return res.json({ init_point: response.init_point });
      }

      if (provider === 'stripe') {
        const stripe = new Stripe(token);
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [{
            price_data: {
              currency: 'brl',
              product_data: {
                name: plan.name,
                description: `Assinatura ITWF - ${plan.duration}`,
              },
              unit_amount: Math.round(Number(plan.price) * 100),
            },
            quantity: 1,
          }],
          mode: 'payment',
          success_url: `${reqHost}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${reqHost}/checkout`,
          client_reference_id: externalReference,
          customer_email: client?.email || undefined,
        });

        return res.json({ init_point: session.url });
      }

      if (provider === 'asaas') {
        // Asaas API v3
        const asaasUrl = setting.is_sandbox ? 'https://sandbox.asaas.com/api/v3' : 'https://www.asaas.com/api/v3';
        
        const response = await fetch(`${asaasUrl}/payments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'access_token': token
          },
          body: JSON.stringify({
            billingType: 'UNDEFINED', // Permite que o cliente escolha no checkout do Asaas
            value: Number(plan.price),
            dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // 1 dia de vencimento
            description: `Plano ${plan.name} - ITWF`,
            externalReference: externalReference,
            customer: undefined // O Asaas exige criar um cliente antes se quiser faturar direto, 
            // mas podemos usar o Checkout deles se tivermos o e-mail
          })
        });

        const data = await response.json();
        if (data.invoiceUrl) {
          return res.json({ init_point: data.invoiceUrl });
        } else {
          throw new Error(data.errors?.[0]?.description || 'Erro no Asaas');
        }
      }

      res.status(400).json({ error: 'Provedor não suportado para criação de preferência' });
    } catch (err: any) {
      console.error('Erro ao criar sessão de pagamento:', err);
      res.status(500).json({ error: err.message || 'Erro ao criar sessão de pagamento' });
    }
  });

  // Helper para processar pagamentos de qualquer gateway
  // Cache de logos de administradores para evitar múltiplas consultas ao DB
  const adminLogoCache = new Map<string | null, string>();

  async function getAdminLogo(adminId: string | null): Promise<string> {
    const appUrl = process.env.VITE_APP_URL || 'https://itwf.vercel.app';
    const defaultLogo = `${appUrl}/logo.png`;

    if (!adminId) return defaultLogo;
    if (adminLogoCache.has(adminId)) return adminLogoCache.get(adminId)!;

    try {
      const { data: adminAuth } = await supabase.from('admins').select('user_id').eq('id', adminId).maybeSingle();
      const userId = adminAuth?.user_id || adminId;

      const { data: adminProfile } = await supabase.from('clients').select('push_logo_url').eq('user_id', userId).maybeSingle();
      const logo = adminProfile?.push_logo_url || defaultLogo;

      adminLogoCache.set(adminId, logo);
      return logo;
    } catch (e) {
      console.error(`[AdminLogo Error] Falha ao buscar logo para ${adminId}:`, e);
      return defaultLogo;
    }
  }

  async function sendPushNotification(subscriptionJson: string, payload: any, adminId?: string | null) {
    try {
      const pushSubscription = JSON.parse(subscriptionJson);
      const logo = await getAdminLogo(adminId || null);

      const finalPayload = JSON.stringify({
        ...payload,
        icon: payload.icon || logo,
        badge: payload.badge || logo
      });

      return webpush.sendNotification(pushSubscription, finalPayload)
        .catch(async (err) => {
          if (err.statusCode === 404 || err.statusCode === 410) {
            console.log(`[Push] Removendo inscrição inválida (${err.statusCode})`);
            await supabase.from('push_subscriptions').delete().eq('subscription_json', subscriptionJson);
          }
        });
    } catch (e) {
      console.error('[Erro Push] Falha ao enviar notificação:', e);
    }
  }

  async function processApprovedPayment(externalRef: string, providerName: string) {
    if (!externalRef || !externalRef.includes('|')) return;

    const [userEmail, planId] = externalRef.split('|');

    const { data: client } = await supabase.from('clients').select('*').eq('email', userEmail).single();
    const { data: plan } = await supabase.from('plans').select('*').eq('id', planId).single();

    if (client && plan) {
      let monthsToAdd = 1;
      const durStr = (plan.duration || '').toLowerCase();
      if (durStr.includes('3') || durStr.includes('trimestral')) monthsToAdd = 3;
      else if (durStr.includes('6') || durStr.includes('semestral')) monthsToAdd = 6;
      else if (durStr.includes('12') || durStr.includes('anual')) monthsToAdd = 12;

      let baseDate = new Date();
      if (client.expiration_date) {
        const [day, month, year] = client.expiration_date.split('/');
        const expDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (expDate > baseDate) baseDate = expDate;
      }

      baseDate.setMonth(baseDate.getMonth() + monthsToAdd);
      const newExpDate = `${String(baseDate.getDate()).padStart(2, '0')}/${String(baseDate.getMonth() + 1).padStart(2, '0')}/${baseDate.getFullYear()}`;

      // Update Client expiration in Supabase
      await supabase.from('clients').update({ expiration_date: newExpDate }).eq('email', userEmail);

      // Create Invoice Record
      const invoiceDate = `${String(new Date().getDate()).padStart(2, '0')}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`;

      if (client.user_id) {
        await supabase.from('invoices').insert([{
          user_id: client.user_id,
          description: `Renovação de Planos - ${plan.name}`,
          value: Number(plan.price),
          date: invoiceDate,
          type: 'premium',
          sub: `${providerName} (Automático)`,
          status: 'Pago'
        }]);
      }

      // Send Push Notification
      const { data: subscriptions } = await supabase.from('push_subscriptions').select('subscription_json, admin_id').eq('email', userEmail);
      if (subscriptions && subscriptions.length > 0) {
        for (const sub of subscriptions) {
          const payload = {
            title: 'Pagamento Aprovado! 🎉',
            body: `Seu plano "${plan.name}" foi ativado/renovado. Novo vencimento: ${newExpDate}`,
            url: '/invoices'
          };
          await sendPushNotification(sub.subscription_json, payload, sub.admin_id);
        }
      }
    }
  }

  // Webhook Mercado Pago
  app.post('/api/webhooks/mercadopago', async (req, res) => {
    try {
      const { action, data, type } = req.body;

      if (type === 'payment' || action === 'payment.created' || action === 'payment.updated') {
        const paymentId = data?.id;
        if (!paymentId) return res.sendStatus(200);

        // Buscar token no banco
        const { data: setting } = await supabase.from('payment_settings').select('*').eq('provider', 'mercadopago').single();
        const token = setting?.credentials?.token;

        if (!token) return res.sendStatus(200);

        const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) return res.sendStatus(200);
        const paymentData = await response.json();

        if (paymentData.status === 'approved') {
          await processApprovedPayment(paymentData.external_reference, 'Mercado Pago');
        }
      }
      res.sendStatus(200);
    } catch (err) {
      console.error('Erro no Webhook do Mercado Pago:', err);
      res.sendStatus(200); // MP recomenda sempre 200 para evitar retentativas infinitas em falhas parciais
    }
  });

  // Webhook Stripe
  app.post('/api/webhooks/stripe', async (req, res) => {
    try {
      // Nota: Para produção, deveríamos validar a assinatura com stripe.webhooks.constructEvent
      const event = req.body;

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        await processApprovedPayment(session.client_reference_id, 'Stripe');
      }

      res.json({ received: true });
    } catch (err) {
      console.error('Erro no Webhook do Stripe:', err);
      res.status(400).send(`Erro no Webhook`);
    }
  });

  // Webhook Asaas
  app.post('/api/webhooks/asaas', async (req, res) => {
    try {
      const { event, payment } = req.body;

      // Validar token no header se configurado
      const { data: setting } = await supabase.from('payment_settings').select('*').eq('provider', 'asaas').single();
      const webhookSecret = setting?.webhook_secret;

      if (webhookSecret && req.headers['asaas-access-token'] !== webhookSecret) {
        return res.status(401).send('Unauthorized');
      }

      if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
        await processApprovedPayment(payment.externalReference, 'Asaas');
      }

      res.sendStatus(200);
    } catch (err) {
      console.error('Erro no Webhook do Asaas:', err);
      res.sendStatus(200);
    }
  });

  app.get('/api/notifications', async (req, res) => {
    try {
      const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error('Erro ao buscar notificações', error);
        return res.json([]);
      }
      res.json(data);
    } catch (err: any) {
      res.json([]);
    }
  });

  app.post('/api/notifications', async (req, res) => {
    const { title, message, type } = req.body;
    try {
      const { data, error } = await supabase.from('notifications').insert([{ title, message, type }]).select().single();
      if (error) throw error;
      res.json({ id: data.id });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/notifications/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const { error } = await supabase.auth.admin.deleteUser(id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      console.error('Erro ao deletar usuário Auth:', err);
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/subscribe', async (req, res) => {
    const { email, username, subscription, adminId } = req.body;
    try {
      await supabase.from('push_subscriptions').upsert([{
        email,
        username,
        admin_id: adminId,
        subscription_json: JSON.stringify(subscription)
      }], { onConflict: 'subscription_json' });
      res.status(201).json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/push-stats', async (req, res) => {
    const { adminId } = req.query;
    try {
      let query = supabase.from('push_subscriptions').select('*', { count: 'exact', head: true });
      if (adminId) {
        query = query.eq('admin_id', adminId);
      }
      const { count, error } = await query;
      res.json({ count: count || 0 });
    } catch (err) {
      console.error('Erro ao buscar estatísticas de push', err);
      res.json({ count: 0 });
    }
  });

  app.post('/api/send-push', async (req, res) => {
    const { title, message, email, username, adminId } = req.body;
    console.log(`[Push API] Requisitado: ${username || email || 'all'} de Admin: ${adminId}`);

    try {
      // 1. Verificar permissão e identificar o alvo
      let filterUsername = username;
      let filterEmail = email;

      const { data: senderAdmin } = await supabase.from('admins').select('role').eq('user_id', adminId).single();
      const isMaster = senderAdmin?.role === 'master';

      if (username || email) {
        // Push Direto: Verificar se o admin tem permissão para este cliente
        const { data: clientData } = await supabase
          .from('clients')
          .select('username, email, admin_id')
          .or(`username.eq.${username},email.eq.${email}`)
          .maybeSingle();

        if (!clientData) {
          return res.status(404).json({ error: 'Cliente não encontrado.' });
        }

        if (!isMaster && clientData.admin_id !== adminId) {
          return res.status(403).json({ error: 'Acesso negado. Este cliente pertence a outro revendedor.' });
        }

        filterUsername = clientData.username;
        filterEmail = clientData.email;
      }

      // 2. Buscar assinaturas
      let query = supabase.from('push_subscriptions').select('subscription_json, admin_id');
      
      if (filterUsername) {
        query = query.eq('username', filterUsername);
      } else if (filterEmail) {
        query = query.eq('email', filterEmail);
      } else if (adminId && !isMaster) {
        // Broadcast apenas para os assinantes vinculados a este admin
        query = query.eq('admin_id', adminId);
      }

      const { data: subscriptions, error } = await query;

      if (error || !subscriptions) {
        console.error('[Push API Error]', error);
        return res.status(400).json({ error: 'Erro ao buscar inscritos' });
      }

      if (subscriptions.length === 0) {
        return res.json({ success: true, count: 0, message: 'Nenhuma assinatura ativa encontrada para este alvo.' });
      }

      const promises = subscriptions.map((sub) => {
        const payload = {
          title,
          body: message,
          url: '/dashboard'
        };
        return sendPushNotification(sub.subscription_json, payload, sub.admin_id);
      });

      await Promise.all(promises);
      res.json({ success: true, count: subscriptions.length });
    } catch (err: any) {
      console.error('[Push API Fatal Error]', err);
      res.status(500).json({ error: 'Erro interno ao processar notificações' });
    }
  });

  // Keep-alive: pinga a si mesmo a cada 5 min para o Render não dormir
  const RENDER_URL = process.env.RENDER_EXTERNAL_URL || 'https://itwf.onrender.com';
  setInterval(() => {
    fetch(`${RENDER_URL}/api/plans`).catch(() => {});
    console.log(`[Keep-alive] Ping enviado às ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
  }, 5 * 60 * 1000);

  // Controle para não enviar a mesma notificação mais de 1x por dia
  const notifiedToday = new Set<string>();

  // Cron 3x ao dia: 8h, 14h, 20h (horário de Brasília = 11h, 17h, 23h UTC)
  cron.schedule('0 11,17,23 * * *', async () => {
    const brTime = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    console.log(`[Cron] Verificação de vencimento iniciada às ${brTime}`);

    const { data: clients } = await supabase.from('clients').select('*');
    if (!clients) return;

    const today = new Date();
    const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

    for (const client of clients) {
      if (!client.expiration_date) continue;
      const [day, month, year] = client.expiration_date.split('/');
      if (!day || !month || !year) continue;

      const expDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const diffTime = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let message = '';
      let title = 'Aviso de Assinatura';

      // Antes do vencimento
      if (diffDays === 15) {
        message = `📢 Olá ${client.name}, sua assinatura vence em 15 dias. Planeje sua renovação com antecedência!`;
      } else if (diffDays === 7) {
        message = `📅 Olá ${client.name}, sua assinatura vence em 7 dias (uma semana). Fique atento à renovação!`;
      } else if (diffDays === 5) {
        message = `⏰ ${client.name}, sua assinatura vence em 5 dias. Não deixe para última hora!`;
      } else if (diffDays === 3) {
        message = `⚡ Atenção ${client.name}! Sua assinatura vence em 3 dias. Renove agora!`;
      } else if (diffDays === 1) {
        message = `🔔 ${client.name}, sua assinatura vence AMANHÃ! Renove hoje para não perder acesso.`;
        title = '⚠️ Vencimento Amanhã';
      } else if (diffDays === 0) {
        message = `⚠️ ${client.name}, sua assinatura vence HOJE! Renove imediatamente para não perder acesso.`;
        title = '🚨 Vence Hoje!';
      }
      // Após o vencimento
      else if (diffDays === -1) {
        message = `❗ ${client.name}, sua assinatura venceu ontem. Renove agora para restaurar seu acesso.`;
        title = '❌ Assinatura Vencida';
      } else if (diffDays === -2) {
        message = `❌ ${client.name}, sua assinatura venceu há 2 dias. Seu acesso está pendente.`;
        title = '❌ Assinatura Vencida';
      } else if (diffDays === -3) {
        message = `🚫 ${client.name}, sua assinatura venceu há 3 dias. Renove urgentemente!`;
        title = '🚫 Acesso Suspenso';
      } else if (diffDays === -4) {
        message = `⛔ ${client.name}, sua assinatura venceu há 4 dias. Seu serviço poderá ser permanentemente suspenso!`;
        title = '⛔ Suspensão Iminente';
      } else if (diffDays === -5) {
        message = `🔴 ${client.name}, ÚLTIMO AVISO! Sua assinatura venceu há 5 dias. O acesso será encerrado.`;
        title = '🔴 Último Aviso!';
      }

      if (message) {
        // Evitar duplicatas no mesmo dia
        const notifKey = `${todayKey}-${client.id}-${diffDays}`;
        if (notifiedToday.has(notifKey)) continue;
        notifiedToday.add(notifKey);

        const { data: subscriptions } = await supabase.from('push_subscriptions').select('subscription_json, admin_id').eq('username', client.username);
        if (subscriptions && subscriptions.length > 0) {
          for (const sub of subscriptions) {
            const payload = {
              title,
              body: message,
              url: '/dashboard'
            };
            // Usar o helper centralizado: resolve IDs, usa cache e limpa tokens inválidos
            await sendPushNotification(sub.subscription_json, payload, sub.admin_id);
          }
          console.log(`[Cron] Notificação enviada para ${client.username} (${diffDays} dias)`);
        }
      }
    }

    console.log('[Cron] Verificação concluída. ' + notifiedToday.size + ' notificações enviadas hoje.');
  });

  // Limpar controle de duplicatas à meia-noite (3h UTC = 0h BR)
  cron.schedule('0 3 * * *', () => {
    notifiedToday.clear();
    console.log('[Cron] Controle de duplicatas resetado (meia-noite BR).');
  });

  // --- NOVA FUNCIONALIDADE: AGENDA ESPORTIVA ---

  async function fetchSportsAgenda(): Promise<string> {
    try {
      console.log('[Agenda Esportiva] Gerando prompt...');
      const today = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long', day: 'numeric', month: 'long' });
      
      const prompt = `Liste os 5 jogos de futebol MAIS IMPORTANTES para HOJE (${today}).
      Critérios: Série A/B, Copa do Brasil, Libertadores, ou Grandes Ligas Europeias.
      
      Formato: [EMOJI] TIME A x TIME B - Horário (Brasília) - Canal
      Título: ⚽ AGENDA ESPORTIVA ⚽
      
      Retorne APENAS o texto diretamente.`;

      console.log('[Agenda Esportiva] Chamando Gemini 1.5-Flash...');
      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const result = await model.generateContent(prompt + " (Use seus dados internos ou busca se necessário)");
      const response = await result.response;
      return response.text()?.trim() || '';
    } catch (err: any) {
      console.error('[Erro na Agenda Esportiva]', err);
      return '';
    }
  }

  app.post('/api/send-sports-push', async (req, res) => {
    console.log('[API] Recebida requisição para /api/send-sports-push');
    try {
      console.log('[Sports Push] Iniciando envio manual...');
      const message = await fetchSportsAgenda();
      
      if (!message) {
        return res.status(500).json({ error: 'Não foi possível obter a agenda esportiva.' });
      }

      // NOVO: Salvar a agenda na tabela de notificações para visualização no app
      await supabase.from('notifications').insert([{
        title: '⚽ Agenda Esportiva',
        message: message,
        type: 'info'
      }]);

      const { data: subscriptions } = await supabase.from('push_subscriptions').select('subscription_json, admin_id');
      if (!subscriptions || subscriptions.length === 0) {
        return res.status(404).json({ error: 'Nenhum inscrito encontrado.' });
      }

      const promises = subscriptions.map((sub) => {
        const payload = {
          title: '⚽ Agenda Esportiva do Dia',
          body: message,
          url: '/notifications'
        };
        return sendPushNotification(sub.subscription_json, payload, sub.admin_id);
      });

      await Promise.all(promises);
      res.json({ success: true, message: 'Agenda enviada e salva no sistema!' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- SERVIÇO SPORTMONKS (LIVE GOALS) ---
  
  async function checkLiveGoals() {
    const token = process.env.SPORTMONKS_API_TOKEN;
    if (!token) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const url = `https://api.sportmonks.com/v3/football/leagues/date/${today}?api_token=${token}&include=today.scores;today.participants`;
      
      const res = await fetch(url);
      const json = await res.json();
      
      if (!json.data || !Array.isArray(json.data)) return;

      for (const league of json.data) {
        if (!league.today || !Array.isArray(league.today)) continue;

        for (const fixture of league.today) {
          const fixtureId = fixture.id;
          const participants = fixture.participants || [];
          const scores = fixture.scores || [];

          const homeTeam = participants.find((p: any) => p.meta?.location === 'home');
          const awayTeam = participants.find((p: any) => p.meta?.location === 'away');
          
          if (!homeTeam || !awayTeam) continue;

          // Placar atual (procurando pelo score_type que indica o placar total ou atual)
          // Na v3, geralmente os scores têm campos como score.goals
          const homeScore = scores.find((s: any) => s.participant_id === homeTeam.id && s.description === 'CURRENT')?.score?.goals || 0;
          const awayScore = scores.find((s: any) => s.participant_id === awayTeam.id && s.description === 'CURRENT')?.score?.goals || 0;

          const matchName = `${homeTeam.name} x ${awayTeam.name}`;

          // Verifica se houve gol
          if (lastMatchScores[fixtureId]) {
            const last = lastMatchScores[fixtureId];
            if (homeScore > last.home || awayScore > last.away) {
              console.log(`[GOL!] ${matchName} (${homeScore} - ${awayScore})`);
              
              const message = `⚽ GOL DE PLACA!
${matchName}
Placar Atual: ${homeScore} - ${awayScore}`;

              // Dispara Push
              const { data: subs } = await supabase.from('push_subscriptions').select('subscription_json, admin_id');
              if (subs) {
                subs.forEach(sub => {
                  sendPushNotification(sub.subscription_json, {
                    title: '⚽ GOL EM TEMPO REAL!',
                    body: message,
                    url: '/sports'
                  }, sub.admin_id);
                });
              }
            }
          }

          // Atualiza estado
          lastMatchScores[fixtureId] = { home: homeScore, away: awayScore, name: matchName };
        }
      }
    } catch (err) {
      console.error('[Sportmonks Polling Error]', err);
    }
  }

  // Iniciar Polling a cada 60 segundos se o token existir
  if (process.env.SPORTMONKS_API_TOKEN) {
    console.log('[Sportmonks] Iniciando monitoramento de gols...');
    sportmonksPollingInterval = setInterval(checkLiveGoals, 60000);
  }

  // Cron Agenda Esportiva: Manhã (09:00 BRT / 12:00 UTC)
  cron.schedule('0 12 * * *', async () => {
    console.log('[Cron] Iniciando envio da Agenda Esportiva (Manhã)...');
    try {
      const message = await fetchSportsAgenda();
      if (!message) return;

      const { data: subscriptions } = await supabase.from('push_subscriptions').select('subscription_json, admin_id');
      if (!subscriptions) return;

      const appUrl = process.env.VITE_APP_URL || 'https://itwf.vercel.app';
      
      for (const sub of subscriptions) {
        const payload = {
          title: '⚽ Agenda Esportiva do Dia',
          body: message,
          url: '/dashboard'
        };
        await sendPushNotification(sub.subscription_json, payload, sub.admin_id);
      }
      console.log('[Cron] Agenda Esportiva (Manhã) enviada.');
    } catch (e) {
      console.error('[Cron] Falha na Agenda Esportiva (Manhã):', e);
    }
  });

  // Cron Agenda Esportiva: Tarde (15:00 BRT / 18:00 UTC)
  cron.schedule('0 18 * * *', async () => {
    console.log('[Cron] Iniciando envio da Agenda Esportiva (Tarde)...');
    try {
      const message = await fetchSportsAgenda();
      if (!message) return;

      const { data: subscriptions } = await supabase.from('push_subscriptions').select('subscription_json, admin_id');
      if (!subscriptions) return;

      const appUrl = process.env.VITE_APP_URL || 'https://itwf.vercel.app';
      
      for (const sub of subscriptions) {
        const payload = {
          title: '⚽ Agenda Esportiva do Dia',
          body: message,
          url: '/dashboard'
        };
        await sendPushNotification(sub.subscription_json, payload, sub.admin_id);
      }
      console.log('[Cron] Agenda Esportiva (Tarde) enviada.');
    } catch (e) {
      console.error('[Cron] Falha na Agenda Esportiva (Tarde):', e);
    }
  });

  // Cron Agenda Esportiva: Noite (21:00 BRT / 00:00 UTC)
  cron.schedule('0 0 * * *', async () => {
    console.log('[Cron] Iniciando envio da Agenda Esportiva (Noite)...');
    try {
      const message = await fetchSportsAgenda();
      if (!message) return;

      const { data: subscriptions } = await supabase.from('push_subscriptions').select('subscription_json, admin_id');
      if (!subscriptions) return;

      for (const sub of subscriptions) {
        const payload = {
          title: '⚽ Agenda Esportiva do Dia',
          body: message,
          url: '/dashboard'
        };
        await sendPushNotification(sub.subscription_json, payload, sub.admin_id);
      }
      console.log('[Cron] Agenda Esportiva (Noite) enviada.');
    } catch (e) {
      console.error('[Cron] Falha na Agenda Esportiva (Noite):', e);
    }
  });

  // ---------------------------------------------

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Seed plans natively missing if tables are created via script
async function seedInitialPlans() {
  try {
    const { data: plansCountData, error } = await supabase.from('plans').select('id', { count: 'exact' });
    if (!error && plansCountData && plansCountData.length === 0) {
      await supabase.from('plans').insert([
        { name: 'Básico Mensal', price: 29.90, duration: '1 Mês', payment_link: 'https://mercadopago.com.br', features: JSON.stringify(['1 Tela', 'Resolução HD', 'Suporte Básico']) },
        { name: 'Premium Trimestral', price: 84.90, duration: '3 Meses', payment_link: 'https://mercadopago.com.br', features: JSON.stringify(['2 Telas', 'Resolução 4K', 'Sem Anúncios']) },
        { name: 'Master Semestral', price: 159.90, duration: '6 Meses', payment_link: 'https://mercadopago.com.br', features: JSON.stringify(['4 Telas', 'Resolução 4K + HDR', 'Suporte Prioritário 24/7']) }
      ]);
      console.log('Seeded initial plans to Supabase');
    }
  } catch (e) {
    console.log('Could not seed plans automatically. They might already exist or table is inaccessible.');
  }
}

seedInitialPlans().then(() => {
  startServer();
});
