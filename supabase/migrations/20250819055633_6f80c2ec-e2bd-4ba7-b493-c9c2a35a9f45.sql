-- Delete all data from related tables first to avoid foreign key issues
DELETE FROM public.party_votes;

-- Delete all mail votes
DELETE FROM public.mail_votes;

-- Delete all electoral acts
DELETE FROM public.electoral_acts;

-- Delete all municipality data
DELETE FROM public.mpca;

-- Refresh materialized views to clear cached data
REFRESH MATERIALIZED VIEW public.mpca_search_optimized;

-- Reset sequences if needed (though UUID tables don't need this)
-- This ensures clean state for future data imports