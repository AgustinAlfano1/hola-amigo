
-- Fix: restrict insert to admins only (edge functions use service role which bypasses RLS)
DROP POLICY "Service can insert notifications" ON public.notifications;
CREATE POLICY "Admins can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));
