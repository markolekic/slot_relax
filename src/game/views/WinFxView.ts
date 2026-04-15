import {
  Container,
  Sprite,
  Texture,
  Ticker,
  type DestroyOptions,
} from 'pixi.js';
import type { WinCell, WinFxViewOptions } from '../../types/game.types';

const WIN_FX_ALPHA = 0.85;
const WIN_FX_PULSE_AMPLITUDE = 0.03;
const WIN_FX_PULSE_FREQUENCY = 6;
const WIN_FX_CELL_FILL = 0.95;

export class WinFxView extends Container {
  private readonly cellWidth: number;
  private readonly cellHeight: number;
  private readonly columnGap: number;
  private readonly rowGap: number;
  private readonly texture: Texture;

  private isPlaying = false;
  private elapsedSeconds = 0;

  // Rotation speed for the win effect sprite
  private readonly rotationSpeedRadiansPerSecond = 1.2;

  // Small size increase so the effect appears slightly larger than the cell
  private readonly sizeBumpPixels = 20;

  // Currently active effect sprites on the scene
  private effectSprites: Sprite[] = [];

  // Sprite pool used to reuse sprites instead of creating new ones every time
  private spritePool: Sprite[] = [];

  // Stores the base scale for each sprite so pulse animation can build on it
  private baseScaleBySprite = new Map<Sprite, number>();

  constructor(options: WinFxViewOptions) {
    super();

    // Stores layout values used to position effects inside slot cells
    this.cellWidth = options.cellWidth;
    this.cellHeight = options.cellHeight;
    this.columnGap = options.columnGap;
    this.rowGap = options.rowGap;

    // Texture used for every win effect sprite
    this.texture = options.texture;
  }

  /**
   * Gets a sprite from the pool if one is available.
   * Otherwise, creates a new sprite using the win effect texture.
   */
  private acquireSprite(): Sprite {
    const sprite = this.spritePool.pop();

    if (sprite) {
      // Reactivates a reused sprite
      sprite.visible = true;
      return sprite;
    }

    // Creates a new sprite only when the pool is empty
    return new Sprite(this.texture);
  }

  /**
   * Resets a sprite and returns it to the pool for later reuse.
   */
  private releaseSprite(sprite: Sprite) {
    // Hides the sprite and clears visual state from the previous animation
    sprite.visible = false;
    sprite.rotation = 0;
    sprite.alpha = 0;
    sprite.scale.set(1);

    // Stores the sprite so it can be reused next time
    this.spritePool.push(sprite);
  }

  /**
   * Calculates the center position of a cell based on column and row.
   */
  private getCellCenter(columnIndex: number, rowIndex: number) {
    return {
      x: columnIndex * (this.cellWidth + this.columnGap) + this.cellWidth / 2,
      y: rowIndex * (this.cellHeight + this.rowGap) + this.cellHeight / 2,
    };
  }

  /**
   * Calculates the base scale so the texture fits inside the cell,
   * with a small extra bump to make the effect more visible.
   */
  private getBaseScale(sprite: Sprite): number {
    // Target size inside the cell
    const maxSize =
      Math.min(this.cellWidth, this.cellHeight) * WIN_FX_CELL_FILL;

    // Reads the original texture size
    const { width: textureWidth, height: textureHeight } = sprite.texture;

    // Fits the texture inside the target size while preserving aspect ratio
    const fittedScale = Math.min(
      maxSize / textureWidth,
      maxSize / textureHeight,
    );

    // Adds a small scale bump based on texture size
    const bumpScale =
      this.sizeBumpPixels / Math.max(textureWidth, textureHeight);

    return fittedScale + bumpScale;
  }

  /**
   * Shows the win effect on the provided cells.
   */
  play(cells: WinCell[]) {
    // Clears any previous win effect before starting a new one
    this.stop();

    // Resets animation time and marks the effect as active
    this.elapsedSeconds = 0;
    this.isPlaying = true;

    for (const { columnIndex, rowIndex } of cells) {
      // Finds the center of the target cell
      const { x, y } = this.getCellCenter(columnIndex, rowIndex);

      // Gets a reusable sprite and calculates its fitted scale
      const sprite = this.acquireSprite();
      const baseScale = this.getBaseScale(sprite);

      // Centers transform origin for clean rotation and scaling
      sprite.anchor.set(0.5);

      // Places the effect over the winning cell
      sprite.position.set(x, y);

      // Applies default visibility and size
      sprite.alpha = WIN_FX_ALPHA;
      sprite.scale.set(baseScale);

      // Stores base scale for pulse updates
      this.baseScaleBySprite.set(sprite, baseScale);

      // Adds the sprite to the scene and tracks it as active
      this.addChild(sprite);
      this.effectSprites.push(sprite);
    }

    // Starts frame updates for rotation and pulse animation
    Ticker.shared.add(this.handleTick);
  }

  /**
   * Stops the animation and returns all active sprites to the pool.
   */
  stop() {
    // Removes ticker updates only if the effect was playing
    if (this.isPlaying) {
      this.isPlaying = false;
      Ticker.shared.remove(this.handleTick);
    }

    // Removes active sprites from the scene and recycles them
    for (const sprite of this.effectSprites) {
      this.removeChild(sprite);
      this.baseScaleBySprite.delete(sprite);
      this.releaseSprite(sprite);
    }

    // Clears the active sprite list
    this.effectSprites = [];
  }

  /**
   * Runs on every frame:
   * - rotates each effect sprite
   * - applies a subtle pulsing scale effect
   */
  private handleTick = (ticker: Ticker) => {
    // Converts frame delta from milliseconds to seconds
    const deltaSeconds = ticker.deltaMS / 1000;
    this.elapsedSeconds += deltaSeconds;

    // Calculates a smooth pulse value around 1.0
    const pulse =
      1 +
      WIN_FX_PULSE_AMPLITUDE *
        Math.sin(this.elapsedSeconds * WIN_FX_PULSE_FREQUENCY);

    for (const sprite of this.effectSprites) {
      // Rotates the effect over time
      sprite.rotation += deltaSeconds * this.rotationSpeedRadiansPerSecond;

      // Applies pulse on top of the sprite's saved base scale
      const baseScale = this.baseScaleBySprite.get(sprite) ?? 1;
      sprite.scale.set(baseScale * pulse);
    }
  };

  /**
   * Cleans up:
   * - stops active animation
   * - destroys sprites kept in the pool
   */
  override destroy(options?: DestroyOptions | boolean): void {
    // Stops animation and returns active sprites to the pool first
    this.stop();

    // Destroys pooled sprites that are no longer needed
    for (const sprite of this.spritePool) {
      sprite.destroy();
    }

    // Clears the pool before destroying the container
    this.spritePool = [];

    super.destroy(options);
  }
}
