import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import * as XLSX from 'https://esm.sh/xlsx@0.18.5';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessingResult {
  success: boolean;
  processed: number;
  created: number;
  updated: number;
  errors: string[];
  unresolvedMunicipalities?: UnresolvedMunicipality[];
  unresolvedParties?: UnresolvedParty[];
  // Batch processing fields
  batchComplete?: boolean;
  currentBatch?: number;
  totalBatches?: number;
  nextBatchStart?: number;
  progressPercentage?: number;
  // Extras for client progress
  totalRows?: number;
  pausedForResolution?: boolean;
}

interface UnresolvedMunicipality {
  originalName: string;
  normalizedName: string;
  rowIndex: number;
  provincia?: string;
  ca?: string;
}

interface UnresolvedParty {
  originalName: string;
  normalizedName: string;
  columnIndex: number;
}

interface MpcaData {
  idm: number;
  municipio: string;
  idp: number;
  provincia: string;
  idca: number;
  ca: string;
  idc: string;
}

interface MunicipalityResolution {
  originalName: string;
  resolvedIdm: number;
}

interface PartyResolution {
  originalName: string;
  resolvedPartyId: string;
}

serve(async (req) => {
  console.log('🚀 Real data Excel processing function called');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const sourceType = formData.get('sourceType') as string;
    const electionId = formData.get('electionId') as string;
    // Optional province filter (IDP) to restrict matching to a single province for Real Data Excel
    const provinceIdpParam = formData.get('provinceIdp') as string | null;
    const selectedProvinceIdp = provinceIdpParam ? parseInt(provinceIdpParam) : undefined;

    // Get optional batch processing and resolution parameters
    const batchStart = formData.get('batchStart') ? parseInt(formData.get('batchStart') as string) : 0;
    const batchSize = formData.get('batchSize') ? parseInt(formData.get('batchSize') as string) : 100;
    const batchMode = formData.get('batchMode') === 'true';
    const resolutionsJson = formData.get('resolutions') as string;
    const partyResolutionsJson = formData.get('partyResolutions') as string;
    
    let municipalityResolutions = new Map<string, number>();
    if (resolutionsJson) {
      try {
        const resolutions: MunicipalityResolution[] = JSON.parse(resolutionsJson);
        resolutions.forEach(resolution => {
          const normalizedName = resolution.originalName
            .toLowerCase()
            .trim()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ');
          municipalityResolutions.set(normalizedName, resolution.resolvedIdm);
        });
      } catch (error) {
        console.error('❌ Error parsing municipality resolutions:', error);
      }
    }

    let partyResolutions = new Map<string, string>();
    if (partyResolutionsJson) {
      try {
        const resolutions: PartyResolution[] = JSON.parse(partyResolutionsJson);
        resolutions.forEach(resolution => {
          const normalizedName = resolution.originalName
            .toLowerCase()
            .trim()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ');
          partyResolutions.set(normalizedName, resolution.resolvedPartyId);
        });
      } catch (error) {
        console.error('❌ Error parsing party resolutions:', error);
      }
    }

    if (!file || !sourceType || !electionId) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: file, sourceType, or electionId' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📝 Processing real data Excel file: ${file.name}`);

    // Read Excel file
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });

    // Select the best sheet: one that contains expected headers and most data rows
    let selectedSheetName = workbook.SheetNames[0];
    let selectedJsonData: any[] = [];
    let maxDataRows = 0;

    const normalize = (s: any) => (typeof s === 'string' ? s : String(s || ''))?.toLowerCase()?.trim()?.normalize('NFD')?.replace(/[\u0300-\u036f]/g, '') || '';
    const hasExpectedHeaders = (headers: string[]) => {
      const norm = headers.map(h => normalize(h));
      const hasMunicipio = norm.some(h => h.includes('municipio') || h.includes('municipality'));
      // Accept either a combined mesa identifier column OR separate district+section columns
      const hasMesaCombined = norm.some(h => h.includes('mesa') || h.includes('table') || h.includes('polling'));
      const hasDistrictSection = norm.some(h => h.includes('distrito') || h.includes('district')) &&
                                 norm.some(h => h.includes('seccion') || h.includes('sección') || h.includes('section'));
      return hasMunicipio && (hasMesaCombined || hasDistrictSection);
    };

    for (const sheetName of workbook.SheetNames) {
      const ws = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      if (!Array.isArray(data) || data.length < 2) continue; // needs header + at least 1 row
      const headersRow = data[0] as string[];
      const dataRows = data.length - 1;
      const qualifies = hasExpectedHeaders(headersRow);
      if (qualifies && dataRows > maxDataRows) {
        selectedSheetName = sheetName;
        selectedJsonData = data as any[];
        maxDataRows = dataRows;
      } else if (!selectedJsonData.length && dataRows > maxDataRows) {
        // Fallback: keep the sheet with most rows if none qualified yet
        selectedSheetName = sheetName;
        selectedJsonData = data as any[];
        maxDataRows = dataRows;
      }
    }

    const worksheet = workbook.Sheets[selectedSheetName];
    const jsonData = selectedJsonData.length ? selectedJsonData : XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    console.log(`📄 Selected sheet: ${selectedSheetName}`);
    if (!jsonData || jsonData.length < 2) {
      return new Response(JSON.stringify({ 
        error: 'Excel file must have at least 2 rows (header + data)' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📊 Found ${jsonData.length} rows in Excel`);
    
    // Calculate batch information
    const totalDataRows = jsonData.length - 1; // Exclude header
    const totalBatches = Math.ceil(totalDataRows / batchSize);
    const currentBatch = Math.floor(batchStart / batchSize) + 1;
    const isBatchMode = batchMode;
    
    console.log(`📦 Batch processing: ${currentBatch}/${totalBatches} (rows ${batchStart + 1}-${Math.min(batchStart + batchSize, totalDataRows) + 1}/${totalDataRows})`);

    // Parse headers and find column indices
    const headers = jsonData[0] as string[];
    console.log(`📋 Headers found:`, headers);

    // New optimized format for "Usuarios" (real-data):
    // Column A: Full mesa identifier (e.g., "08-05-001-01-001-U") 
    // Column B: Municipality name (for reference only)
    // Column C: Census
    // Column D: Total Voters
    // Column E: Null Votes  
    // Column F: Blank Votes
    // Column G: Observations
    // Column H+: Party identifier numbers (1, 2, 3, etc.)

    const fullIdentifierIndex = 0; // Column A
    const municipioRefIndex = 1;   // Column B (reference only)
    const censoIndex = 2;          // Column C
    const votantesIndex = 3;       // Column D
    const nulosIndex = 4;          // Column E
    const blancosIndex = 5;        // Column F
    const observationsIndex = 6;   // Column G

    // Find party columns starting from column H (index 7) for "Usuarios" format
    // These should be party_identifier numbers (1, 2, 3, etc.)
    const partyIdentifierIndices: { index: number; partyIdentifier: number }[] = []
    for (let i = 7; i < headers.length; i++) {
      const header = headers[i]?.toString().trim()
      if (header && /^\d+$/.test(header)) {
        const partyIdentifier = parseInt(header)
        partyIdentifierIndices.push({ index: i, partyIdentifier })
      }
    }

    console.log(`📊 Found ${partyIdentifierIndices.length} party identifier columns:`, 
      partyIdentifierIndices.map(p => p.partyIdentifier));

    // System column filters (keeping for backward compatibility)
    const systemColumns = [
      // Image/Photo columns
      'fotografía', 'foto', 'imagen', 'image', 'img', 'picture',
      // Location columns
      'municipio', 'municipality', 'ciudad', 'city', 'localidad', 'locality',
      'distrito', 'district', 'distrit', 'distr',
      'sección', 'section', 'seccion', 'secc', 'sec',
      'mesa', 'table', 'polling', 'poll', 'voting table',
      'provincia', 'province', 'prov',
      'comunidad autonoma', 'comunidad autónoma', 'ca', 'ccaa',
      'codigo', 'código', 'code',
      // Vote count columns
      'censo', 'census', 'electores', 'voters', 'número de electores censados', 'numero de electores censados',
      'votantes', 'total voters', 'total votantes', 'número total de votantes', 'numero total de votantes',
      'blancos', 'blank', 'votos en blanco', 'blank votes', 'voto blanco', 'votos blancos',
      'nulos', 'null', 'invalid', 'votos nulos', 'null votes', 'invalid votes', 'voto nulo',
      // Calculation columns
      'suma', 'total', 'suma votos', 'total votes', 'suma de votos', 'total de votos',
      '=', 'diferencia', 'difference', 'no han votado', 'abstenciones', 'abstention',
      'participacion', 'participación', 'participation',
      // Common spreadsheet artifacts
      'observaciones', 'observations', 'notas', 'notes', 'comentarios', 'comments',
      // Numeric patterns
      'voto', 'votos', 'vote', 'votes'
    ];

    // Enhanced function to check if a column is a system column
    const isSystemColumn = (header: string): boolean => {
      if (!header || !header.trim()) return true;
      
      const normalizedHeader = header.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      
      // Check if it's purely numeric (likely a mistake)
      if (/^\d+$/.test(normalizedHeader)) {
        console.log(`🔍 Filtering out numeric column: "${header}"`);
        return true;
      }
      
      // Check if it's a formula (only if header starts with '=')
      if (normalizedHeader.startsWith('=')) {
        console.log(`🔍 Filtering out calculation column: "${header}"`);
        return true;
      }
      
      // Tokenize header to avoid substring false positives (e.g., 'suma' vs 'sumar')
      const tokens = normalizedHeader.split(/\s+/).filter(Boolean);

      // Check against system column keywords (word-level for single words, substring for multi-word phrases)
      const isSystem = systemColumns.some(systemCol => {
        const normalizedSystemCol = systemCol.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        let matches = false;
        if (normalizedSystemCol.includes(' ')) {
          // Multi-word phrase: require full phrase in header
          matches = normalizedHeader.includes(normalizedSystemCol);
        } else {
          // Single word: require token match
          matches = tokens.includes(normalizedSystemCol);
        }
        if (matches) {
          console.log(`🔍 Filtering out system column: "${header}" (matched: "${systemCol}")`);
        }
        return matches;
      });
      
      return isSystem;
    };

    // Column indices are now fixed based on the new format
    
    console.log(`📍 Column indices (fixed format):`, {
      fullIdentifier: fullIdentifierIndex,
      municipioRef: municipioRefIndex,
      censo: censoIndex,
      votantes: votantesIndex,
      nulos: nulosIndex,
      blancos: blancosIndex,
      observations: observationsIndex,
      partyColumns: partyIdentifierIndices.map(p => `${p.index}:${p.partyIdentifier}`)
    });

    // Define index variables for compatibility with existing code
    const municipioIndex = municipioRefIndex;
    const mesaIndex = fullIdentifierIndex;
    const districtIndex = -1; // Not used in new format
    const sectionIndex = -1;  // Not used in new format
    const fotoIndex = -1;     // Not used in new format
    
    // Extract party column indices for compatibility
    const partyColumnIndices = partyIdentifierIndices.map(p => p.index);
    console.log('📥 Loading municipality and party data...');
    
    const { data: mpcaData, error: mpcaError } = await supabase
      .from('mpca')
      .select('idm, municipio, idp, provincia, idca, ca, idc');
    
    if (mpcaError) {
      console.error('❌ Error fetching municipality data:', mpcaError);
      throw new Error('Failed to load municipality data');
    }

    const { data: partiesData, error: partiesError } = await supabase
      .from('political_parties')
      .select('id, name, siglas, color, party_identifier');
    
    if (partiesError) {
      console.error('❌ Error fetching political parties:', partiesError);
      throw new Error('Failed to load political parties data');
    }

    // Enhanced municipality lookup with support for the new identifier-based format
    const municipalityByCodesMap = new Map<string, MpcaData>();
    const municipalityByIdMap = new Map<number, MpcaData>();
    const municipalityMap = new Map<string, MpcaData>();
    
    (mpcaData || []).forEach(item => {
      const codesKey = `${item.idca}-${item.idp}-${item.idc}`;
      municipalityByCodesMap.set(codesKey, {
        idm: item.idm,
        municipio: item.municipio,
        idp: item.idp,
        provincia: item.provincia,
        idca: item.idca,
        ca: item.ca,
        idc: item.idc,
      });
      municipalityByIdMap.set(item.idm, {
        idm: item.idm,
        municipio: item.municipio,
        idp: item.idp,
        provincia: item.provincia,
        idca: item.idca,
        ca: item.ca,
        idc: item.idc,
      });
      // Also add to name-based map for legacy compatibility
      const normalizedName = normalizeText(item.municipio);
      municipalityMap.set(normalizedName, {
        idm: item.idm,
        municipio: item.municipio,
        idp: item.idp,
        provincia: item.provincia,
        idca: item.idca,
        ca: item.ca,
        idc: item.idc,
      });
    });

    const partyMap = new Map<string, any>();
    const partyByIdentifierMap = new Map<number, any>();
    const allParties: any[] = [];
    (partiesData || []).forEach(party => {
      const normalizedName = normalizeText(party.name);
      const normalizedSiglas = normalizeText(party.siglas || '');
      partyMap.set(normalizedName, party);
      if (normalizedSiglas) {
        partyMap.set(normalizedSiglas, party);
      }
      // Add to identifier map for faster lookup
      partyByIdentifierMap.set(party.party_identifier, party);
      allParties.push(party);
    });

    console.log(`🏛️ Loaded ${municipalityMap.size} municipalities and ${allParties.length} parties`);
    console.log(`📊 Available parties in database:`, allParties.map(p => `${p.name} (${p.siglas})`).join(', '));

    // Enhanced normalize text function for better party and municipality matching
    function normalizeText(text: string): string {
      return text
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ');
    }

    // Move article at the end in parentheses to the beginning: "Ejido (EL)" -> "EL Ejido"
    function moveArticleAtEndToStart(name: string): string {
      if (!name) return name;
      const m = name.match(/\s*\((el|la|los|las)\)\s*$/i);
      if (!m) return name;
      const article = m[1].toUpperCase();
      const base = name.replace(/\s*\((el|la|los|las)\)\s*$/i, '').trim();
      return `${article} ${base}`;
    }

    function normalizeMunicipalityCandidate(name: string): string {
      return normalizeText(moveArticleAtEndToStart(name));
    }

    // Convert Google Drive share/open links to direct usercontent URLs
    function convertDriveLink(url: string | null): string | null {
      if (!url) return null;
      try {
        const u = url.trim();
        if (u.includes('drive.usercontent.google.com')) return u;
        // id from uc?export=view&id=XXXX
        const m1 = u.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        // id from /file/d/XXXX/view
        const m2 = u.match(/\/file\/d\/([a-zA-Z0-9_-]+)\//);
        const id = (m1 && m1[1]) || (m2 && m2[1]);
        if (id) {
          return `https://drive.usercontent.google.com/download?id=${id}&export=view&authuser=0`;
        }
        return u;
      } catch {
        return url;
      }
    }

    // Extract siglas from party names (text inside parentheses)
    function extractSiglas(text: string): string | null {
      const match = text.match(/\(([^)]+)\)$/);
      return match ? match[1].trim() : null;
    }

    // Normalize party name by removing siglas in parentheses
    function normalizePartyName(text: string): string {
      const withoutParentheses = text.replace(/\s*\([^)]*\)\s*$/, '').trim();
      return normalizeText(withoutParentheses);
    }

    // Enhanced party lookup function
    function findParty(partyName: string): any | null {
      console.log(`🎭 Looking for party: "${partyName}"`);
      
      // Extract siglas if present
      const siglas = extractSiglas(partyName);
      const normalizedName = normalizePartyName(partyName);
      const normalizedOriginal = normalizeText(partyName);
      
      console.log(`   Normalized name: "${normalizedName}"`);
      console.log(`   Extracted siglas: "${siglas}"`);
      
      // Try direct match with normalized original
      if (partyMap.has(normalizedOriginal)) {
        const found = partyMap.get(normalizedOriginal);
        console.log(`   ✅ Direct original match: "${found.name}"`);
        return found;
      }
      
      // Try match with normalized name (without parentheses)
      if (partyMap.has(normalizedName)) {
        const found = partyMap.get(normalizedName);
        console.log(`   ✅ Name match: "${found.name}"`);
        return found;
      }
      
      // Try match with siglas if extracted
      if (siglas) {
        const normalizedSiglas = normalizeText(siglas);
        if (partyMap.has(normalizedSiglas)) {
          const found = partyMap.get(normalizedSiglas);
          console.log(`   ✅ Siglas match: "${found.name}" (${found.siglas})`);
          return found;
        }
      }
      
      // Try fuzzy matching for names
      for (const [key, party] of partyMap.entries()) {
        // Check if it's a party entry (not siglas)
        if (party.name && normalizeText(party.name) === key) {
          if (key.includes(normalizedName) || normalizedName.includes(key)) {
            console.log(`   🔍 Fuzzy name match: "${partyName}" -> "${party.name}"`);
            return party;
          }
        }
      }
      
      console.log(`   ❌ No match found for: "${partyName}"`);
      return null;
    }

    // Enhanced municipality lookup function (exact match only, province-aware)
    function findMunicipality(municipioName: string): MpcaData | null {
      const normalized = normalizeMunicipalityCandidate(municipioName);

      // Prefer match within selected province if provided
      if (selectedProvinceIdp !== undefined) {
        const inProvince = (mpcaData || []).find((item: any) => 
          normalizeMunicipalityCandidate(item.municipio) === normalized && 
          Number(item.idp) === Number(selectedProvinceIdp)
        );
        if (inProvince) return {
          idm: inProvince.idm,
          municipio: inProvince.municipio,
          idp: inProvince.idp,
          provincia: inProvince.provincia,
          idca: inProvince.idca,
          ca: inProvince.ca,
          idc: inProvince.idc,
        };
      }

      // Fallback: exact match in any province
      const anyMatch = (mpcaData || []).find((item: any) => 
        normalizeMunicipalityCandidate(item.municipio) === normalized
      );
      if (anyMatch) return {
        idm: anyMatch.idm,
        municipio: anyMatch.municipio,
        idp: anyMatch.idp,
        provincia: anyMatch.provincia,
        idca: anyMatch.idca,
        ca: anyMatch.ca,
        idc: anyMatch.idc,
      };

      return null;
    }

    // Helpers to normalize and build mesa identifier from combined or split columns
    const combinedMesaRegex = /^(\d{1,2})[\s\-_.]?(\d{1,3})[\s\-_.]?([A-Za-z])$/;
    function normalizeMesaCombined(value: string): string | null {
      const v = (value || '').toString().trim();
      const m = v.match(combinedMesaRegex);
      if (!m) return null;
      const d = m[1].padStart(2, '0');
      const s = m[2].padStart(3, '0');
      const t = m[3].toUpperCase();
      return `${d}-${s}-${t}`;
    }
    function buildMesaIdentifier(row: any[]): string | null {
      // Try combined column first
      const rawMesa = mesaIndex !== -1 ? (row[mesaIndex]?.toString()?.trim() || '') : '';
      const combined = rawMesa ? normalizeMesaCombined(rawMesa) : null;
      if (combined) return combined;

      // Try split columns (Distrito + Sección + Mesa letter possibly in mesa column)
      const rawDistrict = districtIndex !== -1 ? (row[districtIndex]?.toString()?.trim() || '') : '';
      const rawSection = sectionIndex !== -1 ? (row[sectionIndex]?.toString()?.trim() || '') : '';
      let letter = '';
      if (rawMesa && /^[A-Za-z]$/.test(rawMesa)) {
        letter = rawMesa.toUpperCase();
      }
      // Extract digits
      const districtNum = rawDistrict.replace(/[^0-9]/g, '');
      const sectionNum = rawSection.replace(/[^0-9]/g, '');
      if (!districtNum || !sectionNum || !letter) return null;
      const d = districtNum.padStart(2, '0');
      const s = sectionNum.padStart(3, '0');
      return `${d}-${s}-${letter}`;
    }

    // Process data and collect unresolved municipalities and parties
    const unresolvedMunicipalities: UnresolvedMunicipality[] = [];
    const unresolvedParties: UnresolvedParty[] = [];
    const mesaDataList: any[] = [];
    let processedCount = 0;
    const errors: string[] = [];
    const MAX_ERRORS = 50;

    // Process only the current batch range
    const startIndex = isBatchMode ? batchStart + 1 : 1; // +1 to skip header
    const endIndex = isBatchMode ? Math.min(batchStart + batchSize + 1, jsonData.length) : jsonData.length;
    
    // Province context for unresolved hint
    const provinceContext = selectedProvinceIdp !== undefined 
      ? (mpcaData || []).find((it: any) => Number(it.idp) === Number(selectedProvinceIdp))
      : undefined;
    
    // First pass: identify all unresolved municipalities in current batch
    for (let i = startIndex; i < endIndex; i++) {
      const row = jsonData[i] as any[];
      
      if (!row || row.length === 0) continue;

      const municipioName = row[municipioIndex]?.toString()?.trim();
      if (!municipioName) continue;

      const normalizedMunicipio = normalizeMunicipalityCandidate(municipioName);
      
      // Check if we have a resolution for this municipality
      let municipalityData: MpcaData | null = null;
      
      if (municipalityResolutions.has(normalizedMunicipio)) {
        const resolvedIdm = municipalityResolutions.get(normalizedMunicipio)!;
        municipalityData = municipalityByIdMap.get(resolvedIdm) || null;
      } else {
        municipalityData = findMunicipality(municipioName);
      }

      if (!municipalityData) {
        // Check if we already have this unresolved municipality
        const alreadyExists = unresolvedMunicipalities.some(
          unresolved => normalizeMunicipalityCandidate(unresolved.originalName) === normalizedMunicipio
        );
        
        if (!alreadyExists) {
          unresolvedMunicipalities.push({
            originalName: municipioName,
            normalizedName: normalizedMunicipio,
            rowIndex: i,
            provincia: provinceContext?.provincia,
            ca: provinceContext?.ca,
          });
        }
        continue;
      }

      // Store for processing
      mesaDataList.push({
        rowIndex: i,
        row,
        municipalityData
      });
    }

    // Check for unresolved parties in party columns using enhanced matching
    for (const partyIndex of partyColumnIndices) {
      const partyName = headers[partyIndex]?.toString()?.trim();
      if (!partyName) continue;

      const normalizedPartyName = normalizeText(partyName);
      
      // Check if we have a resolution for this party
      let partyExists = false;
      
      if (partyResolutions.has(normalizedPartyName)) {
        partyExists = true;
      } else {
        // Use enhanced party matching function
        const foundParty = findParty(partyName);
        partyExists = foundParty !== null;
      }

      if (!partyExists) {
        // Check if we already have this unresolved party
        const alreadyExists = unresolvedParties.some(
          unresolved => normalizeText(unresolved.originalName) === normalizedPartyName
        );
        
        if (!alreadyExists) {
          unresolvedParties.push({
            originalName: partyName,
            normalizedName: normalizedPartyName,
            columnIndex: partyIndex
          });
        }
      }
    }

    // Check resolution order: parties first, then municipalities
    if (unresolvedParties.length > 0 && !partyResolutionsJson) {
      console.log(`⏸️ Found ${unresolvedParties.length} partidos sin resolver. Pausing for party resolution.`);
      console.log(`   Unresolved parties:`, unresolvedParties.map(p => p.originalName));
      
      const result: ProcessingResult = {
        success: false,
        processed: 0,
        created: 0,
        updated: 0,
        errors: [],
        unresolvedParties: unresolvedParties,
        batchComplete: false,
        currentBatch: isBatchMode ? currentBatch : 1,
        totalBatches: isBatchMode ? totalBatches : 1,
        nextBatchStart: batchStart,
        progressPercentage: 0,
        totalRows: totalDataRows,
        pausedForResolution: true
      };

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (unresolvedMunicipalities.length > 0 && !resolutionsJson) {
      console.log(`⏸️ Found ${unresolvedMunicipalities.length} municipios sin resolver. Pausing for municipality resolution.`);
      
      const result: ProcessingResult = {
        success: false,
        processed: 0,
        created: 0,
        updated: 0,
        errors: [],
        unresolvedMunicipalities: unresolvedMunicipalities,
        batchComplete: false,
        currentBatch: isBatchMode ? currentBatch : 1,
        totalBatches: isBatchMode ? totalBatches : 1,
        nextBatchStart: batchStart,
        progressPercentage: 0,
        totalRows: totalDataRows,
        pausedForResolution: true
      };

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📋 Processing ${mesaDataList.length} mesas...`);

    // Process the mesas
    let createdMesas = 0;
    let updatedMesas = 0;
    let createdParties = 0;

    for (const mesaData of mesaDataList) {
      const { row, municipalityData, rowIndex } = mesaData;
      
      try {
        const mesaIdentifier = buildMesaIdentifier(row);
        if (!mesaIdentifier) {
          if (errors.length < MAX_ERRORS) {
            errors.push(`Fila ${rowIndex + 1}: Identificador de mesa vacío o inválido`);
          }
          continue;
        }

        const censo = parseInt(row[censoIndex]?.toString() || '0') || 0;
        const votantes = parseInt(row[votantesIndex]?.toString() || '0') || 0;
        const blancos = parseInt(row[blancosIndex]?.toString() || '0') || 0;
        const nulos = parseInt(row[nulosIndex]?.toString() || '0') || 0;
        const observations = row[observationsIndex]?.toString()?.trim() || null;
        const fotoUrlRaw = row[fotoIndex]?.toString()?.trim() || null;
        const fotoUrl = convertDriveLink(fotoUrlRaw);

        // Generate full identifier
        const fullIdentifier = `${String(municipalityData.idca).padStart(2, '0')}-${String(municipalityData.idp).padStart(2, '0')}-${municipalityData.idc}-${mesaIdentifier}`;

        // Check if electoral act exists
        const { data: existingAct, error: findError } = await supabase
          .from('electoral_acts')
          .select('id')
          .eq('municipality_idm', municipalityData.idm)
          .eq('mesa_identifier', mesaIdentifier)
          .eq('election_id', electionId)
          .maybeSingle();

        if (findError) {
          console.error('❌ Error finding existing act:', findError);
          if (errors.length < MAX_ERRORS) {
            errors.push(`Fila ${rowIndex + 1}: Error buscando acta existente - ${findError.message}`);
          }
          continue;
        }

        let actId: string;

        if (existingAct) {
          // Update existing act
          const { error: updateError } = await supabase
            .from('electoral_acts')
            .update({
              census_total: censo,
              total_voters: votantes,
              blank_votes: blancos,
              null_votes: nulos,
              source_type: sourceType,
              image_url: fotoUrl,
              full_identifier: fullIdentifier,
              observations: observations,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingAct.id);

          if (updateError) {
            console.error('❌ Error updating electoral act:', updateError);
            if (errors.length < MAX_ERRORS) {
              errors.push(`Fila ${rowIndex + 1}: Error actualizando acta electoral - ${updateError.message}`);
            }
            continue;
          }

          actId = existingAct.id;
          updatedMesas++;

          // Delete existing party votes for this act
          await supabase
            .from('party_votes')
            .delete()
            .eq('electoral_act_id', actId);

        } else {
          // Create new act
          const { data: newAct, error: insertError } = await supabase
            .from('electoral_acts')
            .insert({
              election_id: electionId,
              municipality_idm: municipalityData.idm,
              mesa_identifier: mesaIdentifier,
              census_total: censo,
              total_voters: votantes,
              blank_votes: blancos,
              null_votes: nulos,
              source_type: sourceType,
              image_url: fotoUrl,
              full_identifier: fullIdentifier,
              observations: observations
            })
            .select('id')
            .single();

          if (insertError) {
            console.error('❌ Error creating electoral act:', insertError);
            if (errors.length < MAX_ERRORS) {
              errors.push(`Fila ${rowIndex + 1}: Error creando acta electoral - ${insertError.message}`);
            }
            continue;
          }

          actId = newAct.id;
          createdMesas++;
        }

        // Process party votes for this act
        const partyVotesToInsert = [];
        
        for (const partyIndex of partyColumnIndices) {
          const partyName = headers[partyIndex]?.toString()?.trim();
          if (!partyName) continue;

          const normalizedPartyName = normalizeText(partyName);
          const votes = parseInt(row[partyIndex]?.toString() || '0') || 0;
          
          if (votes <= 0) continue;

          // Use enhanced party finding with resolution support
          let party = null;
          
          // Check if we have a resolution for this party
          if (partyResolutions.has(normalizedPartyName)) {
            const resolvedPartyId = partyResolutions.get(normalizedPartyName)!;
            // Find party by resolved ID
            for (const [key, value] of partyMap.entries()) {
              if (value.id === resolvedPartyId) {
                party = value;
                break;
              }
            }
          } else {
            // Use enhanced party matching
            party = findParty(partyName);
          }
          
          if (!party) {
            // Skip this party - it should have been resolved in the resolution step
            console.warn(`⚠️ Skipping unresolved party: ${partyName}`);
            continue;
          }

          partyVotesToInsert.push({
            electoral_act_id: actId,
            party_id: party.id,
            votes: votes
          });
        }

        // Insert party votes in batch
        if (partyVotesToInsert.length > 0) {
          const { error: partyVotesError } = await supabase
            .from('party_votes')
            .insert(partyVotesToInsert);

          if (partyVotesError) {
            console.error('❌ Error inserting party votes:', partyVotesError);
            if (errors.length < MAX_ERRORS) {
              errors.push(`Fila ${rowIndex + 1}: Error insertando votos de partidos - ${partyVotesError.message}`);
            }
            continue;
          }
        }

        processedCount++;

      } catch (error) {
        console.error(`❌ Error processing row ${rowIndex + 1}:`, error);
        if (errors.length < MAX_ERRORS) {
          errors.push(`Fila ${rowIndex + 1}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
      }
    }

    // Calculate batch completion status
    const nextBatchStart = batchStart + batchSize;
    const batchComplete = !isBatchMode || nextBatchStart >= totalDataRows;
    const progressPercentage = isBatchMode 
      ? Math.round((Math.min(batchStart + batchSize, totalDataRows) / totalDataRows) * 100)
      : 100;

    const result: ProcessingResult = {
      success: errors.length === 0,
      processed: processedCount,
      created: createdMesas,
      updated: updatedMesas,
      errors: errors.slice(0, MAX_ERRORS),
      batchComplete,
      currentBatch: isBatchMode ? currentBatch : 1,
      totalBatches: isBatchMode ? totalBatches : 1,
      nextBatchStart: batchComplete ? undefined : nextBatchStart,
      progressPercentage,
      totalRows: totalDataRows
    };

    console.log(`✅ Batch ${currentBatch}/${totalBatches} completed: ${processedCount} processed, ${createdMesas} created, ${updatedMesas} updated`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Fatal error:', error);
    return new Response(JSON.stringify({
      success: false,
      processed: 0,
      created: 0,
      updated: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    } as ProcessingResult), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});