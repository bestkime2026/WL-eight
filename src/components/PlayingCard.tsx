import React from 'react';
import { Card as CardType } from '../types';
import { motion } from 'motion/react';

interface PlayingCardProps {
  card?: CardType;
  hidden?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  isValid?: boolean;
}

const suitSymbols = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const suitColors = {
  hearts: 'text-red-500',
  diamonds: 'text-red-500',
  clubs: 'text-gray-900',
  spades: 'text-gray-900',
};

export const PlayingCard: React.FC<PlayingCardProps> = ({ card, hidden, onClick, disabled, className = '', isValid = true }) => {
  if (hidden || !card) {
    return (
      <motion.div
        className={`w-16 h-24 sm:w-20 sm:h-32 md:w-24 md:h-36 rounded-xl bg-blue-800 border-2 border-white shadow-md flex items-center justify-center ${className}`}
        initial={{ rotateY: 0 }}
        animate={{ rotateY: 180 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-full h-full border-4 border-blue-600 rounded-lg opacity-50 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.1)_10px,rgba(255,255,255,0.1)_20px)]"></div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`w-16 h-24 sm:w-20 sm:h-32 md:w-24 md:h-36 rounded-xl bg-white border border-gray-300 shadow-md flex flex-col justify-between p-1.5 sm:p-2 cursor-pointer
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${!isValid && !disabled ? 'opacity-50' : ''}
        ${className}`}
      onClick={!disabled && isValid ? onClick : undefined}
      layoutId={card.id}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
    >
      <div className={`text-xs sm:text-base font-bold leading-none ${suitColors[card.suit]}`}>
        <div>{card.rank}</div>
        <div className="text-[10px] sm:text-xs">{suitSymbols[card.suit]}</div>
      </div>
      <div className={`text-2xl sm:text-4xl text-center flex items-center justify-center ${suitColors[card.suit]}`}>
        {suitSymbols[card.suit]}
      </div>
      <div className={`text-xs sm:text-base font-bold leading-none rotate-180 ${suitColors[card.suit]}`}>
        <div>{card.rank}</div>
        <div className="text-[10px] sm:text-xs">{suitSymbols[card.suit]}</div>
      </div>
    </motion.div>
  );
};
