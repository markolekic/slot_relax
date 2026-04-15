import styles from './WinDisplay.module.css';

type Props = {
  win: number;
};

const WinDisplay = ({ win }: Props) => {
  return (
    <div className={styles.panel} aria-live="polite" aria-atomic="true">
      <p className={styles.value}>{win}</p>
      <p className={styles.label}>credit</p>
    </div>
  );
};

export default WinDisplay;
