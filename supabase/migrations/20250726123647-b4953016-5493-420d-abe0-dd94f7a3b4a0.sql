-- Create trigger to log electoral act changes
CREATE TRIGGER log_electoral_act_changes_trigger
  BEFORE UPDATE ON public.electoral_acts
  FOR EACH ROW
  EXECUTE FUNCTION public.log_electoral_act_changes();