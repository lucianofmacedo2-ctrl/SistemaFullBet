import ExcelJS from 'exceljs';
import { Match, MatchStatus, MatchStats, MatchOdds } from '../types';

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

export interface ParsedMatchUpdateRow {
  rowIndex: number;
  matchId?: string; // ID_Jogo ex: "JOGO-001"
  matchDate: string;
  countryName: string;
  leagueName: string;
  homeTeamName: string;
  awayTeamName: string;
  round?: string;
  stadium?: string;
  referee?: string;
  status?: MatchStatus;
  notes?: string;

  // Placar e Gols
  homeScore?: number | null;
  awayScore?: number | null;
  halftimeHomeScore?: number | null;
  halftimeAwayScore?: number | null;
  goalMinutesHome?: string;
  goalMinutesAway?: string;
  firstGoalMinuteMatch?: number | null;
  firstGoalMinuteHome?: number | null;
  firstGoalMinuteAway?: number | null;

  // Cantos (Escanteios)
  cornersHomeFT?: number | null;
  cornersAwayFT?: number | null;
  cornersHomeHT?: number | null;
  cornersAwayHT?: number | null;

  // Posse (%)
  possessionHomeFT?: number | null;
  possessionAwayFT?: number | null;
  possessionHomeHT?: number | null;
  possessionAwayHT?: number | null;

  // Cartões Amarelos
  yellowCardsHomeFT?: number | null;
  yellowCardsAwayFT?: number | null;
  yellowCardsHomeHT?: number | null;
  yellowCardsAwayHT?: number | null;

  // Cartões Vermelhos
  redCardsHomeFT?: number | null;
  redCardsAwayFT?: number | null;
  redCardsHomeHT?: number | null;
  redCardsAwayHT?: number | null;

  // Finalizações Totais
  shotsHomeFT?: number | null;
  shotsAwayFT?: number | null;
  shotsHomeHT?: number | null;
  shotsAwayHT?: number | null;

  // Chutes no Alvo
  shotsOnTargetHomeFT?: number | null;
  shotsOnTargetAwayFT?: number | null;
  shotsOnTargetHomeHT?: number | null;
  shotsOnTargetAwayHT?: number | null;

  // Odds FT
  oddHomeFT?: number | null;
  oddDrawFT?: number | null;
  oddAwayFT?: number | null;
  oddOver25FT?: number | null;
  oddUnder25FT?: number | null;
  oddBttsFT?: number | null;

  // Odds HT
  oddHomeHT?: number | null;
  oddDrawHT?: number | null;
  oddAwayHT?: number | null;
  oddOver05HT?: number | null;
  oddUnder05HT?: number | null;
  oddBttsHT?: number | null;

  // Validation & Mapping
  matchedMatch?: Match;
  matchedMatchId?: string;
  isNewMatch?: boolean;
  isValid: boolean;
  validationError?: string;
  changedFields: string[];
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
 * Splits any date/time string into distinct Brazilian date (DD/MM/YYYY) and time (HH:mm) strings
 */
export function splitDateTimeForExcel(dateStr: string | null | undefined): { date: string; time: string } {
  if (!dateStr) return { date: '', time: '' };
  
  const str = dateStr.trim();
  let date = '';
  let time = '';

  // 1. Try ISO pattern YYYY-MM-DD or YYYY-MM-DDTHH:mm
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{1,2}):(\d{2}))?/);
  if (isoMatch) {
    const [, y, m, d, h, min] = isoMatch;
    date = `${d}/${m}/${y}`;
    if (h !== undefined && min !== undefined) {
      time = `${h.padStart(2, '0')}:${min}`;
    }
    return { date, time };
  }

  // 2. Try Brazilian pattern DD/MM/YYYY HH:mm or DD-MM-YYYY HH:mm
  const dmyMatch = str.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})(?:[T\s](\d{1,2}):(\d{2}))?/);
  if (dmyMatch) {
    const [, d, m, y, h, min] = dmyMatch;
    const fullYear = y.length === 2 ? `20${y}` : y;
    date = `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${fullYear}`;
    if (h !== undefined && min !== undefined) {
      time = `${h.padStart(2, '0')}:${min}`;
    }
    return { date, time };
  }

  // Fallback
  return { date: str, time: '' };
}

/**
 * Combines separate date and time values from Excel / CSV into a standardized ISO date string (YYYY-MM-DDTHH:mm:00)
 */
export function combineDateAndTime(dateVal: any, timeVal: any): string {
  let dateStr = '';
  let timeStr = '';

  // 1. Extract Date component
  if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
    const y = dateVal.getFullYear();
    const m = String(dateVal.getMonth() + 1).padStart(2, '0');
    const d = String(dateVal.getDate()).padStart(2, '0');
    dateStr = `${y}-${m}-${d}`;

    const h = String(dateVal.getHours()).padStart(2, '0');
    const min = String(dateVal.getMinutes()).padStart(2, '0');
    if (h !== '00' || min !== '00') {
      timeStr = `${h}:${min}`;
    }
  } else if (dateVal !== null && dateVal !== undefined) {
    const rawDate = String(dateVal).trim();
    if (rawDate) {
      const ymdMatch = rawDate.match(/^(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})/);
      if (ymdMatch) {
        dateStr = `${ymdMatch[1]}-${ymdMatch[2].padStart(2, '0')}-${ymdMatch[3].padStart(2, '0')}`;
      } else {
        const dmyMatch = rawDate.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
        if (dmyMatch) {
          const d = dmyMatch[1].padStart(2, '0');
          const m = dmyMatch[2].padStart(2, '0');
          const y = dmyMatch[3].length === 2 ? `20${dmyMatch[3]}` : dmyMatch[3];
          dateStr = `${y}-${m}-${d}`;
        }
      }

      const embeddedTimeMatch = rawDate.match(/[T\s](\d{1,2}):(\d{2})/);
      if (embeddedTimeMatch) {
        timeStr = `${embeddedTimeMatch[1].padStart(2, '0')}:${embeddedTimeMatch[2]}`;
      }
    }
  }

  // 2. Extract Time component (overrides embedded time if present)
  if (timeVal instanceof Date && !isNaN(timeVal.getTime())) {
    const h = String(timeVal.getHours()).padStart(2, '0');
    const min = String(timeVal.getMinutes()).padStart(2, '0');
    timeStr = `${h}:${min}`;
  } else if (typeof timeVal === 'number' && !isNaN(timeVal)) {
    if (timeVal > 0 && timeVal < 1) {
      const totalMinutes = Math.round(timeVal * 24 * 60);
      const h = String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0');
      const min = String(totalMinutes % 60).padStart(2, '0');
      timeStr = `${h}:${min}`;
    } else if (timeVal >= 1 && timeVal <= 24) {
      const h = String(Math.floor(timeVal)).padStart(2, '0');
      const min = String(Math.round((timeVal % 1) * 60)).padStart(2, '0');
      timeStr = `${h}:${min}`;
    }
  } else if (timeVal !== null && timeVal !== undefined) {
    const rawTime = String(timeVal).trim();
    if (rawTime) {
      const tmMatch = rawTime.match(/(\d{1,2})[:hH](\d{2})/);
      if (tmMatch) {
        timeStr = `${tmMatch[1].padStart(2, '0')}:${tmMatch[2]}`;
      } else {
        const hourOnlyMatch = rawTime.match(/^(\d{1,2})$/);
        if (hourOnlyMatch) {
          timeStr = `${hourOnlyMatch[1].padStart(2, '0')}:00`;
        }
      }
    }
  }

  if (!dateStr) {
    if (dateVal) {
      return String(dateVal).trim();
    }
    return '';
  }

  const finalTime = timeStr || '00:00';
  return `${dateStr}T${finalTime}:00`;
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
 * Downloads a pre-formatted Excel template for Future Matches (.xlsx) with distinct Date and Time columns
 */
export async function downloadMatchImportTemplate() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Jogos_Futuros');

  worksheet.columns = [
    { header: 'Data', key: 'matchDate', width: 15 },
    { header: 'Hora', key: 'matchTime', width: 12 },
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

  // Sample data rows with separated Date and Time
  worksheet.addRows([
    {
      matchDate: '15/09/2026',
      matchTime: '16:00',
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
      matchDate: '16/09/2026',
      matchTime: '21:00',
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
      matchDate: '18/09/2026',
      matchTime: '16:00',
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
  a.download = `Modelo_Cadastro_Jogos_Futuros_FUTLFM2.xlsx`;
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
        } else if (val === 'hora' || val.includes('horario') || val === 'hora_jogo' || val === 'time') {
          containsHeaderKeywords = true;
          colMap.matchTime = colNumber;
        } else if (val === 'data' || val === 'date' || val === 'dia' || val === 'data_jogo' || val.includes('data_hora')) {
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
        if (!colMap.matchTime && !colMap.countryName) {
          // If matchTime not explicitly mapped by header name
          // check if second column is Hora
        }
        if (!colMap.countryName) colMap.countryName = colMap.matchTime ? 3 : 2;
        return;
      }
    }

    // Skip the header row itself
    if (rowNumber === headerRowIndex) {
      return;
    }

    const rawDateCell = colMap.matchDate ? row.getCell(colMap.matchDate) : null;
    const rawTimeCell = colMap.matchTime ? row.getCell(colMap.matchTime) : null;
    const dateVal = rawDateCell ? (rawDateCell.value instanceof Date ? rawDateCell.value : getVal(rawDateCell)) : '';
    const timeVal = rawTimeCell ? (rawTimeCell.value instanceof Date ? rawTimeCell.value : getVal(rawTimeCell)) : '';

    const matchDateStr = combineDateAndTime(dateVal, timeVal);
    const countryName = colMap.countryName ? getVal(row.getCell(colMap.countryName)) : '';
    const leagueName = colMap.leagueName ? getVal(row.getCell(colMap.leagueName)) : '';
    const homeTeamName = colMap.homeTeamName ? getVal(row.getCell(colMap.homeTeamName)) : '';
    const awayTeamName = colMap.awayTeamName ? getVal(row.getCell(colMap.awayTeamName)) : '';
    const round = colMap.round ? getVal(row.getCell(colMap.round)) : 'Rodada 1';
    const stadium = colMap.stadium ? getVal(row.getCell(colMap.stadium)) : '';
    const referee = colMap.referee ? getVal(row.getCell(colMap.referee)) : '';
    const notes = colMap.notes ? getVal(row.getCell(colMap.notes)) : '';

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
      round: round || 'Rodada 1',
      stadium,
      referee,
      notes,
      oddHomeFT: colMap.oddHomeFT ? parseNum(row.getCell(colMap.oddHomeFT)) : null,
      oddDrawFT: colMap.oddDrawFT ? parseNum(row.getCell(colMap.oddDrawFT)) : null,
      oddAwayFT: colMap.oddAwayFT ? parseNum(row.getCell(colMap.oddAwayFT)) : null,
      oddOver25FT: colMap.oddOver25FT ? parseNum(row.getCell(colMap.oddOver25FT)) : null,
      oddUnder25FT: colMap.oddUnder25FT ? parseNum(row.getCell(colMap.oddUnder25FT)) : null,
      oddBttsFT: colMap.oddBttsFT ? parseNum(row.getCell(colMap.oddBttsFT)) : null,
      oddHomeHT: colMap.oddHomeHT ? parseNum(row.getCell(colMap.oddHomeHT)) : null,
      oddDrawHT: colMap.oddDrawHT ? parseNum(row.getCell(colMap.oddDrawHT)) : null,
      oddAwayHT: colMap.oddAwayHT ? parseNum(row.getCell(colMap.oddAwayHT)) : null,
      oddOver05HT: colMap.oddOver05HT ? parseNum(row.getCell(colMap.oddOver05HT)) : null,
      oddUnder05HT: colMap.oddUnder05HT ? parseNum(row.getCell(colMap.oddUnder05HT)) : null,
      oddBttsHT: colMap.oddBttsHT ? parseNum(row.getCell(colMap.oddBttsHT)) : null,
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

  const getIdx = (keywords: string[], fallback = -1) => {
    const idx = headers.findIndex(h => keywords.some(k => h === k || h.includes(k)));
    return idx !== -1 ? idx : fallback;
  };

  const matchDateIdx = getIdx(['data', 'date', 'dia', 'data_hora']);
  const matchTimeIdx = getIdx(['hora', 'horario', 'hora_jogo', 'time']);
  const countryNameIdx = getIdx(['pais', 'country']);
  const leagueNameIdx = getIdx(['liga', 'league', 'campeonato']);
  const homeTeamNameIdx = getIdx(['mandante', 'home']);
  const awayTeamNameIdx = getIdx(['visitante', 'away']);
  const roundIdx = getIdx(['rodada', 'round']);
  const stadiumIdx = getIdx(['estadio', 'arena']);
  const refereeIdx = getIdx(['arbitro', 'juiz']);
  const notesIdx = getIdx(['obs', 'note']);

  const oddHomeFTIdx = getIdx(['home_ft', 'mandante_ft', '1_ft']);
  const oddDrawFTIdx = getIdx(['draw_ft', 'empate_ft', 'x_ft']);
  const oddAwayFTIdx = getIdx(['away_ft', 'visitante_ft', '2_ft']);
  const oddOver25FTIdx = getIdx(['over25_ft', 'over2.5_ft']);
  const oddUnder25FTIdx = getIdx(['under25_ft', 'under2.5_ft']);
  const oddBttsFTIdx = getIdx(['btts_ft', 'ambos_ft']);

  const oddHomeHTIdx = getIdx(['home_ht', 'mandante_ht', '1_ht']);
  const oddDrawHTIdx = getIdx(['draw_ht', 'empate_ht', 'x_ht']);
  const oddAwayHTIdx = getIdx(['away_ht', 'visitante_ht', '2_ht']);
  const oddOver05HTIdx = getIdx(['over05_ht', 'over0.5_ht']);
  const oddUnder05HTIdx = getIdx(['under05_ht', 'under0.5_ht']);
  const oddBttsHTIdx = getIdx(['btts_ht', 'ambos_ht']);

  const rows: ParsedMatchRow[] = [];

  const parseNum = (str: string | undefined): number | null => {
    if (!str) return null;
    const n = parseFloat(str.replace(',', '.'));
    return isNaN(n) ? null : n;
  };

  const getCol = (cols: string[], idx: number): string => {
    if (idx === -1 || !cols[idx]) return '';
    return cols[idx].replace(/^["']|["']$/g, '').trim();
  };

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map(c => c.replace(/^["']|["']$/g, '').trim());

    const dateVal = matchDateIdx !== -1 ? getCol(cols, matchDateIdx) : getCol(cols, 0);
    const timeVal = matchTimeIdx !== -1 ? getCol(cols, matchTimeIdx) : '';
    const matchDateStr = combineDateAndTime(dateVal, timeVal);

    const countryName = countryNameIdx !== -1 ? getCol(cols, countryNameIdx) : getCol(cols, 1);
    const leagueName = leagueNameIdx !== -1 ? getCol(cols, leagueNameIdx) : getCol(cols, 2);
    const homeTeamName = homeTeamNameIdx !== -1 ? getCol(cols, homeTeamNameIdx) : getCol(cols, 3);
    const awayTeamName = awayTeamNameIdx !== -1 ? getCol(cols, awayTeamNameIdx) : getCol(cols, 4);
    const round = roundIdx !== -1 ? getCol(cols, roundIdx) : 'Rodada 1';
    const stadium = stadiumIdx !== -1 ? getCol(cols, stadiumIdx) : '';
    const referee = refereeIdx !== -1 ? getCol(cols, refereeIdx) : '';
    const notes = notesIdx !== -1 ? getCol(cols, notesIdx) : '';

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
      round: round || 'Rodada 1',
      stadium,
      referee,
      notes,
      oddHomeFT: parseNum(getCol(cols, oddHomeFTIdx)),
      oddDrawFT: parseNum(getCol(cols, oddDrawFTIdx)),
      oddAwayFT: parseNum(getCol(cols, oddAwayFTIdx)),
      oddOver25FT: parseNum(getCol(cols, oddOver25FTIdx)),
      oddUnder25FT: parseNum(getCol(cols, oddUnder25FTIdx)),
      oddBttsFT: parseNum(getCol(cols, oddBttsFTIdx)),
      oddHomeHT: parseNum(getCol(cols, oddHomeHTIdx)),
      oddDrawHT: parseNum(getCol(cols, oddDrawHTIdx)),
      oddAwayHT: parseNum(getCol(cols, oddAwayHTIdx)),
      oddOver05HT: parseNum(getCol(cols, oddOver05HTIdx)),
      oddUnder05HT: parseNum(getCol(cols, oddUnder05HTIdx)),
      oddBttsHT: parseNum(getCol(cols, oddBttsHTIdx)),
      isValid,
      validationError: isValid ? undefined : validationError,
    });
  }

  return rows;
}

/**
 * Checks if a match is 100% complete with pre-match, scores and stats.
 */
export function isMatchComplete(match: Match): boolean {
  // Pre-match essentials
  if (!match.matchDate || !match.stadium || !match.round) return false;
  if (!match.odds || match.odds.homeFT == null || match.odds.drawFT == null || match.odds.awayFT == null) return false;

  // Final score
  if (match.homeScore === null || match.awayScore === null) return false;

  // Stats
  const st = match.stats;
  if (!st) return false;
  const hasSomeStats =
    (st.halftimeHomeScore != null && st.halftimeAwayScore != null) ||
    st.cornersHomeFT != null ||
    st.possessionHomeFT != null ||
    st.shotsHomeFT != null ||
    st.yellowCardsHomeFT != null ||
    Boolean(st.goalMinutesHome || st.goalMinutesAway);

  return hasSomeStats;
}

/**
 * Downloads an Excel spreadsheet containing matches (either only incomplete ones or all)
 * with all existing data pre-filled, ready for the user to complete and re-upload.
 */
export async function downloadIncompleteMatchesTemplate(
  matches: Match[],
  onlyIncomplete = true
) {
  const targetMatches = onlyIncomplete
    ? matches.filter(m => !isMatchComplete(m))
    : matches;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Atualizacao_Jogos');

  // Define columns with friendly headers
  worksheet.columns = [
    // 1. Identificação Geral
    { header: 'ID_Jogo', key: 'id', width: 14 },
    { header: 'Data', key: 'matchDate', width: 15 },
    { header: 'Hora', key: 'matchTime', width: 12 },
    { header: 'Pais', key: 'countryName', width: 16 },
    { header: 'Liga', key: 'leagueName', width: 22 },
    { header: 'Mandante', key: 'homeTeamName', width: 22 },
    { header: 'Visitante', key: 'awayTeamName', width: 22 },
    { header: 'Rodada', key: 'round', width: 14 },
    { header: 'Estadio', key: 'stadium', width: 20 },
    { header: 'Arbitro', key: 'referee', width: 20 },
    { header: 'Status', key: 'status', width: 15 },

    // 2. Placar & Minutos de Gols
    { header: 'Placar_Mandante_FT', key: 'homeScore', width: 18 },
    { header: 'Placar_Visitante_FT', key: 'awayScore', width: 18 },
    { header: 'Placar_Mandante_HT', key: 'halftimeHomeScore', width: 18 },
    { header: 'Placar_Visitante_HT', key: 'halftimeAwayScore', width: 18 },
    { header: 'Minutos_Gols_Mandante', key: 'goalMinutesHome', width: 24 },
    { header: 'Minutos_Gols_Visitante', key: 'goalMinutesAway', width: 24 },
    { header: 'Momento_1_Gol_Jogo', key: 'firstGoalMinuteMatch', width: 20 },
    { header: '1_Gol_Mandante', key: 'firstGoalMinuteHome', width: 18 },
    { header: '1_Gol_Visitante', key: 'firstGoalMinuteAway', width: 18 },

    // 3. Escanteios (Cantos)
    { header: 'Escanteios_Mandante_FT', key: 'cornersHomeFT', width: 22 },
    { header: 'Escanteios_Visitante_FT', key: 'cornersAwayFT', width: 22 },
    { header: 'Escanteios_Mandante_HT', key: 'cornersHomeHT', width: 22 },
    { header: 'Escanteios_Visitante_HT', key: 'cornersAwayHT', width: 22 },

    // 4. Posse de Bola (%)
    { header: 'Posse_Mandante_FT_%', key: 'possessionHomeFT', width: 20 },
    { header: 'Posse_Visitante_FT_%', key: 'possessionAwayFT', width: 20 },
    { header: 'Posse_Mandante_HT_%', key: 'possessionHomeHT', width: 20 },
    { header: 'Posse_Visitante_HT_%', key: 'possessionAwayHT', width: 20 },

    // 5. Cartões Amarelos & Vermelhos
    { header: 'Cartao_Amarelo_Mandante_FT', key: 'yellowCardsHomeFT', width: 25 },
    { header: 'Cartao_Amarelo_Visitante_FT', key: 'yellowCardsAwayFT', width: 25 },
    { header: 'Cartao_Amarelo_Mandante_HT', key: 'yellowCardsHomeHT', width: 25 },
    { header: 'Cartao_Amarelo_Visitante_HT', key: 'yellowCardsAwayHT', width: 25 },
    { header: 'Cartao_Vermelho_Mandante_FT', key: 'redCardsHomeFT', width: 25 },
    { header: 'Cartao_Vermelho_Visitante_FT', key: 'redCardsAwayFT', width: 25 },
    { header: 'Cartao_Vermelho_Mandante_HT', key: 'redCardsHomeHT', width: 25 },
    { header: 'Cartao_Vermelho_Visitante_HT', key: 'redCardsAwayHT', width: 25 },

    // 6. Finalizações e Chutes ao Gol
    { header: 'Finalizacoes_Mandante_FT', key: 'shotsHomeFT', width: 22 },
    { header: 'Finalizacoes_Visitante_FT', key: 'shotsAwayFT', width: 22 },
    { header: 'Finalizacoes_Mandante_HT', key: 'shotsHomeHT', width: 22 },
    { header: 'Finalizacoes_Visitante_HT', key: 'shotsAwayHT', width: 22 },
    { header: 'Chutes_Gol_Mandante_FT', key: 'shotsOnTargetHomeFT', width: 22 },
    { header: 'Chutes_Gol_Visitante_FT', key: 'shotsOnTargetAwayFT', width: 22 },
    { header: 'Chutes_Gol_Mandante_HT', key: 'shotsOnTargetHomeHT', width: 22 },
    { header: 'Chutes_Gol_Visitante_HT', key: 'shotsOnTargetAwayHT', width: 22 },

    // 7. Odds FT & HT
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

    // 8. Observações
    { header: 'Observacoes', key: 'notes', width: 30 },
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

  // Populate existing data for each match
  targetMatches.forEach(m => {
    const st = m.stats || {};
    const od = m.odds || {};
    const { date, time } = splitDateTimeForExcel(m.matchDate);

    worksheet.addRow({
      id: m.id,
      matchDate: date,
      matchTime: time,
      countryName: m.countryName,
      leagueName: m.leagueName,
      homeTeamName: m.homeTeamName,
      awayTeamName: m.awayTeamName,
      round: m.round || '',
      stadium: m.stadium || '',
      referee: m.referee || '',
      status: m.status || 'AGENDADO',

      // Placar e Gols
      homeScore: m.homeScore !== null ? m.homeScore : '',
      awayScore: m.awayScore !== null ? m.awayScore : '',
      halftimeHomeScore: st.halftimeHomeScore !== null && st.halftimeHomeScore !== undefined ? st.halftimeHomeScore : '',
      halftimeAwayScore: st.halftimeAwayScore !== null && st.halftimeAwayScore !== undefined ? st.halftimeAwayScore : '',
      goalMinutesHome: st.goalMinutesHome || '',
      goalMinutesAway: st.goalMinutesAway || '',
      firstGoalMinuteMatch: st.firstGoalMinuteMatch !== null && st.firstGoalMinuteMatch !== undefined ? st.firstGoalMinuteMatch : '',
      firstGoalMinuteHome: st.firstGoalMinuteHome !== null && st.firstGoalMinuteHome !== undefined ? st.firstGoalMinuteHome : '',
      firstGoalMinuteAway: st.firstGoalMinuteAway !== null && st.firstGoalMinuteAway !== undefined ? st.firstGoalMinuteAway : '',

      // Escanteios
      cornersHomeFT: st.cornersHomeFT !== null && st.cornersHomeFT !== undefined ? st.cornersHomeFT : (st.cornersHome !== null && st.cornersHome !== undefined ? st.cornersHome : ''),
      cornersAwayFT: st.cornersAwayFT !== null && st.cornersAwayFT !== undefined ? st.cornersAwayFT : (st.cornersAway !== null && st.cornersAway !== undefined ? st.cornersAway : ''),
      cornersHomeHT: st.cornersHomeHT !== null && st.cornersHomeHT !== undefined ? st.cornersHomeHT : '',
      cornersAwayHT: st.cornersAwayHT !== null && st.cornersAwayHT !== undefined ? st.cornersAwayHT : '',

      // Posse
      possessionHomeFT: st.possessionHomeFT !== null && st.possessionHomeFT !== undefined ? st.possessionHomeFT : (st.possessionHome !== null && st.possessionHome !== undefined ? st.possessionHome : ''),
      possessionAwayFT: st.possessionAwayFT !== null && st.possessionAwayFT !== undefined ? st.possessionAwayFT : (st.possessionAway !== null && st.possessionAway !== undefined ? st.possessionAway : ''),
      possessionHomeHT: st.possessionHomeHT !== null && st.possessionHomeHT !== undefined ? st.possessionHomeHT : '',
      possessionAwayHT: st.possessionAwayHT !== null && st.possessionAwayHT !== undefined ? st.possessionAwayHT : '',

      // Cartões
      yellowCardsHomeFT: st.yellowCardsHomeFT !== null && st.yellowCardsHomeFT !== undefined ? st.yellowCardsHomeFT : (st.yellowCardsHome !== null && st.yellowCardsHome !== undefined ? st.yellowCardsHome : ''),
      yellowCardsAwayFT: st.yellowCardsAwayFT !== null && st.yellowCardsAwayFT !== undefined ? st.yellowCardsAwayFT : (st.yellowCardsAway !== null && st.yellowCardsAway !== undefined ? st.yellowCardsAway : ''),
      yellowCardsHomeHT: st.yellowCardsHomeHT !== null && st.yellowCardsHomeHT !== undefined ? st.yellowCardsHomeHT : '',
      yellowCardsAwayHT: st.yellowCardsAwayHT !== null && st.yellowCardsAwayHT !== undefined ? st.yellowCardsAwayHT : '',
      redCardsHomeFT: st.redCardsHomeFT !== null && st.redCardsHomeFT !== undefined ? st.redCardsHomeFT : (st.redCardsHome !== null && st.redCardsHome !== undefined ? st.redCardsHome : ''),
      redCardsAwayFT: st.redCardsAwayFT !== null && st.redCardsAwayFT !== undefined ? st.redCardsAwayFT : (st.redCardsAway !== null && st.redCardsAway !== undefined ? st.redCardsAway : ''),
      redCardsHomeHT: st.redCardsHomeHT !== null && st.redCardsHomeHT !== undefined ? st.redCardsHomeHT : '',
      redCardsAwayHT: st.redCardsAwayHT !== null && st.redCardsAwayHT !== undefined ? st.redCardsAwayHT : '',

      // Finalizações & Chutes ao Gol
      shotsHomeFT: st.shotsHomeFT !== null && st.shotsHomeFT !== undefined ? st.shotsHomeFT : (st.shotsHome !== null && st.shotsHome !== undefined ? st.shotsHome : ''),
      shotsAwayFT: st.shotsAwayFT !== null && st.shotsAwayFT !== undefined ? st.shotsAwayFT : (st.shotsAway !== null && st.shotsAway !== undefined ? st.shotsAway : ''),
      shotsHomeHT: st.shotsHomeHT !== null && st.shotsHomeHT !== undefined ? st.shotsHomeHT : '',
      shotsAwayHT: st.shotsAwayHT !== null && st.shotsAwayHT !== undefined ? st.shotsAwayHT : '',
      shotsOnTargetHomeFT: st.shotsOnTargetHomeFT !== null && st.shotsOnTargetHomeFT !== undefined ? st.shotsOnTargetHomeFT : (st.shotsOnTargetHome !== null && st.shotsOnTargetHome !== undefined ? st.shotsOnTargetHome : ''),
      shotsOnTargetAwayFT: st.shotsOnTargetAwayFT !== null && st.shotsOnTargetAwayFT !== undefined ? st.shotsOnTargetAwayFT : (st.shotsOnTargetAway !== null && st.shotsOnTargetAway !== undefined ? st.shotsOnTargetAway : ''),
      shotsOnTargetHomeHT: st.shotsOnTargetHomeHT !== null && st.shotsOnTargetHomeHT !== undefined ? st.shotsOnTargetHomeHT : '',
      shotsOnTargetAwayHT: st.shotsOnTargetAwayHT !== null && st.shotsOnTargetAwayHT !== undefined ? st.shotsOnTargetAwayHT : '',

      // Odds FT & HT
      oddHomeFT: od.homeFT ?? '',
      oddDrawFT: od.drawFT ?? '',
      oddAwayFT: od.awayFT ?? '',
      oddOver25FT: od.over25FT ?? '',
      oddUnder25FT: od.under25FT ?? '',
      oddBttsFT: od.bttsFT ?? '',
      oddHomeHT: od.homeHT ?? '',
      oddDrawHT: od.drawHT ?? '',
      oddAwayHT: od.awayHT ?? '',
      oddOver05HT: od.over05HT ?? '',
      oddUnder05HT: od.under05HT ?? '',
      oddBttsHT: od.bttsHT ?? '',

      notes: m.notes || '',
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fileName = onlyIncomplete
    ? `Planilha_Jogos_Incompletos_Preenchimento_${new Date().toISOString().slice(0, 10)}.xlsx`
    : `Planilha_Todos_Jogos_Preenchimento_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parses an uploaded Excel or CSV file containing match updates or full match completions.
 */
export async function parseMatchUpdateExcelOrCsvFile(
  file: File,
  existingMatches: Match[]
): Promise<ParsedMatchUpdateRow[]> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.csv') || file.type === 'text/csv') {
    return parseMatchUpdateCsvFile(file, existingMatches);
  }

  return parseMatchUpdateXlsxFile(file, existingMatches);
}

function normalizeClean(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function findMatchingMatch(
  id: string,
  homeTeamName: string,
  awayTeamName: string,
  existingMatches: Match[]
): Match | undefined {
  if (id) {
    const byId = existingMatches.find(m => m.id.toLowerCase().trim() === id.toLowerCase().trim());
    if (byId) return byId;
  }

  const cleanHome = normalizeClean(homeTeamName);
  const cleanAway = normalizeClean(awayTeamName);

  if (!cleanHome || !cleanAway) return undefined;

  return existingMatches.find(m => {
    const mHome = normalizeClean(m.homeTeamName);
    const mAway = normalizeClean(m.awayTeamName);
    return (mHome === cleanHome && mAway === cleanAway) ||
           (mHome.includes(cleanHome) && mAway.includes(cleanAway)) ||
           (cleanHome.includes(mHome) && cleanAway.includes(mAway));
  });
}

async function parseMatchUpdateXlsxFile(
  file: File,
  existingMatches: Match[]
): Promise<ParsedMatchUpdateRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('O arquivo Excel está vazio ou não contém planilhas.');
  }

  const getVal = (cell: any): string => {
    if (!cell || cell.value === null || cell.value === undefined) return '';
    const val = cell.value;

    if (val instanceof Date) {
      if (isNaN(val.getTime())) return '';
      const day = String(val.getDate()).padStart(2, '0');
      const month = String(val.getMonth() + 1).padStart(2, '0');
      const year = val.getFullYear();
      const hours = String(val.getHours()).padStart(2, '0');
      const mins = String(val.getMinutes()).padStart(2, '0');
      if (hours === '00' && mins === '00') return `${day}/${month}/${year}`;
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
      if ('text' in val) return String(val.text || '').trim();
    }

    if (cell.text && typeof cell.text === 'string' && cell.text.trim() && cell.text !== '[object Object]') {
      return cell.text.trim();
    }

    return String(val).trim();
  };

  const parseNum = (cell: any): number | null => {
    const s = getVal(cell);
    if (!s) return null;
    const cleaned = s.replace('%', '').replace(',', '.').trim();
    const n = parseFloat(cleaned);
    return isNaN(n) ? null : n;
  };

  const colMap: Record<string, number> = {};
  let headerRowIndex = -1;

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (headerRowIndex === -1) {
      let isHeader = false;
      row.eachCell((cell, colNumber) => {
        const val = normalizeHeader(getVal(cell));

        if (val.includes('id_jogo') || val === 'id' || val === 'codigo') { colMap.matchId = colNumber; isHeader = true; }
        else if (val.includes('placar_mandante_ft') || val.includes('home_score') || val.includes('gols_mandante_ft')) { colMap.homeScore = colNumber; isHeader = true; }
        else if (val.includes('placar_visitante_ft') || val.includes('away_score') || val.includes('gols_visitante_ft')) { colMap.awayScore = colNumber; isHeader = true; }
        else if (val.includes('placar_mandante_ht') || val.includes('ht_mandante')) { colMap.halftimeHomeScore = colNumber; isHeader = true; }
        else if (val.includes('placar_visitante_ht') || val.includes('ht_visitante')) { colMap.halftimeAwayScore = colNumber; isHeader = true; }
        else if (val.includes('minutos_gols_mandante') || val.includes('minutos_mandante')) { colMap.goalMinutesHome = colNumber; isHeader = true; }
        else if (val.includes('minutos_gols_visitante') || val.includes('minutos_visitante')) { colMap.goalMinutesAway = colNumber; isHeader = true; }
        else if (val.includes('momento_1_gol_jogo') || val.includes('1_gol_jogo')) { colMap.firstGoalMinuteMatch = colNumber; isHeader = true; }
        else if (val.includes('1_gol_mandante')) { colMap.firstGoalMinuteHome = colNumber; isHeader = true; }
        else if (val.includes('1_gol_visitante')) { colMap.firstGoalMinuteAway = colNumber; isHeader = true; }

        else if (val.includes('escanteios_mandante_ft') || val.includes('cantos_mandante_ft')) { colMap.cornersHomeFT = colNumber; isHeader = true; }
        else if (val.includes('escanteios_visitante_ft') || val.includes('cantos_visitante_ft')) { colMap.cornersAwayFT = colNumber; isHeader = true; }
        else if (val.includes('escanteios_mandante_ht') || val.includes('cantos_mandante_ht')) { colMap.cornersHomeHT = colNumber; isHeader = true; }
        else if (val.includes('escanteios_visitante_ht') || val.includes('cantos_visitante_ht')) { colMap.cornersAwayHT = colNumber; isHeader = true; }

        else if (val.includes('posse_mandante_ft') || val.includes('posse_casa_ft')) { colMap.possessionHomeFT = colNumber; isHeader = true; }
        else if (val.includes('posse_visitante_ft') || val.includes('posse_fora_ft')) { colMap.possessionAwayFT = colNumber; isHeader = true; }
        else if (val.includes('posse_mandante_ht')) { colMap.possessionHomeHT = colNumber; isHeader = true; }
        else if (val.includes('posse_visitante_ht')) { colMap.possessionAwayHT = colNumber; isHeader = true; }

        else if (val.includes('cartao_amarelo_mandante_ft') || val.includes('amarelos_mandante_ft')) { colMap.yellowCardsHomeFT = colNumber; isHeader = true; }
        else if (val.includes('cartao_amarelo_visitante_ft') || val.includes('amarelos_visitante_ft')) { colMap.yellowCardsAwayFT = colNumber; isHeader = true; }
        else if (val.includes('cartao_amarelo_mandante_ht')) { colMap.yellowCardsHomeHT = colNumber; isHeader = true; }
        else if (val.includes('cartao_amarelo_visitante_ht')) { colMap.yellowCardsAwayHT = colNumber; isHeader = true; }

        else if (val.includes('cartao_vermelho_mandante_ft') || val.includes('vermelhos_mandante_ft')) { colMap.redCardsHomeFT = colNumber; isHeader = true; }
        else if (val.includes('cartao_vermelho_visitante_ft') || val.includes('vermelhos_visitante_ft')) { colMap.redCardsAwayFT = colNumber; isHeader = true; }
        else if (val.includes('cartao_vermelho_mandante_ht')) { colMap.redCardsHomeHT = colNumber; isHeader = true; }
        else if (val.includes('cartao_vermelho_visitante_ht')) { colMap.redCardsAwayHT = colNumber; isHeader = true; }

        else if (val.includes('finalizacoes_mandante_ft') || val.includes('chutes_mandante_ft')) { colMap.shotsHomeFT = colNumber; isHeader = true; }
        else if (val.includes('finalizacoes_visitante_ft') || val.includes('chutes_visitante_ft')) { colMap.shotsAwayFT = colNumber; isHeader = true; }
        else if (val.includes('finalizacoes_mandante_ht')) { colMap.shotsHomeHT = colNumber; isHeader = true; }
        else if (val.includes('finalizacoes_visitante_ht')) { colMap.shotsAwayHT = colNumber; isHeader = true; }

        else if (val.includes('chutes_gol_mandante_ft') || val.includes('alvo_mandante_ft')) { colMap.shotsOnTargetHomeFT = colNumber; isHeader = true; }
        else if (val.includes('chutes_gol_visitante_ft') || val.includes('alvo_visitante_ft')) { colMap.shotsOnTargetAwayFT = colNumber; isHeader = true; }
        else if (val.includes('chutes_gol_mandante_ht')) { colMap.shotsOnTargetHomeHT = colNumber; isHeader = true; }
        else if (val.includes('chutes_gol_visitante_ht')) { colMap.shotsOnTargetAwayHT = colNumber; isHeader = true; }

        // Odds
        else if (val.includes('odd_home_ft') || val.includes('odd_1_ft')) { colMap.oddHomeFT = colNumber; isHeader = true; }
        else if (val.includes('odd_draw_ft') || val.includes('odd_x_ft')) { colMap.oddDrawFT = colNumber; isHeader = true; }
        else if (val.includes('odd_away_ft') || val.includes('odd_2_ft')) { colMap.oddAwayFT = colNumber; isHeader = true; }
        else if (val.includes('odd_over25_ft') || val.includes('over2.5_ft')) { colMap.oddOver25FT = colNumber; isHeader = true; }
        else if (val.includes('odd_under25_ft') || val.includes('under2.5_ft')) { colMap.oddUnder25FT = colNumber; isHeader = true; }
        else if (val.includes('odd_btts_ft') || val.includes('ambos_ft')) { colMap.oddBttsFT = colNumber; isHeader = true; }
        else if (val.includes('odd_home_ht')) { colMap.oddHomeHT = colNumber; isHeader = true; }
        else if (val.includes('odd_draw_ht')) { colMap.oddDrawHT = colNumber; isHeader = true; }
        else if (val.includes('odd_away_ht')) { colMap.oddAwayHT = colNumber; isHeader = true; }
        else if (val.includes('odd_over05_ht')) { colMap.oddOver05HT = colNumber; isHeader = true; }
        else if (val.includes('odd_under05_ht')) { colMap.oddUnder05HT = colNumber; isHeader = true; }
        else if (val.includes('odd_btts_ht')) { colMap.oddBttsHT = colNumber; isHeader = true; }

        // Core fields
        else if (val === 'hora' || val.includes('horario') || val === 'hora_jogo' || val === 'time') { colMap.matchTime = colNumber; isHeader = true; }
        else if (val === 'data' || val === 'date' || val === 'dia' || val === 'data_jogo' || val.includes('data_hora')) { colMap.matchDate = colNumber; isHeader = true; }
        else if (val.includes('pais') || val.includes('country')) { colMap.countryName = colNumber; isHeader = true; }
        else if (val.includes('liga') || val.includes('league')) { colMap.leagueName = colNumber; isHeader = true; }
        else if (val.includes('mandante') || val === 'home') { colMap.homeTeamName = colNumber; isHeader = true; }
        else if (val.includes('visitante') || val === 'away') { colMap.awayTeamName = colNumber; isHeader = true; }
        else if (val.includes('rodada') || val.includes('round')) { colMap.round = colNumber; isHeader = true; }
        else if (val.includes('estadio') || val.includes('stadium')) { colMap.stadium = colNumber; isHeader = true; }
        else if (val.includes('arbitro') || val.includes('referee')) { colMap.referee = colNumber; isHeader = true; }
        else if (val.includes('status') || val.includes('situacao')) { colMap.status = colNumber; isHeader = true; }
        else if (val.includes('obs') || val.includes('note')) { colMap.notes = colNumber; isHeader = true; }
      });

      if (isHeader || rowNumber === 1) {
        headerRowIndex = rowNumber;
        return;
      }
    }
  });

  const parsedRows: ParsedMatchUpdateRow[] = [];

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber <= headerRowIndex) return;

    const matchId = colMap.matchId ? getVal(row.getCell(colMap.matchId)) : '';

    const rawDateCell = colMap.matchDate ? row.getCell(colMap.matchDate) : null;
    const rawTimeCell = colMap.matchTime ? row.getCell(colMap.matchTime) : null;
    const dateVal = rawDateCell ? (rawDateCell.value instanceof Date ? rawDateCell.value : getVal(rawDateCell)) : '';
    const timeVal = rawTimeCell ? (rawTimeCell.value instanceof Date ? rawTimeCell.value : getVal(rawTimeCell)) : '';
    const matchDateStr = combineDateAndTime(dateVal, timeVal);

    const countryName = colMap.countryName ? getVal(row.getCell(colMap.countryName)) : '';
    const leagueName = colMap.leagueName ? getVal(row.getCell(colMap.leagueName)) : '';
    const homeTeamName = colMap.homeTeamName ? getVal(row.getCell(colMap.homeTeamName)) : '';
    const awayTeamName = colMap.awayTeamName ? getVal(row.getCell(colMap.awayTeamName)) : '';
    const round = colMap.round ? getVal(row.getCell(colMap.round)) : '';
    const stadium = colMap.stadium ? getVal(row.getCell(colMap.stadium)) : '';
    const referee = colMap.referee ? getVal(row.getCell(colMap.referee)) : '';
    const statusRaw = colMap.status ? getVal(row.getCell(colMap.status)).toUpperCase() : '';
    const notes = colMap.notes ? getVal(row.getCell(colMap.notes)) : '';

    const homeScore = colMap.homeScore ? parseNum(row.getCell(colMap.homeScore)) : null;
    const awayScore = colMap.awayScore ? parseNum(row.getCell(colMap.awayScore)) : null;
    const halftimeHomeScore = colMap.halftimeHomeScore ? parseNum(row.getCell(colMap.halftimeHomeScore)) : null;
    const halftimeAwayScore = colMap.halftimeAwayScore ? parseNum(row.getCell(colMap.halftimeAwayScore)) : null;

    const goalMinutesHome = colMap.goalMinutesHome ? getVal(row.getCell(colMap.goalMinutesHome)) : '';
    const goalMinutesAway = colMap.goalMinutesAway ? getVal(row.getCell(colMap.goalMinutesAway)) : '';
    const firstGoalMinuteMatch = colMap.firstGoalMinuteMatch ? parseNum(row.getCell(colMap.firstGoalMinuteMatch)) : null;
    const firstGoalMinuteHome = colMap.firstGoalMinuteHome ? parseNum(row.getCell(colMap.firstGoalMinuteHome)) : null;
    const firstGoalMinuteAway = colMap.firstGoalMinuteAway ? parseNum(row.getCell(colMap.firstGoalMinuteAway)) : null;

    const cornersHomeFT = colMap.cornersHomeFT ? parseNum(row.getCell(colMap.cornersHomeFT)) : null;
    const cornersAwayFT = colMap.cornersAwayFT ? parseNum(row.getCell(colMap.cornersAwayFT)) : null;
    const cornersHomeHT = colMap.cornersHomeHT ? parseNum(row.getCell(colMap.cornersHomeHT)) : null;
    const cornersAwayHT = colMap.cornersAwayHT ? parseNum(row.getCell(colMap.cornersAwayHT)) : null;

    const possessionHomeFT = colMap.possessionHomeFT ? parseNum(row.getCell(colMap.possessionHomeFT)) : null;
    const possessionAwayFT = colMap.possessionAwayFT ? parseNum(row.getCell(colMap.possessionAwayFT)) : null;
    const possessionHomeHT = colMap.possessionHomeHT ? parseNum(row.getCell(colMap.possessionHomeHT)) : null;
    const possessionAwayHT = colMap.possessionAwayHT ? parseNum(row.getCell(colMap.possessionAwayHT)) : null;

    const yellowCardsHomeFT = colMap.yellowCardsHomeFT ? parseNum(row.getCell(colMap.yellowCardsHomeFT)) : null;
    const yellowCardsAwayFT = colMap.yellowCardsAwayFT ? parseNum(row.getCell(colMap.yellowCardsAwayFT)) : null;
    const yellowCardsHomeHT = colMap.yellowCardsHomeHT ? parseNum(row.getCell(colMap.yellowCardsHomeHT)) : null;
    const yellowCardsAwayHT = colMap.yellowCardsAwayHT ? parseNum(row.getCell(colMap.yellowCardsAwayHT)) : null;

    const redCardsHomeFT = colMap.redCardsHomeFT ? parseNum(row.getCell(colMap.redCardsHomeFT)) : null;
    const redCardsAwayFT = colMap.redCardsAwayFT ? parseNum(row.getCell(colMap.redCardsAwayFT)) : null;
    const redCardsHomeHT = colMap.redCardsHomeHT ? parseNum(row.getCell(colMap.redCardsHomeHT)) : null;
    const redCardsAwayHT = colMap.redCardsAwayHT ? parseNum(row.getCell(colMap.redCardsAwayHT)) : null;

    const shotsHomeFT = colMap.shotsHomeFT ? parseNum(row.getCell(colMap.shotsHomeFT)) : null;
    const shotsAwayFT = colMap.shotsAwayFT ? parseNum(row.getCell(colMap.shotsAwayFT)) : null;
    const shotsHomeHT = colMap.shotsHomeHT ? parseNum(row.getCell(colMap.shotsHomeHT)) : null;
    const shotsAwayHT = colMap.shotsAwayHT ? parseNum(row.getCell(colMap.shotsAwayHT)) : null;

    const shotsOnTargetHomeFT = colMap.shotsOnTargetHomeFT ? parseNum(row.getCell(colMap.shotsOnTargetHomeFT)) : null;
    const shotsOnTargetAwayFT = colMap.shotsOnTargetAwayFT ? parseNum(row.getCell(colMap.shotsOnTargetAwayFT)) : null;
    const shotsOnTargetHomeHT = colMap.shotsOnTargetHomeHT ? parseNum(row.getCell(colMap.shotsOnTargetHomeHT)) : null;
    const shotsOnTargetAwayHT = colMap.shotsOnTargetAwayHT ? parseNum(row.getCell(colMap.shotsOnTargetAwayHT)) : null;

    const oddHomeFT = colMap.oddHomeFT ? parseNum(row.getCell(colMap.oddHomeFT)) : null;
    const oddDrawFT = colMap.oddDrawFT ? parseNum(row.getCell(colMap.oddDrawFT)) : null;
    const oddAwayFT = colMap.oddAwayFT ? parseNum(row.getCell(colMap.oddAwayFT)) : null;
    const oddOver25FT = colMap.oddOver25FT ? parseNum(row.getCell(colMap.oddOver25FT)) : null;
    const oddUnder25FT = colMap.oddUnder25FT ? parseNum(row.getCell(colMap.oddUnder25FT)) : null;
    const oddBttsFT = colMap.oddBttsFT ? parseNum(row.getCell(colMap.oddBttsFT)) : null;

    const oddHomeHT = colMap.oddHomeHT ? parseNum(row.getCell(colMap.oddHomeHT)) : null;
    const oddDrawHT = colMap.oddDrawHT ? parseNum(row.getCell(colMap.oddDrawHT)) : null;
    const oddAwayHT = colMap.oddAwayHT ? parseNum(row.getCell(colMap.oddAwayHT)) : null;
    const oddOver05HT = colMap.oddOver05HT ? parseNum(row.getCell(colMap.oddOver05HT)) : null;
    const oddUnder05HT = colMap.oddUnder05HT ? parseNum(row.getCell(colMap.oddUnder05HT)) : null;
    const oddBttsHT = colMap.oddBttsHT ? parseNum(row.getCell(colMap.oddBttsHT)) : null;

    if (!matchId && !homeTeamName && !awayTeamName) return;

    // Find match in existing db
    const matchedMatch = findMatchingMatch(matchId, homeTeamName, awayTeamName, existingMatches);

    // Track changed/updated fields
    const changedFields: string[] = [];
    if (homeScore !== null && awayScore !== null) changedFields.push(`Placar FT (${homeScore}x${awayScore})`);
    if (halftimeHomeScore !== null && halftimeAwayScore !== null) changedFields.push(`Placar HT (${halftimeHomeScore}x${halftimeAwayScore})`);
    if (goalMinutesHome || goalMinutesAway) changedFields.push('Minutos dos Gols');
    if (cornersHomeFT !== null || cornersAwayFT !== null) changedFields.push('Escanteios');
    if (possessionHomeFT !== null || possessionAwayFT !== null) changedFields.push('Posse %');
    if (yellowCardsHomeFT !== null || yellowCardsAwayFT !== null || redCardsHomeFT !== null || redCardsAwayFT !== null) changedFields.push('Cartões');
    if (shotsHomeFT !== null || shotsAwayFT !== null || shotsOnTargetHomeFT !== null || shotsOnTargetAwayFT !== null) changedFields.push('Finalizações');
    if (oddHomeFT !== null || oddDrawFT !== null || oddAwayFT !== null) changedFields.push('Odds 1X2 FT');
    if (stadium) changedFields.push('Estádio');
    if (referee) changedFields.push('Árbitro');

    let status: MatchStatus | undefined = undefined;
    if (['FINALIZADO', 'AGENDADO', 'EM_ANDAMENTO', 'ADIADO'].includes(statusRaw)) {
      status = statusRaw as MatchStatus;
    } else if (homeScore !== null && awayScore !== null) {
      status = 'FINALIZADO';
    }

    const isValid = Boolean(matchedMatch || (homeTeamName && awayTeamName));
    const validationError = isValid
      ? undefined
      : 'Partida não encontrada no banco e sem dados suficientes para cadastro.';

    parsedRows.push({
      rowIndex: rowNumber,
      matchId: matchedMatch ? matchedMatch.id : matchId,
      matchDate: matchDateStr || (matchedMatch ? matchedMatch.matchDate : ''),
      countryName: countryName || (matchedMatch ? matchedMatch.countryName : ''),
      leagueName: leagueName || (matchedMatch ? matchedMatch.leagueName : ''),
      homeTeamName: homeTeamName || (matchedMatch ? matchedMatch.homeTeamName : ''),
      awayTeamName: awayTeamName || (matchedMatch ? matchedMatch.awayTeamName : ''),
      round: round || (matchedMatch ? matchedMatch.round : ''),
      stadium: stadium || (matchedMatch ? matchedMatch.stadium : ''),
      referee: referee || (matchedMatch ? matchedMatch.referee : ''),
      status,
      notes: notes || (matchedMatch ? matchedMatch.notes : ''),

      homeScore,
      awayScore,
      halftimeHomeScore,
      halftimeAwayScore,
      goalMinutesHome,
      goalMinutesAway,
      firstGoalMinuteMatch,
      firstGoalMinuteHome,
      firstGoalMinuteAway,

      cornersHomeFT,
      cornersAwayFT,
      cornersHomeHT,
      cornersAwayHT,

      possessionHomeFT,
      possessionAwayFT,
      possessionHomeHT,
      possessionAwayHT,

      yellowCardsHomeFT,
      yellowCardsAwayFT,
      yellowCardsHomeHT,
      yellowCardsAwayHT,
      redCardsHomeFT,
      redCardsAwayFT,
      redCardsHomeHT,
      redCardsAwayHT,

      shotsHomeFT,
      shotsAwayFT,
      shotsHomeHT,
      shotsAwayHT,
      shotsOnTargetHomeFT,
      shotsOnTargetAwayFT,
      shotsOnTargetHomeHT,
      shotsOnTargetAwayHT,

      oddHomeFT,
      oddDrawFT,
      oddAwayFT,
      oddOver25FT,
      oddUnder25FT,
      oddBttsFT,
      oddHomeHT,
      oddDrawHT,
      oddAwayHT,
      oddOver05HT,
      oddUnder05HT,
      oddBttsHT,

      matchedMatch,
      matchedMatchId: matchedMatch?.id,
      isNewMatch: !matchedMatch,
      isValid,
      validationError,
      changedFields,
    });
  });

  return parsedRows;
}

async function parseMatchUpdateCsvFile(
  file: File,
  existingMatches: Match[]
): Promise<ParsedMatchUpdateRow[]> {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);

  if (lines.length <= 1) return [];

  const delimiter = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(delimiter).map(h => normalizeHeader(h));

  const getIdx = (keywords: string[]) => {
    return headers.findIndex(h => keywords.some(k => h.includes(k)));
  };

  const matchIdIdx = getIdx(['id_jogo', 'id', 'codigo']);
  const matchDateIdx = getIdx(['data', 'date', 'dia', 'data_hora']);
  const matchTimeIdx = getIdx(['hora', 'horario', 'hora_jogo', 'time']);
  const countryNameIdx = getIdx(['pais', 'country']);
  const leagueNameIdx = getIdx(['liga', 'league']);
  const homeTeamNameIdx = getIdx(['mandante', 'home']);
  const awayTeamNameIdx = getIdx(['visitante', 'away']);
  const roundIdx = getIdx(['rodada', 'round']);
  const stadiumIdx = getIdx(['estadio', 'stadium']);
  const refereeIdx = getIdx(['arbitro', 'referee']);
  const statusIdx = getIdx(['status', 'situacao']);
  const notesIdx = getIdx(['obs', 'note']);

  const homeScoreIdx = getIdx(['placar_mandante_ft', 'home_score', 'gols_mandante_ft']);
  const awayScoreIdx = getIdx(['placar_visitante_ft', 'away_score', 'gols_visitante_ft']);
  const halftimeHomeScoreIdx = getIdx(['placar_mandante_ht', 'ht_mandante']);
  const halftimeAwayScoreIdx = getIdx(['placar_visitante_ht', 'ht_visitante']);

  const goalMinutesHomeIdx = getIdx(['minutos_gols_mandante', 'minutos_mandante']);
  const goalMinutesAwayIdx = getIdx(['minutos_gols_visitante', 'minutos_visitante']);
  const firstGoalMatchIdx = getIdx(['momento_1_gol_jogo', '1_gol_jogo']);
  const firstGoalHomeIdx = getIdx(['1_gol_mandante']);
  const firstGoalAwayIdx = getIdx(['1_gol_visitante']);

  const cornersHomeFTIdx = getIdx(['escanteios_mandante_ft', 'cantos_mandante_ft']);
  const cornersAwayFTIdx = getIdx(['escanteios_visitante_ft', 'cantos_visitante_ft']);
  const cornersHomeHTIdx = getIdx(['escanteios_mandante_ht', 'cantos_mandante_ht']);
  const cornersAwayHTIdx = getIdx(['escanteios_visitante_ht', 'cantos_visitante_ht']);

  const possessionHomeFTIdx = getIdx(['posse_mandante_ft', 'posse_casa_ft']);
  const possessionAwayFTIdx = getIdx(['posse_visitante_ft', 'posse_fora_ft']);
  const possessionHomeHTIdx = getIdx(['posse_mandante_ht']);
  const possessionAwayHTIdx = getIdx(['posse_visitante_ht']);

  const yellowCardsHomeFTIdx = getIdx(['cartao_amarelo_mandante_ft', 'amarelos_mandante_ft']);
  const yellowCardsAwayFTIdx = getIdx(['cartao_amarelo_visitante_ft', 'amarelos_visitante_ft']);
  const yellowCardsHomeHTIdx = getIdx(['cartao_amarelo_mandante_ht']);
  const yellowCardsAwayHTIdx = getIdx(['cartao_amarelo_visitante_ht']);

  const redCardsHomeFTIdx = getIdx(['cartao_vermelho_mandante_ft', 'vermelhos_mandante_ft']);
  const redCardsAwayFTIdx = getIdx(['cartao_vermelho_visitante_ft', 'vermelhos_visitante_ft']);
  const redCardsHomeHTIdx = getIdx(['cartao_vermelho_mandante_ht']);
  const redCardsAwayHTIdx = getIdx(['cartao_vermelho_visitante_ht']);

  const shotsHomeFTIdx = getIdx(['finalizacoes_mandante_ft', 'chutes_mandante_ft']);
  const shotsAwayFTIdx = getIdx(['finalizacoes_visitante_ft', 'chutes_visitante_ft']);
  const shotsHomeHTIdx = getIdx(['finalizacoes_mandante_ht']);
  const shotsAwayHTIdx = getIdx(['finalizacoes_visitante_ht']);

  const shotsOnTargetHomeFTIdx = getIdx(['chutes_gol_mandante_ft', 'alvo_mandante_ft']);
  const shotsOnTargetAwayFTIdx = getIdx(['chutes_gol_visitante_ft', 'alvo_visitante_ft']);
  const shotsOnTargetHomeHTIdx = getIdx(['chutes_gol_mandante_ht']);
  const shotsOnTargetAwayHTIdx = getIdx(['chutes_gol_visitante_ht']);

  const oddHomeFTIdx = getIdx(['odd_home_ft', 'odd_1_ft']);
  const oddDrawFTIdx = getIdx(['odd_draw_ft', 'odd_x_ft']);
  const oddAwayFTIdx = getIdx(['odd_away_ft', 'odd_2_ft']);
  const oddOver25FTIdx = getIdx(['odd_over25_ft', 'over2.5_ft']);
  const oddUnder25FTIdx = getIdx(['odd_under25_ft', 'under2.5_ft']);
  const oddBttsFTIdx = getIdx(['odd_btts_ft', 'ambos_ft']);

  const oddHomeHTIdx = getIdx(['odd_home_ht']);
  const oddDrawHTIdx = getIdx(['odd_draw_ht']);
  const oddAwayHTIdx = getIdx(['odd_away_ht']);
  const oddOver05HTIdx = getIdx(['odd_over05_ht']);
  const oddUnder05HTIdx = getIdx(['odd_under05_ht']);
  const oddBttsHTIdx = getIdx(['odd_btts_ht']);

  const parseNum = (str: string | undefined): number | null => {
    if (!str) return null;
    const cleaned = str.replace('%', '').replace(',', '.').trim();
    const n = parseFloat(cleaned);
    return isNaN(n) ? null : n;
  };

  const getCol = (cols: string[], idx: number): string => {
    if (idx === -1 || !cols[idx]) return '';
    return cols[idx].replace(/^["']|["']$/g, '').trim();
  };

  const rows: ParsedMatchUpdateRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter);

    const matchId = getCol(cols, matchIdIdx);
    const dateVal = getCol(cols, matchDateIdx);
    const timeVal = getCol(cols, matchTimeIdx);
    const matchDateStr = combineDateAndTime(dateVal, timeVal);

    const countryName = getCol(cols, countryNameIdx);
    const leagueName = getCol(cols, leagueNameIdx);
    const homeTeamName = getCol(cols, homeTeamNameIdx);
    const awayTeamName = getCol(cols, awayTeamNameIdx);
    const round = getCol(cols, roundIdx);
    const stadium = getCol(cols, stadiumIdx);
    const referee = getCol(cols, refereeIdx);
    const statusRaw = getCol(cols, statusIdx).toUpperCase();
    const notes = getCol(cols, notesIdx);

    const homeScore = parseNum(getCol(cols, homeScoreIdx));
    const awayScore = parseNum(getCol(cols, awayScoreIdx));
    const halftimeHomeScore = parseNum(getCol(cols, halftimeHomeScoreIdx));
    const halftimeAwayScore = parseNum(getCol(cols, halftimeAwayScoreIdx));

    const goalMinutesHome = getCol(cols, goalMinutesHomeIdx);
    const goalMinutesAway = getCol(cols, goalMinutesAwayIdx);
    const firstGoalMinuteMatch = parseNum(getCol(cols, firstGoalMatchIdx));
    const firstGoalMinuteHome = parseNum(getCol(cols, firstGoalHomeIdx));
    const firstGoalMinuteAway = parseNum(getCol(cols, firstGoalAwayIdx));

    const cornersHomeFT = parseNum(getCol(cols, cornersHomeFTIdx));
    const cornersAwayFT = parseNum(getCol(cols, cornersAwayFTIdx));
    const cornersHomeHT = parseNum(getCol(cols, cornersHomeHTIdx));
    const cornersAwayHT = parseNum(getCol(cols, cornersAwayHTIdx));

    const possessionHomeFT = parseNum(getCol(cols, possessionHomeFTIdx));
    const possessionAwayFT = parseNum(getCol(cols, possessionAwayFTIdx));
    const possessionHomeHT = parseNum(getCol(cols, possessionHomeHTIdx));
    const possessionAwayHT = parseNum(getCol(cols, possessionAwayHTIdx));

    const yellowCardsHomeFT = parseNum(getCol(cols, yellowCardsHomeFTIdx));
    const yellowCardsAwayFT = parseNum(getCol(cols, yellowCardsAwayFTIdx));
    const yellowCardsHomeHT = parseNum(getCol(cols, yellowCardsHomeHTIdx));
    const yellowCardsAwayHT = parseNum(getCol(cols, yellowCardsAwayHTIdx));

    const redCardsHomeFT = parseNum(getCol(cols, redCardsHomeFTIdx));
    const redCardsAwayFT = parseNum(getCol(cols, redCardsAwayFTIdx));
    const redCardsHomeHT = parseNum(getCol(cols, redCardsHomeHTIdx));
    const redCardsAwayHT = parseNum(getCol(cols, redCardsAwayHTIdx));

    const shotsHomeFT = parseNum(getCol(cols, shotsHomeFTIdx));
    const shotsAwayFT = parseNum(getCol(cols, shotsAwayFTIdx));
    const shotsHomeHT = parseNum(getCol(cols, shotsHomeHTIdx));
    const shotsAwayHT = parseNum(getCol(cols, shotsAwayHTIdx));

    const shotsOnTargetHomeFT = parseNum(getCol(cols, shotsOnTargetHomeFTIdx));
    const shotsOnTargetAwayFT = parseNum(getCol(cols, shotsOnTargetAwayFTIdx));
    const shotsOnTargetHomeHT = parseNum(getCol(cols, shotsOnTargetHomeHTIdx));
    const shotsOnTargetAwayHT = parseNum(getCol(cols, shotsOnTargetAwayHTIdx));

    const oddHomeFT = parseNum(getCol(cols, oddHomeFTIdx));
    const oddDrawFT = parseNum(getCol(cols, oddDrawFTIdx));
    const oddAwayFT = parseNum(getCol(cols, oddAwayFTIdx));
    const oddOver25FT = parseNum(getCol(cols, oddOver25FTIdx));
    const oddUnder25FT = parseNum(getCol(cols, oddUnder25FTIdx));
    const oddBttsFT = parseNum(getCol(cols, oddBttsFTIdx));

    const oddHomeHT = parseNum(getCol(cols, oddHomeHTIdx));
    const oddDrawHT = parseNum(getCol(cols, oddDrawHTIdx));
    const oddAwayHT = parseNum(getCol(cols, oddAwayHTIdx));
    const oddOver05HT = parseNum(getCol(cols, oddOver05HTIdx));
    const oddUnder05HT = parseNum(getCol(cols, oddUnder05HTIdx));
    const oddBttsHT = parseNum(getCol(cols, oddBttsHTIdx));

    if (!matchId && !homeTeamName && !awayTeamName) continue;

    const matchedMatch = findMatchingMatch(matchId, homeTeamName, awayTeamName, existingMatches);

    const changedFields: string[] = [];
    if (homeScore !== null && awayScore !== null) changedFields.push(`Placar FT (${homeScore}x${awayScore})`);
    if (halftimeHomeScore !== null && halftimeAwayScore !== null) changedFields.push(`Placar HT (${halftimeHomeScore}x${halftimeAwayScore})`);
    if (goalMinutesHome || goalMinutesAway) changedFields.push('Minutos dos Gols');
    if (cornersHomeFT !== null || cornersAwayFT !== null) changedFields.push('Escanteios');
    if (possessionHomeFT !== null || possessionAwayFT !== null) changedFields.push('Posse %');
    if (yellowCardsHomeFT !== null || yellowCardsAwayFT !== null || redCardsHomeFT !== null || redCardsAwayFT !== null) changedFields.push('Cartões');
    if (shotsHomeFT !== null || shotsAwayFT !== null || shotsOnTargetHomeFT !== null || shotsOnTargetAwayFT !== null) changedFields.push('Finalizações');
    if (oddHomeFT !== null || oddDrawFT !== null || oddAwayFT !== null) changedFields.push('Odds 1X2 FT');
    if (stadium) changedFields.push('Estádio');
    if (referee) changedFields.push('Árbitro');

    let status: MatchStatus | undefined = undefined;
    if (['FINALIZADO', 'AGENDADO', 'EM_ANDAMENTO', 'ADIADO'].includes(statusRaw)) {
      status = statusRaw as MatchStatus;
    } else if (homeScore !== null && awayScore !== null) {
      status = 'FINALIZADO';
    }

    const isValid = Boolean(matchedMatch || (homeTeamName && awayTeamName));
    const validationError = isValid
      ? undefined
      : 'Partida não encontrada no banco e sem dados suficientes para cadastro.';

    rows.push({
      rowIndex: i + 1,
      matchId: matchedMatch ? matchedMatch.id : matchId,
      matchDate: matchDateStr || (matchedMatch ? matchedMatch.matchDate : ''),
      countryName: countryName || (matchedMatch ? matchedMatch.countryName : ''),
      leagueName: leagueName || (matchedMatch ? matchedMatch.leagueName : ''),
      homeTeamName: homeTeamName || (matchedMatch ? matchedMatch.homeTeamName : ''),
      awayTeamName: awayTeamName || (matchedMatch ? matchedMatch.awayTeamName : ''),
      round: round || (matchedMatch ? matchedMatch.round : ''),
      stadium: stadium || (matchedMatch ? matchedMatch.stadium : ''),
      referee: referee || (matchedMatch ? matchedMatch.referee : ''),
      status,
      notes: notes || (matchedMatch ? matchedMatch.notes : ''),

      homeScore,
      awayScore,
      halftimeHomeScore,
      halftimeAwayScore,
      goalMinutesHome,
      goalMinutesAway,
      firstGoalMinuteMatch,
      firstGoalMinuteHome,
      firstGoalMinuteAway,

      cornersHomeFT,
      cornersAwayFT,
      cornersHomeHT,
      cornersAwayHT,

      possessionHomeFT,
      possessionAwayFT,
      possessionHomeHT,
      possessionAwayHT,

      yellowCardsHomeFT,
      yellowCardsAwayFT,
      yellowCardsHomeHT,
      yellowCardsAwayHT,
      redCardsHomeFT,
      redCardsAwayFT,
      redCardsHomeHT,
      redCardsAwayHT,

      shotsHomeFT,
      shotsAwayFT,
      shotsHomeHT,
      shotsAwayHT,
      shotsOnTargetHomeFT,
      shotsOnTargetAwayFT,
      shotsOnTargetHomeHT,
      shotsOnTargetAwayHT,

      oddHomeFT,
      oddDrawFT,
      oddAwayFT,
      oddOver25FT,
      oddUnder25FT,
      oddBttsFT,
      oddHomeHT,
      oddDrawHT,
      oddAwayHT,
      oddOver05HT,
      oddUnder05HT,
      oddBttsHT,

      matchedMatch,
      matchedMatchId: matchedMatch?.id,
      isNewMatch: !matchedMatch,
      isValid,
      validationError,
      changedFields,
    });
  }

  return rows;
}
