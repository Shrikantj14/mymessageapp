
import React, { useState, useEffect, useCallback } from 'react';
import { DailyMessage } from './types';
import DailyMessageCard from './components/DailyMessageCard';
import PostEditor from './components/PostEditor';
import { dataService } from './services/dataService';

const App: React.FC = () => {
  const [messages, setMessages] = useState<DailyMessage[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isConfigured = dataService.isConfigured();

  const refreshMessages = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const remoteMessages = await dataService.getMessages();
      const sorted = [...remoteMessages].sort((a, b) => b.timestamp - a.timestamp);
      
      setMessages(sorted.length > 0 ? sorted : [{
        id: 'welcome',
        date: new Date().toISOString(),
        content: isConfigured 
          ? "The board is empty. Be the first to share a thought!" 
          : "Welcome! Pulse is currently in local mode. To sync with everyone, ensure your Supabase keys are correctly set in your host environment.",
        author: "System",
        aiEnhanced: false,
        timestamp: Date.now(),
      }]);
    } catch (err) {
      console.error("Refresh failed", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isConfigured]);

  useEffect(() => {
    refreshMessages();
    const interval = setInterval(() => refreshMessages(false), 15000); 
    return () => clearInterval(interval);
  }, [refreshMessages]);

  const handlePost = async (content: string, author: string, enhanced: boolean) => {
    const newMessage: DailyMessage = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      content,
      author,
      aiEnhanced: enhanced,
      timestamp: Date.now(),
    };

    // Optimistic update
    setMessages(prev => [newMessage, ...prev]);
    setIsEditorOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const success = await dataService.saveMessage(newMessage);
    if (!success && isConfigured) {
      console.warn("Could not sync message to cloud database.");
    }
    refreshMessages();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-6">
          <div className="h-10 w-10 border-2 border-slate-100 border-t-slate-900 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] animate-pulse">Initializing Feed</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfdfd] text-slate-900 pb-32">
      {/* Subtle Connection Status Line */}
      <div className={`h-1 w-full transition-all duration-1000 ${isConfigured ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>

      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`h-2 w-2 rounded-full ${isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
            <h1 className="text-sm font-black tracking-[0.2em] text-slate-900">DAILYPULSE</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => refreshMessages(true)} 
              disabled={isRefreshing}
              className={`text-slate-400 hover:text-slate-900 transition-all ${isRefreshing ? 'rotate-180 text-emerald-500' : ''}`}
              title="Refresh Feed"
            >
              <i className="fa-solid fa-rotate-right text-xs"></i>
            </button>
            <button 
              onClick={() => setIsEditorOpen(true)} 
              className="px-5 py-2 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-slate-200"
            >
              + New Entry
            </button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h2 className="text-6xl md:text-8xl font-serif font-bold text-slate-900 mb-6 tracking-tighter leading-none">Shared Thoughts.</h2>
        <div className="flex items-center justify-center gap-4 text-slate-400">
          <div className="h-px w-8 bg-slate-200"></div>
          <p className="text-xs font-bold uppercase tracking-[0.2em]">Public Bulletin</p>
          <div className="h-px w-8 bg-slate-200"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6">
        {isEditorOpen ? (
          <PostEditor onPost={handlePost} onCancel={() => setIsEditorOpen(false)} />
        ) : (
          <div className="mb-20 flex justify-center">
             <button 
              onClick={() => setIsEditorOpen(true)} 
              className="flex items-center gap-4 px-10 py-6 bg-white border border-slate-100 rounded-[32px] shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group"
            >
              <div className="h-8 w-8 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                <i className="fa-solid fa-plus text-xs"></i>
              </div>
              <span className="font-bold text-slate-800 text-lg tracking-tight">Post for today</span>
            </button>
          </div>
        )}

        <div className="space-y-12">
          {messages.map((msg, idx) => (
            <DailyMessageCard key={msg.id} message={msg} isLatest={idx === 0} />
          ))}
        </div>

        <footer className="mt-40 text-center opacity-30 grayscale hover:grayscale-0 transition-all">
          <p className="text-[9px] font-black uppercase tracking-[0.6em] mb-10">Sync Protocol Active</p>
          <div className="flex justify-center gap-12 text-slate-400">
            <i className="fa-solid fa-circle text-[6px]"></i>
            <i className="fa-solid fa-circle text-[6px]"></i>
            <i className="fa-solid fa-circle text-[6px]"></i>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;
