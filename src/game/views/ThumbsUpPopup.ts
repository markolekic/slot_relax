import { Container, Sprite, Text, Ticker } from 'pixi.js';
import { clamp01, easeOut } from '../utils/reels.utils';
import type { ThumbsUpPopupOptions } from '../../types/game.types';

// Small value used to avoid division by zero
const EPSILON = 0.0001;

// Popup shown after a win or when the game is over
export class ThumbsUpPopup extends Container {
  // Main thumbs-up image
  private readonly sprite: Sprite;
  private readonly winLabel: Text;
  // Time passed since the current animation started
  private elapsedSeconds = 0;
  // Whether the popup animation is currently active
  private isPlaying = false;

  // Animation durations in seconds
  private readonly introDurationSeconds: number;
  private readonly holdDurationSeconds: number;
  private readonly outroDurationSeconds: number;

  // Base popup scale used as the normal size
  private baseScale: number;

  // Handler registered on the Pixi ticker/game loop
  private tickHandler?: (ticker: Ticker) => void;

  constructor(options: ThumbsUpPopupOptions) {
    super();

    // Converts animation durations from milliseconds to seconds
    this.introDurationSeconds = (options.introDurationMs ?? 220) / 1000;
    this.holdDurationSeconds = (options.holdDurationMs ?? 800) / 1000;
    this.outroDurationSeconds = (options.outroDurationMs ?? 420) / 1000;

    // Stores the base scale, or uses the default popup size
    this.baseScale = options.baseScale ?? 0.18;

    // Creates the thumbs-up sprite
    this.sprite = new Sprite(options.texture);

    // Centers the sprite pivot so scaling and rotation happen from the middle
    this.sprite.anchor.set(0.5);

    // Adds the sprite to this popup container
    this.addChild(this.sprite);

    // Creates the text label for the win amount
    this.winLabel = new Text({
      text: '',
      style: {
        fontFamily: 'GhulRegular, system-ui, sans-serif',
        fontSize: 320,
        fill: '#f3cf47',
        fontWeight: 'bold',
        stroke: { color: '#000000', width: 24 },
      },
    });

    // Centers the label horizontally and aligns it from the top vertically
    this.winLabel.anchor.set(0.5, 0);

    // Places the label below the thumbs-up sprite
    this.winLabel.y = 450;

    // Adds the text label to the popup container
    this.addChild(this.winLabel);

    // Places the popup at the requested scene position
    this.position.set(options.x, options.y);

    // Starts hidden until play() or showGameOver() is called
    this.visible = false;
    this.alpha = 0;
    this.scale.set(this.baseScale);
  }

  // Plays the win animation: pop in, hold, then fade out
  play(winAmount: number) {
    // If another popup animation is active, stop and reset it first
    if (this.isPlaying) this.hide();

    // Shows the win amount with a plus sign
    this.winLabel.text = `+${winAmount}`;

    // Keeps the thumbs-up sprite in its normal orientation
    this.sprite.rotation = 0;

    // Resets animation state before starting
    this.isPlaying = true;
    this.elapsedSeconds = 0;
    this.visible = true;
    this.alpha = 0;
    this.scale.set(this.baseScale);

    // Largest scale reached during the pop-in/hold phase
    const peakScale = this.baseScale * 1.25;

    // Slightly larger scale used during the fade-out phase
    const fadeOutScale = this.baseScale * 1.45;

    // Local aliases for animation phase durations
    const introDuration = this.introDurationSeconds;
    const holdDuration = this.holdDurationSeconds;
    const outroDuration = this.outroDurationSeconds;

    // Runs once per frame through Pixi's shared ticker
    const handleAnimationTick = (ticker: Ticker) => {
      // Converts frame delta time from milliseconds to seconds
      this.elapsedSeconds += ticker.deltaMS / 1000;

      // Phase 1: fade in and scale up with easing
      if (this.elapsedSeconds <= introDuration) {
        // Normalized progress from 0 to 1
        const progress = clamp01(
          this.elapsedSeconds / Math.max(EPSILON, introDuration)
        );

        // Fades the popup in
        this.alpha = progress;

        // Scales from base size to peak size with easing
        this.scale.set(
          this.baseScale + (peakScale - this.baseScale) * easeOut(progress)
        );

        return;
      }

      // Phase 2: keep the popup visible at peak size
      if (this.elapsedSeconds <= introDuration + holdDuration) {
        this.alpha = 1;
        this.scale.set(peakScale);
        return;
      }

      // Phase 3: fade out while slightly growing
      if (this.elapsedSeconds <= introDuration + holdDuration + outroDuration) {
        // Normalized fade-out progress from 0 to 1
        const progress = clamp01(
          (this.elapsedSeconds - introDuration - holdDuration) /
            Math.max(EPSILON, outroDuration)
        );

        // Smooth easing for the fade-out movement
        const easedProgress = easeOut(progress);

        // Grows a bit more while disappearing
        this.scale.set(peakScale + (fadeOutScale - peakScale) * easedProgress);

        // Fades the popup out
        this.alpha = 1 - easedProgress;

        return;
      }

      // Ends the animation and hides the popup
      this.hide();
    };

    // Stores the handler so it can be removed later
    this.tickHandler = handleAnimationTick;

    // Registers the animation handler on the shared ticker
    Ticker.shared.add(handleAnimationTick);
  }

  // Shows a static game-over state without animation
  showGameOver() {
    // Clears any active animation first
    this.hide();

    // Replaces the win amount with the game-over text
    this.winLabel.text = 'game over';

    // Turns the thumbs-up sprite upside down
    this.sprite.rotation = Math.PI;

    // Shows the popup immediately
    this.visible = true;
    this.alpha = 1;
    this.scale.set(this.baseScale);
  }

  // Resets state and hides the popup
  hide() {
    // Removes the ticker handler if one is active
    this.detachTicker();

    // Resets animation state
    this.isPlaying = false;
    this.elapsedSeconds = 0;

    // Hides the popup visually
    this.visible = false;
    this.alpha = 0;
    this.scale.set(this.baseScale);
  }

  // Removes the ticker handler to prevent memory leaks or duplicate loops
  private detachTicker() {
    // Nothing to remove if no handler is registered
    if (!this.tickHandler) return;

    // Detaches the current animation from the shared ticker
    Ticker.shared.remove(this.tickHandler);

    // Clears the stored handler reference
    this.tickHandler = undefined;
  }
}
