// Types shared across the app for services / bookings / clients / payments
export type Extra = { extra_id: string; name: string; price_eur: number };
export type ExtraInput = { extra_id?: string; name: string; price_eur: number };

export type Service = {
  service_id: string;
  user_id: string;
  name: string;
  description?: string | null;
  price_eur: number;
  deposit_pct: number;
  duration_min: number;
  photo_url?: string | null;
  info_url?: string | null;
  max_bookings_per_day?: number | null;
  active: boolean;
  extras: Extra[];
  created_at: string;
  updated_at: string;
};

export type ServiceInput = {
  name: string;
  description?: string;
  price_eur: number;
  deposit_pct: number;
  duration_min: number;
  photo_url?: string | null;
  info_url?: string | null;
  max_bookings_per_day?: number | null;
  active: boolean;
  extras: ExtraInput[];
};

export type AvailabilitySlot = {
  slot_id: string; user_id: string; weekday: number;
  start_min: number; end_min: number;
};
