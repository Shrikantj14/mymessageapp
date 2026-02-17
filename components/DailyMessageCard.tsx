
import React from 'react';
import { DailyMessage } from '../types';

interface DailyMessageCardProps {
  message: DailyMessage;
  isLatest?: boolean;
}

const DailyMessageCard: React.FC<DailyMessageCardProps> = ({ message, isLatest = false }) => {
  const formattedDate = new Date(message.timestamp).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className={`relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all hover:shadow-md ${isLatest ? 'ring-2 ring-indigo-500/20' : ''}`}>
      {isLatest && (
        <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl-lg">
          Latest Update
        </div>
      )}
      
      <div className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
            <i className="fa-solid fa-calendar-day"></i>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{formattedDate}</h3>
            <p className="text-xs text-slate-400">Posted by {message.author}</p>
          </div>
        </div>

        <blockquote className="font-serif text-xl md:text-2xl text-slate-800 leading-relaxed italic">
          "{message.content}"
        </blockquote>

        {message.aiEnhanced && (
          <div className="mt-6 flex items-center gap-2 text-xs text-indigo-500 font-medium bg-indigo-50/50 w-fit px-2 py-1 rounded">
            <i className="fa-solid fa-wand-magic-sparkles"></i>
            Enhanced by AI
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyMessageCard;
