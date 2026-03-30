import { motion } from 'motion/react';
import {
  CreditCard,
  QrCode,
  ReceiptText,
  ShoppingCart,
  Info,
  Copy,
  Timer,
  CheckCircle2,
  Globe,
  Wallet,
  ArrowRight
} from 'lucide-react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const plan = location.state?.plan;
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');

  useEffect(() => {
    fetchActiveProviders();
  }, []);

  const fetchActiveProviders = async () => {
    const { data } = await supabase
      .from('payment_settings')
      .select('provider, active')
      .eq('active', true);

    if (data && data.length > 0) {
      setProviders(data);
      setSelectedProvider(data[0].provider);
    }
  };

  if (!plan) {
    return <Navigate to="/plans" replace />;
  }

  const handleCheckout = async () => {
    if (!selectedProvider) {
      alert('Por favor, selecione um método de pagamento.');
      return;
    }

    try {
      setLoading(true);
      const userEmail = localStorage.getItem('currentUser') || '';

      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/create-preference`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          plan_id: plan.id, 
          email: userEmail, 
          provider: selectedProvider 
        })
      });

      const contentType = response.headers.get('content-type');
      if (response.ok && contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.init_point) {
          window.location.href = data.init_point;
        } else {
          alert(data.error || 'Erro ao gerar o link de pagamento. Verifique as configurações no admin.');
        }
      } else {
        const errorText = await response.text().catch(() => '');
        console.error('[Checkout] Erro na API:', errorText);
        alert(`Erro no servidor (${response.status}). Tente novamente em instantes.`);
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao gerar o link de pagamento.');
    } finally {
      setLoading(false);
    }
  };

  const getProviderLabel = (p: string) => {
    switch(p) {
      case 'mercadopago': return { name: 'Mercado Pago', icon: QrCode, desc: 'PIX, Cartão e Boleto' };
      case 'stripe': return { name: 'Stripe', icon: Globe, desc: 'Cartão de Crédito Global' };
      case 'asaas': return { name: 'Asaas', icon: Wallet, desc: 'Boleto e PIX Direto' };
      default: return { name: p, icon: CreditCard, desc: 'Pagamento Seguro' };
    }
  };

  return (
    <Layout>
      <div className="max-w-[1100px] mx-auto flex flex-col gap-8 py-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">Finalizar Compra</h1>
          <p className="text-slate-500 dark:text-slate-400">Escolha seu método de pagamento preferido e confirme sua assinatura.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 items-start">
          {/* Payment Methods Selection */}
          <div className="flex-[2] flex flex-col gap-8 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {providers.length > 0 ? (
                providers.map((p) => {
                  const info = getProviderLabel(p.provider);
                  const isSelected = selectedProvider === p.provider;
                  return (
                    <motion.div
                      key={p.provider}
                      whileHover={{ y: -4 }}
                      onClick={() => setSelectedProvider(p.provider)}
                      className={`relative cursor-pointer p-6 rounded-3xl border-2 transition-all flex flex-col gap-4 ${
                        isSelected 
                          ? 'border-primary bg-primary/5 shadow-xl shadow-primary/10' 
                          : 'border-black/5 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:border-primary/30'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className={`p-3 rounded-2xl ${isSelected ? 'bg-primary text-white' : 'bg-black/5 dark:bg-white/10 text-slate-500'}`}>
                          <info.icon size={24} />
                        </div>
                        {isSelected && (
                          <div className="size-6 bg-primary text-white rounded-full flex items-center justify-center">
                            <CheckCircle2 size={16} />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className={`font-bold text-lg ${isSelected ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>
                          {info.name}
                        </h3>
                        <p className="text-sm text-slate-500">{info.desc}</p>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="col-span-2 p-8 bg-amber-500/10 border border-amber-500/20 rounded-3xl text-amber-600 font-medium">
                  Nenhum método de pagamento disponível no momento.
                </div>
              )}
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-50 dark:bg-slate-900/60 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-3xl p-10 flex flex-col items-center justify-center text-center gap-8 shadow-xl"
            >
              <div className="flex flex-col gap-3">
                <div className="size-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                  <ShoppingCart size={32} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Tudo Pronto para Ativar seu Plano?</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Ao clicar no botão abaixo, você será redirecionado com segurança para o 
                  <span className="font-bold text-primary"> {getProviderLabel(selectedProvider).name}</span>.
                </p>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading || !selectedProvider}
                className="w-full max-w-md bg-primary hover:bg-primary/90 text-white font-black py-5 px-8 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-primary/25 text-lg uppercase tracking-widest active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <div className="size-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Confirmar e Pagar
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </motion.div>
          </div>

          {/* Order Summary */}
          <div className="flex-1 w-full lg:sticky lg:top-28">
            <div className="bg-slate-50 dark:bg-slate-900/60 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-3xl p-8 flex flex-col gap-8 shadow-xl">
              <div className="flex items-center gap-4 border-b border-black/5 dark:border-white/10 pb-6">
                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <ReceiptText size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Resumo</h3>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <p className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight">{plan.name}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{plan.duration}</p>
                  </div>
                  <p className="font-black text-slate-900 dark:text-white">R$ {Number(plan.price).toFixed(2).replace('.', ',')}</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-black/5 dark:border-white/10">
                <span className="font-bold text-slate-500 uppercase text-xs tracking-widest">Total Geral</span>
                <span className="font-black text-3xl text-primary tracking-tighter">R$ {Number(plan.price).toFixed(2).replace('.', ',')}</span>
              </div>

              <div className="bg-primary/5 rounded-2xl p-5 flex items-start gap-4 text-sm text-slate-600 dark:text-slate-300 border border-primary/10">
                <Info className="text-primary shrink-0 mt-0.5" size={20} />
                <p className="leading-relaxed">Sua renovação será processada automaticamente após a confirmação do pagamento pelo gateway escolhido.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

