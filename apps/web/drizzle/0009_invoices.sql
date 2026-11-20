ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "fiscal" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invoice_counters" (
	"business_id" text NOT NULL REFERENCES "businesses"("id") ON DELETE cascade,
	"series" text NOT NULL,
	"year" integer NOT NULL,
	"seq" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "invoice_counters_pk" PRIMARY KEY ("business_id","series","year")
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL REFERENCES "businesses"("id") ON DELETE cascade,
	"number" text NOT NULL,
	"series" text NOT NULL,
	"year" integer NOT NULL,
	"seq" integer NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"customer_id" text REFERENCES "customers"("id") ON DELETE set null,
	"booking_id" text REFERENCES "bookings"("id") ON DELETE set null,
	"customer_pack_id" text REFERENCES "customer_packs"("id") ON DELETE set null,
	"issuer" jsonb NOT NULL,
	"buyer" jsonb NOT NULL,
	"lines" jsonb NOT NULL,
	"subtotal_cents" integer NOT NULL,
	"tax_cents" integer NOT NULL,
	"total_cents" integer NOT NULL,
	"currency" text NOT NULL,
	"status" text DEFAULT 'issued' NOT NULL,
	"paid_at" timestamp with time zone,
	"payment_method" text DEFAULT '' NOT NULL,
	"cancelled_at" timestamp with time zone,
	"cancel_reason" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_number_uq" ON "invoices" USING btree ("business_id","number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoices_business_idx" ON "invoices" USING btree ("business_id","issued_at");
