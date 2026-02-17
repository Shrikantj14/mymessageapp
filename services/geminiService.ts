
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI | null = null;

  // Only initialize the AI when it's actually needed
  private getAI() {
    if (this.ai) return this.ai;
    
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === 'undefined') {
      console.warn("Gemini API key is missing in Netlify. AI features are disabled, but the app will continue to work.");
      return null;
    }

    try {
      this.ai = new GoogleGenAI({ apiKey });
      return this.ai;
    } catch (e) {
      console.error("Failed to initialize Gemini:", e);
      return null;
    }
  }

  async polishMessage(message: string): Promise<string> {
    try {
      const client = this.getAI();
      if (!client) return message; // Return original if AI isn't ready

      const response = await client.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `I want to post a daily message on a community bulletin. Please polish this message to make it sound inspiring, clear, and professional yet warm. Keep it concise. Original message: "${message}"`,
        config: {
          temperature: 0.7,
        },
      });

      return response.text?.trim() || message;
    } catch (error) {
      console.error("Error polishing message:", error);
      return message;
    }
  }

  async generateDailyQuote(): Promise<string> {
    try {
      const client = this.getAI();
      if (!client) return "Every day is a new opportunity to grow together.";

      const response = await client.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Generate a short, inspiring, and unique one-sentence quote for a daily community bulletin. Do not use quotes from famous people, create something fresh and relevant for a modern community.",
      });
      return response.text?.trim() || "Every day is a new opportunity to grow together.";
    } catch (error) {
      console.error("Error generating quote:", error);
      return "Community is the heart of every great achievement.";
    }
  }
}

export const geminiService = new GeminiService();
