import React, { useState, useEffect, useCallback } from 'react';
import { Card, GameState, PlayerType, Suit } from '../types';
import { createDeck, dealCards, shuffleDeck } from '../utils/deck';
import { PlayingCard } from './PlayingCard';
import { translations, Language } from '../translations';
import { motion, AnimatePresence } from 'motion/react';

interface GameProps {
  language: Language;
}

const INITIAL_HAND_SIZE = 8;

export const Game: React.FC<GameProps> = ({ language }) => {
  const t = translations[language];
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [aiThinking, setAiThinking] = useState(false);

  const initGame = useCallback(() => {
    let deck = shuffleDeck(createDeck());
    const playerDeal = dealCards(deck, INITIAL_HAND_SIZE);
    const aiDeal = dealCards(playerDeal.remainingDeck, INITIAL_HAND_SIZE);
    deck = aiDeal.remainingDeck;

    // First card of discard pile cannot be an 8
    let topCard = deck.shift()!;
    while (topCard.rank === '8') {
      deck.push(topCard);
      deck = shuffleDeck(deck);
      topCard = deck.shift()!;
    }

    setGameState({
      deck,
      discardPile: [topCard],
      playerHand: playerDeal.hand,
      aiHand: aiDeal.hand,
      currentPlayer: 'player',
      currentSuit: topCard.suit,
      winner: null,
      message: t.playerTurn,
      isChoosingSuit: false,
    });
  }, [t.playerTurn]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const isValidPlay = (card: Card, currentSuit: Suit, topCard: Card) => {
    return card.rank === '8' || card.suit === currentSuit || card.rank === topCard.rank;
  };

  const hasValidPlay = (hand: Card[], currentSuit: Suit, topCard: Card) => {
    return hand.some(card => isValidPlay(card, currentSuit, topCard));
  };

  const handlePlayCard = (card: Card, player: PlayerType) => {
    if (!gameState || gameState.winner || gameState.currentPlayer !== player || gameState.isChoosingSuit) return;

    const topCard = gameState.discardPile[gameState.discardPile.length - 1];

    if (!isValidPlay(card, gameState.currentSuit, topCard)) return;

    const newHand = player === 'player' ? gameState.playerHand.filter(c => c.id !== card.id) : gameState.aiHand.filter(c => c.id !== card.id);
    
    const newDiscardPile = [...gameState.discardPile, card];
    
    let nextState: Partial<GameState> = {
      discardPile: newDiscardPile,
      [player === 'player' ? 'playerHand' : 'aiHand']: newHand,
    };

    if (newHand.length === 0) {
      nextState.winner = player;
      nextState.message = player === 'player' ? t.youWin : t.aiWins;
      setGameState(prev => ({ ...prev!, ...nextState }));
      return;
    }

    if (card.rank === '8') {
      if (player === 'player') {
        nextState.isChoosingSuit = true;
        nextState.message = t.chooseSuit;
      } else {
        // AI chooses suit (most common suit in hand)
        const suitCounts = newHand.reduce((acc, c) => {
          if (c.rank !== '8') {
            acc[c.suit] = (acc[c.suit] || 0) + 1;
          }
          return acc;
        }, {} as Record<Suit, number>);
        
        let bestSuit: Suit = 'hearts';
        let maxCount = -1;
        for (const [suit, count] of Object.entries(suitCounts) as [Suit, number][]) {
          if (count > maxCount) {
            maxCount = count;
            bestSuit = suit;
          }
        }
        
        nextState.currentSuit = bestSuit;
        nextState.currentPlayer = 'player';
        nextState.message = `${t.aiPlayed} 8. ${t.aiChangedSuit} ${t[bestSuit]}. ${t.playerTurn}`;
      }
    } else {
      nextState.currentSuit = card.suit;
      nextState.currentPlayer = player === 'player' ? 'ai' : 'player';
      nextState.message = player === 'player' ? t.aiTurn : `${t.aiPlayed} ${card.rank}${card.suit === 'hearts' ? '♥' : card.suit === 'diamonds' ? '♦' : card.suit === 'clubs' ? '♣' : '♠'}. ${t.playerTurn}`;
    }

    setGameState(prev => ({ ...prev!, ...nextState }));
  };

  const handleDrawCard = (player: PlayerType) => {
    if (!gameState || gameState.winner || gameState.currentPlayer !== player || gameState.isChoosingSuit) return;

    if (gameState.deck.length === 0) {
      // Skip turn if deck is empty
      setGameState(prev => ({
        ...prev!,
        currentPlayer: player === 'player' ? 'ai' : 'player',
        message: player === 'player' ? `${t.playerSkipped} ${t.aiTurn}` : `${t.aiSkipped} ${t.playerTurn}`
      }));
      return;
    }

    const newDeck = [...gameState.deck];
    const drawnCard = newDeck.shift()!;
    
    const newHand = player === 'player' ? [...gameState.playerHand, drawnCard] : [...gameState.aiHand, drawnCard];

    setGameState(prev => ({
      ...prev!,
      deck: newDeck,
      [player === 'player' ? 'playerHand' : 'aiHand']: newHand,
      message: player === 'player' ? t.playerDrew : t.aiDrew,
      currentPlayer: player === 'player' ? 'ai' : 'player',
    }));
  };

  const handleChooseSuit = (suit: Suit) => {
    if (!gameState || gameState.currentPlayer !== 'player' || !gameState.isChoosingSuit) return;

    setGameState(prev => ({
      ...prev!,
      currentSuit: suit,
      isChoosingSuit: false,
      currentPlayer: 'ai',
      message: t.aiTurn,
    }));
  };

  // AI Logic
  useEffect(() => {
    if (gameState?.currentPlayer === 'ai' && !gameState.winner && !gameState.isChoosingSuit) {
      setAiThinking(true);
      const timer = setTimeout(() => {
        const topCard = gameState.discardPile[gameState.discardPile.length - 1];
        const validCards = gameState.aiHand.filter(c => isValidPlay(c, gameState.currentSuit, topCard));
        
        if (validCards.length > 0) {
          // Play a valid card. Prefer non-8s if possible.
          const nonEights = validCards.filter(c => c.rank !== '8');
          const cardToPlay = nonEights.length > 0 ? nonEights[0] : validCards[0];
          handlePlayCard(cardToPlay, 'ai');
        } else {
          handleDrawCard('ai');
        }
        setAiThinking(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState?.currentPlayer, gameState?.isChoosingSuit, gameState?.winner]);

  if (!gameState) return null;

  const topCard = gameState.discardPile[gameState.discardPile.length - 1];
  const playerHasValidPlay = hasValidPlay(gameState.playerHand, gameState.currentSuit, topCard);

  return (
    <div className="flex flex-col h-[80vh] w-full max-w-5xl mx-auto p-2 sm:p-4 bg-emerald-800 text-white rounded-xl shadow-2xl relative overflow-hidden">
      {/* AI Hand */}
      <div className="flex flex-col items-center justify-start h-1/4 pt-4">
        <div className="mb-2 text-sm sm:text-base font-semibold text-emerald-200">
          AI ({gameState.aiHand.length} {t.cardsLeft})
        </div>
        <div className="flex justify-center -space-x-10 sm:-space-x-12 md:-space-x-16 px-4 w-full py-4">
          <AnimatePresence>
            {gameState.aiHand.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ delay: index * 0.05 }}
                className="relative z-10"
              >
                <PlayingCard hidden />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Center Area (Deck & Discard) */}
      <div className="flex-grow flex flex-col items-center justify-center relative py-4">
        <div className="bg-black/40 px-4 py-2 rounded-full text-sm sm:text-lg font-bold text-center z-20 shadow-lg mb-6 max-w-[90%]">
          {gameState.message}
          {aiThinking && <span className="ml-2 animate-pulse">...</span>}
        </div>
        
        <div className="flex space-x-8 sm:space-x-16 items-center">
          {/* Deck */}
          <div className="flex flex-col items-center">
            <div 
              className={`relative cursor-pointer transition-transform hover:scale-105 ${gameState.currentPlayer === 'player' && !playerHasValidPlay && !gameState.isChoosingSuit ? 'ring-4 ring-yellow-400 rounded-xl shadow-[0_0_15px_rgba(250,204,21,0.5)]' : ''}`}
              onClick={() => {
                if (gameState.currentPlayer === 'player' && !gameState.isChoosingSuit) {
                  handleDrawCard('player');
                }
              }}
            >
              {gameState.deck.length > 0 ? (
                <>
                  {gameState.deck.slice(0, Math.min(3, gameState.deck.length)).map((_, i) => (
                    <div key={i} className="absolute" style={{ top: -i * 2, left: -i * 2 }}>
                      <PlayingCard hidden />
                    </div>
                  ))}
                  <PlayingCard hidden />
                </>
              ) : (
                <div className="w-16 h-24 sm:w-20 sm:h-32 md:w-24 md:h-36 rounded-xl border-2 border-dashed border-emerald-500 flex items-center justify-center text-emerald-500 text-xs text-center p-2">
                  {t.deckEmpty}
                </div>
              )}
            </div>
            <div className="mt-4 text-xs sm:text-sm font-medium text-emerald-200 bg-black/20 px-3 py-1 rounded-full">{gameState.deck.length} {t.cardsLeft}</div>
          </div>

          {/* Discard Pile */}
          <div className="flex flex-col items-center">
            <div className="relative w-16 h-24 sm:w-20 sm:h-32 md:w-24 md:h-36">
              {gameState.discardPile.slice(Math.max(0, gameState.discardPile.length - 3)).map((card, i) => (
                <div 
                  key={card.id} 
                  className="absolute" 
                  style={{ top: i * 4, left: i * 4, zIndex: i }}
                >
                  <PlayingCard card={card} />
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs sm:text-sm font-bold flex items-center gap-1 bg-black/20 px-3 py-1 rounded-full">
              {t.currentSuit}: 
              <span className={`text-lg ml-1 ${gameState.currentSuit === 'hearts' || gameState.currentSuit === 'diamonds' ? 'text-red-400' : 'text-gray-300'}`}>
                {gameState.currentSuit === 'hearts' ? '♥' : gameState.currentSuit === 'diamonds' ? '♦' : gameState.currentSuit === 'clubs' ? '♣' : '♠'}
              </span>
            </div>
          </div>
        </div>

        {/* Suit Chooser */}
        <AnimatePresence>
          {gameState.isChoosingSuit && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="absolute bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-2xl z-30 flex flex-col items-center border border-gray-200"
            >
              <h3 className="text-gray-800 font-bold mb-4 text-lg">{t.chooseSuit}</h3>
              <div className="flex space-x-4">
                {(['hearts', 'diamonds', 'clubs', 'spades'] as Suit[]).map(suit => (
                  <button
                    key={suit}
                    onClick={() => handleChooseSuit(suit)}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-3xl sm:text-4xl hover:bg-gray-100 transition-all shadow-sm border border-gray-200 hover:scale-110
                      ${suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-gray-900'}`}
                  >
                    {suit === 'hearts' ? '♥' : suit === 'diamonds' ? '♦' : suit === 'clubs' ? '♣' : '♠'}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Player Hand */}
      <div className="flex flex-col items-center justify-end h-1/3 pb-4 w-full">
        <div className="mb-4 text-sm sm:text-base font-semibold text-emerald-200 bg-black/20 px-4 py-1 rounded-full whitespace-nowrap">
          {gameState.currentPlayer === 'player' && !gameState.isChoosingSuit ? t.playerTurn : t.playerCardsLeft} ({gameState.playerHand.length} {t.cardsLeft})
        </div>
        <div className="w-full overflow-x-auto py-4 scrollbar-hide flex justify-start md:justify-center">
          <div className="flex gap-2 px-4 min-w-max mx-auto md:mx-0 items-center">
            <AnimatePresence>
              {gameState.playerHand.map((card, index) => {
                const valid = isValidPlay(card, gameState.currentSuit, topCard);
                const isMyTurn = gameState.currentPlayer === 'player' && !gameState.isChoosingSuit;
                return (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative hover:-translate-y-4 transition-transform duration-200"
                  >
                    <PlayingCard 
                      card={card} 
                      isValid={valid}
                      disabled={!isMyTurn}
                      onClick={() => handlePlayCard(card, 'player')}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Game Over Overlay */}
      <AnimatePresence>
        {gameState.winner && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-50"
          >
            <motion.h2 
              initial={{ scale: 0.5, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              className="text-4xl sm:text-6xl font-bold text-white mb-8 text-center drop-shadow-lg"
            >
              {gameState.winner === 'player' ? '🎉 ' + t.youWin + ' 🎉' : '🤖 ' + t.aiWins}
            </motion.h2>
            <motion.button 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={initGame}
              className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full font-bold text-lg sm:text-xl transition-all hover:scale-105 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
            >
              {t.playAgain}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
