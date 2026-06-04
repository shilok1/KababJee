
-- 1. Reviews INSERT policy: restrict to authenticated
DROP POLICY IF EXISTS "Users create own reviews" ON public.reviews;
CREATE POLICY "Users create own reviews"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. Profiles INSERT policy: restrict to own id
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 3. has_role: add NULL guard
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF _user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
END;
$$;

-- 4. Revoke EXECUTE on internal SECURITY DEFINER functions from anon/authenticated.
-- handle_new_user is a trigger; should never be callable via the API.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
-- set_updated_at is a trigger helper too
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
