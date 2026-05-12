-- Add online category
INSERT INTO categories (slug, label, default_spend, max_spend, display_order, tooltip)
VALUES (
  'online',
  'Online',
  800,
  5000,
  8,
  'E-commerce purchases — Amazon, Noon, food delivery (Talabat, Deliveroo), streaming services (Netflix, Spotify), online subscriptions'
);

-- Populate tooltips for existing categories
UPDATE categories SET tooltip = 'Supermarkets and grocery stores — Carrefour, Lulu, Spinneys, Choithrams, organic shops' WHERE slug = 'groceries';
UPDATE categories SET tooltip = 'Restaurants and cafes — dine-in, takeaway. Includes coffee shops and fast food' WHERE slug = 'dining';
UPDATE categories SET tooltip = 'Flights, hotels, airline tickets, holiday bookings, lounge access fees' WHERE slug = 'travel';
UPDATE categories SET tooltip = 'Petrol stations — ADNOC, EPPCO, ENOC, Emirates Petroleum' WHERE slug = 'fuel';
UPDATE categories SET tooltip = 'Physical retail — clothing stores, malls, department stores, electronics shops, boutiques' WHERE slug = 'shopping';
UPDATE categories SET tooltip = 'Monthly bills — DEWA (electricity, water), SEWA, FEWA, internet, phone bills' WHERE slug = 'utilities';
UPDATE categories SET tooltip = 'Car rental services — short-term vehicle rentals from agencies like Hertz, Avis, Sixt' WHERE slug = 'car_rental';
