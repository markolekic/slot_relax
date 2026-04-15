import { Application, Texture } from 'pixi.js';
import { useEffect, useRef } from 'react';
import { SLOT_LAYOUT } from '../../game/config/game.config';
import { GameController } from '../../game/controllers/GameController';
import type { GameState } from '../../types/game.types';
import styles from './GameCanvas.module.css';

interface Props {
  // Loaded Pixi textures used by GameView to draw symbols
  textures: Record<string, Texture>;
  // Callback used to notify the parent when the controller is ready
  onReady: (controller: GameController) => void;
  // Callback fired on every game state change
  // so the React UI stays synced with the Pixi logic
  onStateChange: (state: GameState) => void;
}

const GameCanvas = ({ textures, onReady, onStateChange }: Props) => {
  // DOM element where the Pixi canvas is appended
  const canvasRef = useRef<HTMLDivElement>(null);

  // Stores the Pixi app instance so it is not created multiple times
  const appRef = useRef<Application | null>(null);

  useEffect(() => {
    if (!canvasRef.current || appRef.current) return;

    const app = new Application();
    let mounted = true;

    app
      .init({
        width: SLOT_LAYOUT.canvasWidth,
        height: SLOT_LAYOUT.canvasHeight,
        backgroundAlpha: 0,
      })
      .then(() => {
        // Destroys the app if the component unmounted before init finished
        if (!mounted || !canvasRef.current) {
          app.destroy(true);
          return;
        }

        canvasRef.current.appendChild(app.canvas);
        appRef.current = app;

        // Creates the controller that connects logic with the UI
        const controller = new GameController(app, textures, onStateChange);
        onReady(controller);
      });

    return () => {
      mounted = false;

      // Cleans up the Pixi
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Runs once: creates the app on mount and destroys it on unmount

  return (
    <div className={styles.wrapper}>
      <div className={styles.frame}>
        <div className={styles.canvas} ref={canvasRef} />

        <div className={styles.overlay} />
      </div>
    </div>
  );
};

export default GameCanvas;
