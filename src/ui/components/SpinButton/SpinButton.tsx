import { FaRotateRight, FaStop } from 'react-icons/fa6';
import styles from './SpinButton.module.css';

type Props = {
  // Whether the reels are currently spinning or stopping
  spinning: boolean;

  // Whether the player has no available bets left
  gameLost: boolean;

  // Called when the player clicks the spin/stop button
  onClick: () => void;
};

const SpinButton = ({ spinning, gameLost, onClick }: Props) => {
  return (
    <button
      // Disables the button after game over, unless a spin is still finishing
      disabled={gameLost && !spinning}
      type="button"
      className={styles.button}
      onClick={onClick}
      aria-label={spinning ? 'Stop spinning' : 'Start spinning'}
    >
      {spinning ? (
        // Shows stop icon while reels are spinning
        <FaStop className={styles.icon} aria-hidden="true" />
      ) : (
        // Shows spin icon while the game is idle
        <FaRotateRight className={styles.icon} aria-hidden="true" />
      )}
    </button>
  );
};

export default SpinButton;
