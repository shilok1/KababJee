CREATE TYPE public.food_type AS ENUM ('veg','non_veg');
ALTER TABLE public.categories ADD COLUMN food_type public.food_type NOT NULL DEFAULT 'veg';
UPDATE public.categories SET food_type='non_veg' WHERE name IN ('BBQ & Kababs','Karahi & Handi','Biryani & Rice');
UPDATE public.categories SET food_type='veg' WHERE name IN ('Naan & Breads','Beverages','Desserts');