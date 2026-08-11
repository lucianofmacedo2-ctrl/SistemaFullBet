import ExcelJS from 'exceljs';

export interface ParsedTeamRow {
  rowIndex: number;
  time: string;
  estadio: string;
  urlEscudo: string;
  isValid: boolean;
  validationError?: string;
}

/**
 * Normalizes header string to match expected column names regardless of accents or casing
 */
function normalizeHeader(header: string): string {
  return header
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Parse an Excel file (.xlsx, .xls) or CSV file into team rows
 */
export async function parseExcelOrCsvFile(file: File): Promise<ParsedTeamRow[]> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.csv') || file.type === 'text/csv') {
    return parseCsvFile(file);
  }

  return parseXlsxFile(file);
}

async function parseXlsxFile(file: File): Promise<ParsedTeamRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('O arquivo Excel está vazio ou não contém planilhas.');
  }

  const rows: ParsedTeamRow[] = [];
  let timeColIdx = -1;
  let estadioColIdx = -1;
  let escudoColIdx = -1;

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    // Header row detection
    if (rowNumber === 1) {
      row.eachCell((cell, colNumber) => {
        const val = normalizeHeader(cell.text || String(cell.value || ''));
        if (['times', 'time', 'equipe', 'equipes', 'nome', 'nometime'].some(k => val.includes(k))) {
          timeColIdx = colNumber;
        } else if (['estadio', 'estadios', 'arena', 'campo'].some(k => val.includes(k))) {
          estadioColIdx = colNumber;
        } else if (['escudo', 'logo', 'url_escudo', 'urlescudo', 'url', 'imagem', 'bandeira'].some(k => val.includes(k))) {
          escudoColIdx = colNumber;
        }
      });

      // Fallbacks if header names weren't exact matches
      if (timeColIdx === -1) timeColIdx = 1;
      if (estadioColIdx === -1) estadioColIdx = 2;
      if (escudoColIdx === -1) escudoColIdx = 3;

      return;
    }

    // Data rows
    const getCellValue = (colIdx: number): string => {
      if (colIdx <= 0) return '';
      const cell = row.getCell(colIdx);
      if (!cell || cell.value === null || cell.value === undefined) return '';
      if (typeof cell.value === 'object' && 'text' in cell.value) {
        return String(cell.value.text || '').trim();
      }
      if (typeof cell.value === 'object' && 'hyperlink' in cell.value) {
        return String(cell.value.hyperlink || cell.value.text || '').trim();
      }
      return String(cell.value).trim();
    };

    const teamName = getCellValue(timeColIdx);
    const estadio = getCellValue(estadioColIdx);
    const urlEscudo = getCellValue(escudoColIdx);

    if (!teamName && !estadio && !urlEscudo) {
      return; // Skip empty rows
    }

    const isValid = teamName.length >= 2;
    rows.push({
      rowIndex: rowNumber,
      time: teamName,
      estadio,
      urlEscudo,
      isValid,
      validationError: isValid ? undefined : 'Nome do time é obrigatório (min. 2 caracteres)',
    });
  });

  return rows;
}

async function parseCsvFile(file: File): Promise<ParsedTeamRow[]> {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);

  if (lines.length <= 1) {
    return [];
  }

  // Detect delimiter (comma or semicolon)
  const delimiter = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(delimiter).map(h => normalizeHeader(h));

  let timeColIdx = headers.findIndex(h => ['times', 'time', 'equipe', 'equipes', 'nome'].some(k => h.includes(k)));
  let estadioColIdx = headers.findIndex(h => ['estadio', 'estadios', 'arena'].some(k => h.includes(k)));
  let escudoColIdx = headers.findIndex(h => ['escudo', 'logo', 'url_escudo', 'urlescudo', 'url'].some(k => h.includes(k)));

  if (timeColIdx === -1) timeColIdx = 0;
  if (estadioColIdx === -1) estadioColIdx = 1;
  if (escudoColIdx === -1) escudoColIdx = 2;

  const rows: ParsedTeamRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map(c => c.replace(/^["']|["']$/g, '').trim());
    const teamName = cols[timeColIdx] || '';
    const estadio = cols[estadioColIdx] || '';
    const urlEscudo = cols[escudoColIdx] || '';

    if (!teamName && !estadio && !urlEscudo) continue;

    const isValid = teamName.length >= 2;
    rows.push({
      rowIndex: i + 1,
      time: teamName,
      estadio,
      urlEscudo,
      isValid,
      validationError: isValid ? undefined : 'Nome do time é obrigatório',
    });
  }

  return rows;
}

/**
 * Downloads a pre-formatted Excel template file (.xlsx)
 */
export async function downloadTeamImportTemplate(leagueName = 'Liga', season = '2026') {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Equipes');

  worksheet.columns = [
    { header: 'Times', key: 'time', width: 28 },
    { header: 'Estadio', key: 'estadio', width: 28 },
    { header: 'URL_escudo', key: 'urlEscudo', width: 50 },
  ];

  // Header styling
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF10B981' }, // Emerald green
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'left' };

  // Sample data
  worksheet.addRows([
    {
      time: 'Flamengo',
      estadio: 'Maracanã',
      urlEscudo: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Flamengo_braz_logo.svg',
    },
    {
      time: 'Palmeiras',
      estadio: 'Allianz Parque',
      urlEscudo: 'https://upload.wikimedia.org/wikipedia/commons/1/10/Palmeiras_logo.svg',
    },
    {
      time: 'São Paulo',
      estadio: 'Morumbis',
      urlEscudo: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Sao_Paulo_FC.svg',
    },
    {
      time: 'Real Madrid',
      estadio: 'Santiago Bernabéu',
      urlEscudo: 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Real_Madrid_CF.svg',
    },
  ]);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeLeague = leagueName.replace(/[^a-zA-Z0-9]/g, '_');
  a.download = `Modelo_Cadastro_Equipes_${safeLeague}_${season}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
