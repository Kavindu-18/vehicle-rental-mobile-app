import type { Addon, Host, Vehicle } from './types';

/** Demo hosts — mirrors supabase/seed.sql. */
export const demoHosts: Record<string, Host> = {
  drivelux: { id: '00000000-0000-0000-0000-000000000001', kind: 'company', name: 'DriveLux Rentals', verified: true, city: 'Colombo', rating: 4.95, reviewCount: 612, responseMinutes: 5, bio: 'Premium and luxury fleet with chauffeur options across Colombo and Kandy.' },
  island: { id: '00000000-0000-0000-0000-000000000002', kind: 'company', name: 'Island Wheels', verified: true, city: 'Negombo', rating: 4.84, reviewCount: 1389, responseMinutes: 10, bio: 'Affordable cars and vans for touring Sri Lanka. Airport pick-up available.' },
  ruwan: { id: '00000000-0000-0000-0000-000000000003', kind: 'individual', name: 'Ruwan S.', verified: true, city: 'Colombo', rating: 4.92, reviewCount: 87, responseMinutes: 15, bio: 'Weekend driver, careful owner. My Seal is always fully charged for you.' },
  dilini: { id: '00000000-0000-0000-0000-000000000004', kind: 'individual', name: 'Dilini P.', verified: false, city: 'Kandy', rating: 4.89, reviewCount: 41, responseMinutes: 30, bio: 'Family Land Cruiser available while I travel for work.' },
};

/** Demo listings used until Supabase is connected (mirrors supabase/seed.sql). */
export const demoVehicles: Vehicle[] = [
  {
    id: 'v1', make: 'Mercedes-Benz', model: 'S 580', year: 2025, category: 'Luxury', bodyStyle: 'sedan',
    seats: 5, transmission: 'Auto', fuel: 'Hybrid', dailyRate: 85000, deposit: 250000, rating: 4.97, trips: 212,
    colors: ['#0E0E12', '#C9CCD3', '#1F3A5F', '#6B1E2B'],
    specs: { power: '496 hp', topSpeed: '250 km/h', economy: '11 km/l', luggage: '3 bags' },
    features: ['Chauffeur option', 'Massage seats', 'Burmester audio', 'Night vision'], location: 'Colombo 03', host: demoHosts.drivelux,
  },
  {
    id: 'v2', make: 'Toyota', model: 'Land Cruiser 300', year: 2024, category: 'SUV', bodyStyle: 'suv',
    seats: 7, transmission: 'Auto', fuel: 'Diesel', dailyRate: 62000, deposit: 200000, rating: 4.92, trips: 41,
    colors: ['#F2F2F2', '#111111', '#4A5A3C', '#7A6A55'],
    specs: { power: '304 hp', topSpeed: '210 km/h', economy: '9 km/l', luggage: '5 bags' },
    features: ['4x4 terrain modes', '7 seats', 'Roof rails', 'Apple CarPlay'], location: 'Kandy', host: demoHosts.dilini,
  },
  {
    id: 'v3', make: 'BYD', model: 'Seal', year: 2025, category: 'Electric', bodyStyle: 'sedan',
    seats: 5, transmission: 'Auto', fuel: 'Electric', dailyRate: 28000, deposit: 100000, rating: 4.88, trips: 87,
    colors: ['#2B6CB0', '#E8E8EC', '#1A1A1A', '#7FB3A6'],
    specs: { power: '523 hp', topSpeed: '180 km/h', economy: '570 km range', luggage: '2 bags' },
    features: ['Fast charging', 'Rotating screen', 'Panoramic roof', 'Autopilot assist'], location: 'Colombo 07', host: demoHosts.ruwan,
  },
  {
    id: 'v4', make: 'Porsche', model: '911 Carrera', year: 2024, category: 'Sport', bodyStyle: 'sport',
    seats: 2, transmission: 'Auto', fuel: 'Petrol', dailyRate: 120000, deposit: 400000, rating: 5.0, trips: 64,
    colors: ['#E3B505', '#C1121F', '#F5F5F5', '#22252B'],
    specs: { power: '385 hp', topSpeed: '293 km/h', economy: '10 km/l', luggage: '1 bag' },
    features: ['Sport Chrono', 'Launch control', 'Bose audio', 'Track-ready'], location: 'Colombo 03', host: demoHosts.drivelux,
  },
  {
    id: 'v5', make: 'Toyota', model: 'Axio Hybrid', year: 2023, category: 'Sedan', bodyStyle: 'sedan',
    seats: 5, transmission: 'Auto', fuel: 'Hybrid', dailyRate: 9500, deposit: 40000, rating: 4.81, trips: 902,
    colors: ['#FFFFFF', '#8E9196', '#1C1C1C', '#5A2A2A'],
    specs: { power: '99 hp', topSpeed: '170 km/h', economy: '24 km/l', luggage: '2 bags' },
    features: ['Fuel saver', 'Reverse camera', 'Bluetooth', 'Ideal for city'], location: 'Negombo', host: demoHosts.island,
  },
  {
    id: 'v6', make: 'Toyota', model: 'KDH High Roof', year: 2022, category: 'Van', bodyStyle: 'van',
    seats: 14, transmission: 'Manual', fuel: 'Diesel', dailyRate: 22000, deposit: 80000, rating: 4.86, trips: 487,
    colors: ['#F4F4F4', '#C0C0C0', '#2C2C2C'],
    specs: { power: '148 hp', topSpeed: '160 km/h', economy: '10 km/l', luggage: '10 bags' },
    features: ['With-driver option', 'Dual A/C', 'Group tours', 'Airport transfers'], location: 'Katunayake', host: demoHosts.island,
  },
];

export const demoAddons: Addon[] = [
  { id: 'a1', name: 'Full insurance', description: 'Zero excess on damage', pricePerDay: 4500, icon: '🛡️' },
  { id: 'a2', name: 'Professional driver', description: 'Licensed, English-speaking', pricePerDay: 6000, icon: '🧑‍✈️' },
  { id: 'a3', name: 'Child seat', description: 'ISOFIX, 9–36 kg', pricePerDay: 1000, icon: '👶' },
  { id: 'a4', name: 'Doorstep delivery', description: 'We bring the car to you', pricePerDay: 2500, icon: '📍' },
];

export const hostFilters = ['Everyone', 'Companies', 'Private owners'] as const;

export const categories = ['All', 'Luxury', 'SUV', 'Electric', 'Sport', 'Sedan', 'Van'] as const;
