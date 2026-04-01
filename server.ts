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
import admin from 'firebase-admin';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- CONFIGURAÇÕES DE IA E SUPABASE ---
const ai = new GoogleGenAI(process.env.GEMINI_API_KEY || '');
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- CONFIGURAÇÕES PUSH (WEB & MOBILE) ---
const publicVapidKey = process.env.VITE_VAPID_PUBLIC_KEY || 'BHxacd_CxUxPuwPGqmyySkDTNHvop0IKLyZ3EExEmMMEDlMoFXntORvw_Ss7dI-2XNjoGRT-EZmUk5O4qEGZ76o';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || 'SchGx25Ck70ZzpiHBIB2zhiob5bSxEACbM38AqqyOIw';

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:admin@itwf.com',
  publicVapidKey,
  privateVapidKey
);

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('[Firebase] Admin SDK inicializado com sucesso.');
  } catch (e) {
    console.error('[Firebase] Erro ao inicializar Admin SDK.', e);
  }
}

// --- ESTADO GLOBAL / CACHE ---
const notifiedToday = new Set<string>();
const adminLogoCache = new Map<string | null, string>();
let cachedAgenda: { message: string, date: string } | null = null;
let lastMatchScores: Record<number, { home: number; away: number; name: string }> = {};
let sportmonksPollingInterval: NodeJS.Timeout | null = null;

// --- FUNÇÕES UTILITÁRIAS ---

async function getAdminLogo(adminId: string | null): Promise<string> {
  const appUrl = process.env.VITE_APP_URL || 'https://itwf.vercel.app';
  const defaultLogo = `${appUrl}/logo.png`;
  if (!adminId) return defaultLogo;
  if (adminLogoCache.has(adminId)) return adminLogoCache.get(adminId)!;
  try {
    // Busca o logo diretamente na tabela admins usando o ID (PK)
    const { data: adminProfile } = await supabase
      .from('admins')
      .select('push_logo_url')
      .eq('id', adminId)
      .maybeSingle();

    const logo = adminProfile?.push_logo_url || defaultLogo;
    adminLogoCache.set(adminId, logo);
    return logo;
  } catch (e) {
    console.error('[server] Erro ao buscar logo do admin:', e);
    return defaultLogo;
  }
}

async function sendPushNotification(subscriptionJson: string, payload: any, adminId?: string | null) {
  try {
    const logo = await getAdminLogo(adminId || null);
    const finalPayload = {
      ...payload,
      icon: payload.icon || logo,
      badge: payload.badge || logo,
      data: { ...payload.data, url: payload.url || '/dashboard' }
    };

    if (subscriptionJson && subscriptionJson.startsWith('{')) {
      const pushSubscription = JSON.parse(subscriptionJson);
      return webpush.sendNotification(pushSubscription, JSON.stringify(finalPayload))
        .catch(async (err) => {
          const isInvalid = err.statusCode === 404 || err.statusCode === 410 || err.statusCode === 403;
          if (isInvalid) {
            console.log(`[Push Web] Removendo inscrição inválida (${err.statusCode})`);
            await supabase.from('push_subscriptions').delete().eq('subscription_json', subscriptionJson);
          }
          throw err;
        });
    }
  } catch (e) {
    console.error('[Push Web Error]', e);
    throw e;
  }
}

async function sendFcmNotification(token: string, payload: any) {
  if (!admin.apps.length) return;
  try {
    await admin.messaging().send({
      token: token,
      notification: { title: payload.title, body: payload.body },
      data: { url: payload.url || '/dashboard' },
      android: { priority: 'high', notification: { channelId: 'default', clickAction: 'FLUTTER_NOTIFICATION_CLICK' } }
    });
  } catch (e: any) {
    if (e.code === 'messaging/registration-token-not-registered') {
      await supabase.from('fcm_tokens').delete().eq('token', token);
    }
    throw e;
  }
}

async function notifyUser(userId: string | null, email: string | null, username: string | null, payload: any, adminId: string | null) {
  const promises: Promise<any>[] = [];

  // Web Push
  let webQuery = supabase.from('push_subscriptions').select('subscription_json, admin_id');
  if (username) webQuery = webQuery.eq('username', username);
  else if (email) webQuery = webQuery.eq('email', email);
  
  const { data: webSubs } = await webQuery;
  if (webSubs) {
    webSubs.forEach(sub => promises.push(sendPushNotification(sub.subscription_json, payload, sub.admin_id || adminId)));
  }

  // Mobile Push
  let fcmQuery = supabase.from('fcm_tokens').select('token');
  if (userId) fcmQuery = fcmQuery.eq('user_id', userId);
  else if (email) fcmQuery = fcmQuery.eq('email', email);

  const { data: fcmTokens } = await fcmQuery;
  if (fcmTokens) {
    fcmTokens.forEach(fcm => promises.push(sendFcmNotification(fcm.token, payload)));
  }

  return Promise.allSettled(promises);
}

async function runVencimentosCheck() {
  const brTime = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  console.log(`[Cron/Manual] Verificação iniciada em ${brTime}`);

  const { data: clients } = await supabase.from('clients').select('*');
  if (!clients || clients.length === 0) return;

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const notificationsToSend: any[] = [];

  for (const client of clients) {
    if (!client.expiration_date) continue;
    const [day, month, year] = client.expiration_date.split('/');
    const expDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    let message = '';
    let title = 'Aviso de Assinatura';

    if (diffDays === 15) message = `📢 Olá ${client.name}, sua assinatura vence em 15 dias.`;
    else if (diffDays === 7) message = `📅 Olá ${client.name}, sua assinatura vence em 7 dias.`;
    else if (diffDays === 1) { message = `🔔 ${client.name}, vence AMANHÃ!`; title = '⚠️ Vencimento Amanhã'; }
    else if (diffDays === 0) { message = `⚠️ ${client.name}, vence HOJE!`; title = '🚨 Vence Hoje!'; }
    else if (diffDays < 0 && diffDays >= -5) { message = `❌ ${client.name}, sua assinatura venceu.`; title = '❌ Vencida'; }

    if (message) {
      const notifKey = `${todayKey}-${client.id}-${diffDays}`;
      if (notifiedToday.has(notifKey)) continue;
      notifiedToday.add(notifKey);
      notificationsToSend.push({ client, payload: { title, body: message, url: '/dashboard' } });
    }
  }

  if (notificationsToSend.length > 0) {
    const promises = notificationsToSend.map(n => notifyUser(n.client.user_id, n.client.email, n.client.username, n.payload, n.client.admin_id));
    await Promise.allSettled(promises);
  }
  console.log(`[Cron] Envio concluído (${notificationsToSend.length} pendentes).`);
}

async function fetchSportsAgenda(): Promise<string> {
  try {
    const now = new Date();
    const fullDateText = now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const prompt = `Hoje é ${fullDateText}. Primeiro, verifique a data atual. Em seguida, realize uma busca em tempo real nos principais portais de esporte do Brasil (GE, UOL Esporte, TNT Sports) e liste os 5 jogos de futebol mais importantes de HOJE, com foco total no Brasileirão Séries A e B. Além de times e horários, informe OBRIGATORIAMENTE onde assistir (Canais de TV ou Streaming). Formato: [EMOJI] TIME A x TIME B - Horário (Brasília) - [📺 Onde assistir]. Se não houver jogos importantes hoje, informe 'Sem jogos de destaque hoje'. Responda apenas com a lista diretamente.`;
    
    const model = ai.getGenerativeModel({ model: 'gemini-flash-latest', tools: [{ googleSearchRetrieval: {} }] as any });
    const result = await model.generateContent(prompt);
    return result.response.text()?.trim() || '';
  } catch (err) {
    console.error('[IA Agenda Error]', err);
    return '';
  }
}

async function runSportsAgendaPush() {
  const brDate = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const todayISO = new Date().toISOString().split('T')[0];
  console.log(`[Sports Auto-Push] Iniciando verificação para ${brDate}`);

  try {
    // Busca agenda do dia (se já gerada)
    let { data: dbAgenda } = await supabase
      .from('notifications')
      .select('message')
      .eq('title', '⚽ Agenda Esportiva')
      .gte('created_at', todayISO)
      .maybeSingle();

    let message = dbAgenda?.message || '';

    if (!message) {
      message = await fetchSportsAgenda();
      if (message && message !== 'Sem jogos de destaque hoje') {
        await supabase.from('notifications').insert([{ title: '⚽ Agenda Esportiva', message, type: 'info' }]);
      }
    }

    if (message && message !== 'Sem jogos de destaque hoje') {
      const { data: subs } = await supabase.from('push_subscriptions').select('subscription_json, admin_id');
      if (subs && subs.length > 0) {
        const promises = subs.map(s => sendPushNotification(s.subscription_json, { 
          title: '⚽ Agenda Esportiva do Dia', 
          body: message.substring(0, 500), // Evita payload muito grande
          url: '/notifications' 
        }, s.admin_id));
        await Promise.allSettled(promises);
        console.log(`[Sports Auto-Push] Agenda enviada para ${subs.length} inscritos.`);
      }
    } else {
      console.log('[Sports Auto-Push] Nenhuma agenda relevante encontrada para hoje.');
    }
  } catch (err) {
    console.error('[Sports Auto-Push Error]', err);
  }
}

async function checkLiveGoals() {
  const token = process.env.SPORTMONKS_API_TOKEN;
  if (!token) return;
  try {
    const today = new Date().toISOString().split('T')[0];
    const url = `https://api.sportmonks.com/v3/football/fixtures/date/${today}?api_token=${token}&include=scores;participants`;
    const res = await fetch(url);
    const json = await res.json();
    if (!json.data) return;

    for (const fixture of json.data) {
      const homeTeam = fixture.participants?.find((p: any) => p.meta?.location === 'home');
      const awayTeam = fixture.participants?.find((p: any) => p.meta?.location === 'away');
      if (!homeTeam || !awayTeam) continue;

      const homeScore = fixture.scores?.find((s: any) => s.participant_id === homeTeam.id && s.description === 'CURRENT')?.score?.goals || 0;
      const awayScore = fixture.scores?.find((s: any) => s.participant_id === awayTeam.id && s.description === 'CURRENT')?.score?.goals || 0;
      const fixtureId = fixture.id;

      if (lastMatchScores[fixtureId]) {
        const last = lastMatchScores[fixtureId];
        if (homeScore > last.home || awayScore > last.away) {
          const msg = `⚽ GOL! ${homeTeam.name} ${homeScore} x ${awayScore} ${awayTeam.name}`;
          const { data: subs } = await supabase.from('push_subscriptions').select('subscription_json, admin_id');
          if (subs) {
            subs.forEach(s => sendPushNotification(s.subscription_json, { title: '⚽ GOL EM TEMPO REAL!', body: msg, url: '/sports' }, s.admin_id));
          }
        }
      }
      lastMatchScores[fixtureId] = { home: homeScore, away: awayScore, name: `${homeTeam.name} x ${awayTeam.name}` };
    }
  } catch (err) {
    console.error('[Live Goals Error]', err);
  }
}

async function processApprovedPayment(externalRef: string, providerName: string) {
  if (!externalRef || !externalRef.includes('|')) return;
  const [userEmail, planId] = externalRef.split('|');
  const { data: client } = await supabase.from('clients').select('*').eq('email', userEmail).single();
  const { data: plan } = await supabase.from('plans').select('*').eq('id', planId).single();

  if (client && plan) {
    let baseDate = new Date();
    if (client.expiration_date) {
      const [day, month, year] = client.expiration_date.split('/');
      const exp = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (exp > baseDate) baseDate = exp;
    }
    // Lógica robusta de adição de meses baseada na duração do plano
    const currentDay = baseDate.getDate();
    let monthsToAdd = 1;
    
    const duration = plan.duration?.toLowerCase() || '';
    if (duration.includes('trimestral')) monthsToAdd = 3;
    else if (duration.includes('anual')) monthsToAdd = 12;
    else if (duration.includes('semestral')) monthsToAdd = 6;

    baseDate.setMonth(baseDate.getMonth() + monthsToAdd);
    
    // Se o dia mudou (ex: 31 de jan -> 3 de mar), ajusta para o último dia do mês correto
    if (baseDate.getDate() !== currentDay) {
      baseDate.setDate(0);
    }
    
    const day = String(baseDate.getDate()).padStart(2, '0');
    const month = String(baseDate.getMonth() + 1).padStart(2, '0');
    const year = baseDate.getFullYear();
    const newExp = `${day}/${month}/${year}`;
    
    await supabase.from('clients').update({ expiration_date: newExp }).eq('email', userEmail);
    await notifyUser(client.user_id, client.email, client.username, { title: 'Pagamento Aprovado! 🎉', body: `Plano "${plan.name}" ativado. Novo vencimento: ${newExp}`, url: '/invoices' }, client.admin_id);
  }
}

// --- APP & ROUTES ---

async function startServer() {
  const app = express();
  
  // CORS Dinâmico: Aceita Vercel oficial, subdomínios Vercel (previews) e localhost
  app.use(cors({ 
    origin: (origin, callback) => {
      const allowedOrigins = [
        'https://itwf.vercel.app', 
        'http://localhost:5173', 
        'http://localhost:3000'
      ];
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }, 
    credentials: true 
  }));
  
  app.use(express.json({ verify: (req: any, res, buf) => { if (req.originalUrl.startsWith('/api/webhooks/stripe')) req.rawBody = buf; } }));

  // Routes
  app.get('/api/plans', async (req, res) => {
    try {
      const { data, error } = await supabase.from('plans').select('*').order('id', { ascending: true });
      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      console.error('[Plans API Error]', err);
      res.status(500).json({ error: 'Erro ao carregar planos' });
    }
  });

  app.post('/api/chat', async (req, res) => {
    try {
      const { history, message } = req.body;
      const model = ai.getGenerativeModel({ model: 'gemini-flash-latest' });
      
      // Inicia chat com histórico para manter contexto
      const chat = model.startChat({ 
        history: (history || []).map((m: any) => ({
          role: m.role || 'user',
          parts: [{ text: m.parts?.[0]?.text || '' }]
        }))
      });

      const result = await chat.sendMessage(message || '');
      res.json({ reply: result.response.text() });
    } catch (err: any) {
      console.error('[Chat API Error Detail]', {
        message: err.message,
        status: err.status,
        code: err.code,
        reason: err.reason,
        stack: err.stack
      });
      res.status(500).json({ error: 'Desculpe, tive um problema ao processar sua mensagem.', detail: err.message });
    }
  });

  app.post('/api/send-push', async (req, res) => {
    try {
      const { title, message, email, username, adminId } = req.body;
      
      let query = supabase.from('push_subscriptions').select('subscription_json, admin_id');
      
      let orFilter = [];
      if (username) orFilter.push(`username.eq.${username}`);
      if (email) orFilter.push(`email.eq.${email}`);
      
      if (orFilter.length > 0) {
        query = query.or(orFilter.join(','));
      } else if (adminId) {
        // Se for broadcast mas tiver adminId, filtra pelos inscritos daquele admin
        query = query.eq('admin_id', adminId);
      }
      
      const { data: subs } = await query;

      if (subs && subs.length > 0) {
        const promises = subs.map(s => sendPushNotification(s.subscription_json, { title, body: message, url: '/dashboard' }, s.admin_id || adminId));
        await Promise.allSettled(promises);
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error('[Send Push API Error]', err);
      res.status(500).json({ error: 'Erro ao enviar notificação' });
    }
  });

  app.post('/api/send-sports-push', async (req, res) => {
    try {
      await runSportsAgendaPush();
      res.json({ success: true, message: 'Processamento da agenda iniciado...' });
    } catch (err: any) {
      console.error('[Manual Sports Push Error]', err);
      res.status(500).json({ error: 'Erro ao processar agenda esportiva' });
    }
  });

  app.post('/api/subscribe', async (req, res) => {
    try {
      const { email, username, subscription, adminId } = req.body;
      if (!subscription) return res.status(400).json({ error: 'Assinatura PWA não fornecida' });
      
      let finalUsername = username;
      let finalAdminId = adminId;

      // Se o username ou adminId estiverem faltando, tenta buscar na tabela de clients
      if (!finalUsername || !finalAdminId) {
        const { data: client } = await supabase.from('clients').select('username, admin_id').eq('email', email).maybeSingle();
        if (client) {
          if (!finalUsername) finalUsername = client.username;
          if (!finalAdminId) finalAdminId = client.admin_id;
        }
      }

      await supabase.from('push_subscriptions').upsert([{ 
        email, 
        username: finalUsername || null, 
        admin_id: finalAdminId || null, 
        subscription_json: JSON.stringify(subscription) 
      }], { onConflict: 'subscription_json' });
      
      res.status(201).json({ success: true });
    } catch (err: any) {
      console.error('[Subscribe API Error]', err);
      res.status(500).json({ error: 'Erro ao registrar assinatura de notificações' });
    }
  });

  app.post('/api/unsubscribe', async (req, res) => {
    try {
      const { email, subscription_json } = req.body;
      if (subscription_json) {
        await supabase.from('push_subscriptions').delete().eq('subscription_json', subscription_json);
      } else if (email) {
        await supabase.from('push_subscriptions').delete().eq('email', email);
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error('[Unsubscribe API Error]', err);
      res.status(500).json({ error: 'Erro ao remover assinatura' });
    }
  });

  app.post('/api/register-fcm', async (req, res) => {
    try {
      const { email, token, device_type } = req.body;
      if (!token) return res.status(400).json({ error: 'Token FCM não fornecido' });

      const { data: client } = await supabase.from('clients').select('user_id').eq('email', email).maybeSingle();
      await supabase.from('fcm_tokens').upsert([{ 
        user_id: client?.user_id, 
        email, 
        token, 
        device_type 
      }], { onConflict: 'token' });
      
      res.status(201).json({ success: true });
    } catch (err: any) {
      console.error('[FCM API Error]', err);
      res.status(500).json({ error: 'Erro ao registrar token mobile' });
    }
  });

  app.get('/api/admin/run-vencimentos', async (req, res) => {
    try {
      await runVencimentosCheck();
      res.json({ success: true });
    } catch (err: any) {
      console.error('[Admin Cron Error]', err);
      res.status(500).json({ error: 'Erro ao executar verificação de vencimentos' });
    }
  });

  // ROTA PARA DELETAR USUÁRIO COMPLETAMENTE (Incluindo tabela auth.users)
  app.delete('/api/users/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      
      if (!userId || userId === 'undefined') {
        return res.status(400).json({ error: 'ID de usuário inválido.' });
      }

      // 1. Usar a conta de serviço admin para deletar o usuário do Identity
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      
      if (authError) {
        console.error('[API Delete User] Erro no Supabase Auth:', authError.message);
        return res.status(500).json({ error: 'Erro ao deletar usuário no sistema de autenticação.' });
      }

      // A exclusão da tabela `clients` e outras tabelas dependentes já está sendo
      // feita pelo Frontend no Admin.tsx (performClientCleanup), ou via ON DELETE CASCADE.
      
      res.json({ success: true, message: 'Usuário deletado com sucesso do sistema.' });
    } catch (err: any) {
      console.error('[API Delete User]', err);
      res.status(500).json({ error: 'Erro catastrófico ao excluir usuário' });
    }
  });

  app.get('/api/notifications', async (req, res) => {
    try {
      const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      console.error('[Notifications API Error]', err);
      res.status(500).json({ error: 'Erro ao carregar notificações' });
    }
  });

  app.post('/api/notifications', async (req, res) => {
    try {
      const { title, message, type } = req.body;
      const { data, error } = await supabase.from('notifications').insert([{ title, message, type }]).select().single();
      if (error) throw error;
      res.status(201).json(data);
    } catch (err: any) {
      console.error('[Notifications API Error]', err);
      res.status(500).json({ error: 'Erro ao criar notificação' });
    }
  });

  app.get('/api/push-stats', async (req, res) => {
    try {
      const { adminId } = req.query;
      let query = supabase.from('push_subscriptions').select('*', { count: 'exact', head: true });
      if (adminId) {
        query = query.eq('admin_id', adminId);
      }
      const { count, error } = await query;
      if (error) throw error;
      res.json({ count: count || 0 });
    } catch (err: any) {
      console.error('[Push Stats API Error]', err);
      res.status(500).json({ error: 'Erro ao buscar estatísticas de push' });
    }
  });

  // Webhooks
  app.post('/api/webhooks/mercadopago', async (req, res) => {
    try {
      const { data, type } = req.body;
      
      // Processa apenas notificações de pagamento aprovado
      if (type === 'payment' || data?.id) {
        const paymentId = data?.id || req.body.id;
        const { data: setting } = await supabase.from('payment_settings').select('*').eq('provider', 'mercadopago').single();
        
        if (setting?.credentials?.token) {
          const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, { 
            headers: { Authorization: `Bearer ${setting.credentials.token}` } 
          });
          
          if (mpResponse.ok) {
            const mpData = await mpResponse.json();
            if (mpData.status === 'approved') {
              await processApprovedPayment(mpData.external_reference, 'Mercado Pago');
            }
          }
        }
      }
      res.sendStatus(200);
    } catch (err: any) {
      console.error('[MP Webhook Error]', err);
      // Sempre retornamos 200 para o MP não ficar tentando reenviar em caso de erro interno
      res.sendStatus(200);
    }
  });

  // Keep-alive e Crons
  const RENDER_URL = process.env.RENDER_EXTERNAL_URL || 'https://itwf.onrender.com';
  setInterval(() => { fetch(`${RENDER_URL}/api/plans`).catch(() => {}); }, 5 * 60 * 1000);

  cron.schedule('0 11,17,23 * * *', runVencimentosCheck);
  cron.schedule('0 7,9 * * *', runSportsAgendaPush);
  cron.schedule('0 3 * * *', () => notifiedToday.clear());
  
  if (process.env.SPORTMONKS_API_TOKEN) setInterval(checkLiveGoals, 60000);

  // Static (apenas se o dist existir - frontend pode estar na Vercel separadamente)
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, 'dist');
    const indexPath = path.join(distPath, 'index.html');
    const { existsSync } = await import('fs');
    if (existsSync(indexPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => res.sendFile(indexPath));
      console.log('[Server] Servindo frontend estático a partir de dist/');
    } else {
      console.log('[Server] Frontend não encontrado em dist/ - modo API apenas (frontend na Vercel)');
    }
  } else {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  }

  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  app.listen(PORT, '0.0.0.0', () => console.log(`Server v2 running on port ${PORT}`));
}

startServer();
