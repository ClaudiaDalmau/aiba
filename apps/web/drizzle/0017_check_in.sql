ALTER TYPE "booking_status" ADD VALUE IF NOT EXISTS 'no_agreement';--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "check_in_code" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "checked_in_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "outcome_note" text;--> statement-breakpoint
UPDATE "bookings" SET "check_in_code" = lpad(floor(random() * 1000000)::int::text, 6, '0') WHERE "check_in_code" IS NULL AND "status" IN ('pending', 'confirmed');
