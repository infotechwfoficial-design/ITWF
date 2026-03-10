import { motion } from 'motion/react';
import { 
  FileText, 
  Lock, 
  Scale, 
  Info,
  ChevronRight
} from 'lucide-react';
import Layout from '../components/Layout';

export default function Terms() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto w-full py-6 md:py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">Termos de Uso e Política de Privacidade</h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg">Última atualização: 15 de Outubro de 2023</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-4">
              <nav className="sticky top-28 space-y-2">
                <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-primary/10 text-primary font-bold text-sm border border-primary/20">
                  1. Aceitação dos Termos
                  <ChevronRight size={16} />
                </button>
                <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-medium">
                  2. Uso do Sistema
                  <ChevronRight size={16} />
                </button>
                <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-medium">
                  3. Pagamentos e Planos
                  <ChevronRight size={16} />
                </button>
                <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-medium">
                  4. Privacidade de Dados
                  <ChevronRight size={16} />
                </button>
                <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-medium">
                  5. Cancelamento
                  <ChevronRight size={16} />
                </button>
              </nav>
            </div>

            <div className="md:col-span-2 space-y-10 text-slate-600 dark:text-slate-300 leading-relaxed">
              <section className="space-y-4">
                <div className="flex items-center gap-3 text-slate-900 dark:text-white">
                  <Scale className="text-primary" size={24} />
                  <h2 className="text-2xl font-bold">1. Aceitação dos Termos</h2>
                </div>
                <p>Ao acessar e utilizar o sistema ITWF, você concorda em cumprir e estar vinculado aos seguintes termos e condições de uso. Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.</p>
                <p>O ITWF reserva-se o direito de atualizar ou modificar estes termos a qualquer momento sem aviso prévio. O uso continuado do sistema após tais alterações constitui sua aceitação dos novos termos.</p>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-3 text-slate-900 dark:text-white">
                  <FileText className="text-primary" size={24} />
                  <h2 className="text-2xl font-bold">2. Uso do Sistema</h2>
                </div>
                <p>O sistema ITWF é uma plataforma de gestão de assinaturas e renovações. Você é responsável por manter a confidencialidade de sua conta e senha, e por todas as atividades que ocorram sob sua conta.</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>O uso comercial não autorizado é proibido.</li>
                  <li>Você não deve usar o sistema para qualquer finalidade ilegal.</li>
                  <li>A engenharia reversa do software é estritamente proibida.</li>
                </ul>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-3 text-slate-900 dark:text-white">
                  <Lock className="text-primary" size={24} />
                  <h2 className="text-2xl font-bold">3. Privacidade de Dados</h2>
                </div>
                <p>Sua privacidade é importante para nós. Nossa Política de Privacidade explica como coletamos, usamos e protegemos suas informações pessoais.</p>
                <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 flex items-start gap-4">
                  <Info className="text-primary shrink-0 mt-1" size={20} />
                  <p className="text-sm text-slate-600 dark:text-slate-300 italic">Utilizamos criptografia de ponta a ponta para proteger seus dados financeiros e nunca compartilhamos suas informações com terceiros sem seu consentimento explícito.</p>
                </div>
              </section>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
