CREATE TABLE IF NOT EXISTS "calendar_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL REFERENCES "businesses"("id") ON DELETE cascade,
	"provider" text DEFAULT 'google' NOT NULL,
	"account_email" text DEFAULT '' NOT NULL,
	"refresh_token" text NOT NULL,
	"calendar_id" text DEFAULT 'primary' NOT NULL,
	"staff_id" text REFERENCES "staff"("id") ON DELETE set null,
	"push_bookings" boolean DEFAULT true NOT NULL,
	"block_busy" boolean DEFAULT true NOT NULL,
	"last_error" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "calendar_connections_business_uq" ON "calendar_connections" USING btree ("business_id","provider");--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "google_event_id" text;
