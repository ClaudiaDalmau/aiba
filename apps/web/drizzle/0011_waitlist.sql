CREATE TABLE IF NOT EXISTS "slot_waitlist" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL REFERENCES "businesses"("id") ON DELETE cascade,
	"customer_id" text NOT NULL REFERENCES "customers"("id") ON DELETE cascade,
	"service_id" text NOT NULL REFERENCES "services"("id") ON DELETE cascade,
	"staff_id" text REFERENCES "staff"("id") ON DELETE set null,
	"date" text NOT NULL,
	"status" text DEFAULT 'waiting' NOT NULL,
	"source" text DEFAULT 'web' NOT NULL,
	"notified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "slot_waitlist_lookup_idx" ON "slot_waitlist" USING btree ("business_id","date","status");
