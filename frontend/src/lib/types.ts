/* ── Shared Types ── */

export interface TripConfig {
  tripStart: string;
  tripEnd: string;
}

export interface City {
  id: number;
  name: string;
}

export interface Guest {
  id: number;
  fullName: string;
  cityId: number | null;
  cityOther: string | null;
  arrivalDate: string | null;
  departureDate: string | null;
  canDrive: boolean;
  isRegistered: boolean;
}

export type CarDirection = 'IDA' | 'VUELTA';

export interface CarPassenger {
  guestId: number;
  fullName: string;
}

export interface Car {
  id: number;
  driverGuestId: number;
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

export type FloorName = 'PLANTA_1' | 'PLANTA_2' | 'PLANTA_3' | 'HORREO';

export interface Room {
  id: number;
  name: string;
  floor: FloorName;
  bedCount: number;
  position: number;
}

export interface RoomDistributionGuest {
  id: number;
  fullName: string;
}

export interface RoomDistribution {
  id: number;
  name: string;
  floor: FloorName;
  bedCount: number;
  guests: RoomDistributionGuest[];
}

export interface DayDistribution {
  day: string;
  rooms: RoomDistribution[];
  unassigned: RoomDistributionGuest[];
}
