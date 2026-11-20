ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "device" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "device_hash" text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "known_devices" (
	"user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"device_hash" text NOT NULL,
	"label" text DEFAULT '' NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "known_devices_pk" PRIMARY KEY ("user_id","device_hash")
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "safety_alerts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"business_id" text,
	"message" text DEFAULT '' NOT NULL,
	"contact" text DEFAULT '' NOT NULL,
	"urgent" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"handled_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
