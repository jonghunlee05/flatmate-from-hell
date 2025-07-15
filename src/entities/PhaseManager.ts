import { PHASES, GAME_CONFIG, SPAWN_CONFIG } from '../data/constants';

export type Phase = typeof PHASES[keyof typeof PHASES];

export interface PhaseState {
  currentPhase: Phase;
  phaseTime: number;
  phaseDuration: number;
  isComplete: boolean;
}

export class PhaseManager {
  private currentPhase: Phase = PHASES.MORNING;
  private phaseTime: number = 0;
  private phaseDuration: number = GAME_CONFIG.PHASE_DURATION;
  private isComplete: boolean = false;
  private onPhaseChange?: (phase: Phase) => void;
  private onDayComplete?: () => void;

  constructor(onPhaseChange?: (phase: Phase) => void, onDayComplete?: () => void) {
    this.onPhaseChange = onPhaseChange;
    this.onDayComplete = onDayComplete;
  }

  update(delta: number) {
    if (this.isComplete) return;

    this.phaseTime += delta;

    if (this.phaseTime >= this.phaseDuration) {
      this.transitionToNextPhase();
    }
  }

  private transitionToNextPhase() {
    const phases: Phase[] = [PHASES.MORNING, PHASES.AFTERNOON, PHASES.EVENING, PHASES.NIGHT];
    const currentIndex = phases.indexOf(this.currentPhase);
    const nextIndex = currentIndex + 1;

    if (nextIndex >= phases.length) {
      // Day complete
      this.isComplete = true;
      this.onDayComplete?.();
    } else {
      // Transition to next phase
      this.currentPhase = phases[nextIndex];
      this.phaseTime = 0;
      this.onPhaseChange?.(this.currentPhase);
    }
  }

  getCurrentPhase(): Phase {
    return this.currentPhase;
  }

  getPhaseTime(): number {
    return this.phaseTime;
  }

  getPhaseProgress(): number {
    return this.phaseTime / this.phaseDuration;
  }

  getRemainingTime(): number {
    return Math.max(0, this.phaseDuration - this.phaseTime);
  }

  getSpawnConfig() {
    return SPAWN_CONFIG[this.currentPhase.toUpperCase() as keyof typeof SPAWN_CONFIG];
  }

  isNightPhase(): boolean {
    return this.currentPhase === PHASES.NIGHT;
  }

  isDayComplete(): boolean {
    return this.isComplete;
  }

  getPhaseDisplayName(): string {
    const names = {
      [PHASES.MORNING]: 'MORNING',
      [PHASES.AFTERNOON]: 'AFTERNOON',
      [PHASES.EVENING]: 'EVENING',
      [PHASES.NIGHT]: 'NIGHT'
    };
    return names[this.currentPhase];
  }

  reset() {
    this.currentPhase = PHASES.MORNING;
    this.phaseTime = 0;
    this.isComplete = false;
  }
} 