
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
  const diagnostics = dataService.getDiagnostics();

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
          : "Welcome! You are currently in Local Mode. Messages you post here will only be visible on this device. Click 'Global Setup' to connect to everyone.",
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
    const interval = setInterval(() => refreshMessages(false), 30000); 
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

    setMessages(prev => [newMessage, ...prev]);
    setIsEditorOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const success = await dataService.saveMessage(newMessage);
    if (!success && isConfigured) {
      alert("Failed to sync to database. Check your Supabase table name and SQL setup.");
    }
    refreshMessages();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium animate-pulse">Checking connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfdfd] text-slate-900 pb-24">
      {/* Top Banner for Status */}
      <div className={`py-2 px-4 text-center text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-500 shadow-sm ${isConfigured ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-amber-900'}`}>
        {isConfigured ? (
          <span className="flex items-center justify-center gap-2"><i className="fa-solid fa-circle-check animate-pulse"></i> Global Mode: Syncing across all devices</span>
        ) : (
          <span className="flex items-center justify-center gap-2"><i className="fa-solid fa-triangle-exclamation"></i> Local Mode: Only you can see these messages</span>
        )}
      </div>

      {/* Navbar */}
      <nav className="bg-white/70 backdrop-blur-xl sticky top-0 z-40 border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-emerald-600"><i className="fa-solid fa-bolt text-xl"></i></span>
            <h1 className="text-lg font-bold tracking-tight text-slate-800">DailyPulse</h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => refreshMessages(true)} 
              disabled={isRefreshing}
              className={`h-9 px-3 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 transition-all ${isRefreshing ? 'text-emerald-500' : ''}`}
            >
              <i className={`fa-solid fa-rotate ${isRefreshing ? 'animate-spin' : ''}`}></i>
            </button>
            {!isConfigured && (
              <button 
                onClick={() => setShowSetupGuide(true)}
                className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 bg-amber-100 text-amber-700 border border-amber-200 rounded-xl hover:bg-amber-200 transition-all flex items-center gap-2"
              >
                <i className="fa-solid fa-circle-exclamation text-amber-500"></i> Global Setup
              </button>
            )}
            <button onClick={() => setIsEditorOpen(true)} className="h-9 px-4 flex items-center justify-center bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-all shadow-md active:scale-95">
              + New
            </button>
          </div>
        </div>
      </nav>

      {/* Setup Diagnostic Overlay */}
      {showSetupGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-[32px] max-w-xl w-full p-8 shadow-2xl animate-in zoom-in duration-300 my-8">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-3xl font-bold text-slate-900 tracking-tight">Sync Status</h3>
                <p className="text-slate-500 text-sm mt-1">Checking your global connection...</p>
              </div>
              <button onClick={() => setShowSetupGuide(false)} className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"><i className="fa-solid fa-xmark"></i></button>
            </div>
            
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-8">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Live Diagnostics</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Database URL</span>
                  {diagnostics.hasUrl ? 
                    <span className="flex items-center gap-2 text-emerald-600 text-xs font-bold bg-emerald-50 px-3 py-1 rounded-full"><i className="fa-solid fa-check"></i> Found</span> : 
                    <span className="flex items-center gap-2 text-rose-500 text-xs font-bold bg-rose-50 px-3 py-1 rounded-full"><i className="fa-solid fa-xmark"></i> Missing</span>
                  }
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Database Key</span>
                  {diagnostics.hasKey ? 
                    <span className="flex items-center gap-2 text-emerald-600 text-xs font-bold bg-emerald-50 px-3 py-1 rounded-full"><i className="fa-solid fa-check"></i> Found</span> : 
                    <span className="flex items-center gap-2 text-rose-500 text-xs font-bold bg-rose-50 px-3 py-1 rounded-full"><i className="fa-solid fa-xmark"></i> Missing</span>
                  }
                </div>
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800">Connection Mode</span>
                  <span className={`text-xs font-black uppercase tracking-widest ${diagnostics.isLive ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {diagnostics.isLive ? 'GLOBAL (Live)' : 'LOCAL ONLY'}
                  </span>
                </div>
              </div>
            </div>

            {!diagnostics.isLive ? (
              <div className="space-y-4 text-sm text-slate-600">
                <p className="font-bold text-slate-800">Why is it still local?</p>
                <ol className="list-decimal list-inside space-y-2 text-xs">
                  <li>You must add <code className="bg-slate-100 px-1 rounded">SUPABASE_URL</code> and <code className="bg-slate-100 px-1 rounded">SUPABASE_KEY</code> to Netlify Environment Variables.</li>
                  <li><b>CRITICAL:</b> After adding keys, you MUST click <b>"Trigger Deploy"</b> in Netlify to rebuild the site with the new keys.</li>
                  <li>Ensure there are no extra spaces or quotes in the values.</li>
                </ol>
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full mt-4 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-rotate"></i> Check for Updates
                </button>
              </div>
            ) : (
              <div className="text-center p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-emerald-700 text-sm font-bold">Your connection is perfect! Every device can see your messages now.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-5xl md:text-7xl font-serif font-bold text-slate-900 mb-6 tracking-tight leading-tight">Shared Thoughts.</h2>
        <p className="text-slate-500 text-xl font-medium max-w-lg mx-auto leading-relaxed">A live community board for everyone.</p>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6">
        {isEditorOpen ? (
          <PostEditor onPost={handlePost} onCancel={() => setIsEditorOpen(false)} />
        ) : (
          <div className="mb-16 flex flex-col items-center gap-4">
             <button onClick={() => setIsEditorOpen(true)} className="group flex items-center gap-4 px-10 py-6 bg-white border border-slate-200 rounded-[28px] shadow-sm hover:border-emerald-400 hover:shadow-2xl hover:shadow-emerald-100/40 transition-all active:scale-95">
              <span className="h-8 w-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm shadow-lg shadow-emerald-200"><i className="fa-solid fa-plus"></i></span>
              <span className="font-bold text-slate-800 text-lg tracking-tight">Share something for everyone</span>
            </button>
          </div>
        )}

        <div className="space-y-16">
          {messages.map((msg, idx) => (
            <DailyMessageCard key={msg.id} message={msg} isLatest={idx === 0} />
          ))}
        </div>

        <footer className="mt-32 pt-16 border-t border-slate-100 text-center">
          <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.3em] mb-6">Pulse Community Protocol v2.0</p>
          <div className="flex justify-center gap-8 text-slate-200">
            <i className="fa-solid fa-bolt text-xl hover:text-emerald-400 transition-colors cursor-pointer"></i>
            <i className="fa-solid fa-earth-americas text-xl hover:text-indigo-400 transition-colors cursor-pointer"></i>
            <i className="fa-solid fa-shield-heart text-xl hover:text-rose-400 transition-colors cursor-pointer"></i>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;
