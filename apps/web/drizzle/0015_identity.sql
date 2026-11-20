ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "identity_verified_at" timestamp with time zone;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "identity_checks" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"status" text DEFAULT 'pending' NOT NULL,
	"document_type" text NOT NULL,
	"document_image" text,
	"selfie_image" text,
	"reason" text DEFAULT '' NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "identity_checks_status_idx" ON "identity_checks" USING btree ("status","created_at");
