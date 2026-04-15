import { Container, Sprite, Texture } from 'pixi.js';
import type { SymbolKey } from '../../types/symbol.types';

export class SymbolSprite extends Container {
  // Pixi sprite that displays the current symbol texture
  private sprite: Sprite;
  // Width of the slot cell
  private readonly cellWidth: number;
  // Height of the slot cell
  private readonly cellHeight: number;
  // Loaded textures mapped by symbol key
  private readonly textures: Record<string, Texture>;
  // Original horizontal scale used as the base for animations
  private baseScaleX = 1;
  // Original vertical scale used as the base for animations
  private baseScaleY = 1;

  constructor(
    cellWidth: number,
    cellHeight: number,
    textures: Record<string, Texture>,
    symbol: SymbolKey
  ) {
    super();

    // Stores cell size so every symbol can be resized consistently
    this.cellWidth = cellWidth;
    this.cellHeight = cellHeight;

    // Stores available textures for later symbol changes
    this.textures = textures;

    // Creates the actual Pixi sprite and adds it to this container
    this.sprite = new Sprite();
    this.addChild(this.sprite);

    // Applies the initial symbol texture
    this.setSymbol(symbol);
  }

  setSymbol(key: SymbolKey) {
    // Finds the texture for the requested symbol
    const texture = this.textures[key];

    // Skips the update if the texture is missing
    if (!texture) return;

    // Replaces the sprite texture with the selected symbol texture
    this.sprite.texture = texture;

    // Calculates a scale that keeps the symbol inside the cell
    // while preserving its original aspect ratio
    const scale = Math.min(
      this.cellWidth / texture.width,
      this.cellHeight / texture.height
    );

    // Applies the calculated size to the sprite
    this.sprite.width = texture.width * scale;
    this.sprite.height = texture.height * scale;

    // Stores the fitted scale as the base scale for pulse/reset effects
    this.baseScaleX = this.sprite.scale.x;
    this.baseScaleY = this.sprite.scale.y;

    // Re-centers the symbol after resizing
    this.centerSprite();
  }

  setPulseMultiplier(multiplier: number) {
    // Applies a temporary scale multiplier for the win pulse effect
    this.sprite.scale.set(
      this.baseScaleX * multiplier,
      this.baseScaleY * multiplier
    );

    // Keeps the symbol centered while it grows or shrinks
    this.centerSprite();
  }

  resetScale() {
    // Restores the symbol to its normal fitted scale
    this.sprite.scale.set(this.baseScaleX, this.baseScaleY);

    // Makes sure the restored symbol is centered again
    this.centerSprite();
  }

  private centerSprite() {
    // Centers the symbol horizontally
    this.sprite.x = (this.cellWidth - this.sprite.width) / 2;

    // Centers the symbol vertically
    this.sprite.y = (this.cellHeight - this.sprite.height) / 2;
  }
}
