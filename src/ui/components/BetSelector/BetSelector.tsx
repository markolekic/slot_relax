import styles from './BetSelector.module.css';

type Props = {
  // Selected bet
  bet: number;
  // All bet values shown in the selector
  options: number[];
  // Bet values that the player cannot currently afford
  disabledBets: number[];
  // Whether the reels are currently spinning or stopping
  spinning: boolean;
  // Called when the player selects a different bet
  onChange: (value: number) => void;
};

const BetSelector = ({
  bet,
  options,
  disabledBets,
  spinning,
  onChange,
}: Props) => {
  return (
    <div className={styles.panel} role="group" aria-label="Bet selection">
      {options.map((value) => {
        // Marks the button that matches the current bet
        const isActive = bet === value;

        // Disables bets when the player cannot afford them
        const isDisabled = spinning || disabledBets.includes(value);

        return (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            disabled={isDisabled}
            className={`${styles.betButton} ${isActive ? styles.active : ''}`}
            aria-label={`Select bet ${value}`}
            aria-pressed={isActive}
          >
            <span className={styles.label} aria-hidden="true">
              {value}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default BetSelector;
