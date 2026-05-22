import React from 'react';
import { motion } from 'motion/react';

export const VoiceVisualizer: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  return (
    <div className="flex items-center justify-center gap-1 h-8">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-blue-500 rounded-full"
          animate={{
            height: isActive ? [8, 24, 12, 32, 8][i % 5] : 4,
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatType: "reverse",
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );
};
