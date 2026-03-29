import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Search,
  MessageSquare,
  Phone,
  Mail,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  LifeBuoy
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { supabase } from '../utils/supabase';

export default function Support() {
  const navigate = useNavigate();
  const [supportNumber, setSupportNumber] = useState('5584996764125');

  useEffect(() => {
    const fetchSupportInfo = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: clientData } = await supabase
            .from('clients')
            .select('admin_id')
            .eq('user_id', user.id)
            .maybeSingle();
            
          if (clientData?.admin_id) {
            const { data: adminData } = await supabase
              .from('clients')
              .select('support_number')
              .eq('user_id', clientData.admin_id)
              .maybeSingle();
              
            if (adminData?.support_number) {
              setSupportNumber(adminData.support_number);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching support info:', err);
      }
    };
    fetchSupportInfo();
  }, []);

  const faqs = [
    { q: 'Como renovar minha assinatura?', a: 'Basta acessar o painel principal, clicar em "Renovar Agora" na fatura desejada e seguir as instruções de pagamento.' },
    { q: 'Quais as formas de pagamento aceitas?', a: 'Aceitamos PIX (com liberação imediata), Cartão de Crédito (até 12x) e Boleto Bancário.' },
    { q: 'Como alterar meus dados cadastrais?', a: 'Vá até a aba "Configurações" no menu lateral e atualize suas informações pessoais.' },
    { q: 'Esqueci minha senha, o que fazer?', a: 'Na tela de login, clique em "Esqueceu sua senha?" e siga os passos para recuperação via e-mail.' },
  ];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto flex flex-col gap-10">
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Central de Ajuda ITWF</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">Como podemos ajudar você hoje? Encontre respostas rápidas ou entre em contato com nosso time.</p>

          <div className="max-w-xl mx-auto relative mt-8">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={20} className="text-slate-500" />
            </div>
            <input
              type="text"
              placeholder="Pesquisar por problema ou dúvida..."
              className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900/60 border border-black/5 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm dark:shadow-xl"
            />
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-slate-50 dark:bg-slate-900/40 border border-black/5 dark:border-white/10 p-6 rounded-2xl flex flex-col items-center text-center gap-4 hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-all cursor-pointer shadow-sm"
          >
            <div className="size-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <MessageSquare size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Chat ao Vivo</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Fale com um especialista agora mesmo. Tempo médio: 5 min.</p>
            <button
              onClick={() => window.dispatchEvent(new Event('open-chatbot'))}
              className="mt-2 text-primary font-bold text-sm flex items-center gap-1 hover:underline"
            >
              Iniciar Chat <ChevronRight size={16} />
            </button>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-slate-50 dark:bg-slate-900/40 border border-black/5 dark:border-white/10 p-6 rounded-2xl flex flex-col items-center text-center gap-4 hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-all cursor-pointer shadow-sm"
          >
            <div className="size-14 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 flex items-center justify-center">
              <Phone size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">WhatsApp</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Suporte rápido via mensagem. Atendimento 24/7.</p>
            <a
              href={`https://wa.me/${supportNumber.replace(/\D/g, '')}`}
              target="_blank" rel="noopener noreferrer"
              className="mt-2 text-emerald-600 dark:text-emerald-500 font-bold text-sm flex items-center gap-1 hover:underline"
            >
              Abrir WhatsApp <ChevronRight size={16} />
            </a>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-slate-50 dark:bg-slate-900/40 border border-black/5 dark:border-white/10 p-6 rounded-2xl flex flex-col items-center text-center gap-4 hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-all cursor-pointer shadow-sm"
          >
            <div className="size-14 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-500 flex items-center justify-center">
              <Mail size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">E-mail</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Para dúvidas complexas ou financeiro. Resposta em 24h.</p>
            <a
              href="mailto:contato@itwf.com"
              className="mt-2 text-purple-600 dark:text-purple-500 font-bold text-sm flex items-center gap-1 hover:underline"
            >
              Enviar E-mail <ChevronRight size={16} />
            </a>
          </motion.div>
        </div>

        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-4">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-900 dark:text-white">
              <HelpCircle className="text-primary" />
              Dúvidas Frequentes
            </h2>
            <Link to="/tutorials" className="text-primary text-sm font-bold hover:underline flex items-center gap-1">
              Ver Tutoriais em Vídeo <ExternalLink size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-slate-50 dark:bg-slate-900/40 border border-black/5 dark:border-white/5 p-6 rounded-2xl hover:border-primary/30 transition-colors group shadow-sm">
                <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-start gap-3">
                  <span className="text-primary font-black">Q.</span>
                  {faq.q}
                </h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed pl-7">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="bg-primary/10 border border-primary/20 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="size-16 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
              <LifeBuoy size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Ainda precisa de ajuda?</h3>
              <p className="text-slate-600 dark:text-slate-300">Nossa equipe técnica está pronta para resolver qualquer problema.</p>
            </div>
          </div>
          <a
            href={`https://wa.me/${supportNumber.replace(/\D/g, '')}?text=Preciso+de+suporte`}
            target="_blank" rel="noopener noreferrer"
            className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 transition-all whitespace-nowrap"
          >
            ABRIR TICKET DE SUPORTE
          </a>
        </div>
      </div>
    </Layout>
  );
}
