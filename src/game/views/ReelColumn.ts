import { Container, Texture } from 'pixi.js';
import type { SymbolKey } from '../../types/symbol.types';
import { clamp01, easeOut, randomSymbol } from '../utils/reels.utils';
import { SymbolSprite } from './SymbolSprite';
import type { ReelColumnOptions } from '../../types/game.types';

type StopPhase = 'none' | 'feed' | 'settle';

export class ReelColumn extends Container {
  private rows: number;
  private cellHeight: number;
  private gap: number;
  // Number of hidden rows above the visible area
  private bufferTop: number;
  // Number of hidden rows below the visible area
  private bufferBottom: number;
  private textures: Record<string, Texture>;
  // Pixel distance of one row movement step
  private stepPixels: number;
  // Total number of slots, including hidden buffers
  private totalSlots: number;
  private sprites: SymbolSprite[] = [];
  // Logical symbols assigned to each slot
  private symbols: SymbolKey[] = [];

  // Whether this reel is currently spinning
  private spinning = false;

  // Current vertical offset in pixels
  private offsetPixels = 0;

  // Current spin speed in pixels per second
  private speedPixelsPerSecond = 0;

  // Maximum spin speed
  private readonly maxSpeed = 1400;

  // Minimum stop speed so the reel does not slow down too early
  private readonly minStopSpeed = 420;

  // Stop phase:
  // - none: normal spinning
  // - feed: feeds final symbols into the reel
  // - settle: smoothly aligns the reel back to zero offset
  private stopPhase: StopPhase = 'none';

  // Symbols that should enter the reel before it fully stops
  private stopQueue: SymbolKey[] = [];

  // Current settle animation progress from 0 to 1
  private settleProgress = 0;

  // Settle animation duration in seconds
  private readonly settleDurationSeconds = 0.28;

  // Starting offset used by the settle animation
  private settleFromOffset = 0;

  constructor(opts: ReelColumnOptions, textures: Record<string, Texture>) {
    super();

    this.rows = opts.rows;
    this.cellHeight = opts.cellHeight;
    this.gap = opts.gap;
    this.bufferTop = opts.bufferTop ?? 1;
    this.bufferBottom = opts.bufferBottom ?? 1;
    this.textures = textures;

    // One row equals symbol height plus gap
    this.stepPixels = this.cellHeight + this.gap;

    // Total slots equal visible rows plus top and bottom buffers
    this.totalSlots = this.rows + this.bufferTop + this.bufferBottom;

    // Creates initial sprites and layout
    this.build();
    this.layoutStatic();
  }

  get isSpinning() {
    return this.spinning;
  }

  startSpin() {
    // Resets state for a new spin
    this.spinning = true;
    this.stopPhase = 'none';
    this.stopQueue = [];
    this.speedPixelsPerSecond = 0;
    this.offsetPixels = 0;

    // Resets any scale or win effects on symbols
    for (const sprite of this.sprites) sprite.resetScale();

    // Restores the reel to its initial layout
    this.layoutStatic();
  }

  startStop(targetTopToBottom: SymbolKey[], fillerCount = 10) {
    // Adds random filler symbols before the final target symbols
    const fillerSymbols = Array.from({ length: fillerCount }, () =>
      randomSymbol()
    );

    // Reverses target symbols because new symbols enter from the top
    const feedSymbols = [...targetTopToBottom].reverse();

    // Adds one extra random symbol to complete the visual stop movement
    feedSymbols.push(randomSymbol());

    this.stopQueue = [...fillerSymbols, ...feedSymbols];
    this.stopPhase = 'feed';
    this.settleProgress = 0;
  }

  tick(deltaSeconds: number) {
    // Skips updates when the reel is not spinning
    if (!this.spinning) return;

    if (this.stopPhase === 'none') {
      // Accelerates toward max speed during normal spinning
      this.speedPixelsPerSecond = Math.min(
        this.maxSpeed,
        this.speedPixelsPerSecond + 4200 * deltaSeconds
      );
    } else if (this.stopPhase === 'feed') {
      // Slows down during the stop phase
      // but stays above the minimum speed while symbols are feeding
      this.speedPixelsPerSecond = Math.max(
        this.minStopSpeed,
        this.speedPixelsPerSecond * (1 - 1.6 * deltaSeconds)
      );

      // Starts the settle phase once all queued symbols are consumed
      if (this.stopQueue.length === 0) this.beginSettle();
    } else if (this.stopPhase === 'settle') {
      this.speedPixelsPerSecond = 0;
      this.settleProgress = clamp01(
        this.settleProgress + deltaSeconds / this.settleDurationSeconds
      );

      const easedProgress = easeOut(this.settleProgress);
      this.offsetPixels = this.settleFromOffset * (1 - easedProgress);
      this.applyOffset();

      if (this.settleProgress >= 1) {
        this.offsetPixels = 0;

        // Resets the full layout after settling
        this.layoutStatic();

        this.spinning = false;
        this.stopPhase = 'none';
      }

      return;
    }

    // Moves the reel downward based on the current speed
    this.offsetPixels += this.speedPixelsPerSecond * deltaSeconds;

    // Rotates logical symbols every time a full row is crossed
    while (this.offsetPixels >= this.stepPixels) {
      this.offsetPixels -= this.stepPixels;
      this.advanceOneRow();
    }

    // Applies the current offset to sprite positions
    this.applyOffset();
  }

  getVisible(): SymbolSprite[] {
    // Returns only visible sprites, excluding buffer rows
    return this.sprites.slice(this.bufferTop, this.bufferTop + this.rows);
  }

  private build() {
    // Clears previous content
    this.sprites = [];
    this.symbols = [];
    this.removeChildren();

    // Creates initial symbols and their sprites
    for (let slotIndex = 0; slotIndex < this.totalSlots; slotIndex++) {
      const symbol = randomSymbol();
      this.symbols.push(symbol);

      const sprite = new SymbolSprite(
        // cellW currently matches cellH because cells are square
        this.cellHeight,
        this.cellHeight,
        this.textures,
        symbol
      );

      this.sprites.push(sprite);
      this.addChild(sprite);
    }
  }

  private layoutStatic() {
    // Places sprites at their base Y positions,
    // regardless of the current offset
    for (let slotIndex = 0; slotIndex < this.totalSlots; slotIndex++) {
      this.sprites[slotIndex].y =
        (slotIndex - this.bufferTop) * this.stepPixels;
    }

    // Applies offset if needed
    this.applyOffset();
  }

  private applyOffset() {
    // Applies base position plus current offset to each sprite
    for (let slotIndex = 0; slotIndex < this.totalSlots; slotIndex++) {
      this.sprites[slotIndex].y =
        (slotIndex - this.bufferTop) * this.stepPixels + this.offsetPixels;
    }
  }

  private advanceOneRow() {
    // Removes the bottom symbol
    this.symbols.pop();

    // Adds the next feed symbol or a random symbol at the top
    this.symbols.unshift(this.getNextFeedSymbol());

    // Updates sprites to display the new symbol order
    for (let slotIndex = 0; slotIndex < this.totalSlots; slotIndex++) {
      this.sprites[slotIndex].setSymbol(this.symbols[slotIndex]);
    }
  }

  private getNextFeedSymbol(): SymbolKey {
    // Takes the next symbol from the stop queue during the feed phase
    if (this.stopPhase === 'feed') {
      const nextSymbol = this.stopQueue.shift();
      if (nextSymbol !== undefined) return nextSymbol;
    }

    // Uses a random symbol in all other cases
    return randomSymbol();
  }

  private beginSettle() {
    // Stores the offset where final alignment starts
    this.settleFromOffset = this.offsetPixels;

    // Resets settle animation progress
    this.settleProgress = 0;

    // Switches to the settle phase
    this.stopPhase = 'settle';
  }
}
