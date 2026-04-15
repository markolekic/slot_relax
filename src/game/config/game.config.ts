export const SLOT_LAYOUT = {
  cellSize: 100,
  colGap: 50,
  rowGap: 25,
  startX: 80,
  startY: 30,
  visibleRows: 3,
  extraRows: 3,
  canvasWidth: 560,
  canvasHeight: 400,
} as const;

export const SLOT_VALUES = {
  betOptions: [5, 10, 20, 50],
  initialBalance: 50,
  speed: 28,
} as const;

// Total number of rows per column, including buffers
export const TOTAL_ROWS = SLOT_LAYOUT.visibleRows + SLOT_LAYOUT.extraRows * 2;

// Returns all bets the player can currently afford
export const getAvailableBets = (balance: number): number[] =>
  (SLOT_VALUES.betOptions as unknown as number[]).filter((b) => b <= balance);

// Probability that a spin will be a win
export const winProbability = 0.5; // 50%
