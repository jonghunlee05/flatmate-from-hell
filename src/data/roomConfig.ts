export interface RoomConfig {
  sceneKey: string;
  roomName: string;
  color: number;
  doors: DoorConfig[];
}

export interface DoorConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  targetScene: string;
  targetRoom: string;
  label: string;
}

export const ROOM_CONFIGS: Record<string, RoomConfig> = {
  'PlayerBedroomScene': {
    sceneKey: 'PlayerBedroomScene',
    roomName: 'Your Bedroom',
    color: 0x3498db,
    doors: [
      {
        x: 1180,
        y: 360,
        width: 40,
        height: 80,
        targetScene: 'LivingRoomScene',
        targetRoom: 'Living Room',
        label: 'Living Room'
      }
    ]
  },
  'FlatmateBedroomScene': {
    sceneKey: 'FlatmateBedroomScene',
    roomName: 'Flatmate Bedroom',
    color: 0x9b59b6,
    doors: [
      {
        x: 100,
        y: 360,
        width: 40,
        height: 80,
        targetScene: 'LivingRoomScene',
        targetRoom: 'Living Room',
        label: 'Living Room'
      }
    ]
  },
  'LivingRoomScene': {
    sceneKey: 'LivingRoomScene',
    roomName: 'Living Room',
    color: 0x27ae60,
    doors: [
      {
        x: 100,
        y: 360,
        width: 40,
        height: 80,
        targetScene: 'PlayerBedroomScene',
        targetRoom: 'Your Bedroom',
        label: 'Your Bedroom'
      },
      {
        x: 1180,
        y: 360,
        width: 40,
        height: 80,
        targetScene: 'FlatmateBedroomScene',
        targetRoom: 'Flatmate Bedroom',
        label: 'Flatmate Bedroom'
      },
      {
        x: 400,
        y: 650,
        width: 40,
        height: 80,
        targetScene: 'KitchenScene',
        targetRoom: 'Kitchen',
        label: 'Kitchen'
      },
      {
        x: 600,
        y: 650,
        width: 40,
        height: 80,
        targetScene: 'BathroomScene',
        targetRoom: 'Bathroom',
        label: 'Bathroom'
      },
      {
        x: 800,
        y: 650,
        width: 40,
        height: 80,
        targetScene: 'LaundryScene',
        targetRoom: 'Laundry',
        label: 'Laundry'
      }
    ]
  },
  'KitchenScene': {
    sceneKey: 'KitchenScene',
    roomName: 'Kitchen',
    color: 0xe67e22,
    doors: [
      {
        x: 400,
        y: 100,
        width: 40,
        height: 80,
        targetScene: 'LivingRoomScene',
        targetRoom: 'Living Room',
        label: 'Living Room'
      }
    ]
  },
  'BathroomScene': {
    sceneKey: 'BathroomScene',
    roomName: 'Bathroom',
    color: 0x1abc9c,
    doors: [
      {
        x: 600,
        y: 100,
        width: 40,
        height: 80,
        targetScene: 'LivingRoomScene',
        targetRoom: 'Living Room',
        label: 'Living Room'
      }
    ]
  },
  'LaundryScene': {
    sceneKey: 'LaundryScene',
    roomName: 'Laundry',
    color: 0x95a5a6,
    doors: [
      {
        x: 800,
        y: 100,
        width: 40,
        height: 80,
        targetScene: 'LivingRoomScene',
        targetRoom: 'Living Room',
        label: 'Living Room'
      }
    ]
  }
};

export const ROOM_NAMES = Object.values(ROOM_CONFIGS).map(config => config.roomName);

export const SCENE_TO_ROOM_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(ROOM_CONFIGS).map(([sceneKey, config]) => [sceneKey, config.roomName])
);

export const ROOM_TO_SCENE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(ROOM_CONFIGS).map(([sceneKey, config]) => [config.roomName, sceneKey])
);

export function getRoomConfig(sceneKey: string): RoomConfig | undefined {
  return ROOM_CONFIGS[sceneKey];
}

export function getRoomName(sceneKey: string): string {
  return SCENE_TO_ROOM_MAP[sceneKey] || 'Living Room';
}

export function getSceneKey(roomName: string): string {
  return ROOM_TO_SCENE_MAP[roomName] || 'LivingRoomScene';
}

export function getAllRoomNames(): string[] {
  return ROOM_NAMES;
}

export function getRandomRoomName(): string {
  return ROOM_NAMES[Math.floor(Math.random() * ROOM_NAMES.length)];
} 