
interface IndraRow {
  codmun: string;
  mesa: string;
  [partyName: string]: string | number;
}

export const parseExcelData = (csvText: string): IndraRow[] => {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows: IndraRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    if (values.length !== headers.length) continue;

    // Initialize row with required properties
    const row: Partial<IndraRow> = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index];
    });

    // Check if required properties exist
    if (row.codmun && row.mesa) {
      rows.push(row as IndraRow);
    }
  }

  return rows;
};

export const extractMesaInfo = (mesaString: string) => {
  // Format: "01001A" -> district: "01", section: "001", table: "A"
  const match = mesaString.match(/^(\d{2})(\d{3})([A-Z])$/);
  if (!match) {
    throw new Error(`Invalid mesa format: ${mesaString}`);
  }
  
  return {
    district: match[1],
    section: match[2],
    table_letter: match[3]
  };
};
