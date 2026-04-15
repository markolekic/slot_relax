import { SYMBOL_KEYS, type SymbolKey } from '../../types/symbol.types';

// Returns a random symbol from the available symbols list
export const randomSymbol = (): SymbolKey =>
  SYMBOL_KEYS[Math.floor(Math.random() * SYMBOL_KEYS.length)];

// Generates a reel matrix filled with random symbols
export const getRandomReels = (cols = 3, rows = 3): SymbolKey[][] =>
  Array.from({ length: cols }, () =>
    Array.from({ length: rows }, () => randomSymbol()),
  );

// Keeps the value within the 0 to 1 range
export const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

// Smoothly slows the animation near the end
export const easeOut = (progress: number) => 1 - (1 - progress) ** 3;
