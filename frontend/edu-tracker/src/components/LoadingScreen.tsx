import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-500">
      <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 max-w-sm w-full mx-4 animate-in fade-in zoom-in duration-300">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin relative z-10" />
          <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-2 -right-2 animate-bounce" />
        </div>
        <div className="flex flex-col items-center gap-1">
            <h3 className="text-lg font-semibold text-slate-800">EduTracker</h3>
            <p className="text-slate-500 font-medium animate-pulse">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
