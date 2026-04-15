import { FaRotateRight, FaStop } from 'react-icons/fa6';
import styles from './SpinButton.module.css';

type Props = {
  spinning: boolean;
  gameLost: boolean;
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
        <FaStop className={styles.icon} aria-hidden="true" />
      ) : (
        <FaRotateRight className={styles.icon} aria-hidden="true" />
      )}
    </button>
  );
};

export default SpinButton;
