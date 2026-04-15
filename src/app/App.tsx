import { FaSpinner } from 'react-icons/fa6';
import GameCanvas from '../ui/canvas/GameCanvas';
import BetSelector from '../ui/components/BetSelector/BetSelector';
import SpinButton from '../ui/components/SpinButton/SpinButton';
import WinDisplay from '../ui/components/WinDisplay/WinDisplay';
import { useGameState } from '../ui/hooks/useGameState';
import useSlotTextures from '../ui/hooks/useSlotTextures';
import styles from './App.module.css';

const App = () => {
  // Main game state and actions
  const {
    state,
    setState,
    bet,
    allBets,
    disabledBets,
    gameLost,
    spinning,
    handleReady,
    spin,
    stop,
    setBet,
  } = useGameState();

  // Loads Pixi textures
  const { textures, loaded } = useSlotTextures();

  // During a spin, click stops the reels; otherwise, it starts a new spin
  const handleSpinClick = spinning ? stop : spin;

  if (!loaded) {
    return (
      <div className={styles.loading}>
        <FaSpinner className={styles.spinner} aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className={styles.slot}>
      <header className={styles.header}>
        <h1 className={styles.title}>skeleton slot</h1>
      </header>

      <main className={styles.main}>
        <GameCanvas
          textures={textures}
          // Registers the game controller when the canvas is ready
          onReady={handleReady}
          // Syncs game state changes back into React
          onStateChange={setState}
        />

        <section className={styles.controls}>
          <BetSelector
            bet={bet}
            options={allBets}
            disabledBets={disabledBets}
            spinning={spinning}
            onChange={setBet}
          />

          <SpinButton
            spinning={spinning}
            gameLost={gameLost}
            onClick={handleSpinClick}
          />

          <WinDisplay win={state.balance} />
        </section>
      </main>
    </div>
  );
};

export default App;
