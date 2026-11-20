ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "community_readonly_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "community_readonly_reason" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "community_readonly_notice_at" timestamp with time zone;
