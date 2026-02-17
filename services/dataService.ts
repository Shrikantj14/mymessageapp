
import { DailyMessage } from '../types';

// Helper to safely get environment variables in various environments
const getEnv = (key: string): string => {
  try {
    // Check process.env first (standard)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
    // Check window environment if exists
    if ((window as any)._env_ && (window as any)._env_[key]) {
      return (window as any)._env_[key];
    }
  } catch (e) {
    console.warn(`Error accessing env var ${key}:`, e);
  }
  return '';
};

const SUPABASE_URL = getEnv('SUPABASE_URL'); 
const SUPABASE_KEY = getEnv('SUPABASE_KEY');

export const dataService = {
  isConfigured(): boolean {
    const hasUrl = SUPABASE_URL.length > 0;
    const hasKey = SUPABASE_KEY.length > 0;
    return hasUrl && hasKey;
  },

  getDiagnostics() {
    return {
      hasUrl: SUPABASE_URL.length > 0,
      urlPrefix: SUPABASE_URL ? SUPABASE_URL.substring(0, 15) + '...' : 'none',
      hasKey: SUPABASE_KEY.length > 0,
      keyPrefix: SUPABASE_KEY ? SUPABASE_KEY.substring(0, 5) + '...' : 'none',
      isLive: this.isConfigured()
    };
  },

  async getMessages(): Promise<DailyMessage[]> {
    if (!this.isConfigured()) {
      const saved = localStorage.getItem('community_bulletin_msgs');
      return saved ? JSON.parse(saved) : [];
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/message?select=*&order=timestamp.desc`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      
      if (!response.ok) throw new Error(`Database Error: ${response.status}`);
      
      const data = await response.json();
      return data.map((item: any) => ({
        id: item.id,
        content: item.content,
        author: item.author,
        aiEnhanced: item.ai_enhanced,
        timestamp: item.timestamp,
        date: new Date(item.timestamp).toISOString()
      }));
    } catch (error) {
      console.error("DB Fetch Error:", error);
      // Fallback to local storage on error so the app doesn't break
      const saved = localStorage.getItem('community_bulletin_msgs');
      return saved ? JSON.parse(saved) : [];
    }
  },

  async saveMessage(message: DailyMessage): Promise<boolean> {
    // Local backup always happens
    const localSaved = await this.getMessages();
    localStorage.setItem('community_bulletin_msgs', JSON.stringify([message, ...localSaved]));

    if (!this.isConfigured()) return true;

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/message`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          id: message.id,
          content: message.content,
          author: message.author,
          ai_enhanced: message.aiEnhanced,
          timestamp: message.timestamp
        })
      });
      return response.ok;
    } catch (error) {
      console.error("Save Error:", error);
      return false;
    }
  }
};
