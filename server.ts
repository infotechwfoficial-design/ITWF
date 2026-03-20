import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import webpush from 'web-push';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { GoogleGenAI } from '@google/genai';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Note: Payment clients will be initialized dynamically per request
// using data from the 'payment_settings' table in Supabase.

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
        contents = contents.concat(history);
      }

      contents.push({ role: 'user', parts: [{ text: message }] });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents
      });

      res.json({ reply: response.text });
    } catch (err: any) {
      console.error('Gemini error:', err);
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
      const { plan_id, username, provider = 'mercadopago' } = req.body;

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
      if (username) {
        const { data: c } = await supabase.from('clients').select('*').eq('username', username).single();
        client = c;
      }

      const reqHost = req.get('host') ? (req.secure || req.get('host')?.includes('localhost') ? `http://${req.get('host')}` : `https://${req.get('host')}`) : '';
      const externalReference = username ? `${username}|${plan.id}` : `guest|${plan.id}`;

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
      console.error('Error creating payment session:', err);
      res.status(500).json({ error: err.message || 'Erro ao criar sessão de pagamento' });
    }
  });

  // Helper para processar pagamentos de qualquer gateway
  async function processApprovedPayment(externalRef: string, providerName: string) {
    if (!externalRef || !externalRef.includes('|')) return;

    const [username, planId] = externalRef.split('|');

    const { data: client } = await supabase.from('clients').select('*').eq('username', username).single();
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
      await supabase.from('clients').update({ expiration_date: newExpDate }).eq('username', username);

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
      const { data: subscriptions } = await supabase.from('push_subscriptions').select('subscription_json').eq('username', username);
      if (subscriptions && subscriptions.length > 0) {
        const appUrl = process.env.VITE_APP_URL || 'https://itwf.vercel.app';
        const payload = JSON.stringify({
          title: 'Pagamento Aprovado! 🎉',
          body: `Seu plano "${plan.name}" foi ativado/renovado. Novo vencimento: ${newExpDate}`,
          icon: `${appUrl}/logo.png`,
          badge: `${appUrl}/logo.png`,
          url: '/invoices'
        });
        subscriptions.forEach(sub => {
          try {
            webpush.sendNotification(JSON.parse(sub.subscription_json), payload).catch(() => { });
          } catch (e) { }
        });
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
      console.error('Mercado Pago Webhook Error:', err);
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
      console.error('Stripe Webhook Error:', err);
      res.status(400).send(`Webhook Error`);
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
      console.error('Asaas Webhook Error:', err);
      res.sendStatus(200);
    }
  });

  app.get('/api/notifications', async (req, res) => {
    try {
      const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error('Get Notifications Error', error);
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

  app.post('/api/subscribe', async (req, res) => {
    const { email, username, subscription, adminId } = req.body;
    try {
      await supabase.from('push_subscriptions').upsert([{
        email,
        username,
        admin_id: adminId,
        subscription_json: JSON.stringify(subscription)
      }], { onConflict: 'subscription_json' });
      res.status(201).json({});
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/send-push', async (req, res) => {
    const { title, message, email, username } = req.body;
    console.log(`Sending push for: ${username || email || 'all'}`);

    let query = supabase.from('push_subscriptions').select('subscription_json');
    if (username) {
      query = query.eq('username', username);
    } else if (email) {
      query = query.eq('email', email);
    }
    const { data: subscriptions, error } = await query;
    if (error || !subscriptions) {
      console.error('Push fetch error:', error);
      return res.status(400).json({ error: 'Failed to fetch subscriptions' });
    }

    const reqHost = req.headers['x-forwarded-host']
      ? `https://${req.headers['x-forwarded-host']}`
      : req.get('host')
        ? (req.get('host')!.includes('localhost') ? `http://${req.get('host')}` : `https://${req.get('host')}`)
        : '';
    const payload = JSON.stringify({
      title,
      body: message,
      icon: `${reqHost}/logo.png`,
      badge: `${reqHost}/logo.png`,
      url: '/dashboard'
    });

    const promises = subscriptions.map(sub => {
      const pushSubscription = JSON.parse(sub.subscription_json);
      return webpush.sendNotification(pushSubscription, payload)
        .catch(err => {
          console.error(`Push error for user ${email || 'all'}:`, err.statusCode, err.body || err.message);
          if (err.statusCode === 404 || err.statusCode === 410) {
            supabase.from('push_subscriptions').delete().eq('subscription_json', sub.subscription_json).then();
          }
        });
    });

    await Promise.all(promises);
    res.json({ success: true });
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

        const { data: subscriptions } = await supabase.from('push_subscriptions').select('subscription_json').eq('username', client.username);
        if (subscriptions && subscriptions.length > 0) {
          const appUrl = process.env.VITE_APP_URL || 'https://itwf.vercel.app';
          const payload = JSON.stringify({
            title,
            body: message,
            icon: `${appUrl}/logo.png`,
            badge: `${appUrl}/logo.png`,
            url: '/dashboard'
          });

          const promises = subscriptions.map(sub => {
            const pushSubscription = JSON.parse(sub.subscription_json);
            return webpush.sendNotification(pushSubscription, payload).catch(err => {
              console.error(`[Cron] Push falhou para ${client.username}:`, err.statusCode);
              if (err.statusCode === 404 || err.statusCode === 410) {
                supabase.from('push_subscriptions').delete().eq('subscription_json', sub.subscription_json).then();
              }
            });
          });

          await Promise.all(promises);
          console.log(`[Cron] Notificação enviada para ${client.username} (${diffDays} dias)`);
        }
      }
    }

    console.log(`[Cron] Verificação concluída. ${notifiedToday.size} notificações enviadas hoje.`);
  });

  // Limpar controle de duplicatas à meia-noite (3h UTC = 0h BR)
  cron.schedule('0 3 * * *', () => {
    notifiedToday.clear();
    console.log('[Cron] Controle de duplicatas resetado (meia-noite BR).');
  });

  // --- NOVA FUNCIONALIDADE: AGENDA ESPORTIVA ---

  async function fetchSportsAgenda(): Promise<string> {
    try {
      console.log('[Sports Agenda] Gerando prompt...');
      const now = new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
      const today = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long', day: 'numeric', month: 'long' });
      
      const prompt = `System Prompt: Você é um curador de elite de agenda esportiva. 
      Sua tarefa é fornecer os 5 jogos MAIS IMPORTANTES para HOJE (${today}) que serão transmitidos na TV Aberta do Brasil ou streaming gratuito.
      
      HORÁRIO ATUAL: ${now} (Brasília)
      
      CRITÉRIOS DE SELEÇÃO (Prioridade):
      1. Brasileirão Série A/B, Copa do Brasil, Libertadores, Sul-Americana.
      2. Champions League, Europa League, Premier League, La Liga, Bundesliga, Serie A (Itália).
      3. Grandes Clássicos ou Finais de outros esportes.
      4. IGNORE ligas menores ou jogos irrelevantes para o grande público.
      
      REGRAS DE FORMATAÇÃO:
      - Liste EXATAMENTE os 5 melhores jogos que AINDA NÃO TERMINARAM a partir de ${now}.
      - Se houver jogos acontecendo agora, use o prefixo "🔥 AO VIVO:".
      - Se forem em breve, use "🕒 EM BREVE:".
      - Use o formato: [EMOJI] TIME A x TIME B - Horário (Brasília) - Canal/Streaming
      - Título: ⚽ AGENDA DE ELITE ⚽\n🗓 ${today.toUpperCase()}
      
      Retorne APENAS o texto formatado.`;

      console.log('[Sports Agenda] Chamando Gemini...');
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      console.log('[Sports Agenda] Resposta recebida do Gemini.');
      return response.text.trim();
    } catch (err) {
      console.error('Error fetching sports agenda:', err);
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

      const { data: subscriptions } = await supabase.from('push_subscriptions').select('subscription_json');
      if (!subscriptions || subscriptions.length === 0) {
        return res.status(404).json({ error: 'Nenhum inscrito encontrado.' });
      }

      const reqHost = req.get('host') ? (req.get('host')!.includes('localhost') ? `http://${req.get('host')}` : `https://${req.get('host')}`) : '';
      const appUrl = process.env.VITE_APP_URL || (reqHost);
      
      const payload = JSON.stringify({
        title: '⚽ Agenda Esportiva do Dia',
        body: message,
        icon: `${appUrl}/logo.png`,
        badge: `${appUrl}/logo.png`,
        url: '/dashboard'
      });

      const promises = subscriptions.map(sub => {
        const pushSubscription = JSON.parse(sub.subscription_json);
        console.log(`[Sports Push] Enviando para: ${pushSubscription.endpoint.substring(0, 30)}...`);
        return webpush.sendNotification(pushSubscription, payload)
          .then(() => console.log(`[Sports Push] Sucesso no envio!`))
          .catch((err) => {
            console.error(`[Sports Push] Erro ao enviar para inscrição:`, err.statusCode, err.body || err.message);
          });
      });

      await Promise.all(promises);
      res.json({ success: true, message: 'Agenda enviada com sucesso!' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Cron Agenda Esportiva: Diariamente às 09:00 BRT (12:00 UTC)
  cron.schedule('0 12 * * *', async () => {
    console.log('[Cron] Iniciando envio da Agenda Esportiva...');
    try {
      const message = await fetchSportsAgenda();
      if (!message) return;

      const { data: subscriptions } = await supabase.from('push_subscriptions').select('subscription_json');
      if (!subscriptions) return;

      const appUrl = process.env.VITE_APP_URL || 'https://itwf.vercel.app';
      const payload = JSON.stringify({
        title: '⚽ Agenda Esportiva do Dia',
        body: message,
        icon: `${appUrl}/logo.png`,
        badge: `${appUrl}/logo.png`,
        url: '/dashboard'
      });

      subscriptions.forEach(sub => {
        try {
          webpush.sendNotification(JSON.parse(sub.subscription_json), payload).catch(() => {});
        } catch (e) {}
      });
      console.log('[Cron] Agenda Esportiva enviada.');
    } catch (e) {
      console.error('[Cron] Falha na Agenda Esportiva:', e);
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
