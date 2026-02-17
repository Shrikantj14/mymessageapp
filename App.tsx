
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
    const remoteMessages = await dataService.getMessages();
    const sorted = [...remoteMessages].sort((a, b) => b.timestamp - a.timestamp);
    
    setMessages(sorted.length > 0 ? sorted : [{
      id: 'welcome',
      date: new Date().toISOString(),
      content: isConfigured 
        ? "The board is empty. Be the first to post something!" 
        : "Welcome! Your messages are currently staying on this computer only. Click 'Global Setup' in the top right to make them public.",
      author: "System",
      aiEnhanced: false,
      timestamp: Date.now(),
    }]);
    
    setIsLoading(false);
    setIsRefreshing(false);
  }, [isConfigured]);

  useEffect(() => {
    refreshMessages();
    const interval = setInterval(() => refreshMessages(true), 60000);
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

    await dataService.saveMessage(newMessage);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-10 w-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfdfd] text-slate-900 pb-24">
      {/* Navbar */}
      <nav className="bg-white/70 backdrop-blur-xl sticky top-0 z-40 border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-emerald-600"><i className="fa-solid fa-earth-americas text-xl"></i></span>
            <h1 className="text-lg font-bold tracking-tight text-slate-800">DailyPulse</h1>
          </div>
          <div className="flex items-center gap-4">
            {!isConfigured && (
              <button 
                onClick={() => setShowSetupGuide(true)}
                className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-amber-50 text-amber-600 rounded-full border border-amber-100 hover:bg-amber-100 transition-colors"
              >
                <i className="fa-solid fa-triangle-exclamation mr-1"></i> Global Setup
              </button>
            )}
            <button onClick={() => setIsEditorOpen(true)} className="text-xs font-bold uppercase tracking-widest text-emerald-600">+ New</button>
          </div>
        </div>
      </nav>

      {/* Setup Wizard Overlay */}
      {showSetupGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-bold text-slate-800">Connect to the World</h3>
              <button onClick={() => setShowSetupGuide(false)} className="text-slate-400 hover:text-slate-600"><i className="fa-solid fa-xmark text-xl"></i></button>
            </div>
            <p className="text-slate-600 mb-6">To let others see your messages, you need to connect a Supabase database. It takes 2 minutes:</p>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">1</div>
                <div>
                  <p className="font-semibold text-slate-700">Create a Supabase Project</p>
                  <p className="text-xs text-slate-400">Go to supabase.com and start a free project.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">2</div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-700">Run this SQL command</p>
                  <p className="text-xs text-slate-400 mb-2">Open "SQL Editor" in Supabase and paste this:</p>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-[10px] text-slate-500 relative group">
                    <code>create table message ( id uuid primary key, content text, author text, ai_enhanced boolean, timestamp bigint );</code>
                    <button 
                      onClick={() => navigator.clipboard.writeText('create table message ( id uuid primary key, content text, author text, ai_enhanced boolean, timestamp bigint );')}
                      className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 bg-white shadow-sm border px-2 py-1 rounded text-[9px] font-bold transition-opacity"
                    >Copy</button>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">3</div>
                <div>
                  <p className="font-semibold text-slate-700">Add Keys to Netlify</p>
                  <p className="text-xs text-slate-400">Add SUPABASE_URL and SUPABASE_KEY to your Netlify Environment Variables.</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowSetupGuide(false)}
              className="w-full mt-8 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all"
            >
              Got it, I'll set it up!
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h2 className="text-5xl font-serif font-bold text-slate-900 mb-4">Shared Thoughts.</h2>
        <p className="text-slate-500">A live community board for everyone.</p>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6">
        {isEditorOpen ? (
          <PostEditor onPost={handlePost} onCancel={() => setIsEditorOpen(false)} />
        ) : (
          <div className="mb-12 flex justify-center">
             <button onClick={() => setIsEditorOpen(true)} className="group flex items-center gap-3 px-8 py-4 bg-white border border-slate-200 rounded-full shadow-sm hover:border-emerald-200 transition-all">
              <span className="h-6 w-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px]"><i className="fa-solid fa-plus"></i></span>
              <span className="font-semibold text-slate-600">Share something for everyone</span>
            </button>
          </div>
        )}

        <div className="space-y-12">
          {messages.map((msg, idx) => (
            <DailyMessageCard key={msg.id} message={msg} isLatest={idx === 0} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default App;
