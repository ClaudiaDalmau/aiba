CREATE TABLE IF NOT EXISTS "quick_replies" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL REFERENCES "businesses"("id") ON DELETE cascade,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"uses" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quick_replies_business_idx" ON "quick_replies" USING btree ("business_id");
