
import { DailyMessage } from '../types';

const SUPABASE_URL = process.env.SUPABASE_URL || ''; 
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

export const dataService = {
  isConfigured(): boolean {
    return SUPABASE_URL.length > 0 && SUPABASE_KEY.length > 0;
  },

  async getMessages(): Promise<DailyMessage[]> {
    if (!this.isConfigured()) {
      const saved = localStorage.getItem('community_bulletin_msgs');
      return saved ? JSON.parse(saved) : [];
    }

    try {
      // Updated from /messages to /message
      const response = await fetch(`${SUPABASE_URL}/rest/v1/message?select=*&order=timestamp.desc`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      
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
      const saved = localStorage.getItem('community_bulletin_msgs');
      return saved ? JSON.parse(saved) : [];
    }
  },

  async saveMessage(message: DailyMessage): Promise<boolean> {
    // Local backup
    const localSaved = await this.getMessages();
    localStorage.setItem('community_bulletin_msgs', JSON.stringify([message, ...localSaved]));

    if (!this.isConfigured()) return true;

    try {
      // Updated from /messages to /message
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
      return false;
    }
  }
};
