export type BodyStyle = 'sedan' | 'suv' | 'sport' | 'van';
export type Category = 'Luxury' | 'SUV' | 'Sedan' | 'Electric' | 'Sport' | 'Van';

export type Host = {
  id: string;
  kind: 'company' | 'individual';
  name: string;
  verified: boolean;
  city: string;
  rating: number;
  reviewCount: number;
  responseMinutes: number | null;
  bio: string;
};

export type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  category: Category;
  bodyStyle: BodyStyle;
  seats: number;
  transmission: 'Auto' | 'Manual';
  fuel: 'Petrol' | 'Diesel' | 'Hybrid' | 'Electric';
  dailyRate: number;
  deposit: number;
  rating: number;
  trips: number;
  colors: string[];
  /** Optional GLB model URL; falls back to the procedural 3D body. */
  modelUrl?: string | null;
  specs: { power: string; topSpeed: string; economy: string; luggage: string };
  features: string[];
  /** Pickup location name. */
  location: string;
  host: Host;
};

export type Addon = { id: string; name: string; description: string; pricePerDay: number; icon: string };

export type Booking = {
  id: string;
  vehicle: Vehicle;
  start: string;
  end: string;
  pickup: string;
  total: number;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  color: string;
};
