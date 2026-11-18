CREATE TABLE IF NOT EXISTS "leads" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"email" text NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"business_name" text DEFAULT '' NOT NULL,
	"category" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"website" text DEFAULT '' NOT NULL,
	"links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"locale" text DEFAULT '' NOT NULL,
	"source" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_kind_idx" ON "leads" USING btree ("kind","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "leads_kind_email_uq" ON "leads" USING btree ("kind","email");
