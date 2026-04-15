import { SYMBOL_KEYS, type SymbolKey } from '../../types/symbol.types';
import { winProbability } from '../config/game.config';
import { getRandomReels, randomSymbol } from './reels.utils';

// Describes a single winning line
export interface WinLine {
  // Row index checked in each reel column
  rows: number[];

  // Payout multiplier for three matching symbols
  multiplierThree: number;

  // Payout multiplier for two adjacent matching symbols
  multiplierTwo: number;
}

// All supported winning lines
const WIN_LINES: WinLine[] = [
  { rows: [1, 1, 1], multiplierThree: 5, multiplierTwo: 2 },
];

// Result of a win evaluation
export interface WinResult {
  // Total win amount
  amount: number;

  // Reel columns included in the win
  winCols: number[];
}

// Calculates the win amount and returns winning columns
export const evaluateWin = (reels: SymbolKey[][], bet: number): WinResult => {
  let amount = 0;
  const winCols = new Set<number>();

  for (const line of WIN_LINES) {
    // Reads symbols from the configured win line
    const lineSymbols = line.rows.map((row, col) => reels[col][row]);

    const [leftSymbol, centerSymbol, rightSymbol] = lineSymbols;

    // Checks for three matching symbols
    if (leftSymbol === centerSymbol && centerSymbol === rightSymbol) {
      amount += bet * line.multiplierThree;
      line.rows.forEach((_, col) => winCols.add(col));
      continue;
    }

    // Checks for a matching pair on the left side
    if (leftSymbol === centerSymbol) {
      amount += bet * line.multiplierTwo;
      winCols.add(0);
      winCols.add(1);
      continue;
    }

    // Checks for a matching pair on the right side
    if (centerSymbol === rightSymbol) {
      amount += bet * line.multiplierTwo;
      winCols.add(1);
      winCols.add(2);
    }
  }

  return { amount, winCols: [...winCols] };
};

// Helper that returns only the win amount
export const getWinAmount = (reels: SymbolKey[][], bet: number): number =>
  evaluateWin(reels, bet).amount;

// Helper that returns only the winning columns
export const getWinCols = (reels: SymbolKey[][]): number[] =>
  evaluateWin(reels, 1).winCols;

// Generates reels with a controlled chance of winning
export const getControlledReels = (cols = 3, rows = 3): SymbolKey[][] => {
  // Starts with a random spin result
  const reels = getRandomReels(cols, rows);

  // Checks whether the random result is already a win
  const isWin = getWinAmount(reels, 1) > 0;

  // Decides whether this spin should be a win
  const shouldWin = Math.random() < winProbability;

  // Returns the result unchanged if it already matches the desired outcome
  if (isWin === shouldWin) {
    return reels;
  }

  // Forces a winning spin
  if (shouldWin) {
    const winSymbol = randomSymbol();

    // Chooses between a three-symbol win and a two-symbol win
    const useThreeReels = Math.random() < 0.5;

    // Creates a win across all three reels
    if (useThreeReels) {
      return reels.map((col) => {
        const newCol = [...col];
        newCol[1] = winSymbol;
        return newCol;
      });
    }

    // Creates a win on either the left or right pair of reels
    const useLeftPair = Math.random() < 0.5;

    return reels.map((col, index) => {
      const newCol = [...col];

      const isWinningReel =
        (useLeftPair && (index === 0 || index === 1)) ||
        (!useLeftPair && (index === 1 || index === 2));

      if (isWinningReel) {
        newCol[1] = winSymbol;
      } else {
        // Changes the third reel symbol to avoid creating a three-symbol win
        const differentSymbols = SYMBOL_KEYS.filter(
          (symbol) => symbol !== winSymbol,
        );

        newCol[1] =
          differentSymbols[Math.floor(Math.random() * differentSymbols.length)];
      }

      return newCol;
    });
  }

  // Forces a losing spin
  return reels.map((col, index) => {
    const newCol = [...col];

    const prevMiddle = index > 0 ? reels[index - 1][1] : null;
    const nextMiddle = index < cols - 1 ? reels[index + 1][1] : null;

    const matchesPrev = newCol[1] === prevMiddle;
    const matchesNext = newCol[1] === nextMiddle;

    // Changes the middle symbol if it creates an unwanted match
    if (matchesPrev || matchesNext) {
      const allowedSymbols = SYMBOL_KEYS.filter(
        (symbol) =>
          symbol !== newCol[1] &&
          symbol !== prevMiddle &&
          symbol !== nextMiddle,
      );

      newCol[1] =
        allowedSymbols[Math.floor(Math.random() * allowedSymbols.length)];
    }

    return newCol;
  });
};
