import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../utils/supabase';
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  Star,
  PlusSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

export default function Invoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<any>(null);

  // Estados de Filtro
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  const months = [
    { label: 'Todos os Meses', value: null },
    { label: 'Janeiro', value: 0 },
    { label: 'Fevereiro', value: 1 },
    { label: 'Março', value: 2 },
    { label: 'Abril', value: 3 },
    { label: 'Maio', value: 4 },
    { label: 'Junho', value: 5 },
    { label: 'Julho', value: 6 },
    { label: 'Agosto', value: 7 },
    { label: 'Setembro', value: 8 },
    { label: 'Outubro', value: 9 },
    { label: 'Novembro', value: 10 },
    { label: 'Dezembro', value: 11 }
  ];

  const availableYears = Array.from(new Set(
    invoices.map(inv => new Date(inv.created_at).getFullYear())
  )).sort((a, b) => b - a);

  const filteredInvoices = invoices.filter(inv => {
    const invDate = new Date(inv.created_at);
    const matchesSearch = 
      inv.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.sub || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMonth = selectedMonth === null || invDate.getMonth() === selectedMonth;
    const matchesYear = selectedYear === null || invDate.getFullYear() === selectedYear;
    
    return matchesSearch && matchesMonth && matchesYear;
  });

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user && mounted) {
          const [clientRes, invoicesRes, renewalsRes] = await Promise.allSettled([
            supabase.from('clients').select('*').eq('user_id', user.id).single(),
            supabase.from('invoices').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
            supabase.from('requests').select('*').eq('user_id', user.id).eq('content_type', 'RENOVAÇÃO').order('created_at', { ascending: false })
          ]);

          if (mounted) {
            let clientData = null;
            let invoicesData: any[] = [];
            let renewalsData: any[] = [];

            if (clientRes.status === 'fulfilled' && clientRes.value.data) {
              clientData = clientRes.value.data;
              setClient(clientData);
            }

            if (invoicesRes.status === 'fulfilled' && invoicesRes.value.data) {
              invoicesData = invoicesRes.value.data;
            }

            if (renewalsRes.status === 'fulfilled' && renewalsRes.value.data) {
              renewalsData = renewalsRes.value.data;
            }

            // Combinar e mapear renovações para o formato de faturas
            const combined = [
              ...invoicesData,
              ...renewalsData.map(r => ({
                id: `ren_${r.id}`,
                date: new Date(r.created_at).toLocaleDateString(),
                description: 'Renovação de Assinatura',
                sub: r.status === 'RENOVAÇÃO APROVADA' ? 'Pagamento Confirmado' : 'Aguardando Aprovação',
                value: clientData?.balance ? `R$ ${Number(clientData.balance).toFixed(2)}` : 'R$ 25,00',
                status: r.status === 'RENOVAÇÃO APROVADA' ? 'Pago' : 'Pendente',
                type: 'premium',
                created_at: r.created_at
              }))
            ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            setInvoices(combined);
          }
        }
      } catch (err) {
        if (mounted) console.error('Error fetching invoices:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, []);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
          <div>
            <h1 className="text-slate-900 dark:text-white text-3xl font-bold tracking-tight">Histórico de Faturas</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Acompanhe seus pagamentos e faça o download dos comprovantes.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              {loading ? (
                <span className="text-sm font-bold text-slate-400">Carregando...</span>
              ) : (
                <>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{client?.name || 'Sem nome'}</span>
                  <span className="text-xs text-slate-500">{client?.email || ''}</span>
                </>
              )}
            </div>
            <div className="size-10 rounded-full border border-primary/30 overflow-hidden bg-slate-200 flex items-center justify-center">
              {client?.avatar_url ? (
                <img src={client.avatar_url} alt="User" />
              ) : (
                <span className="text-xs font-bold">{client?.name?.[0] || 'U'}</span>
              )}
            </div>
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-50 dark:bg-slate-900/40 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-sm dark:shadow-2xl"
        >
          {/* Filters */}
          <div className="p-5 border-b border-black/5 dark:border-white/5 flex flex-col sm:flex-row gap-4 justify-between items-center bg-black/[0.02] dark:bg-white/[0.02]">
            <div className="w-full sm:w-96 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar faturas por descrição..."
                className="w-full pl-10 pr-3 py-2 border border-black/5 dark:border-white/10 rounded-xl bg-white dark:bg-slate-900/50 text-slate-900 dark:text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm transition-colors"
              />
            </div>
            <div className="flex gap-3 w-full sm:w-auto overflow-x-visible pb-2 sm:pb-0 scrollbar-hide">
              {/* Month Selector */}
              <div className="relative">
                <button 
                  onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 text-slate-900 dark:text-slate-200 text-sm font-bold transition-colors whitespace-nowrap"
                >
                  {selectedMonth === null ? 'Todos os Meses' : months.find(m => m.value === selectedMonth)?.label}
                  <ChevronDown size={18} className={`transition-transform ${showMonthDropdown ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showMonthDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowMonthDropdown(false)} />
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-black/5 dark:border-white/10 rounded-2xl shadow-xl z-20 overflow-hidden"
                      >
                        <div className="max-h-64 overflow-y-auto custom-scrollbar">
                          {months.map((m) => (
                            <button
                              key={m.label}
                              onClick={() => {
                                setSelectedMonth(m.value);
                                setShowMonthDropdown(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${selectedMonth === m.value ? 'text-primary font-bold bg-primary/5' : 'text-slate-600 dark:text-slate-400'}`}
                            >
                              {m.label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Year Selector */}
              <div className="relative">
                <button 
                  onClick={() => setShowYearDropdown(!showYearDropdown)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 text-slate-900 dark:text-slate-200 text-sm font-bold transition-colors whitespace-nowrap"
                >
                  {selectedYear === null ? 'Todos os Anos' : selectedYear}
                  <ChevronDown size={18} className={`transition-transform ${showYearDropdown ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showYearDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowYearDropdown(false)} />
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-slate-900 border border-black/5 dark:border-white/10 rounded-2xl shadow-xl z-20 overflow-hidden"
                      >
                        <button
                          onClick={() => {
                            setSelectedYear(null);
                            setShowYearDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${selectedYear === null ? 'text-primary font-bold bg-primary/5' : 'text-slate-600 dark:text-slate-400'}`}
                        >
                          Todos os Anos
                        </button>
                        {availableYears.map((y) => (
                          <button
                            key={y}
                            onClick={() => {
                              setSelectedYear(y);
                              setShowYearDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${selectedYear === y ? 'text-primary font-bold bg-primary/5' : 'text-slate-600 dark:text-slate-400'}`}
                          >
                            {y}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/[0.01] dark:bg-white/[0.03] border-b border-black/5 dark:border-white/5">
                  <th className="px-8 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest w-32">Data</th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Descrição</th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest w-32 text-right">Valor</th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest w-40 text-center">Status</th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest w-32 text-center">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {loading ? (
                  <tr><td colSpan={5} className="px-8 py-5 text-center text-slate-500">Carregando faturas...</td></tr>
                ) : filteredInvoices.length === 0 ? (
                  <tr><td colSpan={5} className="px-8 py-10 text-center text-slate-500 italic">Nenhuma fatura encontrada.</td></tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-5 text-sm text-slate-600 dark:text-slate-300 font-medium">{inv.date}</td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${inv.type === 'premium' ? 'bg-primary/10 text-primary' : inv.type === 'add' ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            {inv.type === 'premium' ? <Star size={20} /> : inv.type === 'add' ? <PlusSquare size={20} /> : <XCircle size={20} />}
                          </div>
                          <div>
                            <div className={`text-sm font-bold ${inv.status === 'Cancelado' ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>{inv.description}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{inv.sub}</div>
                          </div>
                        </div>
                      </td>
                      <td className={`px-8 py-5 text-sm font-black text-right ${inv.status === 'Cancelado' ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-slate-200'}`}>{inv.value}</td>
                      <td className="px-8 py-5 text-center">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${inv.status === 'Pago' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                            inv.status === 'Pendente' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                              'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                          }`}>
                          {inv.status === 'Pago' ? <CheckCircle2 size={14} /> : inv.status === 'Pendente' ? <Clock size={14} /> : <XCircle size={14} />}
                          {inv.status}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <button
                          disabled={inv.status !== 'Pago'}
                          className={`p-2 rounded-xl transition-colors ${inv.status === 'Pago' ? 'text-slate-400 hover:text-primary hover:bg-primary/10' : 'text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50'}`}
                        >
                          <Download size={20} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-black/5 dark:divide-white/5">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Carregando faturas...</div>
            ) : filteredInvoices.length === 0 ? (
              <div className="p-10 text-center text-slate-500 italic">Nenhuma fatura encontrada.</div>
            ) : (
              filteredInvoices.map((inv, idx) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={inv.id}
                  className="p-5 active:bg-black/5 dark:active:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-2xl ${inv.type === 'premium' ? 'bg-primary/10 text-primary' : inv.type === 'add' ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {inv.type === 'premium' ? <Star size={24} /> : inv.type === 'add' ? <PlusSquare size={24} /> : <XCircle size={24} />}
                      </div>
                      <div>
                        <h4 className={`font-bold ${inv.status === 'Cancelado' ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>{inv.description}</h4>
                        <p className="text-xs text-slate-500">{inv.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-black ${inv.status === 'Cancelado' ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>{inv.value}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 bg-black/[0.02] dark:bg-white/[0.02] p-3 rounded-2xl border border-black/5 dark:border-white/5">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${inv.status === 'Pago' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                        inv.status === 'Pendente' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                          'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                      }`}>
                      {inv.status === 'Pago' ? <CheckCircle2 size={12} /> : inv.status === 'Pendente' ? <Clock size={12} /> : <XCircle size={12} />}
                      {inv.status}
                    </div>

                    <button
                      disabled={inv.status !== 'Pago'}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all active:scale-95 ${inv.status === 'Pago' 
                        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                        : 'bg-slate-100 dark:bg-white/10 text-slate-400 opacity-50 cursor-not-allowed'}`}
                    >
                      <Download size={14} />
                      PDF
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01] flex items-center justify-between">
            <span className="text-xs text-slate-500">Mostrando {filteredInvoices.length} faturas</span>
            <div className="flex gap-1">
              <button className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50">
                <ChevronLeft size={16} />
              </button>
              <button className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 text-primary font-bold text-sm">1</button>
              <button className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Security Badge */}
        <div className="flex justify-center items-center gap-2 text-slate-500 text-xs pb-8">
          <ShieldCheck size={14} className="text-emerald-500/70" />
          <span>Ambiente Seguro. Todas as transações são criptografadas.</span>
        </div>
      </div>
    </Layout>
  );
}
