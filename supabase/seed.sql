-- Demo marketplace: two rental companies + two individual owners, all approved.

insert into public.hosts (id, kind, name, slug, status, verified, bio, city, rating, review_count, response_minutes) values
  ('00000000-0000-0000-0000-000000000001', 'company', 'DriveLux Rentals', 'drivelux', 'approved', true,
   'Premium and luxury fleet with chauffeur options across Colombo and Kandy.', 'Colombo', 4.95, 612, 5),
  ('00000000-0000-0000-0000-000000000002', 'company', 'Island Wheels', 'islandwheels', 'approved', true,
   'Affordable cars and vans for touring Sri Lanka. Airport pick-up available.', 'Negombo', 4.84, 1389, 10),
  ('00000000-0000-0000-0000-000000000003', 'individual', 'Ruwan S.', 'ruwan-s', 'approved', true,
   'Weekend driver, careful owner. My Seal is always fully charged for you.', 'Colombo', 4.92, 87, 15),
  ('00000000-0000-0000-0000-000000000004', 'individual', 'Dilini P.', 'dilini-p', 'approved', false,
   'Family Land Cruiser available while I travel for work.', 'Kandy', 4.89, 41, 30);

insert into public.locations (id, host_id, name, address, lat, lng) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Colombo 03', 'Galle Road, Kollupitiya', 6.9147, 79.8489),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Negombo', 'Lewis Place', 7.2083, 79.8358),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'Katunayake', 'BIA Arrivals', 7.1808, 79.8841),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 'Colombo 07', 'Cinnamon Gardens', 6.9110, 79.8670),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000004', 'Kandy', 'Peradeniya Road', 7.2906, 80.6337);

-- seed runs as the service role, so the listing-review guard is bypassed and cars go live directly
insert into public.vehicles (host_id, location_id, make, model, year, plate, category, body_style, seats, transmission, fuel, daily_rate, deposit, rating, trips, colors, specs, features, status) values
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Mercedes-Benz', 'S 580', 2025, 'CBA-5801', 'Luxury', 'sedan', 5, 'Auto', 'Hybrid', 85000, 250000, 4.97, 212,
   '{#0E0E12,#C9CCD3,#1F3A5F,#6B1E2B}', '{"power":"496 hp","topSpeed":"250 km/h","economy":"11 km/l","luggage":"3 bags"}', '{Chauffeur option,Massage seats,Burmester audio,Night vision}', 'available'),
  ('00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000005', 'Toyota', 'Land Cruiser 300', 2024, 'CBB-3001', 'SUV', 'suv', 7, 'Auto', 'Diesel', 62000, 200000, 4.92, 41,
   '{#F2F2F2,#111111,#4A5A3C,#7A6A55}', '{"power":"304 hp","topSpeed":"210 km/h","economy":"9 km/l","luggage":"5 bags"}', '{4x4 terrain modes,7 seats,Roof rails,Apple CarPlay}', 'available'),
  ('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004', 'BYD', 'Seal', 2025, 'CBC-7700', 'Electric', 'sedan', 5, 'Auto', 'Electric', 28000, 100000, 4.88, 87,
   '{#2B6CB0,#E8E8EC,#1A1A1A,#7FB3A6}', '{"power":"523 hp","topSpeed":"180 km/h","economy":"570 km range","luggage":"2 bags"}', '{Fast charging,Rotating screen,Panoramic roof,Autopilot assist}', 'available'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Porsche', '911 Carrera', 2024, 'CBD-9110', 'Sport', 'sport', 2, 'Auto', 'Petrol', 120000, 400000, 5.00, 64,
   '{#E3B505,#C1121F,#F5F5F5,#22252B}', '{"power":"385 hp","topSpeed":"293 km/h","economy":"10 km/l","luggage":"1 bag"}', '{Sport Chrono,Launch control,Bose audio,Track-ready}', 'available'),
  ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Toyota', 'Axio Hybrid', 2023, 'WP-CAX-1234', 'Sedan', 'sedan', 5, 'Auto', 'Hybrid', 9500, 40000, 4.81, 902,
   '{#FFFFFF,#8E9196,#1C1C1C,#5A2A2A}', '{"power":"99 hp","topSpeed":"170 km/h","economy":"24 km/l","luggage":"2 bags"}', '{Fuel saver,Reverse camera,Bluetooth,Ideal for city}', 'available'),
  ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 'Toyota', 'KDH High Roof', 2022, 'WP-PH-5566', 'Van', 'van', 14, 'Manual', 'Diesel', 22000, 80000, 4.86, 487,
   '{#F4F4F4,#C0C0C0,#2C2C2C}', '{"power":"148 hp","topSpeed":"160 km/h","economy":"10 km/l","luggage":"10 bags"}', '{With-driver option,Dual A/C,Group tours,Airport transfers}', 'available');

insert into public.addons (host_id, name, description, price_per_day, icon)
select h.id, a.name, a.description, a.price, a.icon
from public.hosts h
cross join (values
  ('Full insurance', 'Zero excess on damage', 4500, '🛡️'),
  ('Professional driver', 'Licensed, English-speaking', 6000, '🧑‍✈️'),
  ('Child seat', 'ISOFIX, 9–36 kg', 1000, '👶'),
  ('Doorstep delivery', 'We bring the car to you', 2500, '📍')
) as a(name, description, price, icon)
where h.kind = 'company'
union all
select h.id, 'Doorstep delivery', 'I bring the car to you', 2000, '📍'
from public.hosts h where h.kind = 'individual';

-- DRIVE15 is a platform-wide promo (host_id null)
insert into public.promo_codes (host_id, code, percent_off, min_days) values
  (null, 'DRIVE15', 15, 3),
  ('00000000-0000-0000-0000-000000000002', 'ISLAND10', 10, 2);
