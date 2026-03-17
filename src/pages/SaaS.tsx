import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  Zap, 
  Users, 
  MessageSquare, 
  CheckCircle2, 
  ChevronRight, 
  Star, 
  TrendingUp, 
  Shield, 
  Clock,
  ArrowRight,
  Menu,
  X,
  Play,
  User as UserIcon,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SaaS() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const plans = [
    {
      name: 'Bronze',
      price: 'R$ 197',
      period: '/mês',
      features: ['Até 50 Clientes', 'Painel Administrativo', 'Suporte Via WhatsApp', 'Acesso ao App'],
      color: 'from-orange-400 to-orange-600',
      popular: false
    },
    {
      name: 'Prata',
      price: 'R$ 397',
      period: '/mês',
      features: ['Até 150 Clientes', 'Painel Administrativo', 'Suporte Prioritário', 'Acesso ao App', 'Treinamento de Vendas'],
      color: 'from-slate-300 to-slate-500',
      popular: true
    },
    {
      name: 'Ouro',
      price: 'R$ 797',
      period: '/mês',
      features: ['Clientes Ilimitados', 'Painel Administrativo Full', 'Gerente de Contas', 'Acesso ao App', 'White Label (Sua Logo)'],
      color: 'from-amber-400 to-amber-600',
      popular: false
    }
  ];

  const features = [
    {
      icon: <Users className="text-primary" />,
      title: 'Multi-Inquilinos (Multi-Tenancy)',
      description: 'Tenha quantos revendedores quiser. Cada um gerencia seus próprios clientes de forma totalmente isolada.'
    },
    {
      icon: <ShieldCheck className="text-emerald-500" />,
      title: 'Segurança de Dados RLS',
      description: 'Arquitetura de nível bancário. Os dados de um cliente nunca vazarão para outro revendedor.'
    },
    {
      icon: <Zap className="text-amber-500" />,
      title: 'Acesso Rápido via Link',
      description: 'Seus revendedores podem enviar links de login direto pelo WhatsApp, facilitando a vida do cliente.'
    },
    {
      icon: <MessageSquare className="text-blue-500" />,
      title: 'Notificações Push',
      description: 'Mantenha os clientes engajados com notificações automáticas de renovação e novidades.'
    }
  ];

  const faqs = [
    { q: 'Eu preciso saber programar?', a: 'Não! O sistema vem pronto para uso. Você só precisa gerenciar seus clientes pelo painel administrativo.' },
    { q: 'Como recebo dos meus clientes?', a: 'Você define seus próprios preços e recebe diretamente por PIX, cartão ou como preferir.' },
    { q: 'O suporte é incluso?', a: 'Sim, oferecemos suporte técnico para garantir que seu sistema esteja sempre online.' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 dark:text-white font-sans selection:bg-primary selection:text-white overflow-x-hidden">
      
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse delay-1000" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-black/5 dark:border-white/10 rounded-2xl px-6 py-3 shadow-sm">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            <span className="text-xl font-black tracking-tighter">ITWF <span className="text-primary">SAAS</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#recursos" className="text-sm font-bold hover:text-primary transition-colors uppercase tracking-widest">Recursos</a>
            <a href="#precos" className="text-sm font-bold hover:text-primary transition-colors uppercase tracking-widest">Preços</a>
            <a href="#faq" className="text-sm font-bold hover:text-primary transition-colors uppercase tracking-widest">FAQ</a>
            <button 
              onClick={() => navigate('/login')}
              className="bg-primary text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
              Começar Agora
            </button>
          </div>

          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-primary/20"
          >
            <TrendingUp size={14} />
            Seu próximo grande negócio começa aqui
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-8xl font-black tracking-tight mb-8 leading-[1.1] font-display"
          >
            Crie sua própria <br />
            <span className="bg-gradient-to-r from-primary via-emerald-500 to-purple-500 bg-clip-text text-transparent">
              Agência de Renovação
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Venda o melhor painel de gestão para sistema de renovação. Você gerencia seus próprios clientes, define seus preços e lucra 100%. Tudo isso com tecnologia Multi-Tenancy e RLS.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col md:flex-row items-center justify-center gap-4"
          >
            <button className="w-full md:w-auto bg-primary text-white px-10 py-5 rounded-2xl text-lg font-black shadow-2xl shadow-primary/40 flex items-center justify-center gap-2 group transition-all hover:translate-y-[-2px]">
              Quero ser um Revendedor
              <ArrowRight className="group-hover:translate-x-2 transition-transform" />
            </button>
            <button className="w-full md:w-auto px-10 py-5 rounded-2xl text-lg font-bold border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center gap-2 transition-all">
              <Play fill="currentColor" size={20} />
              Ver Demonstração
            </button>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: 'Administradores Ativos', value: '150+' },
            { label: 'Clientes Gerenciados', value: '12K+' },
            { label: 'Uptime Garantido', value: '99.9%' },
            { label: 'ROI Médio', value: '300%' }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <p className="text-3xl md:text-4xl font-black text-primary mb-1">{stat.value}</p>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="recursos" className="py-32 px-6 bg-slate-100/50 dark:bg-slate-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Potência em Cada Detalhe</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Desenvolvemos a plataforma mais robusta do mercado para que você se preocupe apenas em vender.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-black/5 dark:border-white/5 shadow-sm hover:shadow-2xl hover:translate-y-[-10px] transition-all group"
              >
                <div className="size-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {React.cloneElement(f.icon as React.ReactElement, { size: 28 })}
                </div>
                <h3 className="text-xl font-black mb-4">{f.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">Fature agora</span>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">Planos que cabem no seu bolso</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className={`relative p-10 rounded-[3rem] border transition-all ${p.popular ? 'bg-slate-900 border-primary shadow-2xl shadow-primary/20 scale-105 z-10' : 'bg-white dark:bg-slate-900 border-black/5 dark:border-white/5'}`}
              >
                {p.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                    Mais Vendido
                  </div>
                )}
                
                <h3 className={`text-2xl font-black mb-2 ${p.popular ? 'text-white' : ''}`}>{p.name}</h3>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className={`text-5xl font-black ${p.popular ? 'text-white' : ''}`}>{p.price}</span>
                  <span className="text-slate-500 font-bold">{p.period}</span>
                </div>

                <div className="space-y-4 mb-10">
                  {p.features.map((feat, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                      <span className={`text-sm ${p.popular ? 'text-slate-300' : 'text-slate-600 dark:text-slate-400'}`}>{feat}</span>
                    </div>
                  ))}
                </div>

                <button className={`w-full py-4 rounded-2xl font-black transition-all ${p.popular ? 'bg-primary text-white shadow-lg shadow-primary/30 hover:scale-105' : 'bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white dark:hover:bg-primary'}`}>
                  Assinar {p.name}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-32 px-6 bg-slate-100/30 dark:bg-slate-900/10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black tracking-tight mb-4">Dúvidas Frequentes</h2>
            <p className="text-slate-500">Tudo o que você precisa saber antes de começar.</p>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className="p-8 bg-white dark:bg-slate-900/50 rounded-2xl border border-black/5 dark:border-white/5"
              >
                <h4 className="text-lg font-black mb-3">{faq.q}</h4>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-40 px-6 overflow-hidden relative">
        <div className="max-w-5xl mx-auto bg-primary rounded-[3.5rem] p-12 md:p-24 text-center text-white relative z-10 shadow-2xl shadow-primary/40">
          <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight tracking-tight">Pronto para dar o próximo passo <br /> na sua carreira?</h2>
          <p className="text-white/80 text-lg mb-12 max-w-xl mx-auto">Junte-se a centenas de revendedores que já estão faturando com o ITWF SaaS.</p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <button className="w-full md:w-auto bg-white text-primary px-12 py-5 rounded-2xl text-xl font-black hover:scale-105 transition-all">
              Garantir Meu Painel
            </button>
            <div className="flex items-center gap-4 text-white/80 font-bold">
              <div className="flex">
                {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="white" className="text-white" />)}
              </div>
              4.9/5 Avaliações
            </div>
          </div>
        </div>
        
        {/* Background Decor for CTA */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-20 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent" />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-black/5 dark:border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
              <span className="text-2xl font-black tracking-tighter">ITWF <span className="text-primary">SAAS</span></span>
            </div>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest text-center md:text-left">
              © 2026 InfoTechWF. <br /> Todos os direitos reservados.
            </p>
          </div>
          
          <div className="flex gap-12 flex-wrap justify-center">
            <div className="flex flex-col gap-4">
              <h5 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">Produto</h5>
              <a href="#recursos" className="text-sm font-bold hover:text-primary">Recursos</a>
              <a href="#precos" className="text-sm font-bold hover:text-primary">Preços</a>
              <a href="/login" className="text-sm font-bold hover:text-primary">App</a>
            </div>
            <div className="flex flex-col gap-4">
              <h5 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">Suporte</h5>
              <a href="/support" className="text-sm font-bold hover:text-primary">Central de Ajuda</a>
              <a href="/terms" className="text-sm font-bold hover:text-primary">Termos</a>
              <a href="/tutorials" className="text-sm font-bold hover:text-primary">Tutoriais</a>
            </div>
            <div className="flex flex-col gap-4">
              <h5 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">Social</h5>
              <a href="#" className="text-sm font-bold hover:text-primary">Instagram</a>
              <a href="#" className="text-sm font-bold hover:text-primary">WhatsApp</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-white dark:bg-slate-950 flex flex-col items-center justify-center gap-8 p-6 text-center animate-in fade-in zoom-in">
          <button className="absolute top-8 right-8" onClick={() => setIsMenuOpen(false)}>
            <X size={32} />
          </button>
          <a href="#recursos" onClick={() => setIsMenuOpen(false)} className="text-4xl font-black tracking-tighter">Recursos</a>
          <a href="#precos" onClick={() => setIsMenuOpen(false)} className="text-4xl font-black tracking-tighter">Preços</a>
          <a href="#faq" onClick={() => setIsMenuOpen(false)} className="text-4xl font-black tracking-tighter">FAQ</a>
          <button 
            onClick={() => { navigate('/login'); setIsMenuOpen(false); }}
            className="w-full bg-primary text-white py-6 rounded-3xl text-2xl font-black shadow-2xl shadow-primary/40"
          >
            Começar Agora
          </button>
        </div>
      )}

    </div>
  );
}
