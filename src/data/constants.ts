export const GAME_CONFIG = {
  PHASE_DURATION: 60000, // 60 seconds per phase
  ROOM_WIDTH: 800,
  ROOM_HEIGHT: 600,
  PLAYER_SPEED: 200,
  FLATMATE_SPEED: 150,
  CLEANING_TIME: 2000, // 2 seconds to clean
  REPAIR_TIME: 3000, // 3 seconds to repair
  NIGHT_DAMAGE: 10, // Health lost when flatmate catches player
};

export const PHASES = {
  MORNING: 'morning',
  AFTERNOON: 'afternoon', 
  EVENING: 'evening',
  NIGHT: 'night'
} as const;

export const SPAWN_CONFIG = {
  MORNING: { messes: 8, brokenItems: 0 },
  AFTERNOON: { messes: 6, brokenItems: 3 },
  EVENING: { messes: 4, brokenItems: 4 },
  NIGHT: { messes: 0, brokenItems: 0 }
};

export const PARAMETER_DECAY = {
  MOOD_BASE: 1,
  MOOD_CLEANLINESS_FACTOR: 0.02,
  MOOD_RAGE_FACTOR: 0.01,
  CLEANLINESS_BASE: 2,
  CLEANLINESS_MESS_FACTOR: 3,
  HEALTH_BASE: 0.5,
  HEALTH_CLEANLINESS_FACTOR: 0.01,
  HEALTH_RAGE_FACTOR: 0.005,
  RAGE_BASE: 0.5
};

export const CLEANING_REWARDS = {
  MOOD: 5,
  CLEANLINESS: 10,
  HEALTH: 3,
  RAGE_REDUCTION: 5
};

export const REPAIR_REWARDS = {
  MOOD: 3,
  CLEANLINESS: 5,
  HEALTH: 2,
  RAGE_REDUCTION: 3
};

export const COLORS = {
  PLAYER: 0x00ff00, // Green
  FLATMATE: 0xff0000, // Red
  MESS: 0x8b4513, // Brown
  BROKEN_ITEM: 0x808080, // Gray
  ROOM_BG: 0x2c3e50, // Dark blue-gray
  HUD_BG: '#000000',
  HUD_TEXT: '#ffffff',
  MOOD_GOOD: '#39ff14',
  MOOD_BAD: '#ff4500',
  HEALTH_GOOD: '#3498db',
  HEALTH_BAD: '#ff4500',
  CLEANLINESS_GOOD: '#4CAF50',
  CLEANLINESS_BAD: '#ff4500',
  RAGE_GOOD: '#39ff14',
  RAGE_BAD: '#ff4500'
}; 