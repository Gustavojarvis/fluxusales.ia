/*
# Allow demo companies without auth user

The companies.user_id column is NOT NULL, which prevents creating demo
companies that don't belong to any authenticated user. This migration
makes user_id nullable so demo companies (like Flux Burger) can exist
without an auth user. The RLS policies already check user_id = auth.uid(),
so a null user_id means only anon policies apply (public reads).
*/

ALTER TABLE companies ALTER COLUMN user_id DROP NOT NULL;