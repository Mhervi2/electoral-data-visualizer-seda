-- Limpieza de datos de prueba con triggers desactivados
-- Desactivar triggers temporalmente
DROP TRIGGER IF EXISTS trigger_log_mail_votes_changes ON public.mail_votes;
DROP TRIGGER IF EXISTS trigger_log_party_votes_changes ON public.party_votes;
DROP TRIGGER IF EXISTS trigger_log_electoral_act_changes ON public.electoral_acts;

-- Limpieza de datos en orden correcto
DELETE FROM public.mail_votes;
DELETE FROM public.party_votes;
DELETE FROM public.electoral_acts_audit_log;
DELETE FROM public.electoral_acts;
DELETE FROM public.elections;
DELETE FROM public.political_parties;

-- Reactivar triggers
CREATE TRIGGER trigger_log_mail_votes_changes
    AFTER INSERT OR DELETE ON public.mail_votes
    FOR EACH ROW EXECUTE FUNCTION public.log_mail_votes_changes();

CREATE TRIGGER trigger_log_party_votes_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.party_votes
    FOR EACH ROW EXECUTE FUNCTION public.log_party_votes_changes();

CREATE TRIGGER trigger_log_electoral_act_changes
    BEFORE UPDATE ON public.electoral_acts
    FOR EACH ROW EXECUTE FUNCTION public.log_electoral_act_changes();