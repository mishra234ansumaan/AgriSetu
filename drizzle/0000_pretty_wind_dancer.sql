CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" text DEFAULT 'storage' NOT NULL,
	"ref_id" integer DEFAULT 0 NOT NULL,
	"farmer_id" integer NOT NULL,
	"qty_quintal" real DEFAULT 0 NOT NULL,
	"days" integer DEFAULT 0 NOT NULL,
	"est_cost" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'requested' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "buyers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'Trader' NOT NULL,
	"district" text NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"rating" real DEFAULT 4 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crops" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_odia" text DEFAULT '' NOT NULL,
	"category" text DEFAULT 'Vegetable' NOT NULL,
	"icon" text DEFAULT 'wheat' NOT NULL,
	"base_price" integer DEFAULT 2000 NOT NULL,
	"shelf_days" integer DEFAULT 5 NOT NULL,
	"cold_multiplier" real DEFAULT 3 NOT NULL,
	"perishable" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "demands" (
	"id" serial PRIMARY KEY NOT NULL,
	"buyer_id" integer NOT NULL,
	"crop_id" integer NOT NULL,
	"qty_quintal" integer DEFAULT 10 NOT NULL,
	"price_per_quintal" integer DEFAULT 0 NOT NULL,
	"deadline" text NOT NULL,
	"delivery_point" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facilities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'warehouse' NOT NULL,
	"district" text NOT NULL,
	"lat" real DEFAULT 0 NOT NULL,
	"lng" real DEFAULT 0 NOT NULL,
	"capacity_quintal" integer DEFAULT 1000 NOT NULL,
	"available_quintal" integer DEFAULT 500 NOT NULL,
	"rate_per_q_per_day" real DEFAULT 2 NOT NULL,
	"contact" text DEFAULT '' NOT NULL,
	"services" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "farmers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_odia" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"village" text DEFAULT '' NOT NULL,
	"district" text NOT NULL,
	"land_acres" real DEFAULT 1 NOT NULL,
	"kyc_verified" boolean DEFAULT false NOT NULL,
	"land_verified" boolean DEFAULT false NOT NULL,
	"satellite_verified" boolean DEFAULT false NOT NULL,
	"ndvi" real DEFAULT 0 NOT NULL,
	"survey_no" text DEFAULT '' NOT NULL,
	"trust_score" integer DEFAULT 40 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"farmer_id" integer NOT NULL,
	"crop_id" integer NOT NULL,
	"qty_quintal" real DEFAULT 5 NOT NULL,
	"harvest_date" text NOT NULL,
	"storage_condition" text DEFAULT 'open' NOT NULL,
	"district" text NOT NULL,
	"expected_price" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mandis" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"district" text NOT NULL,
	"lat" real DEFAULT 0 NOT NULL,
	"lng" real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pools" (
	"id" serial PRIMARY KEY NOT NULL,
	"crop_id" integer NOT NULL,
	"from_district" text NOT NULL,
	"to_mandi_id" integer NOT NULL,
	"depart_date" text NOT NULL,
	"capacity_quintal" integer DEFAULT 40 NOT NULL,
	"filled_quintal" real DEFAULT 0 NOT NULL,
	"cost_per_quintal" integer DEFAULT 60 NOT NULL,
	"created_by" integer NOT NULL,
	"status" text DEFAULT 'open' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"crop_id" integer NOT NULL,
	"mandi_id" integer NOT NULL,
	"date" text NOT NULL,
	"min_p" integer DEFAULT 0 NOT NULL,
	"modal_p" integer DEFAULT 0 NOT NULL,
	"max_p" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transporters" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"district" text NOT NULL,
	"vehicle" text DEFAULT 'Tata Ace' NOT NULL,
	"capacity_quintal" integer DEFAULT 8 NOT NULL,
	"rate_per_km" real DEFAULT 22 NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"phone" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_farmer_id_farmers_id_fk" FOREIGN KEY ("farmer_id") REFERENCES "public"."farmers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demands" ADD CONSTRAINT "demands_buyer_id_buyers_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."buyers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demands" ADD CONSTRAINT "demands_crop_id_crops_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_farmer_id_farmers_id_fk" FOREIGN KEY ("farmer_id") REFERENCES "public"."farmers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_crop_id_crops_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pools" ADD CONSTRAINT "pools_crop_id_crops_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pools" ADD CONSTRAINT "pools_to_mandi_id_mandis_id_fk" FOREIGN KEY ("to_mandi_id") REFERENCES "public"."mandis"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pools" ADD CONSTRAINT "pools_created_by_farmers_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."farmers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prices" ADD CONSTRAINT "prices_crop_id_crops_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prices" ADD CONSTRAINT "prices_mandi_id_mandis_id_fk" FOREIGN KEY ("mandi_id") REFERENCES "public"."mandis"("id") ON DELETE no action ON UPDATE no action;