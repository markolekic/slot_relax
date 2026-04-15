export const SLOT_LAYOUT = {
  cellSize: 100, // Size of one slot cell
  colGap: 50, // Gap between columns
  rowGap: 25, // Gap between rows
  startX: 80, // Starting X position of the slot grid
  startY: 30, // Starting Y position of the slot grid
  visibleRows: 3, // Number of visible rows
  extraRows: 3, // Buffer rows above and below
  canvasWidth: 560, // Canvas width
  canvasHeight: 400, // Canvas height
} as const;

export const SLOT_VALUES = {
  betOptions: [5, 10, 20, 50], // Available bet values
  initialBalance: 50, // Player starting balance
  speed: 28, // Base spin speed
} as const;

// Total number of rows per column, including buffers
export const TOTAL_ROWS = SLOT_LAYOUT.visibleRows + SLOT_LAYOUT.extraRows * 2;

// Returns all bets the player can currently afford
export const getAvailableBets = (balance: number): number[] =>
  (SLOT_VALUES.betOptions as unknown as number[]).filter((b) => b <= balance);

// Probability that a spin will be a win
export const winProbability = 0.5; // 50%
