CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  phone text,
  address text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  orders_count bigint,
  total_spent numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  RETURN QUERY
  SELECT
    u.id,
    u.email::text,
    p.full_name,
    p.phone,
    p.address,
    u.created_at,
    u.last_sign_in_at,
    COALESCE(o.cnt, 0) AS orders_count,
    COALESCE(o.spent, 0) AS total_spent
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  LEFT JOIN (
    SELECT user_id, COUNT(*)::bigint AS cnt, SUM(total)::numeric AS spent
    FROM public.orders GROUP BY user_id
  ) o ON o.user_id = u.id
  ORDER BY u.created_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;