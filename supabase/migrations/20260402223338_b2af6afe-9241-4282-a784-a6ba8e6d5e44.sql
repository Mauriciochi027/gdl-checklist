
CREATE OR REPLACE FUNCTION public.get_latest_tire_depths(tire_ids uuid[])
RETURNS TABLE(tire_id uuid, depth numeric)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT ON (tm.tire_id) tm.tire_id, tm.depth
  FROM tire_measurements tm
  WHERE tm.tire_id = ANY(tire_ids)
  ORDER BY tm.tire_id, tm.measured_at DESC;
$$;
