import {
  pgTable,
  serial,
  integer,
  real,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

/* ---------------------------------- core ---------------------------------- */

export const farmers = pgTable("farmers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameOdia: text("name_odia").notNull().default(""),
  phone: text("phone").notNull().default(""),
  village: text("village").notNull().default(""),
  district: text("district").notNull(),
  landAcres: real("land_acres").notNull().default(1),
  kycVerified: boolean("kyc_verified").notNull().default(false),
  landVerified: boolean("land_verified").notNull().default(false),
  satelliteVerified: boolean("satellite_verified").notNull().default(false),
  ndvi: real("ndvi").notNull().default(0),
  surveyNo: text("survey_no").notNull().default(""),
  trustScore: integer("trust_score").notNull().default(40),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const crops = pgTable("crops", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameOdia: text("name_odia").notNull().default(""),
  category: text("category").notNull().default("Vegetable"),
  icon: text("icon").notNull().default("wheat"),
  basePrice: integer("base_price").notNull().default(2000), // ₹ / quintal
  shelfDays: integer("shelf_days").notNull().default(5), // open-air shelf life
  coldMultiplier: real("cold_multiplier").notNull().default(3),
  perishable: boolean("perishable").notNull().default(true),
});

export const mandis = pgTable("mandis", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  district: text("district").notNull(),
  lat: real("lat").notNull().default(0),
  lng: real("lng").notNull().default(0),
});

export const prices = pgTable("prices", {
  id: serial("id").primaryKey(),
  cropId: integer("crop_id")
    .notNull()
    .references(() => crops.id),
  mandiId: integer("mandi_id")
    .notNull()
    .references(() => mandis.id),
  date: text("date").notNull(), // YYYY-MM-DD
  minP: integer("min_p").notNull().default(0),
  modalP: integer("modal_p").notNull().default(0),
  maxP: integer("max_p").notNull().default(0),
});

/* ------------------------------- market side ------------------------------ */

export const buyers = pgTable("buyers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default("Trader"), // Processor | Exporter | FPO | Trader | Retail Chain | Govt Agency
  district: text("district").notNull(),
  verified: boolean("verified").notNull().default(false),
  rating: real("rating").notNull().default(4),
});

export const demands = pgTable("demands", {
  id: serial("id").primaryKey(),
  buyerId: integer("buyer_id")
    .notNull()
    .references(() => buyers.id),
  cropId: integer("crop_id")
    .notNull()
    .references(() => crops.id),
  qtyQuintal: integer("qty_quintal").notNull().default(10),
  pricePerQuintal: integer("price_per_quintal").notNull().default(0),
  deadline: text("deadline").notNull(),
  deliveryPoint: text("delivery_point").notNull().default(""),
  status: text("status").notNull().default("open"), // open | filled
});

export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),
  farmerId: integer("farmer_id")
    .notNull()
    .references(() => farmers.id),
  cropId: integer("crop_id")
    .notNull()
    .references(() => crops.id),
  qtyQuintal: real("qty_quintal").notNull().default(5),
  harvestDate: text("harvest_date").notNull(),
  storageCondition: text("storage_condition").notNull().default("open"), // open | shade | cold
  district: text("district").notNull(),
  expectedPrice: integer("expected_price").notNull().default(0),
  status: text("status").notNull().default("active"), // active | sold
});

/* ------------------------------ post-harvest ------------------------------ */

export const facilities = pgTable("facilities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default("warehouse"), // cold | warehouse | processing
  district: text("district").notNull(),
  lat: real("lat").notNull().default(0),
  lng: real("lng").notNull().default(0),
  capacityQuintal: integer("capacity_quintal").notNull().default(1000),
  availableQuintal: integer("available_quintal").notNull().default(500),
  ratePerQPerDay: real("rate_per_q_per_day").notNull().default(2),
  contact: text("contact").notNull().default(""),
  services: text("services").notNull().default(""),
});

export const transporters = pgTable("transporters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  district: text("district").notNull(),
  vehicle: text("vehicle").notNull().default("Tata Ace"),
  capacityQuintal: integer("capacity_quintal").notNull().default(8),
  ratePerKm: real("rate_per_km").notNull().default(22),
  verified: boolean("verified").notNull().default(false),
  phone: text("phone").notNull().default(""),
});

/* ------------------------------ coordination ------------------------------ */

export const pools = pgTable("pools", {
  id: serial("id").primaryKey(),
  cropId: integer("crop_id")
    .notNull()
    .references(() => crops.id),
  fromDistrict: text("from_district").notNull(),
  toMandiId: integer("to_mandi_id")
    .notNull()
    .references(() => mandis.id),
  departDate: text("depart_date").notNull(),
  capacityQuintal: integer("capacity_quintal").notNull().default(40),
  filledQuintal: real("filled_quintal").notNull().default(0),
  costPerQuintal: integer("cost_per_quintal").notNull().default(60),
  createdBy: integer("created_by")
    .notNull()
    .references(() => farmers.id),
  status: text("status").notNull().default("open"), // open | departed
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  kind: text("kind").notNull().default("storage"), // storage | transport | pool
  refId: integer("ref_id").notNull().default(0),
  farmerId: integer("farmer_id")
    .notNull()
    .references(() => farmers.id),
  qtyQuintal: real("qty_quintal").notNull().default(0),
  days: integer("days").notNull().default(0),
  estCost: integer("est_cost").notNull().default(0),
  status: text("status").notNull().default("requested"), // requested | confirmed
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
