-- Unified pricing (web + app): Basic 39 € · Pro 79 € · Premium 149 € per month.
-- Plan ids stay stable (businesses.tier references them): standard = Basic, vip = Pro, premium = Premium.
UPDATE "plans" SET
  "name" = 'Basic',
  "description" = 'Everything to run bookings and your AI assistant.',
  "price_cents" = 3900, "currency" = 'EUR', "interval" = 'month',
  "features" = '["Branded booking page","Unlimited bookings","AI booking assistant","WhatsApp & Telegram","Owner mobile app","1,000 agent conversations / mo","Up to 5 team members"]'::jsonb,
  "entitlements" = '{"community":false,"featured":false,"maxStaff":5,"maxConversationsPerMonth":1000,"whatsapp":true,"telegram":true}'::jsonb,
  "highlighted" = false, "active" = true, "public" = true, "sort_order" = 0
WHERE "id" = 'standard';--> statement-breakpoint
UPDATE "plans" SET
  "name" = 'Pro',
  "description" = 'Online payments, smart reminders and the VIP community.',
  "price_cents" = 7900, "currency" = 'EUR', "interval" = 'month',
  "features" = '["Everything in Basic","Online deposits and payments","Configurable smart reminders","VIP community forum","5,000 agent conversations / mo","Unlimited team members","Featured placement in the marketplace"]'::jsonb,
  "entitlements" = '{"community":true,"featured":true,"maxStaff":null,"maxConversationsPerMonth":5000,"whatsapp":true,"telegram":true}'::jsonb,
  "highlighted" = true, "active" = true, "public" = true, "sort_order" = 1
WHERE "id" = 'vip';--> statement-breakpoint
INSERT INTO "plans" ("id","name","description","price_cents","currency","interval","features","entitlements","trial_days","active","public","highlighted","sort_order") VALUES
 ('premium','Premium','Advanced AI, daily summaries and priority support for multi-professional teams.',14900,'EUR','month',
  '["Everything in Pro","Unlimited agent conversations","Advanced AI with daily summaries","Advanced analytics","Lowest payment fee","Priority support + WhatsApp"]'::jsonb,
  '{"community":true,"featured":true,"maxStaff":null,"maxConversationsPerMonth":null,"whatsapp":true,"telegram":true}'::jsonb,
  14,true,true,false,2)
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name", "description" = EXCLUDED."description", "price_cents" = EXCLUDED."price_cents",
  "currency" = EXCLUDED."currency", "interval" = EXCLUDED."interval", "features" = EXCLUDED."features",
  "entitlements" = EXCLUDED."entitlements", "active" = true, "public" = true, "highlighted" = false, "sort_order" = 2;--> statement-breakpoint
-- Any other plan (e.g. an older "Premium 59 €" created from the admin panel) is retired:
-- existing subscribers keep it, but it can no longer be chosen.
UPDATE "plans" SET "active" = false, "public" = false, "highlighted" = false
WHERE "id" NOT IN ('standard','vip','premium');
