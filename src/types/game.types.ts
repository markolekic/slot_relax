import type { Texture } from 'pixi.js';

// State
export type GameStatus = 'idle' | 'spinning' | 'stopping';

export interface GameState {
  balance: number;
  bet: number;
  win: number;
  status: GameStatus;
}

// Layout
export interface CellSize {
  cellWidth: number;
  cellHeight: number;
}

export interface GridGaps {
  columnGap: number;
  rowGap: number;
}

export interface GridLayout extends CellSize, GridGaps {
  rows: number;
  gap: number;
  bufferTop?: number;
  bufferBottom?: number;
}

// Win
export interface WinCell {
  columnIndex: number;
  rowIndex: number;
}

// View options
export interface WinFxViewOptions extends CellSize, GridGaps {
  texture: Texture;
}

// ReelColumn uses gap instead of columnGap/rowGap, so pick only what it needs
export type ReelColumnOptions = Pick<
  GridLayout,
  'rows' | 'cellWidth' | 'cellHeight' | 'gap' | 'bufferTop' | 'bufferBottom'
>;

export interface ThumbsUpPopupOptions {
  texture: Texture;
  x: number;
  y: number;
  introDurationMs?: number;
  holdDurationMs?: number;
  outroDurationMs?: number;
  baseScale?: number;
}
