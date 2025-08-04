-- Create function to update territorial names and propagate changes
CREATE OR REPLACE FUNCTION public.update_territorial_name(
    p_type TEXT, -- 'ca' or 'provincia'
    p_old_name TEXT,
    p_new_name TEXT
) RETURNS INTEGER AS $$
DECLARE
    affected_count INTEGER;
    name_field TEXT;
BEGIN
    -- Determine the field name based on type
    IF p_type = 'ca' THEN
        name_field := 'ca';
    ELSIF p_type = 'provincia' THEN
        name_field := 'provincia';
    ELSE
        RAISE EXCEPTION 'Invalid type. Must be ''ca'' or ''provincia''';
    END IF;

    -- Count affected municipalities before update
    EXECUTE format('SELECT COUNT(*) FROM public.mpca WHERE %I = $1', name_field)
    INTO affected_count
    USING p_old_name;

    -- Update the territorial name in mpca table
    EXECUTE format('UPDATE public.mpca SET %I = $1 WHERE %I = $2', name_field, name_field)
    USING p_new_name, p_old_name;

    RETURN affected_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;