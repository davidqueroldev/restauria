-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM ('MANAGER', 'KITCHEN', 'WAITER', 'TABLET');
CREATE TYPE table_status AS ENUM ('FREE', 'OCCUPIED');
CREATE TYPE session_status AS ENUM ('ACTIVE', 'CHECKOUT_REQUESTED', 'CLOSED');
CREATE TYPE order_status AS ENUM ('IN_KITCHEN', 'COMPLETED', 'CANCELLED');
CREATE TYPE order_item_status AS ENUM ('PENDING', 'IN_PREP', 'DISPATCHED', 'SERVED', 'CANCELLED');
CREATE TYPE payment_status AS ENUM ('REQUESTED', 'CONFIRMED');

-- Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role user_role NOT NULL DEFAULT 'WAITER',
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Restaurant Settings
CREATE TABLE public.restaurant_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tables
CREATE TABLE public.tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_number INT UNIQUE NOT NULL,
  capacity INT NOT NULL DEFAULT 4,
  status table_status NOT NULL DEFAULT 'FREE',
  tablet_user_id UUID REFERENCES auth.users(id), -- Linked to the specific tablet user
  created_at TIMESTAMPTZ DEFAULT NOW(),
  current_session_id UUID -- Circular reference to table_sessions
);

-- Table Sessions
CREATE TABLE public.table_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id UUID REFERENCES public.tables(id) NOT NULL,
  alias TEXT NOT NULL,
  status session_status NOT NULL DEFAULT 'ACTIVE',
  seated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  checkout_requested_at TIMESTAMPTZ
);

-- Add circular reference to tables for current_session
ALTER TABLE public.tables ADD COLUMN current_session_id UUID REFERENCES public.table_sessions(id);

-- Menu Categories (Sections)
CREATE TABLE public.menu_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu Items
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES public.menu_categories(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  image_url TEXT,
  allergens TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  stock INT NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES public.table_sessions(id) NOT NULL,
  status order_status NOT NULL DEFAULT 'IN_KITCHEN',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Order Items
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) NOT NULL,
  menu_item_id UUID REFERENCES public.menu_items(id) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL, -- Snapshot price
  status order_item_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES public.table_sessions(id) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status payment_status NOT NULL DEFAULT 'REQUESTED',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  confirmed_by_user_id UUID REFERENCES auth.users(id)
);

-- Basic RLS Enabling
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Functions

-- Handle New User (Trigger for Profiles)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_full_name TEXT;
  v_role public.user_role;
BEGIN
  -- Safely extract metadata
  v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', '');
  
  -- Use a CASE to be absolutely sure about the enum and schema
  v_role := CASE (new.raw_user_meta_data->>'role')
    WHEN 'MANAGER' THEN 'MANAGER'::public.user_role
    WHEN 'KITCHEN' THEN 'KITCHEN'::public.user_role
    WHEN 'WAITER' THEN 'WAITER'::public.user_role
    WHEN 'TABLET' THEN 'TABLET'::public.user_role
    ELSE 'WAITER'::public.user_role
  END;

  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, v_full_name, v_role);

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Fallback to ensure user creation doesn't fail
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, '', 'WAITER'::public.user_role);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
