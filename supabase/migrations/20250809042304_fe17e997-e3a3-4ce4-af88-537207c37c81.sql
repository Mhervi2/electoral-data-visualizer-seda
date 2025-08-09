-- Clear electoral_acts table and all associated data
-- Delete in correct order due to foreign key constraints

-- 1. Delete audit logs first
DELETE FROM public.electoral_acts_audit_log;

-- 2. Delete party votes
DELETE FROM public.party_votes;

-- 3. Delete mail votes  
DELETE FROM public.mail_votes;

-- 4. Finally delete electoral acts
DELETE FROM public.electoral_acts;