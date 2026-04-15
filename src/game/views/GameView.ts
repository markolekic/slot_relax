import type { Texture } from 'pixi.js';
import { Application, Container, Ticker } from 'pixi.js';
import type { SymbolKey } from '../../types/symbol.types';
import { SLOT_LAYOUT } from '../config/game.config';
import { getWinCols } from '../utils/win.utils';
import { ReelColumn } from './ReelColumn';
import { ThumbsUpPopup } from './ThumbsUpPopup';
import { WinFxView } from './WinFxView';

interface GameViewOptions {
  app: Application;
  textures: Record<string, Texture>;
  onSpinComplete: () => void;
}

export class GameView {
  private reels: ReelColumn[] = [];
  private container: Container;
  private onSpinComplete: () => void;
  private popup: ThumbsUpPopup;
  private winEffects: WinFxView;
  private ticker = Ticker.shared;

  private isStopping = false;
  private stopElapsedMs = 0;
  private stopDelayMs: number[] = [];

  // Reels that should remain visible after stopping
  private pendingReels: SymbolKey[][] = [];

  // Pulse animation state for winning columns
  private isPulsing = false;
  private pulseElapsedSeconds = 0;
  private winningColumns: number[] = [];

  constructor({ app, textures, onSpinComplete }: GameViewOptions) {
    this.onSpinComplete = onSpinComplete;

    this.container = new Container();
    this.container.x = SLOT_LAYOUT.startX;
    this.container.y = SLOT_LAYOUT.startY;

    // Win effect is placed behind the reels
    this.winEffects = new WinFxView({
      cellWidth: SLOT_LAYOUT.cellSize,
      cellHeight: SLOT_LAYOUT.cellSize,
      columnGap: SLOT_LAYOUT.colGap,
      rowGap: SLOT_LAYOUT.rowGap,
      texture: textures['win_swirl'],
    });
    this.container.addChild(this.winEffects);

    // Creates reel columns and adds them to the slot container
    for (let columnIndex = 0; columnIndex < 3; columnIndex++) {
      const reel = new ReelColumn(
        {
          rows: 3,
          cellWidth: SLOT_LAYOUT.cellSize,
          cellHeight: SLOT_LAYOUT.cellSize,
          gap: SLOT_LAYOUT.rowGap,
          bufferTop: 1,
          bufferBottom: 1,
        },
        textures,
      );

      reel.x = columnIndex * (SLOT_LAYOUT.cellSize + SLOT_LAYOUT.colGap);
      this.container.addChild(reel);
      this.reels.push(reel);
    }

    // Popup is placed above all other elements
    const totalWidth = 3 * SLOT_LAYOUT.cellSize + 2 * SLOT_LAYOUT.colGap;
    const totalHeight = 3 * SLOT_LAYOUT.cellSize + 2 * SLOT_LAYOUT.rowGap;

    this.popup = new ThumbsUpPopup({
      texture: textures['thumb_up'],
      x: totalWidth / 2,
      y: totalHeight / 2,
      baseScale: 0.18,
    });
    this.container.addChild(this.popup);

    app.stage.addChild(this.container);
    this.ticker.add(this.handleTick);
  }

  spin(targetReels: SymbolKey[][]) {
    this.pendingReels = targetReels;
    this.isStopping = false;
    this.stopElapsedMs = 0;

    // Resets win effects before a new spin
    this.winEffects.stop();
    this.stopPulse();
    this.popup.hide();

    for (const reel of this.reels) reel.startSpin();
  }

  private beginStopSequence(baseDelayMs = 140) {
    // Starts the shared stop sequence for auto and manual stop
    if (this.isStopping) return;

    this.isStopping = true;
    this.stopElapsedMs = 0;
    this.stopDelayMs = this.reels.map(
      (_, reelIndex) => reelIndex * baseDelayMs,
    );
  }

  scheduleStop(baseDelayMs = 140) {
    // Schedules an automatic stop
    this.beginStopSequence(baseDelayMs);
  }

  forceStop(baseDelayMs = 140) {
    // Starts manual stop using the same stop sequence
    this.beginStopSequence(baseDelayMs);
  }

  showWinPopup(amount: number) {
    this.popup.play(amount);
  }

  showGameOver() {
    this.popup.showGameOver();
  }

  private handleTick = (ticker: Ticker) => {
    const deltaSeconds = ticker.deltaMS / 1000;

    if (this.isStopping) {
      this.stopElapsedMs += ticker.deltaMS;

      // Sends a stop signal to each reel after its delay expires
      this.reels.forEach((reel, reelIndex) => {
        const delay = this.stopDelayMs[reelIndex];
        if (delay < 0) return;

        if (this.stopElapsedMs >= delay) {
          this.stopDelayMs[reelIndex] = -1;
          reel.startStop(this.pendingReels[reelIndex]);
        }
      });
    }

    // Updates each reel animation
    for (const reel of this.reels) reel.tick(deltaSeconds);

    // Pulses winning symbols while the win effect is active
    if (this.isPulsing) {
      this.pulseElapsedSeconds += deltaSeconds;
      const pulseScale = 1 + 0.08 * Math.sin(this.pulseElapsedSeconds * 10);

      for (const columnIndex of this.winningColumns) {
        this.reels[columnIndex]
          .getVisible()[1]
          ?.setPulseMultiplier?.(pulseScale);
      }
    }

    // Handles the spin result once all reels have stopped
    if (this.isStopping && this.reels.every((reel) => !reel.isSpinning)) {
      this.isStopping = false;
      this.handleAllStopped();
    }
  };

  private handleAllStopped() {
    // Finds winning columns and starts win effects
    const winningColumns = getWinCols(this.pendingReels);
    this.winningColumns = winningColumns;

    if (winningColumns.length > 0) {
      const winningCells = winningColumns.map((columnIndex) => ({
        columnIndex,
        rowIndex: 1,
      }));

      this.winEffects.play(winningCells);
      this.isPulsing = true;
      this.pulseElapsedSeconds = 0;
    }

    // Notifies the controller that the spin has finished
    this.onSpinComplete();
  }

  private stopPulse() {
    this.isPulsing = false;
    this.pulseElapsedSeconds = 0;

    // Resets winning symbol scale back to normal
    for (const columnIndex of this.winningColumns) {
      this.reels[columnIndex]?.getVisible()[1]?.setPulseMultiplier?.(1);
    }

    this.winningColumns = [];
  }

  destroy() {
    // Cleans up ticker and Pixi objects
    this.ticker.remove(this.handleTick);
    this.winEffects.destroy();
    this.container.destroy({ children: true });
  }
}
