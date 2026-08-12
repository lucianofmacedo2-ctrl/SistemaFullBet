import ExcelJS from 'exceljs';

export interface ParsedTeamRow {
  rowIndex: number;
  time: string;
  estadio: string;
  urlEscudo: string;
  isValid: boolean;
  validationError?: string;
}

export interface ParsedMatchRow {
  rowIndex: number;
  matchDate: string;
  countryName: string;
  leagueName: string;
  homeTeamName: string;
  awayTeamName: string;
  round: string;
  stadium: string;
  referee: string;
  notes: string;
  oddHomeFT?: number | null;
  oddDrawFT?: number | null;
  oddAwayFT?: number | null;
  oddOver25FT?: number | null;
  oddUnder25FT?: number | null;
  oddBttsFT?: number | null;
  oddHomeHT?: number | null;
  oddDrawHT?: number | null;
  oddAwayHT?: number | null;
  oddOver05HT?: number | null;
  oddUnder05HT?: number | null;
  oddBttsHT?: number | null;
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
      if (typeof cell.value === 'object') {
        const obj = cell.value as Record<string, any>;
        if ('hyperlink' in obj) {
          return String(obj.hyperlink || obj.text || '').trim();
        }
        if ('text' in obj) {
          return String(obj.text || '').trim();
        }
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

/**
 * Downloads a pre-formatted Excel template for Future Matches (.xlsx)
 */
export async function downloadMatchImportTemplate() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Jogos_Futuros');

  worksheet.columns = [
    { header: 'Data_Hora', key: 'matchDate', width: 20 },
    { header: 'Pais', key: 'countryName', width: 18 },
    { header: 'Liga', key: 'leagueName', width: 24 },
    { header: 'Mandante', key: 'homeTeamName', width: 22 },
    { header: 'Visitante', key: 'awayTeamName', width: 22 },
    { header: 'Rodada', key: 'round', width: 16 },
    { header: 'Estadio', key: 'stadium', width: 22 },
    { header: 'Arbitro', key: 'referee', width: 22 },
    { header: 'Observacoes', key: 'notes', width: 24 },
    { header: 'Odd_Home_FT', key: 'oddHomeFT', width: 14 },
    { header: 'Odd_Draw_FT', key: 'oddDrawFT', width: 14 },
    { header: 'Odd_Away_FT', key: 'oddAwayFT', width: 14 },
    { header: 'Odd_Over25_FT', key: 'oddOver25FT', width: 15 },
    { header: 'Odd_Under25_FT', key: 'oddUnder25FT', width: 15 },
    { header: 'Odd_BTTS_FT', key: 'oddBttsFT', width: 14 },
    { header: 'Odd_Home_HT', key: 'oddHomeHT', width: 14 },
    { header: 'Odd_Draw_HT', key: 'oddDrawHT', width: 14 },
    { header: 'Odd_Away_HT', key: 'oddAwayHT', width: 14 },
    { header: 'Odd_Over05_HT', key: 'oddOver05HT', width: 15 },
    { header: 'Odd_Under05_HT', key: 'oddUnder05HT', width: 15 },
    { header: 'Odd_BTTS_HT', key: 'oddBttsHT', width: 14 },
  ];

  // Header styling with brand blue #2C3EC4
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2C3EC4' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Sample data rows
  worksheet.addRows([
    {
      matchDate: '15/09/2026 16:00',
      countryName: 'Brasil',
      leagueName: 'Brasileirão Série A',
      homeTeamName: 'Flamengo',
      awayTeamName: 'Palmeiras',
      round: 'Rodada 25',
      stadium: 'Maracanã',
      referee: 'Wilton Pereira Sampaio',
      notes: 'Jogo decisivo pelo título',
      oddHomeFT: 2.10,
      oddDrawFT: 3.30,
      oddAwayFT: 3.50,
      oddOver25FT: 1.95,
      oddUnder25FT: 1.85,
      oddBttsFT: 1.80,
      oddHomeHT: 2.70,
      oddDrawHT: 2.10,
      oddAwayHT: 4.00,
      oddOver05HT: 1.40,
      oddUnder05HT: 2.70,
      oddBttsHT: 4.50,
    },
    {
      matchDate: '16/09/2026 21:00',
      countryName: 'Espanha',
      leagueName: 'La Liga',
      homeTeamName: 'Real Madrid',
      awayTeamName: 'Barcelona',
      round: 'Rodada 10',
      stadium: 'Santiago Bernabéu',
      referee: 'Mateu Lahoz',
      notes: 'El Clásico',
      oddHomeFT: 2.20,
      oddDrawFT: 3.40,
      oddAwayFT: 3.20,
      oddOver25FT: 1.80,
      oddUnder25FT: 2.00,
      oddBttsFT: 1.65,
      oddHomeHT: 2.80,
      oddDrawHT: 2.20,
      oddAwayHT: 3.80,
      oddOver05HT: 1.35,
      oddUnder05HT: 3.00,
      oddBttsHT: 4.00,
    },
    {
      matchDate: '18/09/2026 16:00',
      countryName: 'Inglaterra',
      leagueName: 'Premier League',
      homeTeamName: 'Arsenal',
      awayTeamName: 'Chelsea',
      round: 'Rodada 8',
      stadium: 'Emirates Stadium',
      referee: 'Anthony Taylor',
      notes: 'Derby de Londres',
      oddHomeFT: 1.90,
      oddDrawFT: 3.50,
      oddAwayFT: 4.20,
      oddOver25FT: 1.85,
      oddUnder25FT: 1.95,
      oddBttsFT: 1.75,
      oddHomeHT: 2.50,
      oddDrawHT: 2.20,
      oddAwayHT: 4.50,
      oddOver05HT: 1.38,
      oddUnder05HT: 2.80,
      oddBttsHT: 4.20,
    },
  ]);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Modelo_Cadastro_Jogos_Futuros_FUTDB4.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parse an Excel file (.xlsx) or CSV file into future match rows
 */
export async function parseMatchExcelOrCsvFile(file: File): Promise<ParsedMatchRow[]> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.csv') || file.type === 'text/csv') {
    return parseMatchCsvFile(file);
  }

  return parseMatchXlsxFile(file);
}

async function parseMatchXlsxFile(file: File): Promise<ParsedMatchRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('O arquivo Excel está vazio ou não contém planilhas.');
  }

  const rows: ParsedMatchRow[] = [];

  const getVal = (cell: any): string => {
    if (!cell || cell.value === null || cell.value === undefined) return '';
    const val = cell.value;

    // Handle Date object from Excel
    if (val instanceof Date) {
      if (isNaN(val.getTime())) return '';
      const day = String(val.getDate()).padStart(2, '0');
      const month = String(val.getMonth() + 1).padStart(2, '0');
      const year = val.getFullYear();
      const hours = String(val.getHours()).padStart(2, '0');
      const mins = String(val.getMinutes()).padStart(2, '0');
      if (hours === '00' && mins === '00') {
        return `${day}/${month}/${year}`;
      }
      return `${day}/${month}/${year} ${hours}:${mins}`;
    }

    if (typeof val === 'object') {
      if ('richText' in val && Array.isArray(val.richText)) {
        return val.richText.map((r: any) => r.text || '').join('').trim();
      }
      if ('hyperlink' in val) {
        return String(val.text || val.hyperlink || '').trim();
      }
      if ('result' in val) {
        if (val.result instanceof Date) {
          const d = val.result;
          if (isNaN(d.getTime())) return '';
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          const hours = String(d.getHours()).padStart(2, '0');
          const mins = String(d.getMinutes()).padStart(2, '0');
          return `${day}/${month}/${year} ${hours}:${mins}`;
        }
        if (val.result !== null && val.result !== undefined) {
          return String(val.result).trim();
        }
      }
      if ('text' in val) {
        return String(val.text || '').trim();
      }
    }

    // Try formatted cell.text if string
    if (cell.text && typeof cell.text === 'string' && cell.text.trim() && cell.text !== '[object Object]') {
      return cell.text.trim();
    }

    return String(val).trim();
  };

  const parseNum = (cell: any): number | null => {
    const s = getVal(cell);
    if (!s) return null;
    const n = parseFloat(s.replace(',', '.'));
    return isNaN(n) ? null : n;
  };

  let colMap: Record<string, number> = {};
  let headerRowIndex = -1;

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    // Detect header row dynamically
    if (headerRowIndex === -1) {
      let containsHeaderKeywords = false;

      row.eachCell((cell, colNumber) => {
        const val = normalizeHeader(getVal(cell));

        // Prioritize Odds headers FIRST to avoid matching 'home'/'mandante' in 'odd_home_ft'
        if (val.includes('ft') || val.includes('ht') || val.includes('odd')) {
          containsHeaderKeywords = true;
          if (val.includes('home_ft') || val.includes('mandante_ft') || val.includes('1_ft')) colMap.oddHomeFT = colNumber;
          else if (val.includes('draw_ft') || val.includes('empate_ft') || val.includes('x_ft')) colMap.oddDrawFT = colNumber;
          else if (val.includes('away_ft') || val.includes('visitante_ft') || val.includes('2_ft')) colMap.oddAwayFT = colNumber;
          else if (val.includes('over25_ft') || val.includes('over2.5_ft') || val.includes('over_25_ft')) colMap.oddOver25FT = colNumber;
          else if (val.includes('under25_ft') || val.includes('under2.5_ft') || val.includes('under_25_ft')) colMap.oddUnder25FT = colNumber;
          else if (val.includes('btts_ft') || val.includes('ambos_ft') || val.includes('ambas_ft')) colMap.oddBttsFT = colNumber;
          else if (val.includes('home_ht') || val.includes('mandante_ht') || val.includes('1_ht')) colMap.oddHomeHT = colNumber;
          else if (val.includes('draw_ht') || val.includes('empate_ht') || val.includes('x_ht')) colMap.oddDrawHT = colNumber;
          else if (val.includes('away_ht') || val.includes('visitante_ht') || val.includes('2_ht')) colMap.oddAwayHT = colNumber;
          else if (val.includes('over05_ht') || val.includes('over0.5_ht') || val.includes('over_05_ht')) colMap.oddOver05HT = colNumber;
          else if (val.includes('under05_ht') || val.includes('under0.5_ht') || val.includes('under_05_ht')) colMap.oddUnder05HT = colNumber;
          else if (val.includes('btts_ht') || val.includes('ambos_ht') || val.includes('ambas_ht')) colMap.oddBttsHT = colNumber;
        } else if (val.includes('data') || val.includes('date') || val.includes('horar') || val.includes('time_jogo')) {
          containsHeaderKeywords = true;
          colMap.matchDate = colNumber;
        } else if (val.includes('pais') || val.includes('country') || val.includes('nacao')) {
          containsHeaderKeywords = true;
          colMap.countryName = colNumber;
        } else if (val.includes('liga') || val.includes('league') || val.includes('campeonato') || val.includes('torneio')) {
          containsHeaderKeywords = true;
          colMap.leagueName = colNumber;
        } else if (val.includes('mandante') || val === 'home' || val.includes('time_mandante') || val.includes('casa')) {
          containsHeaderKeywords = true;
          colMap.homeTeamName = colNumber;
        } else if (val.includes('visitante') || val === 'away' || val.includes('time_visitante') || val.includes('fora')) {
          containsHeaderKeywords = true;
          colMap.awayTeamName = colNumber;
        } else if (val.includes('rodada') || val.includes('round')) {
          containsHeaderKeywords = true;
          colMap.round = colNumber;
        } else if (val.includes('estadio') || val.includes('arena') || val.includes('stadium') || val.includes('campo')) {
          containsHeaderKeywords = true;
          colMap.stadium = colNumber;
        } else if (val.includes('arbitro') || val.includes('referee') || val.includes('juiz')) {
          containsHeaderKeywords = true;
          colMap.referee = colNumber;
        } else if (val.includes('obs') || val.includes('note') || val.includes('observa')) {
          containsHeaderKeywords = true;
          colMap.notes = colNumber;
        }
      });

      // If we identified this as header row (or reached row 1)
      if (containsHeaderKeywords || rowNumber === 1) {
        headerRowIndex = rowNumber;

        // Apply column position defaults if specific headers weren't found
        if (!colMap.matchDate) colMap.matchDate = 1;
        if (!colMap.countryName) colMap.countryName = 2;
        if (!colMap.leagueName) colMap.leagueName = 3;
        if (!colMap.homeTeamName) colMap.homeTeamName = 4;
        if (!colMap.awayTeamName) colMap.awayTeamName = 5;
        if (!colMap.round) colMap.round = 6;
        if (!colMap.stadium) colMap.stadium = 7;
        if (!colMap.referee) colMap.referee = 8;
        if (!colMap.notes) colMap.notes = 9;
        if (!colMap.oddHomeFT) colMap.oddHomeFT = 10;
        if (!colMap.oddDrawFT) colMap.oddDrawFT = 11;
        if (!colMap.oddAwayFT) colMap.oddAwayFT = 12;
        if (!colMap.oddOver25FT) colMap.oddOver25FT = 13;
        if (!colMap.oddUnder25FT) colMap.oddUnder25FT = 14;
        if (!colMap.oddBttsFT) colMap.oddBttsFT = 15;
        if (!colMap.oddHomeHT) colMap.oddHomeHT = 16;
        if (!colMap.oddDrawHT) colMap.oddDrawHT = 17;
        if (!colMap.oddAwayHT) colMap.oddAwayHT = 18;
        if (!colMap.oddOver05HT) colMap.oddOver05HT = 19;
        if (!colMap.oddUnder05HT) colMap.oddUnder05HT = 20;
        if (!colMap.oddBttsHT) colMap.oddBttsHT = 21;
        return;
      }
    }

    // Skip the header row itself
    if (rowNumber === headerRowIndex) {
      return;
    }

    const matchDateStr = getVal(row.getCell(colMap.matchDate));
    const countryName = getVal(row.getCell(colMap.countryName));
    const leagueName = getVal(row.getCell(colMap.leagueName));
    const homeTeamName = getVal(row.getCell(colMap.homeTeamName));
    const awayTeamName = getVal(row.getCell(colMap.awayTeamName));
    const round = getVal(row.getCell(colMap.round)) || 'Rodada 1';
    const stadium = getVal(row.getCell(colMap.stadium));
    const referee = getVal(row.getCell(colMap.referee));
    const notes = getVal(row.getCell(colMap.notes));

    if (!countryName && !leagueName && !homeTeamName && !awayTeamName) {
      return;
    }

    let isValid = true;
    let validationError = '';

    if (!countryName) {
      isValid = false;
      validationError = 'País é obrigatório.';
    } else if (!leagueName) {
      isValid = false;
      validationError = 'Liga é obrigatória.';
    } else if (!homeTeamName) {
      isValid = false;
      validationError = 'Time Mandante é obrigatório.';
    } else if (!awayTeamName) {
      isValid = false;
      validationError = 'Time Visitante é obrigatório.';
    } else if (homeTeamName.toLowerCase().trim() === awayTeamName.toLowerCase().trim()) {
      isValid = false;
      validationError = 'Mandante e Visitante não podem ser iguais.';
    }

    rows.push({
      rowIndex: rowNumber,
      matchDate: matchDateStr,
      countryName,
      leagueName,
      homeTeamName,
      awayTeamName,
      round,
      stadium,
      referee,
      notes,
      oddHomeFT: parseNum(row.getCell(colMap.oddHomeFT)),
      oddDrawFT: parseNum(row.getCell(colMap.oddDrawFT)),
      oddAwayFT: parseNum(row.getCell(colMap.oddAwayFT)),
      oddOver25FT: parseNum(row.getCell(colMap.oddOver25FT)),
      oddUnder25FT: parseNum(row.getCell(colMap.oddUnder25FT)),
      oddBttsFT: parseNum(row.getCell(colMap.oddBttsFT)),
      oddHomeHT: parseNum(row.getCell(colMap.oddHomeHT)),
      oddDrawHT: parseNum(row.getCell(colMap.oddDrawHT)),
      oddAwayHT: parseNum(row.getCell(colMap.oddAwayHT)),
      oddOver05HT: parseNum(row.getCell(colMap.oddOver05HT)),
      oddUnder05HT: parseNum(row.getCell(colMap.oddUnder05HT)),
      oddBttsHT: parseNum(row.getCell(colMap.oddBttsHT)),
      isValid,
      validationError: isValid ? undefined : validationError,
    });
  });

  return rows;
}

async function parseMatchCsvFile(file: File): Promise<ParsedMatchRow[]> {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);

  if (lines.length <= 1) return [];

  const delimiter = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(delimiter).map(h => normalizeHeader(h));

  const getIdx = (keywords: string[], fallback: number) => {
    const idx = headers.findIndex(h => keywords.some(k => h.includes(k)));
    return idx !== -1 ? idx : fallback;
  };

  const matchDateIdx = getIdx(['data', 'date', 'horar'], 0);
  const countryNameIdx = getIdx(['pais', 'country'], 1);
  const leagueNameIdx = getIdx(['liga', 'league', 'campeonato'], 2);
  const homeTeamNameIdx = getIdx(['mandante', 'home'], 3);
  const awayTeamNameIdx = getIdx(['visitante', 'away'], 4);
  const roundIdx = getIdx(['rodada', 'round'], 5);
  const stadiumIdx = getIdx(['estadio', 'arena'], 6);
  const refereeIdx = getIdx(['arbitro', 'juiz'], 7);
  const notesIdx = getIdx(['obs', 'note'], 8);

  const oddHomeFTIdx = getIdx(['home_ft', 'mandante_ft', '1_ft'], 9);
  const oddDrawFTIdx = getIdx(['draw_ft', 'empate_ft', 'x_ft'], 10);
  const oddAwayFTIdx = getIdx(['away_ft', 'visitante_ft', '2_ft'], 11);
  const oddOver25FTIdx = getIdx(['over25_ft', 'over2.5_ft'], 12);
  const oddUnder25FTIdx = getIdx(['under25_ft', 'under2.5_ft'], 13);
  const oddBttsFTIdx = getIdx(['btts_ft', 'ambos_ft'], 14);

  const oddHomeHTIdx = getIdx(['home_ht', 'mandante_ht', '1_ht'], 15);
  const oddDrawHTIdx = getIdx(['draw_ht', 'empate_ht', 'x_ht'], 16);
  const oddAwayHTIdx = getIdx(['away_ht', 'visitante_ht', '2_ht'], 17);
  const oddOver05HTIdx = getIdx(['over05_ht', 'over0.5_ht'], 18);
  const oddUnder05HTIdx = getIdx(['under05_ht', 'under0.5_ht'], 19);
  const oddBttsHTIdx = getIdx(['btts_ht', 'ambos_ht'], 20);

  const rows: ParsedMatchRow[] = [];

  const parseNum = (str: string | undefined): number | null => {
    if (!str) return null;
    const n = parseFloat(str.replace(',', '.'));
    return isNaN(n) ? null : n;
  };

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map(c => c.replace(/^["']|["']$/g, '').trim());

    const matchDateStr = cols[matchDateIdx] || '';
    const countryName = cols[countryNameIdx] || '';
    const leagueName = cols[leagueNameIdx] || '';
    const homeTeamName = cols[homeTeamNameIdx] || '';
    const awayTeamName = cols[awayTeamNameIdx] || '';
    const round = cols[roundIdx] || 'Rodada 1';
    const stadium = cols[stadiumIdx] || '';
    const referee = cols[refereeIdx] || '';
    const notes = cols[notesIdx] || '';

    if (!countryName && !leagueName && !homeTeamName && !awayTeamName) continue;

    let isValid = true;
    let validationError = '';

    if (!countryName) {
      isValid = false;
      validationError = 'País é obrigatório.';
    } else if (!leagueName) {
      isValid = false;
      validationError = 'Liga é obrigatória.';
    } else if (!homeTeamName) {
      isValid = false;
      validationError = 'Time Mandante é obrigatório.';
    } else if (!awayTeamName) {
      isValid = false;
      validationError = 'Time Visitante é obrigatório.';
    } else if (homeTeamName.toLowerCase() === awayTeamName.toLowerCase()) {
      isValid = false;
      validationError = 'Mandante e Visitante não podem ser iguais.';
    }

    rows.push({
      rowIndex: i + 1,
      matchDate: matchDateStr,
      countryName,
      leagueName,
      homeTeamName,
      awayTeamName,
      round,
      stadium,
      referee,
      notes,
      oddHomeFT: parseNum(cols[oddHomeFTIdx]),
      oddDrawFT: parseNum(cols[oddDrawFTIdx]),
      oddAwayFT: parseNum(cols[oddAwayFTIdx]),
      oddOver25FT: parseNum(cols[oddOver25FTIdx]),
      oddUnder25FT: parseNum(cols[oddUnder25FTIdx]),
      oddBttsFT: parseNum(cols[oddBttsFTIdx]),
      oddHomeHT: parseNum(cols[oddHomeHTIdx]),
      oddDrawHT: parseNum(cols[oddDrawHTIdx]),
      oddAwayHT: parseNum(cols[oddAwayHTIdx]),
      oddOver05HT: parseNum(cols[oddOver05HTIdx]),
      oddUnder05HT: parseNum(cols[oddUnder05HTIdx]),
      oddBttsHT: parseNum(cols[oddBttsHTIdx]),
      isValid,
      validationError: isValid ? undefined : validationError,
    });
  }

  return rows;
}
