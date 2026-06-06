/* ── Shared Types ── */

export interface TripConfig {
  tripStart: string;
  tripEnd: string;
}

export interface City {
  id: string;
  name: string;
}

export interface Guest {
  id: string;
  fullName: string;
  cityId: string | null;
  cityOther: string | null;
  arrivalDate: string | null;
  departureDate: string | null;
  canDrive: boolean;
  isRegistered: boolean;
}

export type CarDirection = 'IDA' | 'VUELTA';

export interface CarPassenger {
  guestId: string;
  fullName: string;
}

export interface Car {
  id: string;
  driverGuestId: string;
  direction: CarDirection;
  travelDate: string;
  place: string;
  passengerSeats: number;
  passengers: CarPassenger[];
}

export interface CostumeResult {
  ballColor: string;
  partners: string[];
}

export interface CostumeGroup {
  groupIndex: number;
  ballColor: string;
  members: string[];
}

export interface BallPair {
  ballColors: string[];
}

export interface BallsView {
  myBallColor: string;
  pairs: BallPair[];
}

export type FloorName = 'PLANTA_1' | 'PLANTA_2' | 'PLANTA_3' | 'HORREO';

export interface Room {
  id: string;
  name: string;
  floor: FloorName;
  bedCount: number;
  position: number;
}

export interface RoomDistributionGuest {
  id: string;
  fullName: string;
}

export interface RoomDistribution {
  id: string;
  name: string;
  floor: FloorName;
  bedCount: number;
  individualBeds: number;
  matrimonioBeds: number;
  guests: RoomDistributionGuest[];
}

export interface DayDistribution {
  day: string;
  rooms: RoomDistribution[];
  unassigned: RoomDistributionGuest[];
}

export interface Bed {
  id: string;
  bedType: 'INDIVIDUAL' | 'MATRIMONIO';
  position: number;
  capacity: number;
}
