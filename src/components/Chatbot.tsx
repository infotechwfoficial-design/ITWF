import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Message = {
    role: 'user' | 'model';
    parts: { text: string }[];
};

export function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', parts: [{ text: 'Olá! Sou a assistente virtual da ITWF. Como posso te ajudar hoje com suas renovações ou novos pedidos?' }] }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('open-chatbot', handleOpen);
        return () => window.removeEventListener('open-chatbot', handleOpen);
    }, []);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');

        const newMessages: Message[] = [
            ...messages,
            { role: 'user', parts: [{ text: userMessage }] }
        ];

        setMessages(newMessages);
        setIsLoading(true);

        try {
            // Remover a primeira mensagem de saudação do histórico para a API se ela não for essencial, 
            // ou enviar o histórico completo exceto a saudação inicial local se preferir.
            const historyForApi = newMessages.slice(1, -1);

            const apiUrl = import.meta.env.VITE_API_URL || '';
            const response = await fetch(`${apiUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    history: historyForApi
                })
            });

            const data = await response.json().catch(() => ({ error: 'Formato de resposta inválido' }));

            if (!response.ok) throw new Error(data.error || `Erro de rede (${response.status})`);

            setMessages((prev) => [
                ...prev,
                { role: 'model', parts: [{ text: data.reply || 'Desculpe, não entendi.' }] }
            ]);
        } catch (error) {
            console.error(error);
            setMessages((prev) => [
                ...prev,
                { role: 'model', parts: [{ text: 'Desculpe, estou passando por instabilidades. Por favor, contate o suporte oficial no WhatsApp: (84) 99676-4125.' }] }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating Button */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: isOpen ? 0 : 1 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-24 md:bottom-6 right-6 z-50 p-4 bg-primary text-white rounded-full shadow-2xl hover:bg-primary/90 hover:scale-110 transition-all duration-300 flex items-center justify-center"
            >
                <MessageCircle size={28} />
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className="fixed bottom-24 md:bottom-6 right-6 z-50 w-[350px] sm:w-[400px] h-[500px] max-h-[80vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-black/5 dark:border-white/10 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-primary p-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-xl">
                                    <Bot size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold">Assistente Virtual</h3>
                                    <p className="text-xs text-white/80">Online agora</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                                >
                                    <div className={`p-2 rounded-full shrink-0 ${msg.role === 'user' ? 'bg-primary/10 text-primary' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                                        {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                    </div>
                                    <div
                                        className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-sm shadow-sm ${msg.role === 'user'
                                            ? 'bg-primary text-white rounded-tr-sm'
                                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-black/5 dark:border-white/5 rounded-tl-sm'
                                            }`}
                                    >
                                        {msg.parts[0].text}
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex items-start gap-2">
                                    <div className="p-2 rounded-full shrink-0 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                        <Bot size={16} />
                                    </div>
                                    <div className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-black/5 dark:border-white/5 rounded-tl-sm shadow-sm">
                                        <Loader2 size={16} className="animate-spin text-primary" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Form */}
                        <form onSubmit={handleSend} className="p-4 bg-white dark:bg-slate-900 border-t border-black/5 dark:border-white/10 flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Escreva sua mensagem..."
                                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-3 rounded-xl text-sm outline-none border border-transparent focus:border-primary/30 transition-colors"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="p-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
