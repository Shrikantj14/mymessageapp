
import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';

interface PostEditorProps {
  onPost: (content: string, author: string, enhanced: boolean) => void;
  onCancel: () => void;
}

const PostEditor: React.FC<PostEditorProps> = ({ onPost, onCancel }) => {
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [isPolishing, setIsPolishing] = useState(false);
  const [isEnhanced, setIsEnhanced] = useState(false);

  const handlePolish = async () => {
    if (!content.trim()) return;
    setIsPolishing(true);
    const polished = await geminiService.polishMessage(content);
    setContent(polished);
    setIsEnhanced(true);
    setIsPolishing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !author.trim()) return;
    onPost(content, author, isEnhanced);
    setContent('');
    setAuthor('');
    setIsEnhanced(false);
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-2xl border border-emerald-100 mb-12 animate-in fade-in zoom-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <span className="h-8 w-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs">
            <i className="fa-solid fa-plus"></i>
          </span>
          Share with the Community
        </h2>
        <button 
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <i className="fa-solid fa-xmark text-lg"></i>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Your Name</label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="How should we call you?"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-700"
            required
          />
        </div>

        <div className="relative">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Your Message</label>
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (isEnhanced) setIsEnhanced(false);
            }}
            placeholder="Share a thought, a quote, or a greeting for today..."
            className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none text-slate-700"
            required
          />
          <button
            type="button"
            onClick={handlePolish}
            disabled={isPolishing || !content.trim()}
            className="absolute bottom-3 right-3 bg-white border border-emerald-100 text-emerald-600 text-xs font-bold px-3 py-2 rounded-lg shadow-sm hover:bg-emerald-50 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isPolishing ? (
              <i className="fa-solid fa-circle-notch fa-spin"></i>
            ) : (
              <i className="fa-solid fa-wand-magic-sparkles"></i>
            )}
            AI Polish
          </button>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
          <p className="text-xs text-slate-400 italic text-center sm:text-left">
            {isEnhanced ? "✨ Your message has been polished for clarity." : "Tip: Use AI Polish to refine your daily message."}
          </p>
          <button
            type="submit"
            className="w-full sm:w-auto bg-slate-900 hover:bg-emerald-600 text-white font-bold px-8 py-3 rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            Post to Bulletin
            <i className="fa-solid fa-arrow-right text-sm"></i>
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostEditor;
