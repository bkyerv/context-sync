import React from 'react';

export const Loader: React.FC<{ text?: string }> = ({ text = "Thinking..." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative w-12 h-12">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-primary rounded-full animate-ping opacity-25"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-t-primary border-r-transparent border-b-secondary border-l-transparent rounded-full animate-spin"></div>
      </div>
      <p className="text-zinc-400 text-sm animate-pulse">{text}</p>
    </div>
  );
};
