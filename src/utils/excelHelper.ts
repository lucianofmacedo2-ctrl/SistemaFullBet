import ExcelJS from 'exceljs';
import { Match, MatchStatus, MatchStats, MatchOdds } from '../types';

export interface ParsedTeamRow {
  rowIndex: number;
  time: string;
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
  referee: string;
  notes: string;
  oddHomeFT?: number | null;
  oddDrawFT?: number | null;
  oddAwayFT?: number | null;
  oddOver25FT?: number | null;
  oddUnder25FT?: number | null;
  asianHandicapHomeLine?: number | null;
  asianHandicapHomeOdd?: number | null;
  asianHandicapAwayLine?: number | null;
  asianHandicapAwayOdd?: number | null;
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
  referee?: string;
  status?: MatchStatus;
  notes?: string;
  matchedMatch?: Match;
  isNewMatch?: boolean;

  // Placar e Gols
  homeScore?: number | null;
  awayScore?: number | null;
  halftimeHomeScore?: number | null;
  halftimeAwayScore?: number | null;

  // Métricas FT
  xgHomeFT?: number | null;
  xgAwayFT?: number | null;
  shotsHomeFT?: number | null;
  shotsAwayFT?: number | null;
  shotsOnTargetHomeFT?: number | null;
  shotsOnTargetAwayFT?: number | null;
  foulsHomeFT?: number | null;
  foulsAwayFT?: number | null;
  cornersHomeFT?: number | null;
  cornersAwayFT?: number | null;
  yellowCardsHomeFT?: number | null;
  yellowCardsAwayFT?: number | null;
  redCardsHomeFT?: number | null;
  redCardsAwayFT?: number | null;

  // Odds FT
  oddHomeFT?: number | null;
  oddDrawFT?: number | null;
  oddAwayFT?: number | null;
  oddOver25FT?: number | null;
  oddUnder25FT?: number | null;
  asianHandicapHomeLine?: number | null;
  asianHandicapHomeOdd?: number | null;
  asianHandicapAwayLine?: number | null;
  asianHandicapAwayOdd?: number | null;

  isValid: boolean;
  validationError?: string;
}

function parseNumber(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  const str = String(val).trim().replace(',', '.');
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

function parseInteger(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return isNaN(val) ? null : Math.round(val);
  const str = String(val).trim().replace(',', '.');
  const num = parseInt(str, 10);
  return isNaN(num) ? null : num;
}

function splitDateTimeForExcel(isoString: string): { date: string; time: string } {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return { date: '', time: '' };
    const date = d.toISOString().slice(0, 10);
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return { date, time: `${hours}:${mins}` };
  } catch {
    return { date: '', time: '' };
  }
}

export function isMatchComplete(match: Match): boolean {
  if (match.homeScore === null || match.awayScore === null) return false;
  if (!match.stats?.cornersHomeFT && !match.stats?.shotsHomeFT && !match.stats?.halftimeHomeScore) return false;
  if (!match.odds?.homeFT) return false;
  return true;
}

/**
 * Exporta Jogos para Excel formatado conforme o novo padrão do banco
 */
export async function exportMatchesToExcel(
  matches: Match[],
  onlyIncomplete: boolean = false
): Promise<void> {
  const targetMatches = onlyIncomplete
    ? matches.filter(m => !isMatchComplete(m))
    : matches;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Jogos');

  worksheet.columns = [
    { header: 'Pais', key: 'countryName', width: 16 },
    { header: 'Liga', key: 'leagueName', width: 22 },
    { header: 'Data', key: 'matchDate', width: 14 },
    { header: 'Hora', key: 'matchTime', width: 10 },
    { header: 'Mandante', key: 'homeTeamName', width: 22 },
    { header: 'Visitante', key: 'awayTeamName', width: 22 },
    { header: 'Placar_Mandante_FT', key: 'homeScore', width: 18 },
    { header: 'Placar_Visitante_FT', key: 'awayScore', width: 18 },
    { header: 'Placar_Mandante_HT', key: 'halftimeHomeScore', width: 18 },
    { header: 'Placar_Visitante_HT', key: 'halftimeAwayScore', width: 18 },
    { header: 'Arbitro', key: 'referee', width: 20 },
    { header: 'xG_Mandante_FT', key: 'xgHomeFT', width: 16 },
    { header: 'xG_Visitante_FT', key: 'xgAwayFT', width: 16 },
    { header: 'Finalizacoes_Mandante_FT', key: 'shotsHomeFT', width: 22 },
    { header: 'Finalizacoes_Visitante_FT', key: 'shotsAwayFT', width: 22 },
    { header: 'Chutes_Gol_Mandante_FT', key: 'shotsOnTargetHomeFT', width: 22 },
    { header: 'Chutes_Gol_Visitante_FT', key: 'shotsOnTargetAwayFT', width: 22 },
    { header: 'Faltas_Mandante_FT', key: 'foulsHomeFT', width: 18 },
    { header: 'Faltas_Visitante_FT', key: 'foulsAwayFT', width: 18 },
    { header: 'Escanteios_Mandante_FT', key: 'cornersHomeFT', width: 22 },
    { header: 'Escanteios_Visitante_FT', key: 'cornersAwayFT', width: 22 },
    { header: 'Cartao_Amarelo_Mandante_FT', key: 'yellowCardsHomeFT', width: 24 },
    { header: 'Cartao_Amarelo_Visitante_FT', key: 'yellowCardsAwayFT', width: 24 },
    { header: 'Cartao_Vermelho_Mandante_FT', key: 'redCardsHomeFT', width: 24 },
    { header: 'Cartao_Vermelho_Visitante_FT', key: 'redCardsAwayFT', width: 24 },
    { header: 'Odd_Home_FT', key: 'oddHomeFT', width: 14 },
    { header: 'Odd_Draw_FT', key: 'oddDrawFT', width: 14 },
    { header: 'Odd_Away_FT', key: 'oddAwayFT', width: 14 },
    { header: 'Odd_Over25_FT', key: 'oddOver25FT', width: 14 },
    { header: 'Odd_Under25_FT', key: 'oddUnder25FT', width: 14 },
    { header: 'Linha_Handicap_Asiático_Mandante_FT', key: 'haHomeLine', width: 28 },
    { header: 'Odd_Handicap_Asiático_Mandante_FT', key: 'haHomeOdd', width: 28 },
    { header: 'Linha_Handicap_Asiático_Visitante_FT', key: 'haAwayLine', width: 28 },
    { header: 'Odd_Handicap_Asiático_Visitante_FT', key: 'haAwayOdd', width: 28 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E40AF' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  targetMatches.forEach(m => {
    const st = m.stats || {};
    const od = m.odds || {};
    const { date, time } = splitDateTimeForExcel(m.matchDate);

    worksheet.addRow({
      countryName: m.countryName,
      leagueName: m.leagueName,
      matchDate: date,
      matchTime: time,
      homeTeamName: m.homeTeamName,
      awayTeamName: m.awayTeamName,
      homeScore: m.homeScore !== null ? m.homeScore : '',
      awayScore: m.awayScore !== null ? m.awayScore : '',
      halftimeHomeScore: st.halftimeHomeScore !== null && st.halftimeHomeScore !== undefined ? st.halftimeHomeScore : '',
      halftimeAwayScore: st.halftimeAwayScore !== null && st.halftimeAwayScore !== undefined ? st.halftimeAwayScore : '',
      referee: m.referee || '',
      xgHomeFT: st.xgHomeFT ?? '',
      xgAwayFT: st.xgAwayFT ?? '',
      shotsHomeFT: st.shotsHomeFT ?? '',
      shotsAwayFT: st.shotsAwayFT ?? '',
      shotsOnTargetHomeFT: st.shotsOnTargetHomeFT ?? '',
      shotsOnTargetAwayFT: st.shotsOnTargetAwayFT ?? '',
      foulsHomeFT: st.foulsHomeFT ?? '',
      foulsAwayFT: st.foulsAwayFT ?? '',
      cornersHomeFT: st.cornersHomeFT ?? '',
      cornersAwayFT: st.cornersAwayFT ?? '',
      yellowCardsHomeFT: st.yellowCardsHomeFT ?? '',
      yellowCardsAwayFT: st.yellowCardsAwayFT ?? '',
      redCardsHomeFT: st.redCardsHomeFT ?? '',
      redCardsAwayFT: st.redCardsAwayFT ?? '',
      oddHomeFT: od.homeFT ?? '',
      oddDrawFT: od.drawFT ?? '',
      oddAwayFT: od.awayFT ?? '',
      oddOver25FT: od.over25FT ?? '',
      oddUnder25FT: od.under25FT ?? '',
      haHomeLine: od.asianHandicapHomeLine ?? '',
      haHomeOdd: od.asianHandicapHomeOdd ?? '',
      haAwayLine: od.asianHandicapAwayLine ?? '',
      haAwayOdd: od.asianHandicapAwayOdd ?? '',
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fileName = onlyIncomplete
    ? `jogos_incompletos_${new Date().toISOString().slice(0, 10)}.xlsx`
    : `jogos_consolidados_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadIncompleteMatchesTemplate(
  matches: Match[],
  onlyIncomplete: boolean = true
): Promise<void> {
  return exportMatchesToExcel(matches, onlyIncomplete);
}

export async function downloadMatchImportTemplate(): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Modelo');

  worksheet.columns = [
    { header: 'Pais', key: 'countryName', width: 16 },
    { header: 'Liga', key: 'leagueName', width: 22 },
    { header: 'Data', key: 'matchDate', width: 14 },
    { header: 'Hora', key: 'matchTime', width: 10 },
    { header: 'Mandante', key: 'homeTeamName', width: 22 },
    { header: 'Visitante', key: 'awayTeamName', width: 22 },
    { header: 'Arbitro', key: 'referee', width: 20 },
    { header: 'Odd_Home_FT', key: 'oddHomeFT', width: 14 },
    { header: 'Odd_Draw_FT', key: 'oddDrawFT', width: 14 },
    { header: 'Odd_Away_FT', key: 'oddAwayFT', width: 14 },
    { header: 'Odd_Over25_FT', key: 'oddOver25FT', width: 14 },
    { header: 'Odd_Under25_FT', key: 'oddUnder25FT', width: 14 },
    { header: 'Linha_Handicap_Asiático_Mandante_FT', key: 'haHomeLine', width: 28 },
    { header: 'Odd_Handicap_Asiático_Mandante_FT', key: 'haHomeOdd', width: 28 },
    { header: 'Linha_Handicap_Asiático_Visitante_FT', key: 'haAwayLine', width: 28 },
    { header: 'Odd_Handicap_Asiático_Visitante_FT', key: 'haAwayOdd', width: 28 },
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `modelo_importacao_jogos.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadTeamImportTemplate(leagueName?: string, season?: string): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Times');

  worksheet.columns = [
    { header: 'Time', key: 'time', width: 25 },
    { header: 'URL_Escudo', key: 'urlEscudo', width: 40 },
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fileName = leagueName
    ? `modelo_times_${leagueName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${season || '2026'}.xlsx`
    : `modelo_importacao_times.xlsx`;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function parseExcelOrCsvFile(file: File): Promise<ParsedTeamRow[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const rows: ParsedTeamRow[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const time = String(row.getCell(1).value || '').trim();
    const urlEscudo = String(row.getCell(2).value || '').trim();
    if (time) {
      rows.push({
        rowIndex: rowNumber,
        time,
        urlEscudo,
        isValid: true,
      });
    }
  });
  return rows;
}

export async function parseMatchExcelOrCsvFile(file: File): Promise<ParsedMatchRow[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const rows: ParsedMatchRow[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const countryName = String(row.getCell(1).value || '').trim();
    const leagueName = String(row.getCell(2).value || '').trim();
    const dateStr = String(row.getCell(3).value || '').trim();
    const timeStr = String(row.getCell(4).value || '').trim();
    const homeTeamName = String(row.getCell(5).value || '').trim();
    const awayTeamName = String(row.getCell(6).value || '').trim();
    const referee = String(row.getCell(7).value || '').trim();

    if (homeTeamName && awayTeamName) {
      rows.push({
        rowIndex: rowNumber,
        matchDate: `${dateStr}T${timeStr || '16:00'}:00`,
        countryName,
        leagueName,
        homeTeamName,
        awayTeamName,
        referee,
        notes: '',
        oddHomeFT: parseNumber(row.getCell(8).value),
        oddDrawFT: parseNumber(row.getCell(9).value),
        oddAwayFT: parseNumber(row.getCell(10).value),
        oddOver25FT: parseNumber(row.getCell(11).value),
        oddUnder25FT: parseNumber(row.getCell(12).value),
        asianHandicapHomeLine: parseNumber(row.getCell(13).value),
        asianHandicapHomeOdd: parseNumber(row.getCell(14).value),
        asianHandicapAwayLine: parseNumber(row.getCell(15).value),
        asianHandicapAwayOdd: parseNumber(row.getCell(16).value),
        isValid: true,
      });
    }
  });
  return rows;
}

export async function parseMatchUpdateExcelOrCsvFile(
  file: File,
  existingMatches: Match[]
): Promise<ParsedMatchUpdateRow[]> {
  return parseBulkMatchUpdateExcel(file, existingMatches);
}

/**
 * Faz o parse de arquivo Excel (.xlsx) de atualização em massa
 */
export async function parseBulkMatchUpdateExcel(
  file: File,
  existingMatches: Match[]
): Promise<ParsedMatchUpdateRow[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const headers: string[] = [];
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell, colNumber) => {
    headers[colNumber] = String(cell.value || '').trim();
  });

  const parsedRows: ParsedMatchUpdateRow[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const rowData: Record<string, any> = {};
    row.eachCell((cell, colNumber) => {
      const header = headers[colNumber];
      if (header) {
        rowData[header] = cell.value;
      }
    });

    const countryName = String(rowData['Pais'] || rowData['País'] || '').trim();
    const leagueName = String(rowData['Liga'] || '').trim();
    const homeTeamName = String(rowData['Mandante'] || '').trim();
    const awayTeamName = String(rowData['Visitante'] || '').trim();
    const referee = String(rowData['Arbitro'] || rowData['Árbitro'] || '').trim();

    const homeScore = parseInteger(rowData['Placar_Mandante_FT']);
    const awayScore = parseInteger(rowData['Placar_Visitante_FT']);
    const halftimeHomeScore = parseInteger(rowData['Placar_Mandante_HT']);
    const halftimeAwayScore = parseInteger(rowData['Placar_Visitante_HT']);

    const matchedMatch = existingMatches.find(
      m =>
        (rowData['ID_Jogo'] && m.id === String(rowData['ID_Jogo']).trim()) ||
        (m.homeTeamName.toLowerCase() === homeTeamName.toLowerCase() &&
          m.awayTeamName.toLowerCase() === awayTeamName.toLowerCase())
    );

    const isNewMatch = !matchedMatch;

    parsedRows.push({
      rowIndex: rowNumber,
      matchId: matchedMatch?.id || String(rowData['ID_Jogo'] || '').trim() || undefined,
      matchDate: matchedMatch?.matchDate || '',
      countryName: countryName || matchedMatch?.countryName || '',
      leagueName: leagueName || matchedMatch?.leagueName || '',
      homeTeamName: homeTeamName || matchedMatch?.homeTeamName || '',
      awayTeamName: awayTeamName || matchedMatch?.awayTeamName || '',
      referee: referee || matchedMatch?.referee || '',
      status: homeScore !== null && awayScore !== null ? 'FINALIZADO' : 'AGENDADO',
      matchedMatch,
      isNewMatch,

      homeScore,
      awayScore,
      halftimeHomeScore,
      halftimeAwayScore,

      xgHomeFT: parseNumber(rowData['xG_Mandante_FT']),
      xgAwayFT: parseNumber(rowData['xG_Visitante_FT']),
      shotsHomeFT: parseInteger(rowData['Finalizacoes_Mandante_FT']),
      shotsAwayFT: parseInteger(rowData['Finalizacoes_Visitante_FT']),
      shotsOnTargetHomeFT: parseInteger(rowData['Chutes_Gol_Mandante_FT']),
      shotsOnTargetAwayFT: parseInteger(rowData['Chutes_Gol_Visitante_FT']),
      foulsHomeFT: parseInteger(rowData['Faltas_Mandante_FT']),
      foulsAwayFT: parseInteger(rowData['Faltas_Visitante_FT']),
      cornersHomeFT: parseInteger(rowData['Escanteios_Mandante_FT']),
      cornersAwayFT: parseInteger(rowData['Escanteios_Visitante_FT']),
      yellowCardsHomeFT: parseInteger(rowData['Cartao_Amarelo_Mandante_FT']),
      yellowCardsAwayFT: parseInteger(rowData['Cartao_Amarelo_Visitante_FT']),
      redCardsHomeFT: parseInteger(rowData['Cartao_Vermelho_Mandante_FT']),
      redCardsAwayFT: parseInteger(rowData['Cartao_Vermelho_Visitante_FT']),

      oddHomeFT: parseNumber(rowData['Odd_Home_FT']),
      oddDrawFT: parseNumber(rowData['Odd_Draw_FT']),
      oddAwayFT: parseNumber(rowData['Odd_Away_FT']),
      oddOver25FT: parseNumber(rowData['Odd_Over25_FT']),
      oddUnder25FT: parseNumber(rowData['Odd_Under25_FT']),
      asianHandicapHomeLine: parseNumber(rowData['Linha_Handicap_Asiático_Mandante_FT']),
      asianHandicapHomeOdd: parseNumber(rowData['Odd_Handicap_Asiático_Mandante_FT']),
      asianHandicapAwayLine: parseNumber(rowData['Linha_Handicap_Asiático_Visitante_FT']),
      asianHandicapAwayOdd: parseNumber(rowData['Odd_Handicap_Asiático_Visitante_FT']),

      isValid: Boolean(matchedMatch || (homeTeamName && awayTeamName)),
    });
  });

  return parsedRows;
}
