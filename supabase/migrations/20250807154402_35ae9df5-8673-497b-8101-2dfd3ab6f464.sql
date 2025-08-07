-- Clean electoral acts and all associated data
-- This operation is IRREVERSIBLE - all electoral data will be permanently deleted

-- Step 1: Delete mail votes (related to electoral acts)
DELETE FROM public.mail_votes;

-- Step 2: Delete party votes (related to electoral acts) 
DELETE FROM public.party_votes;

-- Step 3: Delete electoral acts audit log (related to electoral acts)
DELETE FROM public.electoral_acts_audit_log;

-- Step 4: Delete electoral acts (main table)
DELETE FROM public.electoral_acts;

-- Verification: Check that all tables are now empty
-- (This will be visible in the migration output)