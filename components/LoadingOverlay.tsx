
import React from 'react';

interface LoadingOverlayProps {
  message: string;
  subMessage?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message, subMessage }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin"></div>
        <div className="absolute inset-4 border-4 border-purple-500/20 rounded-full"></div>
        <div className="absolute inset-4 border-4 border-b-purple-500 rounded-full animate-spin-slow"></div>
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">{message}</h2>
      {subMessage && <p className="text-gray-400 max-w-md">{subMessage}</p>}
      <div className="mt-8 flex gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }}></div>
        ))}
      </div>
    </div>
  );
};
