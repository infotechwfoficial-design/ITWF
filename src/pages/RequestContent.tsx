import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Search,
  Heart,
  MessageCircle,
  Info,
  Star,
  Film,
  Tv,
  X,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import Layout from '../components/Layout';
import { Client } from '../types';
import { supabase } from '../utils/supabase';

interface TMDBResult {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  release_date?: string;
  first_air_date?: string;
  poster_path: string;
  media_type: 'movie' | 'tv';
  vote_average: number;
}

export default function RequestContent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TMDBResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<TMDBResult | null>(null);
  const [showLiveResults, setShowLiveResults] = useState(false);
  const [liveResults, setLiveResults] = useState<TMDBResult[]>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch client data
        const { data: clientData } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id)
          .single();
        if (clientData) setClient(clientData);

        // Fetch favorites
        const { data: favData } = await supabase
          .from('favorites')
          .select('content_id')
          .eq('user_id', user.id);

        if (favData) {
          setFavorites(favData.map(f => f.content_id));
        }
      }
    };
    fetchUserData();
  }, []);

  // Debounced search for live results
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length > 2) {
        setIsSearching(true);
        try {
          const apiKey = (import.meta as any).env.VITE_TMDB_API_KEY;
          const url = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=pt-BR`;
          const res = await fetch(url);
          const data = await res.json();
          // Filter out people and people who don't have posters/known_for
          const filteredResults = (data.results || []).filter((m: any) =>
            (m.media_type === 'movie' || m.media_type === 'tv') && m.poster_path
          );
          setLiveResults(filteredResults.slice(0, 5));
          setShowLiveResults(true);
        } catch (err) {
          console.error('Live search error:', err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setLiveResults([]);
        setShowLiveResults(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query) return;
    setLoading(true);
    setShowLiveResults(false);
    try {
      const apiKey = (import.meta as any).env.VITE_TMDB_API_KEY || 'YOUR_TMDB_API_KEY';
      if (!apiKey || apiKey === 'YOUR_TMDB_API_KEY') {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${apiUrl}/api/tmdb/search?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        const filtered = (data.results || []).filter((m: any) => m.media_type === 'movie' || m.media_type === 'tv');
        setResults(filtered);
        return;
      }

      const url = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=pt-BR`;
      const res = await fetch(url);
      const data = await res.json();
      const filtered = (data.results || []).filter((m: any) => m.media_type === 'movie' || m.media_type === 'tv');
      setResults(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (media: TMDBResult) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !client) return;

    const isFav = favorites.includes(media.id.toString());
    if (isFav) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('content_id', media.id.toString());

      setFavorites(favorites.filter(id => id !== media.id.toString()));
    } else {
      await supabase
        .from('favorites')
        .insert([{
          user_id: user.id,
          username: client.username || user.email?.split('@')[0],
          content_id: media.id.toString(),
          content_title: media.title || media.name,
          content_type: media.media_type,
          poster_path: media.poster_path
        }]);

      setFavorites([...favorites, media.id.toString()]);
    }
  };

  const handleRequest = async (media: TMDBResult) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !client) return;

    const title = media.title || media.name;
    const type = media.media_type === 'movie' ? 'Filme' : 'Série';
    const year = (media.release_date || media.first_air_date || '').split('-')[0];
    const tmdbLink = `https://www.themoviedb.org/${media.media_type}/${media.id}`;
    const username = client.username || user.email?.split('@')[0];

    // Save to DB
    await supabase.from('requests').insert([{
      user_id: user.id,
      username,
      client_name: client.name,
      content_title: title,
      content_type: type,
      content_year: year,
      tmdb_link: tmdbLink,
      status: 'AGUARDE'
    }]);

    // WhatsApp Message
    const whatsappMessage = `*Novo Pedido de Conteúdo*\n\n` +
      `*Nome:* ${title}\n` +
      `*Tipo:* ${type}\n` +
      `*Ano:* ${year}\n` +
      `*Link TMDB:* ${tmdbLink}\n\n` +
      `*Solicitado por:* ${client.name} (@${username})`;

    const encodedMessage = encodeURIComponent(whatsappMessage);
    window.open(`https://wa.me/5584996764125?text=${encodedMessage}`, '_blank');
  };

  return (
    <Layout>
      <div className="flex flex-col gap-8">
        <header>
          <h1 className="text-3xl font-black tracking-tight">Pedir Conteúdo</h1>
          <p className="text-slate-500 dark:text-slate-400">Pesquise filmes ou séries e faça seu pedido via WhatsApp.</p>
        </header>

        <form onSubmit={handleSearch} className="relative z-30">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => query.length > 2 && setShowLiveResults(true)}
            placeholder="Pesquisar filme ou série..."
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-black/5 dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-primary shadow-sm"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-white px-6 py-2 rounded-xl font-bold text-sm"
          >
            {loading ? <RefreshCw className="animate-spin" size={18} /> : 'Buscar'}
          </button>

          {/* Live Results Dropdown */}
          {showLiveResults && liveResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
              {liveResults.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setQuery(m.title || m.name || '');
                    setSelectedMedia(m);
                    setShowLiveResults(false);
                  }}
                  className="w-full flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-black/5 dark:border-white/5 last:border-0"
                >
                  <img
                    src={`https://image.tmdb.org/t/p/w92${m.poster_path}`}
                    alt=""
                    className="w-10 h-14 object-cover rounded-md"
                  />
                  <div className="text-left">
                    <p className="font-bold text-sm line-clamp-1">{m.title || m.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {m.media_type === 'movie' ? 'Filme' : 'Série'} • {(m.release_date || m.first_air_date || '').split('-')[0]}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </form>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {results.map((media) => (
            <motion.div
              key={media.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-black/5 dark:border-white/10 shadow-sm hover:shadow-xl transition-all"
            >
              <div className="aspect-[2/3] relative overflow-hidden">
                {media.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w500${media.poster_path}`}
                    alt={media.title || media.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                    <Film size={48} className="text-slate-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRequest(media)}
                      className="flex-1 bg-primary text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <MessageCircle size={14} />
                      Pedir
                    </button>
                    <button
                      onClick={() => toggleFavorite(media)}
                      className={`p-2 rounded-lg ${favorites.includes(media.id.toString()) ? 'bg-rose-500 text-white' : 'bg-white/20 text-white backdrop-blur-md'}`}
                    >
                      <Heart size={14} fill={favorites.includes(media.id.toString()) ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1">
                    {media.media_type === 'movie' ? <Film size={10} /> : <Tv size={10} />}
                    {media.media_type === 'movie' ? 'Filme' : 'Série'}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500">
                    <Star size={10} fill="currentColor" />
                    {media.vote_average?.toFixed(1) || '0.0'}
                  </span>
                </div>
                <h3 className="font-bold text-sm truncate">{media.title || media.name}</h3>
                <p className="text-[10px] text-slate-500">
                  {(media.release_date || media.first_air_date || '').split('-')[0]}
                </p>
                <button
                  onClick={() => setSelectedMedia(media)}
                  className="mt-2 text-[10px] font-bold text-slate-400 hover:text-primary flex items-center gap-1"
                >
                  <Info size={10} />
                  Ver Sinopse
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {results.length === 0 && !loading && query && (
          <div className="py-20 text-center text-slate-500 italic">
            Nenhum resultado encontrado para "{query}".
          </div>
        )}
      </div>

      {/* Synopsis Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
          >
            <div className="relative aspect-video">
              <img
                src={`https://image.tmdb.org/t/p/original${selectedMedia.poster_path}`}
                className="w-full h-full object-cover"
                alt="Backdrop"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-900 to-transparent"></div>
              <button
                onClick={() => setSelectedMedia(null)}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-8 -mt-12 relative z-10">
              <h2 className="text-3xl font-black mb-2">{selectedMedia.title || selectedMedia.name}</h2>
              <div className="flex items-center gap-4 mb-6">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase">
                  {selectedMedia.media_type === 'movie' ? 'Filme' : 'Série'}
                </span>
                <span className="text-slate-500 text-sm font-medium">
                  {(selectedMedia.release_date || selectedMedia.first_air_date || '').split('-')[0]}
                </span>
                <span className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star size={16} fill="currentColor" />
                  {selectedMedia.vote_average?.toFixed(1) || '0.0'}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm mb-8">
                {selectedMedia.overview || 'Sinopse não disponível em português.'}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    handleRequest(selectedMedia);
                    setSelectedMedia(null);
                  }}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle size={20} />
                  Pedir no WhatsApp
                </button>
                <button
                  onClick={() => toggleFavorite(selectedMedia)}
                  className={`p-4 rounded-2xl border ${favorites.includes(selectedMedia.id.toString()) ? 'bg-rose-500 border-rose-500 text-white' : 'border-black/10 dark:border-white/10 text-slate-400'}`}
                >
                  <Heart size={24} fill={favorites.includes(selectedMedia.id.toString()) ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </Layout>
  );
}
