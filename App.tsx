
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
  const [showSetupGuide, setShowSetupGuide] = useState(false);

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
          ? "The board is empty. Be the first to post something!" 
          : "Welcome! You are currently in Local Mode. Messages you post here will only be visible on this device. Click 'Setup Global Sync' to connect to everyone.",
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
    const interval = setInterval(() => refreshMessages(false), 30000); // Auto-refresh every 30 seconds
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
    if (!success) {
      alert("Failed to sync message to the cloud. It is saved locally on this device.");
    }
    refreshMessages();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium animate-pulse">Connecting to Pulse...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfdfd] text-slate-900 pb-24">
      {/* Top Banner for Status */}
      <div className={`py-2 px-4 text-center text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${isConfigured ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-amber-900'}`}>
        {isConfigured ? (
          <span><i className="fa-solid fa-cloud mr-2"></i> Global Sync Active</span>
        ) : (
          <span><i className="fa-solid fa-circle-exclamation mr-2"></i> Local Mode (Messages not shared)</span>
        )}
      </div>

      {/* Navbar */}
      <nav className="bg-white/70 backdrop-blur-xl sticky top-0 z-40 border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-emerald-600"><i className="fa-solid fa-earth-americas text-xl"></i></span>
            <h1 className="text-lg font-bold tracking-tight text-slate-800">DailyPulse</h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => refreshMessages(true)} 
              disabled={isRefreshing}
              className={`h-8 w-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 transition-all ${isRefreshing ? 'animate-spin text-emerald-500' : ''}`}
              title="Refresh messages"
            >
              <i className="fa-solid fa-rotate"></i>
            </button>
            {!isConfigured && (
              <button 
                onClick={() => setShowSetupGuide(true)}
                className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              >
                Setup Global Sync
              </button>
            )}
            <button onClick={() => setIsEditorOpen(true)} className="h-8 w-8 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 transition-all">
              <i className="fa-solid fa-plus"></i>
            </button>
          </div>
        </div>
      </nav>

      {/* Setup Wizard Overlay */}
      {showSetupGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl animate-in zoom-in duration-300 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Go Live</h3>
                <p className="text-slate-500 text-sm">Make your messages visible to everyone.</p>
              </div>
              <button onClick={() => setShowSetupGuide(false)} className="text-slate-400 hover:text-slate-600 p-2"><i className="fa-solid fa-xmark text-xl"></i></button>
            </div>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold shrink-0">1</div>
                <div>
                  <p className="font-semibold text-slate-700 leading-tight mb-1">Database setup</p>
                  <p className="text-xs text-slate-500">Go to <a href="https://supabase.com" target="_blank" className="text-emerald-600 underline">supabase.com</a> and create a free project.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold shrink-0">2</div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-700 leading-tight mb-1">Run SQL Command</p>
                  <p className="text-xs text-slate-500 mb-2">In Supabase "SQL Editor", paste and run this:</p>
                  <div className="bg-slate-900 p-4 rounded-xl font-mono text-[10px] text-emerald-400 relative group border border-slate-800">
                    <code>create table message ( id uuid primary key, content text, author text, ai_enhanced boolean, timestamp bigint );</code>
                    <button 
                      onClick={() => navigator.clipboard.writeText('create table message ( id uuid primary key, content text, author text, ai_enhanced boolean, timestamp bigint );')}
                      className="absolute right-2 top-2 bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded text-[9px] font-bold transition-all"
                    >Copy</button>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold shrink-0">3</div>
                <div>
                  <p className="font-semibold text-slate-700 leading-tight mb-1">Configure Netlify</p>
                  <p className="text-xs text-slate-500">In Netlify > Site Settings > Environment Variables, add your <b>SUPABASE_URL</b> and <b>SUPABASE_KEY</b>.</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowSetupGuide(false)}
              className="w-full mt-8 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
            >
              I've updated my settings
            </button>
            <p className="text-[10px] text-center text-slate-400 mt-4 uppercase tracking-widest">Don't forget to re-deploy after saving variables!</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h2 className="text-5xl md:text-6xl font-serif font-bold text-slate-900 mb-4 tracking-tight">Shared Pulse.</h2>
        <p className="text-slate-500 text-lg">Daily thoughts from our community, updated in real-time.</p>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6">
        {isEditorOpen ? (
          <PostEditor onPost={handlePost} onCancel={() => setIsEditorOpen(false)} />
        ) : (
          <div className="mb-12 flex flex-col items-center gap-4">
             <button onClick={() => setIsEditorOpen(true)} className="group flex items-center gap-3 px-10 py-5 bg-white border border-slate-200 rounded-full shadow-sm hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-50 transition-all active:scale-95">
              <span className="h-7 w-7 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs"><i className="fa-solid fa-plus"></i></span>
              <span className="font-bold text-slate-700 tracking-tight">Post your message for today</span>
            </button>
            {isRefreshing && <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest animate-pulse">Updating feed...</p>}
          </div>
        )}

        <div className="space-y-12">
          {messages.map((msg, idx) => (
            <DailyMessageCard key={msg.id} message={msg} isLatest={idx === 0} />
          ))}
        </div>

        <footer className="mt-24 pt-12 border-t border-slate-100 text-center">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mb-2">Developed for the Community</p>
          <div className="flex justify-center gap-4 text-slate-300">
            <i className="fa-solid fa-heart hover:text-red-400 transition-colors cursor-pointer"></i>
            <i className="fa-solid fa-comment hover:text-emerald-400 transition-colors cursor-pointer"></i>
            <i className="fa-solid fa-share hover:text-indigo-400 transition-colors cursor-pointer"></i>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;
