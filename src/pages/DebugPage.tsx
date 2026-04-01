import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, Trash2, ArrowLeft, RefreshCw, Clipboard } from 'lucide-react';

const DebugPage: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const navigate = useNavigate();

  const loadLogs = () => {
    try {
      const storedLogs = JSON.parse(localStorage.getItem('itwf_auth_logs') || '[]');
      setLogs(storedLogs);
    } catch (e) {
      setLogs(['Erro ao carregar logs do localStorage.']);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleClear = () => {
    if (confirm('Deseja limpar todo o histórico de diagnóstico?')) {
      localStorage.removeItem('itwf_auth_logs');
      setLogs([]);
    }
  };

  const copyToClipboard = () => {
    const text = logs.join('\n');
    navigator.clipboard.writeText(text);
    alert('Logs copiados para a área de transferência!');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 font-sans">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
              <Terminal size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Diagnóstico ITWF</h1>
              <p className="text-xs text-slate-400">Rastreio de Autenticação e PWA</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
            title="Voltar"
          >
            <ArrowLeft size={20} />
          </button>
        </header>

        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={loadLogs}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 py-2.5 rounded-xl text-sm font-medium transition-all"
            >
              <RefreshCw size={16} /> Atualizar
            </button>
            <button
              onClick={copyToClipboard}
              disabled={logs.length === 0}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            >
              <Clipboard size={16} /> Copiar Tudo
            </button>
            <button
              onClick={handleClear}
              disabled={logs.length === 0}
              className="w-12 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all disabled:opacity-50"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden min-h-[400px]">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-slate-500 gap-3">
                <Terminal size={48} className="opacity-20" />
                <p>Nenhum log registrado ainda.</p>
              </div>
            ) : (
              <div className="p-1 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                {logs.map((log, index) => {
                  const isError = log.toLowerCase().includes('erro') || log.toLowerCase().includes('fail');
                  return (
                    <div 
                      key={index} 
                      className={`p-3 text-xs font-mono border-b border-slate-800/50 last:border-0 ${
                        isError ? 'text-red-400 bg-red-400/5' : 'text-slate-300'
                      }`}
                    >
                      {log}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <p className="text-[10px] text-center text-slate-500">
            Dica: Se o PWA travar no celular, acesse e tire um print desta tela.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DebugPage;
