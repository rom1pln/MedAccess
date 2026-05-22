import React from 'react';
import { motion } from 'motion/react';
import { Delete, CornerDownLeft, Space, ArrowBigUp } from 'lucide-react';
import { cn } from '../lib/utils';

interface TouchKeyboardProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onEnter: () => void;
  onSpace: () => void;
  className?: string;
}

export const TouchKeyboard: React.FC<TouchKeyboardProps> = ({ 
  onKeyPress, 
  onDelete, 
  onEnter, 
  onSpace,
  className 
}) => {
  const [isShift, setIsShift] = React.useState(false);

  const rows = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '?'],
  ];

  const handleKey = (key: string) => {
    onKeyPress(isShift ? key.toUpperCase() : key);
  };

  return (
    <div className={cn("bg-slate-900 p-6 rounded-[40px] shadow-2xl border border-white/10 select-none", className)}>
      <div className="space-y-3">
        {rows.map((row, i) => (
          <div key={i} className="flex justify-center gap-2">
            {i === 3 && (
              <button
                onClick={() => setIsShift(!isShift)}
                className={cn(
                  "flex-1 h-16 rounded-2xl flex items-center justify-center transition-all active:scale-95",
                  isShift ? "bg-blue-600 text-white" : "bg-white/10 text-white hover:bg-white/20"
                )}
              >
                <ArrowBigUp className="w-6 h-6" />
              </button>
            )}
            {row.map((key) => (
              <button
                key={key}
                onClick={() => handleKey(key)}
                className="w-14 h-16 bg-white/10 hover:bg-white/20 text-white rounded-2xl flex items-center justify-center text-xl font-bold transition-all active:scale-95 border border-white/5 shadow-sm"
              >
                {isShift ? key.toUpperCase() : key}
              </button>
            ))}
            {i === 3 && (
              <button
                onClick={onDelete}
                className="flex-1 h-16 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-red-500/20"
              >
                <Delete className="w-6 h-6" />
              </button>
            )}
          </div>
        ))}
        <div className="flex gap-2">
          <button
            onClick={onSpace}
            className="flex-[4] h-16 bg-white/10 hover:bg-white/20 text-white rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-white/5"
          >
            <Space className="w-6 h-6 opacity-50" />
          </button>
          <button
            onClick={onEnter}
            className="flex-1 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-blue-600/20"
          >
            <CornerDownLeft className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
