import { motion } from 'motion/react';
import {
  CreditCard,
  QrCode,
  ReceiptText,
  ShoppingCart,
  Info,
  Copy,
  Timer
} from 'lucide-react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useState } from 'react';

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const plan = location.state?.plan;
  const [loading, setLoading] = useState(false);

  if (!plan) {
    return <Navigate to="/plans" replace />;
  }

  const handleCheckout = async () => {
    try {
      setLoading(true);
      const username = localStorage.getItem('currentUser') || '';

      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/create-preference`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: plan.id, username })
      });

      const data = await response.json();

      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        alert(data.error || 'Erro ao gerar o link de pagamento do Mercado Pago');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao gerar o link de pagamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-[1100px] mx-auto flex flex-col gap-8 py-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">Finalizar Compra</h1>
          <p className="text-slate-500 dark:text-slate-400">Escolha a forma de pagamento e confirme seu pedido.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Payment Methods */}
          <div className="flex-[2] flex flex-col gap-6 w-full">
            <div className="flex border-b border-black/5 dark:border-white/10 gap-8">
              <button className="flex items-center gap-2 border-b-[3px] border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white pb-4 pt-2 transition-colors">
                <CreditCard size={18} />
                <span className="text-sm font-bold">Cartão de Crédito</span>
              </button>
              <button className="flex items-center gap-2 border-b-[3px] border-primary text-primary pb-4 pt-2">
                <QrCode size={18} />
                <span className="text-sm font-bold">PIX</span>
              </button>
              <button className="flex items-center gap-2 border-b-[3px] border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white pb-4 pt-2 transition-colors">
                <ReceiptText size={18} />
                <span className="text-sm font-bold">Boleto</span>
              </button>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-50 dark:bg-slate-900/60 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-6 shadow-xl"
            >
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Conclua o Pagamento</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-md">Para sua segurança e conveniência, você será direcionado para o gateway de pagamento configurado (Mercado Pago / PIX).</p>
              </div>

              <div className="flex flex-col items-center gap-4 w-full max-w-sm mt-4">
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-primary/20 text-lg disabled:opacity-50"
                >
                  {loading ? (
                    <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <CreditCard size={20} />
                  )}
                  {loading ? 'Gerando...' : 'Prosseguir para Pagamento'}
                </button>

              </div>
            </motion.div>
          </div>

          {/* Order Summary */}
          <div className="flex-1 w-full lg:sticky lg:top-28">
            <div className="bg-slate-50 dark:bg-slate-900/60 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-xl p-6 flex flex-col gap-6 shadow-xl">
              <div className="flex items-center gap-3 border-b border-black/5 dark:border-white/10 pb-4">
                <ShoppingCart className="text-primary" size={20} />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Resumo do Pedido</h3>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <p className="font-bold text-base text-slate-900 dark:text-white">{plan.name}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Plano Selecionado - {plan.duration}</p>
                  </div>
                  <p className="font-medium text-slate-700 dark:text-slate-300">R$ {Number(plan.price).toFixed(2).replace('.', ',')}</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-black/5 dark:border-white/10">
                <span className="font-bold text-lg text-slate-900 dark:text-white">Total a Pagar</span>
                <span className="font-black text-2xl text-primary">R$ {Number(plan.price).toFixed(2).replace('.', ',')}</span>
              </div>

              <div className="bg-primary/10 rounded-lg p-4 flex items-start gap-3 mt-2 text-sm text-slate-600 dark:text-slate-300 border border-primary/20">
                <Info className="text-primary shrink-0" size={18} />
                <p>Sua assinatura será renovada automaticamente. Você pode cancelar a qualquer momento nas configurações da conta.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
