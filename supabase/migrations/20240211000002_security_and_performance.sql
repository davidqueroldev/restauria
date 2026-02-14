-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_session_id ON public.orders(session_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_table_sessions_table_id ON public.table_sessions(table_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON public.menu_items(category_id);

-- Secure Function to Link Tablet
CREATE OR REPLACE FUNCTION public.link_tablet_to_table(p_table_number INT)
RETURNS UUID AS $$
DECLARE
  v_table_id UUID;
BEGIN
  -- Find the table
  SELECT id INTO v_table_id
  FROM public.tables
  WHERE table_number = p_table_number;

  IF v_table_id IS NULL THEN
    RAISE EXCEPTION 'Table not found';
  END IF;

  -- Update the table with the current user's ID
  -- This runs with SECURITY DEFINER so it bypasses RLS on 'tables' update
  UPDATE public.tables
  SET tablet_user_id = auth.uid()
  WHERE id = v_table_id;

  RETURN v_table_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-apply decrement stock to ensure it exists
CREATE OR REPLACE FUNCTION public.decrement_stock(item_id UUID, qty INT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.menu_items
  SET stock = stock - qty
  WHERE id = item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
