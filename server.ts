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

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
const mpClient = new MercadoPagoConfig({ accessToken: mpAccessToken || '' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
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

  // Enable CORS for all routes (important for split frontend/backend)
  app.use(cors());

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

  // Admin: Delete User entirely from Auth
  app.delete('/api/delete-user/:id', async (req, res) => {
    const userId = req.params.id;
    if (!userId) return res.status(400).json({ error: 'User ID missing' });
    
    try {
      // Deleta o usuário permanentemente do sistema de autenticação do Supabase
      const { data, error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
      res.json({ success: true, message: 'Usuário deletado da autenticação' });
    } catch (err: any) {
      console.error('Delete auth user error:', err);
      res.status(500).json({ error: `Erro ao deletar autenticação: ${err.message}` });
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
      const { plan_id, username } = req.body;

      if (!mpAccessToken) {
        return res.status(500).json({ error: 'Mercado Pago não configurado no servidor (.env).' });
      }

      const { data: plan, error: planError } = await supabase.from('plans').select('*').eq('id', plan_id).single();
      if (planError || !plan) return res.status(404).json({ error: 'Plano não encontrado no banco de dados' });

      let client = null;
      if (username) {
        const { data: c } = await supabase.from('clients').select('*').eq('username', username).single();
        client = c;
      }

      const preference = new Preference(mpClient);
      const reqHost = req.get('host') ? `https://${req.get('host')}` : '';

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
          external_reference: username ? `${username}|${plan.id}` : `guest|${plan.id}`,
          back_urls: {
            success: `${reqHost}/success`,
            failure: `${reqHost}/checkout`,
            pending: `${reqHost}/checkout`
          },
          auto_return: "approved",
          notification_url: `${reqHost}/api/webhooks/mercadopago`
        }
      });

      res.json({ init_point: response.init_point });
    } catch (err: any) {
      console.error('Error creating preference:', err);
      res.status(500).json({ error: 'Erro ao criar preferência de pagamento' });
    }
  });

  // Webhook Mercado Pago
  app.post('/api/webhooks/mercadopago', async (req, res) => {
    try {
      const { action, data, type } = req.body;

      if (type === 'payment' || action === 'payment.created') {
        const paymentId = data?.id;
        if (!paymentId) return res.sendStatus(200);

        const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: { Authorization: `Bearer ${mpAccessToken}` }
        });

        if (!response.ok) return res.sendStatus(200);

        const paymentData = await response.json();

        if (paymentData.status === 'approved') {
          const externalRef = paymentData.external_reference;
          if (externalRef && externalRef.includes('|')) {
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
                  sub: `Mercado Pago (Checkout Pro)`,
                  status: 'Pago'
                }]);
              }

              // Send Push Notification
              const { data: subscriptions } = await supabase.from('push_subscriptions').select('subscription_json').eq('email', client.email);
              if (subscriptions && subscriptions.length > 0) {
                const payload = JSON.stringify({
                  title: 'Pagamento Aprovado! 🎉',
                  body: `Seu plano "${plan.name}" foi ativado/renovado. Novo vencimento: ${newExpDate}`,
                  url: `/dashboard`
                });
                subscriptions.forEach(sub => {
                  try {
                    const options = { TTL: 86400, urgency: 'high' };
                    webpush.sendNotification(JSON.parse(sub.subscription_json), payload, options).catch(() => { });
                  } catch (e) { }
                });
              }
            }
          }
        }
      }

      res.sendStatus(200);
    } catch (err) {
      console.error('Webhook Error:', err);
      res.sendStatus(500);
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
    const { email, subscription } = req.body;
    try {
      await supabase.from('push_subscriptions').upsert([{
        email,
        subscription_json: JSON.stringify(subscription)
      }], { onConflict: 'subscription_json' });
      res.status(201).json({});
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/send-push', async (req, res) => {
    const { title, message, email } = req.body;

    let query = supabase.from('push_subscriptions').select('subscription_json');
    if (email) {
      query = query.eq('email', email);
    }
    const { data: subscriptions, error } = await query;
    if (error) {
      console.error('Falha ao buscar assinaturas no db:', error);
      return res.status(400).json({ error: `Falha ao buscar assinaturas: ${error.message}` });
    }
    if (!subscriptions) {
      return res.status(400).json({ error: 'Nenhuma assinatura de push encontrada' });
    }

    const reqHost = req.get('host') ? `https://${req.get('host')}` : '';
    const payload = JSON.stringify({
      title,
      body: message,
      url: `${reqHost}/dashboard`
    });

    const promises = subscriptions.map(sub => {
      const pushSubscription = JSON.parse(sub.subscription_json);
      const options = { TTL: 86400, urgency: 'high' };
      return webpush.sendNotification(pushSubscription, payload, options)
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

  // Setup automatic daily job for sending due date notifications
  cron.schedule('0 9 * * *', async () => {
    console.log('Running daily expiration check...');
    const { data: clients } = await supabase.from('clients').select('*');
    if (!clients) return;

    const today = new Date();

    for (const client of clients) {
      if (!client.expiration_date) continue;
      const [day, month, year] = client.expiration_date.split('/');
      if (!day || !month || !year) continue;

      const expDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const diffTime = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let message = '';
      if (diffDays === 7) {
        message = `Olá ${client.name}, sua assinatura vence em 7 dias (uma semana). Fique atento à renovação para não perder acesso.`;
      } else if (diffDays === 3) {
        message = `Atenção ${client.name}! Sua assinatura vence em 3 dias. Adote uma renovação rápida entrando em contato com a equipe.`;
      } else if (diffDays === 0) {
        message = `⚠️ ${client.name}, sua assinatura vence HOJE! Por favor, realize a renovação imediatamente.`;
      } else if (diffDays === -2) {
        message = `❌ ${client.name}, sua assinatura venceu há 2 dias. Seu acesso está pendente, renove para continuar.`;
      } else if (diffDays === -4) {
        message = `⛔ ${client.name}, sua assinatura venceu há 4 dias. Seu serviço poderá ser permanentemente suspenso, não perca tempo!`;
      }

      if (message) {
        const { data: subscriptions } = await supabase.from('push_subscriptions').select('subscription_json').eq('email', client.email);
        if (subscriptions) {
          const reqHost = process.env.VITE_API_URL || '';
          const payload = JSON.stringify({ 
            title: 'Aviso de Assinatura', 
            body: message,
            url: `${reqHost}/dashboard`
          });

          const promises = subscriptions.map(sub => {
            const pushSubscription = JSON.parse(sub.subscription_json);
            const options = { TTL: 86400, urgency: 'high' };
            return webpush.sendNotification(pushSubscription, payload, options).catch(err => {
              if (err.statusCode === 404 || err.statusCode === 410) {
                supabase.from('push_subscriptions').delete().eq('subscription_json', sub.subscription_json).then();
              }
            });
          });

          await Promise.all(promises);
        }
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Em produção (Render), servimos apenas a API e pulamos o frontend
    app.get('/', (req, res) => {
      res.json({ message: 'ITWF Backend API Running Successfully' });
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
