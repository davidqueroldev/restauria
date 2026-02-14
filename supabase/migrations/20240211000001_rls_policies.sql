-- RLS Helper Functions
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles: 
-- Read: Staff can read all profiles. Users can read own.
CREATE POLICY "Profiles are viewable by self and staff" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('MANAGER', 'KITCHEN', 'WAITER')
  );

CREATE POLICY "Profiles editable by manager" ON public.profiles
  FOR UPDATE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'MANAGER'
  );

-- Restaurant Settings:
-- Read: All authenticated
CREATE POLICY "Settings viewable by everyone" ON public.restaurant_settings
  FOR SELECT USING (auth.role() = 'authenticated');
-- Update: Manager only
CREATE POLICY "Settings updateable by manager" ON public.restaurant_settings
  FOR UPDATE USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'MANAGER');


-- Tables:
-- Read: All authenticated
CREATE POLICY "Tables viewable by everyone" ON public.tables
  FOR SELECT USING (auth.role() = 'authenticated');
-- Update: Manager only
CREATE POLICY "Tables manage by manager" ON public.tables
  FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'MANAGER');


-- Table Sessions:
-- Read: Staff. Tablet can read OWN session (linked via tables table or session_id?)
-- Tablet is authorized as a user. It needs to find its active session.
-- Allow read if user is staff OR user is the tablet owner of the session's table?
-- Complex: 'table_sessions' -> 'table_id' -> 'tablet_user_id' = auth.uid()
CREATE POLICY "Sessions viewable by staff and own tablet" ON public.table_sessions
  FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('MANAGER', 'KITCHEN', 'WAITER') OR
    (SELECT tablet_user_id FROM public.tables WHERE id = table_sessions.table_id) = auth.uid()
  );

-- Insert: Tablet only (Start session)
CREATE POLICY "Sessions created by tablet" ON public.table_sessions
  FOR INSERT WITH CHECK (
    (SELECT tablet_user_id FROM public.tables WHERE id = table_id) = auth.uid()
  );

-- Update: Tablet (Checkout), Manager/Waiter (Close)
CREATE POLICY "Sessions updateable by staff and tablet" ON public.table_sessions
  FOR UPDATE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('MANAGER', 'WAITER') OR
    (SELECT tablet_user_id FROM public.tables WHERE id = table_id) = auth.uid()
  );


-- Menu (Categories/Items):
-- Read: All authenticated
CREATE POLICY "Menu viewable by everyone" ON public.menu_categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Menu items viewable by everyone" ON public.menu_items FOR SELECT USING (auth.role() = 'authenticated');

-- Write: Manager only
CREATE POLICY "Menu manage by manager" ON public.menu_categories FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'MANAGER');
CREATE POLICY "Menu items manage by manager" ON public.menu_items FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'MANAGER');

-- Update Stock: Manager (via ALL) and Trigger? 
-- If stock update via API is needed by others, e.g. Kitchen cancelling order and returning stock? (MVP: simple)


-- Orders:
-- Read: Staff (Kitchen/Waiter/Manager) and own Tablet
CREATE POLICY "Orders viewable by staff and owner" ON public.orders
  FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('MANAGER', 'KITCHEN', 'WAITER') OR
    EXISTS (
      SELECT 1 FROM public.table_sessions s
      JOIN public.tables t ON s.table_id = t.id
      WHERE s.id = orders.session_id AND t.tablet_user_id = auth.uid()
    )
  );

-- Insert: Tablet only
CREATE POLICY "Orders created by tablet" ON public.orders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.table_sessions s
      JOIN public.tables t ON s.table_id = t.id
      WHERE s.id = session_id AND t.tablet_user_id = auth.uid()
    )
  );

-- Update: Kitchen (Status), Manager
CREATE POLICY "Orders updating by kitchen/manager" ON public.orders
  FOR UPDATE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('MANAGER', 'KITCHEN')
  );


-- Order Items:
-- Read: Same as orders
CREATE POLICY "Order items viewable by staff and owner" ON public.order_items
  FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('MANAGER', 'KITCHEN', 'WAITER') OR
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.table_sessions s ON o.session_id = s.id
      JOIN public.tables t ON s.table_id = t.id
      WHERE o.id = order_items.order_id AND t.tablet_user_id = auth.uid()
    )
  );

-- Insert: Tablet only (via order creation)
CREATE POLICY "Order items created by tablet" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.table_sessions s ON o.session_id = s.id
      JOIN public.tables t ON s.table_id = t.id
      WHERE o.id = order_id AND t.tablet_user_id = auth.uid()
    )
  );

-- Update: Kitchen (Status), Waiter (Served), Manager
CREATE POLICY "Order items updateable by staff" ON public.order_items
  FOR UPDATE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('MANAGER', 'KITCHEN', 'WAITER')
  );

-- Payments
-- Read: Manager, Tablet (Own?)
CREATE POLICY "Payments viewable by manager and tablet" ON public.payments
  FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'MANAGER' OR
    EXISTS (
        SELECT 1 FROM public.table_sessions s
        JOIN public.tables t ON s.table_id = t.id
        WHERE s.id = payments.session_id AND t.tablet_user_id = auth.uid()
    )
  );

-- Insert: Tablet (Request checkout) calls API which inserts payment? Or tablet inserts?
-- Tablet inserts payment request
CREATE POLICY "Payments requestable by tablet" ON public.payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.table_sessions s
      JOIN public.tables t ON s.table_id = t.id
      WHERE s.id = session_id AND t.tablet_user_id = auth.uid()
    )
  );

-- Update: Manager (Confirm)
CREATE POLICY "Payments updateable by manager" ON public.payments
  FOR UPDATE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'MANAGER'
  );

-- Trigger for stock decrement on order sent to kitchen?
-- Doing it via application logic is easier for MVP, but Trigger is safer.
-- Let's stick to simple logic first.
