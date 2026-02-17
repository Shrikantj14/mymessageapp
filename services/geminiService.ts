
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async polishMessage(message: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
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
      const response = await this.ai.models.generateContent({
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
