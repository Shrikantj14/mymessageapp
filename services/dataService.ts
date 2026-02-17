
import { DailyMessage } from '../types';

/**
 * Robust environment variable detector.
 * Checks for standard, Vite-prefixed, and import.meta styles.
 */
const getEnv = (key: string): string => {
  const viteKey = `VITE_${key}`;
  
  try {
    // 1. Check import.meta.env (Standard for modern Vite/ESM builds)
    const metaEnv = (import.meta as any).env;
    if (metaEnv) {
      if (metaEnv[viteKey]) return metaEnv[viteKey];
      if (metaEnv[key]) return metaEnv[key];
    }

    // 2. Check process.env (Standard for Node/Older builds)
    if (typeof process !== 'undefined' && process.env) {
      if (process.env[viteKey]) return process.env[viteKey] as string;
      if (process.env[key]) return process.env[key] as string;
    }

    // 3. Check window global (Some build tools inject here)
    if ((window as any)[viteKey]) return (window as any)[viteKey];
    if ((window as any)[key]) return (window as any)[key];
    if ((window as any)._env_ && (window as any)._env_[key]) return (window as any)._env_[key];

  } catch (e) {
    // Silent fail
  }
  return '';
};

export const dataService = {
  getConfig() {
    return {
      url: getEnv('SUPABASE_URL'),
      key: getEnv('SUPABASE_KEY')
    };
  },

  isConfigured(): boolean {
    const { url, key } = this.getConfig();
    return url.length > 5 && key.length > 5;
  },

  async getMessages(): Promise<DailyMessage[]> {
    const { url, key } = this.getConfig();
    
    if (!this.isConfigured()) {
      const saved = localStorage.getItem('community_bulletin_msgs');
      return saved ? JSON.parse(saved) : [];
    }

    try {
      const response = await fetch(`${url}/rest/v1/message?select=*&order=timestamp.desc`, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`
        }
      });
      
      if (!response.ok) throw new Error(`DB Error: ${response.status}`);
      
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
      console.error("Connection error:", error);
      const saved = localStorage.getItem('community_bulletin_msgs');
      return saved ? JSON.parse(saved) : [];
    }
  },

  async saveMessage(message: DailyMessage): Promise<boolean> {
    const { url, key } = this.getConfig();
    
    // Always keep a local copy as backup
    const localSaved = JSON.parse(localStorage.getItem('community_bulletin_msgs') || '[]');
    localStorage.setItem('community_bulletin_msgs', JSON.stringify([message, ...localSaved]));

    if (!this.isConfigured()) return true;

    try {
      const response = await fetch(`${url}/rest/v1/message`, {
        method: 'POST',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
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
