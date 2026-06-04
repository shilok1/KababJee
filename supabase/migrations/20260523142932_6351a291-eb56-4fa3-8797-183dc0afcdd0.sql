
-- Fix orders insert: require authenticated user
DROP POLICY IF EXISTS "Users create own orders" ON public.orders;
CREATE POLICY "Users create own orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Fix reservations insert: require authenticated user
DROP POLICY IF EXISTS "Users create own reservations" ON public.reservations;
CREATE POLICY "Users create own reservations"
ON public.reservations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Fix order_items insert: require authenticated user
DROP POLICY IF EXISTS "Users create own order items" ON public.order_items;
CREATE POLICY "Users create own order items"
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
  )
);

-- Restrict reviews SELECT to authenticated users to avoid public user_id enumeration
DROP POLICY IF EXISTS "Anyone view reviews" ON public.reviews;
CREATE POLICY "Authenticated users view reviews"
ON public.reviews
FOR SELECT
TO authenticated
USING (true);

-- Defensive: explicit restrictive policy preventing non-admins from inserting roles
CREATE POLICY "Only admins insert roles"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));
