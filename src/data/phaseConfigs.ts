import { SpawnConfig } from '../scenes/phases/MorningPhase';

export interface PhaseConfig {
  name: string;
  description: string;
  color: number;
  spawnConfig: SpawnConfig;
  duration: number; // in milliseconds
}

export const PHASE_CONFIGS: Record<string, PhaseConfig> = {
  morning: {
    name: 'MORNING',
    description: 'Morning: Time to clean up the messes from last night!',
    color: 0xFFD700, // Gold
    spawnConfig: {
      maxMesses: 8,
      maxBrokenItems: 0
    },
    duration: 60000 // 60 seconds
  },
  afternoon: {
    name: 'AFTERNOON',
    description: 'Afternoon: Both messes and broken items need attention!',
    color: 0xFFA500, // Orange
    spawnConfig: {
      maxMesses: 3,
      maxBrokenItems: 3
    },
    duration: 60000 // 60 seconds
  },
  evening: {
    name: 'EVENING',
    description: 'Evening: Chaos events and flatmate activities!',
    color: 0x8B4513, // Brown
    spawnConfig: {
      maxMesses: 0,
      maxBrokenItems: 0
    },
    duration: 60000 // 60 seconds
  },
  night: {
    name: 'NIGHT',
    description: 'Night: Rest period, minimal activity.',
    color: 0x191970, // Midnight Blue
    spawnConfig: {
      maxMesses: 0,
      maxBrokenItems: 0
    },
    duration: 60000 // 60 seconds
  }
};

export function getPhaseConfig(phase: string): PhaseConfig {
  return PHASE_CONFIGS[phase] || PHASE_CONFIGS.morning;
}

export function getAllPhaseNames(): string[] {
  return Object.keys(PHASE_CONFIGS);
} 