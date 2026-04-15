import { useState, useRef, useCallback } from 'react';
import type { GameController } from '../../game/controllers/GameController';
import type { GameState } from '../../types/game.types';
import { getAvailableBets, SLOT_VALUES } from '../../game/config/game.config';

const initialState: GameState = {
  balance: SLOT_VALUES.initialBalance,
  bet: SLOT_VALUES.betOptions[0],
  win: 0,
  status: 'idle',
};

export const useGameState = () => {
  const [state, setState] = useState<GameState>(initialState);

  // Reference to the GameController, which owns the Pixi game logic
  // Stored in a ref because changing it should not trigger a rerender
  const controllerRef = useRef<GameController | null>(null);

  // Called when GameCanvas is ready and provides the controller instance
  const handleReady = useCallback((controller: GameController) => {
    controllerRef.current = controller;
  }, []);

  // Starts a spin through the controller
  const spin = useCallback(() => {
    controllerRef.current?.spin();
  }, []);

  // Manually stops the reels if they are currently spinning
  const stop = useCallback(() => {
    controllerRef.current?.stop();
  }, []);

  // Changes the bet through the controller, when allowed
  const setBet = useCallback((bet: number) => {
    controllerRef.current?.setBet(bet);
  }, []);

  // Bet options the player can afford with the current balance
  const availableBets = getAvailableBets(state.balance);

  // Game is lost when no bet is available and the game is idle
  const gameLost = state.status === 'idle' && availableBets.length === 0;

  // Uses the current bet if it is still valid,
  // otherwise falls back to the highest available bet
  const bet = availableBets.includes(state.bet)
    ? state.bet
    : (availableBets[availableBets.length - 1] ?? 0);

  // Spinning is true both while reels spin and while they are stopping
  const spinning = state.status === 'spinning' || state.status === 'stopping';

  return {
    state,
    setState,
    bet,
    allBets: [...SLOT_VALUES.betOptions],
    disabledBets: SLOT_VALUES.betOptions.filter((b) => b > state.balance),
    gameLost,
    spinning,
    handleReady,
    spin,
    stop,
    setBet,
  };
};
