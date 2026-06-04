
-- Restaurant tables
CREATE TABLE public.restaurant_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  seats integer NOT NULL CHECK (seats > 0),
  status text NOT NULL DEFAULT 'free' CHECK (status IN ('free','booked','reserved')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view tables" ON public.restaurant_tables FOR SELECT USING (true);
CREATE POLICY "Admins manage tables" ON public.restaurant_tables FOR ALL
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_restaurant_tables_updated BEFORE UPDATE ON public.restaurant_tables
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Shop settings singleton
CREATE TABLE public.shop_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_open boolean NOT NULL DEFAULT true,
  closed_message text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view shop settings" ON public.shop_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage shop settings" ON public.shop_settings FOR ALL
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_shop_settings_updated BEFORE UPDATE ON public.shop_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.shop_settings (is_open, closed_message) VALUES (true, 'We are currently closed. Please come back soon!');

-- Seed a few tables
INSERT INTO public.restaurant_tables (label, seats, status) VALUES
  ('Table 1', 2, 'free'),
  ('Table 2', 2, 'booked'),
  ('Table 3', 4, 'free'),
  ('Table 4', 4, 'free'),
  ('Table 5', 6, 'reserved'),
  ('Table 6', 8, 'free');
