-- Promote c9b46f5a-3014-462b-bee8-3cc2224cfb0d to admin if they already exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = 'c9b46f5a-3014-462b-bee8-3cc2224cfb0d') THEN
    -- Upsert the admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES ('c9b46f5a-3014-462b-bee8-3cc2224cfb0d', 'admin')
    ON CONFLICT (user_id, role) 
    DO UPDATE SET role = 'admin';

    -- Remove any duplicate user role mapping
    DELETE FROM public.user_roles 
    WHERE user_id = 'c9b46f5a-3014-462b-bee8-3cc2224cfb0d' 
      AND role = 'user';
  END IF;
END $$;

-- Promote admin2026@gmail.com to admin if they already exist
DO $$
DECLARE
  target_id UUID;
BEGIN
  SELECT id INTO target_id FROM auth.users WHERE email = 'admin2026@gmail.com';
  IF target_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_id, 'admin')
    ON CONFLICT (user_id, role) 
    DO UPDATE SET role = 'admin';

    DELETE FROM public.user_roles 
    WHERE user_id = target_id 
      AND role = 'user';
  END IF;
END $$;

-- Update trigger function to handle future registration of either UID or Email as admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  IF NEW.id = 'c9b46f5a-3014-462b-bee8-3cc2224cfb0d' OR NEW.email = 'admin2026@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;

  INSERT INTO public.credit_ledger (user_id, delta, reason) VALUES (NEW.id, 100, 'signup_bonus');
  RETURN NEW;
END; $$;
