/**
 * VacanSee - Campus Classroom Data Generator & Room Helpers
 * 
 * Generates 960 deterministic classrooms across 40 campus buildings,
 * 3 floors per building, and 8 rooms per floor.
 */

import { simpleHash, padZero } from './scheduleEngine.js';

// Campus building and floor constants
export const TOTAL_BUILDINGS = 40;
export const FLOORS_PER_BUILDING = 3;
export const ROOMS_PER_FLOOR = 8;

// Available facilities in campus rooms
export const ALL_FACILITIES = [
  'Projector',
  'AC',
  'Wi-Fi',
  'Whiteboard',
  'Power Outlets',
  'Smart Board'
];

// Seating capacity distribution options
export const CAPACITY_OPTIONS = [30, 40, 60, 80, 20, 50, 120, 35];

/**
 * Returns formatted building display name (e.g. 1 -> "Building 01")
 * @param {number|string} buildingNumber 
 * @returns {string}
 */
export function getBuildingName(buildingNumber) {
  return `Building ${padZero(buildingNumber)}`;
}

/**
 * Procedurally generates 960 sample classrooms with deterministic
 * capacities, equipment facilities, and room categories.
 * @returns {Array<{ id: string, b: number, floor: number, cap: number, fac: string[], type: string }>}
 */
export function generateClassrooms() {
  const roomsList = [];

  for (let building = 1; building <= TOTAL_BUILDINGS; building++) {
    for (let floor = 1; floor <= FLOORS_PER_BUILDING; floor++) {
      for (let roomNum = 1; roomNum <= ROOMS_PER_FLOOR; roomNum++) {
        const roomId = `B${padZero(building)}-${floor}0${roomNum}`;
        const roomHash = simpleHash(roomId);

        // Deterministic room capacity assignment
        const capacityIndex = (roomNum + floor + building) % CAPACITY_OPTIONS.length;
        const capacity = CAPACITY_OPTIONS[capacityIndex];

        // Categorize room type based on seating size
        let roomType = 'Classroom';
        if (capacity >= 100) {
          roomType = 'Lecture Hall';
        } else if (capacity <= 25) {
          roomType = 'Seminar Room';
        }

        // Assign facilities: Wi-Fi is universal; others assigned based on hash
        const facilities = ['Wi-Fi'];
        for (let i = 0; i < ALL_FACILITIES.length; i++) {
          const item = ALL_FACILITIES[i];
          if (item !== 'Wi-Fi' && (roomHash + i) % 2 === 0) {
            facilities.push(item);
          }
          if (facilities.length >= 4) break;
        }

        roomsList.push({
          id: roomId,
          b: building,
          floor: floor,
          cap: capacity,
          fac: facilities,
          type: roomType
        });
      }
    }
  }

  return roomsList;
}

// 960 Generated Classrooms Array
export const ROOMS = generateClassrooms();

/**
 * Retrieves a single room by its unique ID (e.g. "B01-101")
 * @param {string} roomId 
 * @returns {Object|undefined}
 */
export function getRoomById(roomId) {
  return ROOMS.find(room => room.id === roomId);
}

/**
 * Retrieves all rooms belonging to a specific building
 * @param {number|string} buildingNumber 
 * @returns {Array<Object>}
 */
export function getRoomsByBuilding(buildingNumber) {
  const bNum = parseInt(buildingNumber, 10);
  return ROOMS.filter(room => room.b === bNum);
}

/**
 * Returns a list of all 40 buildings for dropdown selectors
 * @returns {Array<{ id: number, name: string }>}
 */
export function getBuildingList() {
  const list = [];
  for (let i = 1; i <= TOTAL_BUILDINGS; i++) {
    list.push({
      id: i,
      name: getBuildingName(i)
    });
  }
  return list;
}

