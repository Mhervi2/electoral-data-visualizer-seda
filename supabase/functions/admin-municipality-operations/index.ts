import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MunicipalityCreationData {
  municipio: string;
  idp: number;
  provincia: string;
  idca: number;
  ca: string;
}

Deno.serve(async (req) => {
  console.log('Admin municipality operations function called')
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the Supabase service role client (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { action, ...payload } = await req.json()
    console.log('Action requested:', action)
    console.log('Payload:', payload)

    switch (action) {
      case 'create_municipality': {
        const municipalityData = payload as MunicipalityCreationData;
        
        // Get next available IDM
        const { data: maxIdmData, error: idmError } = await supabaseAdmin
          .from('mpca')
          .select('idm')
          .order('idm', { ascending: false })
          .limit(1);

        if (idmError) {
          console.error('Error getting max IDM:', idmError);
          throw new Error(`Error al obtener siguiente IDM: ${idmError.message}`);
        }

        const maxIdm = maxIdmData && maxIdmData.length > 0 ? maxIdmData[0].idm : 0;
        const newIdm = Number(maxIdm) + 1;

        // Get next available IDC for the province
        const { data: usedIdcs, error: idcError } = await supabaseAdmin
          .from('mpca')
          .select('idc')
          .eq('idp', municipalityData.idp)
          .order('idc');

        if (idcError) {
          console.error('Error getting used IDCs:', idcError);
          throw new Error(`Error al obtener códigos IDC: ${idcError.message}`);
        }

        const usedIdcSet = new Set((usedIdcs || []).map(item => parseInt(item.idc)).filter(idc => !isNaN(idc)));
        
        let newIdc: string;
        for (let i = 1; i <= 999; i++) {
          if (!usedIdcSet.has(i)) {
            newIdc = i.toString().padStart(3, '0');
            break;
          }
        }

        if (!newIdc!) {
          throw new Error('No hay códigos IDC disponibles para esta provincia');
        }

        // Create the municipality
        const { data: newMunicipality, error: createError } = await supabaseAdmin
          .from('mpca')
          .insert({
            idm: newIdm,
            municipio: municipalityData.municipio,
            idp: municipalityData.idp,
            provincia: municipalityData.provincia,
            idca: municipalityData.idca,
            ca: municipalityData.ca,
            idc: newIdc
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating municipality:', createError);
          throw new Error(`Error al crear municipio: ${createError.message}`);
        }

        console.log('Municipality created successfully:', newMunicipality);

        return new Response(
          JSON.stringify({ 
            success: true, 
            data: newMunicipality 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      case 'get_provinces': {
        const { data: provinces, error } = await supabaseAdmin
          .from('mpca')
          .select('idp, provincia, idca, ca')
          .order('provincia');

        if (error) {
          console.error('Error fetching provinces:', error);
          throw new Error(`Error al obtener provincias: ${error.message}`);
        }

        // Get unique provinces
        const uniqueProvinces = new Map();
        (provinces || []).forEach(item => {
          if (!uniqueProvinces.has(item.idp)) {
            uniqueProvinces.set(item.idp, {
              idp: item.idp,
              provincia: item.provincia,
              idca: item.idca,
              ca: item.ca
            });
          }
        });

        return new Response(
          JSON.stringify({ 
            success: true, 
            data: Array.from(uniqueProvinces.values()) 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

  } catch (error) {
    console.error('Error in admin municipality operations:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Error interno del servidor' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});