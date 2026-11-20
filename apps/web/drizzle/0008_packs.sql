CREATE TABLE IF NOT EXISTS "packs" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL REFERENCES "businesses"("id") ON DELETE cascade,
	"service_id" text NOT NULL REFERENCES "services"("id") ON DELETE cascade,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"sessions" integer NOT NULL,
	"price_cents" integer NOT NULL,
	"validity_days" integer DEFAULT 365 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "packs_sessions_range" CHECK ("sessions" BETWEEN 2 AND 100)
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "packs_business_idx" ON "packs" USING btree ("business_id");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customer_packs" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL REFERENCES "businesses"("id") ON DELETE cascade,
	"customer_id" text NOT NULL REFERENCES "customers"("id") ON DELETE cascade,
	"pack_id" text REFERENCES "packs"("id") ON DELETE set null,
	"service_id" text NOT NULL REFERENCES "services"("id") ON DELETE cascade,
	"name" text NOT NULL,
	"sessions_total" integer NOT NULL,
	"price_cents" integer NOT NULL,
	"payment" text DEFAULT 'offline' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"voided_at" timestamp with time zone,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_packs_customer_idx" ON "customer_packs" USING btree ("business_id","customer_id");--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "customer_pack_id" text REFERENCES "customer_packs"("id") ON DELETE set null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bookings_customer_pack_idx" ON "bookings" USING btree ("customer_pack_id");
