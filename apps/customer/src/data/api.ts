import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { demoAddons, demoVehicles } from './demo';
import type { Addon, Host, Vehicle } from './types';

// Row shapes from supabase/migrations (vehicles joined with hosts + locations).
type HostRow = {
  id: string; kind: Host['kind']; name: string; verified: boolean; city: string | null;
  rating: number; review_count: number; response_minutes: number | null; bio: string | null;
};
type VehicleRow = {
  id: string; make: string; model: string; year: number; category: Vehicle['category'];
  body_style: Vehicle['bodyStyle']; seats: number; transmission: Vehicle['transmission'];
  fuel: Vehicle['fuel']; daily_rate: number; deposit: number; rating: number; trips: number;
  colors: string[]; model_url: string | null; specs: Vehicle['specs']; features: string[];
  locations: { name: string } | null;
  hosts: HostRow;
};

const hostFromRow = (h: HostRow): Host => ({
  id: h.id, kind: h.kind, name: h.name, verified: h.verified, city: h.city ?? '',
  rating: Number(h.rating), reviewCount: h.review_count, responseMinutes: h.response_minutes, bio: h.bio ?? '',
});

const vehicleFromRow = (r: VehicleRow): Vehicle => ({
  id: r.id, make: r.make, model: r.model, year: r.year, category: r.category, bodyStyle: r.body_style,
  seats: r.seats, transmission: r.transmission, fuel: r.fuel, dailyRate: Number(r.daily_rate),
  deposit: Number(r.deposit), rating: Number(r.rating), trips: r.trips, colors: r.colors,
  modelUrl: r.model_url, specs: r.specs, features: r.features,
  location: r.locations?.name ?? r.hosts.city ?? '', host: hostFromRow(r.hosts),
});

const HOST_COLS = 'id, kind, name, verified, city, rating, review_count, response_minutes, bio';

/** All live listings across every approved host (RLS hides everything else). */
export function useVehicles() {
  return useQuery({
    queryKey: ['vehicles'],
    queryFn: async (): Promise<Vehicle[]> => {
      if (!supabase) return demoVehicles;
      const { data, error } = await supabase
        .from('vehicles')
        .select(`*, locations(name), hosts!inner(${HOST_COLS})`)
        .eq('status', 'available')
        .eq('hosts.status', 'approved')
        .order('rating', { ascending: false });
      if (error) throw error;
      return (data as unknown as VehicleRow[]).map(vehicleFromRow);
    },
  });
}

export function useVehicle(id: string | undefined) {
  const { data, ...rest } = useVehicles();
  return { data: data?.find((v) => v.id === id), ...rest };
}

/** A host and their live listings, derived from the catalogue. */
export function useHost(id: string | undefined) {
  const { data, ...rest } = useVehicles();
  const listings = (data ?? []).filter((v) => v.host.id === id);
  return { host: listings[0]?.host, listings, ...rest };
}

export function useAddons(hostId: string | undefined) {
  return useQuery({
    queryKey: ['addons', hostId],
    enabled: !!hostId,
    queryFn: async (): Promise<Addon[]> => {
      if (!supabase) return demoAddons;
      const { data, error } = await supabase
        .from('addons')
        .select('id, name, description, price_per_day, icon')
        .eq('host_id', hostId!);
      if (error) throw error;
      return data.map((a) => ({
        id: a.id, name: a.name, description: a.description ?? '', icon: a.icon ?? '➕',
        pricePerDay: Number(a.price_per_day),
      }));
    },
  });
}
