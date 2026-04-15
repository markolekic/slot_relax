import type { Application, Texture } from 'pixi.js';
import type { GameState } from '../../types/game.types';
import { getAvailableBets, SLOT_VALUES } from '../config/game.config';
import { getControlledReels, getWinAmount } from '../utils/win.utils';
import { GameView } from '../views/GameView';

export class GameController {
  // Handles game logic and connects state with the Pixi view
  private gameView: GameView;

  // Current game state used by the UI
  private state: GameState;

  // Notifies the UI when the state changes
  private onStateChange: (state: GameState) => void;

  // Stores the win until the spin animation finishes
  private pendingWin = 0;

  constructor(
    app: Application,
    textures: Record<string, Texture>,
    onStateChange: (state: GameState) => void,
  ) {
    this.onStateChange = onStateChange;

    // Sets the initial game state
    this.state = {
      balance: SLOT_VALUES.initialBalance,
      bet: SLOT_VALUES.betOptions[0],
      win: 0,
      status: 'idle',
    };

    // Creates the Pixi view and registers the spin-complete callback
    this.gameView = new GameView({
      app,
      textures,
      onSpinComplete: () => this.handleSpinComplete(),
    });
  }

  spin() {
    // Allows spinning only when the game is idle
    if (this.state.status !== 'idle') return;

    // Stops if the player cannot afford the current bet
    if (this.state.balance < this.state.bet) return;

    // Prepares target reels and calculates the win before animation
    const targetReels = getControlledReels();
    this.pendingWin = getWinAmount(targetReels, this.state.bet);

    // Deducts the bet and switches the game to spinning state
    this.state = {
      ...this.state,
      balance: this.state.balance - this.state.bet,
      status: 'spinning',
      win: 0,
    };
    this.emit();

    // Starts the spin animation
    this.gameView.spin(targetReels);

    // Schedules an automatic stop if the player does not stop manually
    setTimeout(() => {
      if (this.state.status === 'spinning') this.gameView.scheduleStop();
    }, 3000);
  }

  stop() {
    // Allows manual stop only while spinning
    if (this.state.status !== 'spinning') return;

    // Forces the reels to start stopping
    this.gameView.forceStop();

    // Locks the stop button while reels are stopping
    this.state = { ...this.state, status: 'stopping' };
    this.emit();
  }

  setBet(bet: number) {
    // Allows changing bet only outside of a spin
    if (this.state.status !== 'idle') return;

    // Updates the selected bet
    this.state = { ...this.state, bet };
    this.emit();
  }

  private handleSpinComplete() {
    // Reads the win calculated before the spin started
    const win = this.pendingWin;

    // Applies the final result after the animation finishes
    this.state = {
      ...this.state,
      balance: this.state.balance + win,
      win,
      status: 'idle',
    };

    // Clears the pending win value
    this.pendingWin = 0;

    // Finds bets that are still affordable
    const availableBets = getAvailableBets(this.state.balance);

    // Lowers the bet if the current one is no longer affordable
    const betStillValid = availableBets.includes(this.state.bet);
    if (!betStillValid && availableBets.length > 0) {
      this.state = {
        ...this.state,
        bet: availableBets[availableBets.length - 1],
      };
    }

    // Sends the updated state to the UI
    this.emit();

    // Shows the win popup when there is a payout
    if (win > 0) {
      this.gameView.showWinPopup(win);
    }

    // Shows game over when no bet can be afforded
    const canAffordAnyBet = availableBets.length > 0;
    if (!canAffordAnyBet) {
      this.gameView.showGameOver();
    }
  }

  private emit() {
    // Sends a copied state object to the UI
    this.onStateChange({ ...this.state });
  }
}
