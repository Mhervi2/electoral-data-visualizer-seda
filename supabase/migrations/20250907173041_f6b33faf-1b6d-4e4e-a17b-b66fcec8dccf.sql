-- Create the user in Supabase Auth if it doesn't exist
-- This will automatically trigger the handle_new_user function to create the profile
-- We'll use the admin API to create this user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  aud,
  role,
  created_at,
  updated_at,
  email_change_token_new,
  email_change_confirm_status,
  banned_until,
  deleted_at
) VALUES (
  'b7c79249-8596-46b0-b75c-cf1b7caf9151',
  '00000000-0000-0000-0000-000000000000',
  'sergiomorolopez@gmail.com',
  crypt('AdminSergio25#', gen_salt('bf')),
  now(),
  '',
  'authenticated',
  'authenticated',
  now(),
  now(),
  '',
  0,
  null,
  null
) ON CONFLICT (email) DO NOTHING;