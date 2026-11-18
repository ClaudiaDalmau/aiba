CREATE TABLE IF NOT EXISTS "reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL REFERENCES "businesses"("id") ON DELETE cascade,
	"booking_id" text NOT NULL REFERENCES "bookings"("id") ON DELETE cascade,
	"customer_id" text REFERENCES "customers"("id") ON DELETE set null,
	"staff_id" text REFERENCES "staff"("id") ON DELETE set null,
	"service_id" text REFERENCES "services"("id") ON DELETE set null,
	"author_name" text DEFAULT '' NOT NULL,
	"rating" integer NOT NULL,
	"comment" text DEFAULT '' NOT NULL,
	"reply" text DEFAULT '' NOT NULL,
	"replied_at" timestamp with time zone,
	"hidden" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_rating_range" CHECK ("rating" BETWEEN 1 AND 5)
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "reviews_booking_uq" ON "reviews" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reviews_business_idx" ON "reviews" USING btree ("business_id","created_at");
