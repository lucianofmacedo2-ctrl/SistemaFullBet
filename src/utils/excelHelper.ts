import ExcelJS from 'exceljs';
import { Match, MatchStatus, MatchStats, MatchOdds, Team, League, Country } from '../types';

export interface ParsedTeamRow {
  rowIndex: number;
  time: string;
  estadio?: string;
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
  referee?: string;
  stadium?: string;
  stadiumCapacity?: number | null;
  notes?: string;
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
  stadium?: string;
  stadiumCapacity?: number | null;
  attendance?: number | null; // Publico
  status?: MatchStatus;
  notes?: string;
  matchedMatch?: Match;
  isNewMatch?: boolean;

  // Placar e Gols FT e HT
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
  const str = String(val).trim().replace(/\./g, '').replace(',', '.');
  const num = parseInt(str, 10);
  return isNaN(num) ? null : num;
}

function normalizeHeaderKey(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

export const EXCEL_HEADER_ALIASES = {
  country: ['pais', 'país', 'country', 'country_name', 'countryname', 'nacao', 'nação', 'nation', 'pais_nome', 'nome_pais', 'pais_liga', 'paisliga'],
  league: ['liga', 'league', 'league_name', 'leaguename', 'div', 'division', 'divisao', 'divisão', 'competition', 'campeonato', 'torneio', 'nome_liga', 'nomeliga'],
  homeTeam: ['mandante', 'home', 'hometeam', 'home_team', 'time_mandante', 'timemandante', 'clube_mandante', 'clubemandante', 'equipe_mandante', 'equipemandante', 'casa', 'time_casa', 'timecasa', 'clube_casa', 'equipe_casa', 'team_1', 'team1', 'time_1', 'time1', 'ht', 'host'],
  awayTeam: ['visitante', 'away', 'awayteam', 'away_team', 'time_visitante', 'timevisitante', 'clube_visitante', 'clubevisitante', 'equipe_visitante', 'equipevisitante', 'fora', 'time_fora', 'timefora', 'clube_fora', 'equipe_fora', 'team_2', 'team2', 'time_2', 'time2', 'at', 'guest'],
  date: ['data', 'date', 'match_date', 'matchdate', 'data_jogo', 'datajogo', 'dt'],
  time: ['hora', 'time', 'match_time', 'matchtime', 'horario', 'horário', 'hora_jogo', 'horajogo', 'hr'],
  referee: ['arbitro', 'árbitro', 'referee', 'juiz', 'arbitro_jogo'],
  stadium: ['estadio', 'estádio', 'stadium', 'local', 'arena'],
  capacity: ['capacidade', 'capacity', 'capacidade_estadio', 'stadium_capacity'],
  attendance: ['publico', 'público', 'attendance', 'espectadores'],
  matchId: ['id_jogo', 'idjogo', 'match_id', 'matchid', 'id'],
  scoreHomeFT: ['placar_mandante_ft', 'placar_mandante', 'placarmandanteft', 'fthg', 'hg', 'gols_mandante_ft', 'gols_mandante', 'golsmandante', 'home_score_ft', 'home_score', 'homescore', 'fulltimehomegoals'],
  scoreAwayFT: ['placar_visitante_ft', 'placar_visitante', 'placarvisitanteft', 'ftag', 'ag', 'gols_visitante_ft', 'gols_visitante', 'golsvisitante', 'away_score_ft', 'away_score', 'awayscore', 'fulltimeawaygoals'],
  scoreHomeHT: ['placar_mandante_ht', 'placarmandanteht', 'hthg', 'gols_mandante_ht', 'home_score_ht', 'halftimehomegoals'],
  scoreAwayHT: ['placar_visitante_ht', 'placarvisitanteht', 'htag', 'gols_visitante_ht', 'away_score_ht', 'halftimeawaygoals'],
  oddHome: ['odd_home_ft', 'odd_home', 'oddhomeft', 'oddhome', 'odd_1', 'odd1', 'odd_mandante', 'odd_casa', 'b365h', 'b365_h', '1'],
  oddDraw: ['odd_draw_ft', 'odd_draw', 'odddrawft', 'odddraw', 'odd_x', 'oddx', 'odd_empate', 'b365d', 'b365_d', 'x'],
  oddAway: ['odd_away_ft', 'odd_away', 'oddawayft', 'oddaway', 'odd_2', 'odd2', 'odd_visitante', 'odd_fora', 'b365a', 'b365_a', '2'],
  oddOver25: ['odd_over25_ft', 'odd_over_25_ft', 'odd_over25', 'odd_over_25', 'oddover25ft', 'odd_over', 'oddover', 'over25', 'b365>2.5', 'b365_over25', '>2.5'],
  oddUnder25: ['odd_under25_ft', 'odd_under_25_ft', 'odd_under25', 'odd_under_25', 'oddunder25ft', 'odd_under', 'oddunder', 'under25', 'b365<2.5', 'b365_under25', '<2.5'],
  ahHomeLine: ['linha_handicap_asiatico_mandante_ft', 'linha_handicap_asiático_mandante_ft', 'ahh', 'ah_home_line', 'ah_line_home'],
  ahHomeOdd: ['odd_handicap_asiatico_mandante_ft', 'odd_handicap_asiático_mandante_ft', 'b365ahh', 'ah_home_odd', 'ah_odd_home'],
  ahAwayLine: ['linha_handicap_asiatico_visitante_ft', 'linha_handicap_asiático_visitante_ft', 'aha', 'ah_away_line', 'ah_line_away'],
  ahAwayOdd: ['odd_handicap_asiatico_visitante_ft', 'odd_handicap_asiático_visitante_ft', 'b365aha', 'ah_away_odd', 'ah_odd_away'],
  xgHome: ['xg_mandante_ft', 'xg_mandante', 'xg_home_ft', 'xg_home', 'hxg', 'xg_h'],
  xgAway: ['xg_visitante_ft', 'xg_visitante', 'xg_away_ft', 'xg_away', 'axg', 'xg_a'],
  shotsHome: ['finalizacoes_mandante_ft', 'finalizacoes_mandante', 'chutes_mandante', 'shots_home_ft', 'shots_home', 'hs'],
  shotsAway: ['finalizacoes_visitante_ft', 'finalizacoes_visitante', 'chutes_visitante', 'shots_away_ft', 'shots_away', 'as'],
  shotsOnTargetHome: ['chutes_gol_mandante_ft', 'chutes_gol_mandante', 'chutes_no_alvo_mandante', 'shots_on_target_home_ft', 'shots_on_target_home', 'hst'],
  shotsOnTargetAway: ['chutes_gol_visitante_ft', 'chutes_gol_visitante', 'chutes_no_alvo_visitante', 'shots_on_target_away_ft', 'shots_on_target_away', 'ast'],
  foulsHome: ['faltas_mandante_ft', 'faltas_mandante', 'fouls_home_ft', 'fouls_home', 'hf'],
  foulsAway: ['faltas_visitante_ft', 'faltas_visitante', 'fouls_away_ft', 'fouls_away', 'af'],
  cornersHome: ['escanteios_mandante_ft', 'escanteios_mandante', 'cantos_mandante', 'corners_home_ft', 'corners_home', 'hc'],
  cornersAway: ['escanteios_visitante_ft', 'escanteios_visitante', 'cantos_visitante', 'corners_away_ft', 'corners_away', 'ac'],
  yellowHome: ['cartao_amarelo_mandante_ft', 'cartao_amarelo_mandante', 'amarelos_mandante', 'yellow_cards_home_ft', 'yellow_cards_home', 'hy'],
  yellowAway: ['cartao_amarelo_visitante_ft', 'cartao_amarelo_visitante', 'amarelos_visitante', 'yellow_cards_away_ft', 'yellow_cards_away', 'ay'],
  redHome: ['cartao_vermelho_mandante_ft', 'cartao_vermelho_mandante', 'vermelhos_mandante', 'red_cards_home_ft', 'red_cards_home', 'hr'],
  redAway: ['cartao_vermelho_visitante_ft', 'cartao_vermelho_visitante', 'vermelhos_visitante', 'red_cards_away_ft', 'red_cards_away', 'ar']
};

export function getFlexibleValue(
  rowData: Record<string, any>,
  row: ExcelJS.Row | null,
  aliases: string[],
  fallbackCellIndex?: number
): any {
  for (const alias of aliases) {
    const norm = normalizeHeaderKey(alias);
    if (rowData[norm] !== undefined && rowData[norm] !== null && String(rowData[norm]).trim() !== '') {
      return rowData[norm];
    }
    if (rowData[alias] !== undefined && rowData[alias] !== null && String(rowData[alias]).trim() !== '') {
      return rowData[alias];
    }
  }
  if (row && fallbackCellIndex !== undefined) {
    const cellVal = row.getCell(fallbackCellIndex).value;
    if (cellVal !== undefined && cellVal !== null && String(cellVal).trim() !== '') {
      return cellVal;
    }
  }
  return '';
}

function normalizeTextForMatch(text: string): string {
  return (text || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function splitDateTimeForExcel(isoString: string): { date: string; time: string } {
  try {
    if (!isoString) return { date: '', time: '' };

    let year = '';
    let month = '';
    let day = '';
    let hours = '16';
    let mins = '00';

    if (isoString.includes('T')) {
      const [dPart, tPart] = isoString.split('T');
      const dPieces = dPart.split('-');
      if (dPieces.length === 3) {
        year = dPieces[0];
        month = dPieces[1].padStart(2, '0');
        day = dPieces[2].padStart(2, '0');
      }
      if (tPart) {
        const tPieces = tPart.split(':');
        if (tPieces.length >= 2) {
          hours = tPieces[0].padStart(2, '0');
          mins = tPieces[1].slice(0, 2).padStart(2, '0');
        }
      }
    } else if (isoString.includes('-')) {
      const dPieces = isoString.trim().split('-');
      if (dPieces.length === 3) {
        if (dPieces[0].length === 4) {
          year = dPieces[0];
          month = dPieces[1].padStart(2, '0');
          day = dPieces[2].padStart(2, '0');
        } else if (dPieces[2].length === 4) {
          day = dPieces[0].padStart(2, '0');
          month = dPieces[1].padStart(2, '0');
          year = dPieces[2];
        }
      }
    } else if (isoString.includes('/')) {
      const dPieces = isoString.trim().split('/');
      if (dPieces.length === 3) {
        if (dPieces[2].length === 4) {
          day = dPieces[0].padStart(2, '0');
          month = dPieces[1].padStart(2, '0');
          year = dPieces[2];
        } else if (dPieces[0].length === 4) {
          year = dPieces[0];
          month = dPieces[1].padStart(2, '0');
          day = dPieces[2].padStart(2, '0');
        }
      }
    }

    if (year && month && day) {
      return {
        date: `${day}/${month}/${year}`,
        time: `${hours}:${mins}`,
      };
    }

    const d = new Date(isoString);
    if (isNaN(d.getTime())) return { date: '', time: '' };
    const dayStr = String(d.getUTCDate ? d.getUTCDate() : d.getDate()).padStart(2, '0');
    const monStr = String((d.getUTCMonth ? d.getUTCMonth() : d.getMonth()) + 1).padStart(2, '0');
    const yrStr = String(d.getUTCFullYear ? d.getUTCFullYear() : d.getFullYear());
    const hStr = String(d.getHours()).padStart(2, '0');
    const minStr = String(d.getMinutes()).padStart(2, '0');
    return { date: `${dayStr}/${monStr}/${yrStr}`, time: `${hStr}:${minStr}` };
  } catch {
    return { date: '', time: '' };
  }
}

function formatIsoDateTime(dateVal: any, timeVal: any): string {
  let dateStr = '';
  let timeStr = '16:00';

  if (dateVal instanceof Date) {
    const d = dateVal;
    if (!isNaN(d.getTime())) {
      // Use UTC if hours/mins are 0 to prevent date shifting
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dateStr = `${year}-${month}-${day}`;
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      if (hh !== '00' || mm !== '00') {
        timeStr = `${hh}:${mm}`;
      }
    }
  } else if (typeof dateVal === 'number') {
    try {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const d = new Date(excelEpoch.getTime() + dateVal * 86400000);
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      dateStr = `${year}-${month}-${day}`;
    } catch {
      // fallback
    }
  } else if (typeof dateVal === 'string') {
    const raw = dateVal.trim();
    if (raw.includes('/')) {
      const parts = raw.split('/');
      if (parts.length === 3) {
        // DD/MM/YYYY
        if (parts[2].length === 4) {
          dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        } else if (parts[0].length === 4) {
          // YYYY/MM/DD
          dateStr = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        } else {
          // 2-digit year DD/MM/YY
          const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
          dateStr = `${y}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
    } else if (raw.includes('-')) {
      const parts = raw.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          dateStr = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        } else if (parts[2].length === 4) {
          // DD-MM-YYYY
          dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
    } else if (raw.includes('.')) {
      const parts = raw.split('.');
      if (parts.length === 3) {
        if (parts[2].length === 4) {
          // DD.MM.YYYY
          dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
    }
    if (!dateStr && raw.length >= 10) {
      dateStr = raw.slice(0, 10);
    }
  }

  if (timeVal) {
    if (timeVal instanceof Date) {
      const hh = String(timeVal.getHours()).padStart(2, '0');
      const mm = String(timeVal.getMinutes()).padStart(2, '0');
      timeStr = `${hh}:${mm}`;
    } else {
      const tStr = String(timeVal).trim();
      if (tStr.includes(':')) {
        const parts = tStr.split(':');
        timeStr = `${parts[0].padStart(2, '0')}:${parts[1].slice(0, 2).padStart(2, '0')}`;
      }
    }
  }

  if (!dateStr) {
    const now = new Date();
    dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  return `${dateStr}T${timeStr}:00`;
}

export function formatIsoToDDMMYYYY(isoString?: string): string {
  if (!isoString) return '';
  const { date, time } = splitDateTimeForExcel(isoString);
  return time ? `${date} ${time}` : date;
}

export function isMatchComplete(match: Match): boolean {
  if (match.homeScore === null || match.awayScore === null) return false;
  if (match.status !== 'FINALIZADO') return false;
  if (!match.stats?.cornersHomeFT && !match.stats?.shotsHomeFT && !match.stats?.halftimeHomeScore) return false;
  if (!match.odds?.homeFT) return false;
  return true;
}

// -------------------------------------------------------------
// 1. PLANILHA DE JOGOS FUTUROS (PRÉ-JOGO / AGENDADOS)
// -------------------------------------------------------------
export const FUTURE_MATCHES_COLUMNS = [
  'Pais',
  'Liga',
  'Data',
  'Hora',
  'Mandante',
  'Visitante',
  'Odd_Home_FT',
  'Odd_Draw_FT',
  'Odd_Away_FT',
  'Odd_Over25_FT',
  'Odd_Under25_FT',
  'Arbitro',
  'Estadio',
  'Capacidade',
];

/**
 * Baixa o modelo da Planilha de Cadastro de Jogos Futuros (Excel .xlsx ou CSV .csv)
 */
export async function downloadFutureMatchesTemplate(format: 'xlsx' | 'csv' = 'xlsx'): Promise<void> {
  const sampleRows = [
    {
      pais: 'Inglaterra',
      liga: 'Premier League ING',
      data: '29/08/2026',
      hora: '16:00',
      mandante: 'Arsenal',
      visitante: 'Chelsea',
      oddHome: 2.10,
      oddDraw: 3.40,
      oddAway: 3.50,
      oddOver25: 1.85,
      oddUnder25: 1.95,
      arbitro: 'Michael Oliver',
      estadio: 'Emirates Stadium',
      capacidade: 60704,
    },
    {
      pais: 'Espanha',
      liga: 'La Liga 1 ESP',
      data: '30/08/2026',
      hora: '17:00',
      mandante: 'Real Madrid',
      visitante: 'Barcelona',
      oddHome: 2.25,
      oddDraw: 3.60,
      oddAway: 3.00,
      oddOver25: 1.65,
      oddUnder25: 2.20,
      arbitro: 'Jesús Gil Manzano',
      estadio: 'Santiago Bernabéu',
      capacidade: 81044,
    },
    {
      pais: 'Brasil',
      liga: 'Brasileirão Série A',
      data: '30/08/2026',
      hora: '18:30',
      mandante: 'Flamengo',
      visitante: 'Palmeiras',
      oddHome: 2.05,
      oddDraw: 3.25,
      oddAway: 3.80,
      oddOver25: 1.90,
      oddUnder25: 1.90,
      arbitro: 'Wilton Pereira Sampaio',
      estadio: 'Maracanã',
      capacidade: 78838,
    },
  ];

  if (format === 'csv') {
    const csvLines: string[] = [];
    csvLines.push(FUTURE_MATCHES_COLUMNS.join(';'));
    sampleRows.forEach(r => {
      csvLines.push([
        r.pais,
        r.liga,
        r.data,
        r.hora,
        r.mandante,
        r.visitante,
        String(r.oddHome),
        String(r.oddDraw),
        String(r.oddAway),
        String(r.oddOver25),
        String(r.oddUnder25),
        r.arbitro,
        r.estadio,
        String(r.capacidade),
      ].join(';'));
    });

    const csvContent = '\uFEFF' + csvLines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planilha_cadastro_jogos_futuros.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }

  // Excel .xlsx
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Jogos_Futuros');

  worksheet.columns = [
    { header: 'Pais', key: 'pais', width: 18 },
    { header: 'Liga', key: 'liga', width: 26 },
    { header: 'Data', key: 'data', width: 14 },
    { header: 'Hora', key: 'hora', width: 10 },
    { header: 'Mandante', key: 'mandante', width: 24 },
    { header: 'Visitante', key: 'visitante', width: 24 },
    { header: 'Odd_Home_FT', key: 'oddHome', width: 14 },
    { header: 'Odd_Draw_FT', key: 'oddDraw', width: 14 },
    { header: 'Odd_Away_FT', key: 'oddAway', width: 14 },
    { header: 'Odd_Over25_FT', key: 'oddOver25', width: 14 },
    { header: 'Odd_Under25_FT', key: 'oddUnder25', width: 14 },
    { header: 'Arbitro', key: 'arbitro', width: 22 },
    { header: 'Estadio', key: 'estadio', width: 24 },
    { header: 'Capacidade', key: 'capacidade', width: 14 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1D4ED8' }, // Blue 700
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  sampleRows.forEach(r => worksheet.addRow(r));

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `planilha_cadastro_jogos_futuros.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// -------------------------------------------------------------
// 2. PLANILHA DE JOGOS FINALIZADOS (RESULTADOS & STATS)
// -------------------------------------------------------------
export const FINISHED_MATCHES_COLUMNS = [
  'Pais',
  'Liga',
  'Data',
  'Hora',
  'Mandante',
  'Visitante',
  'Placar_Mandante_FT',
  'Placar_Visitante_FT',
  'Placar_Mandante_HT',
  'Placar_Visitante_HT',
  'Arbitro',
  'Estadio',
  'Publico',
  'Capacidade',
  'xG_Mandante_FT',
  'xG_Visitante_FT',
  'Finalizacoes_Mandante_FT',
  'Finalizacoes_Visitante_FT',
  'Chutes_Gol_Mandante_FT',
  'Chutes_Gol_Visitante_FT',
  'Faltas_Mandante_FT',
  'Faltas_Visitante_FT',
  'Escanteios_Mandante_FT',
  'Escanteios_Visitante_FT',
  'Cartao_Amarelo_Mandante_FT',
  'Cartao_Amarelo_Visitante_FT',
  'Cartao_Vermelho_Mandante_FT',
  'Cartao_Vermelho_Visitante_FT',
  'Odd_Home_FT',
  'Odd_Draw_FT',
  'Odd_Away_FT',
  'Odd_Over25_FT',
  'Odd_Under25_FT',
];

/**
 * Baixa o modelo da Planilha de Jogos Finalizados (com opção de pré-preencher com jogos agendados/futuros)
 */
export async function downloadFinishedMatchesTemplate(
  matches: Match[] = [],
  format: 'xlsx' | 'csv' = 'xlsx',
  mode: 'all' | 'future_only' | 'empty_samples' = 'empty_samples'
): Promise<void> {
  let targetMatches: Match[] = [];

  if (mode === 'future_only') {
    targetMatches = matches.filter(m => m.status === 'AGENDADO' || m.homeScore === null || m.awayScore === null);
  } else if (mode === 'all') {
    targetMatches = matches;
  }

  const sampleRows = [
    {
      pais: 'Inglaterra',
      liga: 'Premier League ING',
      data: '23/08/2026',
      hora: '16:00',
      mandante: 'Arsenal',
      visitante: 'Chelsea',
      placarMandanteFT: 2,
      placarVisitanteFT: 1,
      placarMandanteHT: 1,
      placarVisitanteHT: 0,
      arbitro: 'Michael Oliver',
      estadio: 'Emirates Stadium',
      publico: 60214,
      capacidade: 60704,
      xgMandanteFT: 2.15,
      xgVisitanteFT: 1.08,
      finalizacoesMandanteFT: 15,
      finalizacoesVisitanteFT: 9,
      chutesGolMandanteFT: 6,
      chutesGolVisitanteFT: 3,
      faltasMandanteFT: 11,
      faltasVisitanteFT: 14,
      escanteiosMandanteFT: 7,
      escanteiosVisitanteFT: 4,
      cartaoAmareloMandanteFT: 2,
      cartaoAmareloVisitanteFT: 3,
      cartaoVermelhoMandanteFT: 0,
      cartaoVermelhoVisitanteFT: 0,
      oddHomeFT: 2.10,
      oddDrawFT: 3.40,
      oddAwayFT: 3.50,
      oddOver25FT: 1.85,
      oddUnder25FT: 1.95,
    },
    {
      pais: 'Espanha',
      liga: 'La Liga 1 ESP',
      data: '23/08/2026',
      hora: '17:00',
      mandante: 'Real Madrid',
      visitante: 'Barcelona',
      placarMandanteFT: 3,
      placarVisitanteFT: 2,
      placarMandanteHT: 1,
      placarVisitanteHT: 1,
      arbitro: 'Jesús Gil Manzano',
      estadio: 'Santiago Bernabéu',
      publico: 79850,
      capacidade: 81044,
      xgMandanteFT: 2.45,
      xgVisitanteFT: 1.80,
      finalizacoesMandanteFT: 18,
      finalizacoesVisitanteFT: 14,
      chutesGolMandanteFT: 8,
      chutesGolVisitanteFT: 5,
      faltasMandanteFT: 13,
      faltasVisitanteFT: 16,
      escanteiosMandanteFT: 8,
      escanteiosVisitanteFT: 6,
      cartaoAmareloMandanteFT: 3,
      cartaoAmareloVisitanteFT: 4,
      cartaoVermelhoMandanteFT: 0,
      cartaoVermelhoVisitanteFT: 0,
      oddHomeFT: 2.25,
      oddDrawFT: 3.60,
      oddAwayFT: 3.00,
      oddOver25FT: 1.65,
      oddUnder25FT: 2.20,
    },
  ];

  if (format === 'csv') {
    const csvLines: string[] = [];
    csvLines.push(FINISHED_MATCHES_COLUMNS.join(';'));

    if (targetMatches.length > 0) {
      targetMatches.forEach(m => {
        const { date, time } = splitDateTimeForExcel(m.matchDate);
        const st = m.stats || {};
        const od = m.odds || {};
        csvLines.push([
          m.countryName || '',
          m.leagueName || '',
          date,
          time,
          m.homeTeamName || '',
          m.awayTeamName || '',
          m.homeScore !== null && m.homeScore !== undefined ? String(m.homeScore) : '',
          m.awayScore !== null && m.awayScore !== undefined ? String(m.awayScore) : '',
          st.halftimeHomeScore !== null && st.halftimeHomeScore !== undefined ? String(st.halftimeHomeScore) : '',
          st.halftimeAwayScore !== null && st.halftimeAwayScore !== undefined ? String(st.halftimeAwayScore) : '',
          m.referee || '',
          m.stadium || '',
          m.attendance !== null && m.attendance !== undefined ? String(m.attendance) : '',
          m.stadiumCapacity !== null && m.stadiumCapacity !== undefined ? String(m.stadiumCapacity) : '',
          st.xgHomeFT !== null && st.xgHomeFT !== undefined ? String(st.xgHomeFT) : '',
          st.xgAwayFT !== null && st.xgAwayFT !== undefined ? String(st.xgAwayFT) : '',
          st.shotsHomeFT !== null && st.shotsHomeFT !== undefined ? String(st.shotsHomeFT) : '',
          st.shotsAwayFT !== null && st.shotsAwayFT !== undefined ? String(st.shotsAwayFT) : '',
          st.shotsOnTargetHomeFT !== null && st.shotsOnTargetHomeFT !== undefined ? String(st.shotsOnTargetHomeFT) : '',
          st.shotsOnTargetAwayFT !== null && st.shotsOnTargetAwayFT !== undefined ? String(st.shotsOnTargetAwayFT) : '',
          st.foulsHomeFT !== null && st.foulsHomeFT !== undefined ? String(st.foulsHomeFT) : '',
          st.foulsAwayFT !== null && st.foulsAwayFT !== undefined ? String(st.foulsAwayFT) : '',
          st.cornersHomeFT !== null && st.cornersHomeFT !== undefined ? String(st.cornersHomeFT) : '',
          st.cornersAwayFT !== null && st.cornersAwayFT !== undefined ? String(st.cornersAwayFT) : '',
          st.yellowCardsHomeFT !== null && st.yellowCardsHomeFT !== undefined ? String(st.yellowCardsHomeFT) : '',
          st.yellowCardsAwayFT !== null && st.yellowCardsAwayFT !== undefined ? String(st.yellowCardsAwayFT) : '',
          st.redCardsHomeFT !== null && st.redCardsHomeFT !== undefined ? String(st.redCardsHomeFT) : '',
          st.redCardsAwayFT !== null && st.redCardsAwayFT !== undefined ? String(st.redCardsAwayFT) : '',
          od.homeFT !== null && od.homeFT !== undefined ? String(od.homeFT) : '',
          od.drawFT !== null && od.drawFT !== undefined ? String(od.drawFT) : '',
          od.awayFT !== null && od.awayFT !== undefined ? String(od.awayFT) : '',
          od.over25FT !== null && od.over25FT !== undefined ? String(od.over25FT) : '',
          od.under25FT !== null && od.under25FT !== undefined ? String(od.under25FT) : '',
        ].join(';'));
      });
    } else {
      sampleRows.forEach(r => {
        csvLines.push(Object.values(r).map(v => (v !== null && v !== undefined ? String(v) : '')).join(';'));
      });
    }

    const csvContent = '\uFEFF' + csvLines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planilha_jogos_finalizados_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }

  // Excel .xlsx
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Jogos_Finalizados');

  worksheet.columns = [
    { header: 'Pais', key: 'pais', width: 18 },
    { header: 'Liga', key: 'liga', width: 24 },
    { header: 'Data', key: 'data', width: 14 },
    { header: 'Hora', key: 'hora', width: 10 },
    { header: 'Mandante', key: 'mandante', width: 24 },
    { header: 'Visitante', key: 'visitante', width: 24 },
    { header: 'Placar_Mandante_FT', key: 'placarMandanteFT', width: 18 },
    { header: 'Placar_Visitante_FT', key: 'placarVisitanteFT', width: 18 },
    { header: 'Placar_Mandante_HT', key: 'placarMandanteHT', width: 18 },
    { header: 'Placar_Visitante_HT', key: 'placarVisitanteHT', width: 18 },
    { header: 'Arbitro', key: 'arbitro', width: 22 },
    { header: 'Estadio', key: 'estadio', width: 22 },
    { header: 'Publico', key: 'publico', width: 14 },
    { header: 'Capacidade', key: 'capacidade', width: 14 },
    { header: 'xG_Mandante_FT', key: 'xgMandanteFT', width: 16 },
    { header: 'xG_Visitante_FT', key: 'xgVisitanteFT', width: 16 },
    { header: 'Finalizacoes_Mandante_FT', key: 'finalizacoesMandanteFT', width: 22 },
    { header: 'Finalizacoes_Visitante_FT', key: 'finalizacoesVisitanteFT', width: 22 },
    { header: 'Chutes_Gol_Mandante_FT', key: 'chutesGolMandanteFT', width: 22 },
    { header: 'Chutes_Gol_Visitante_FT', key: 'chutesGolVisitanteFT', width: 22 },
    { header: 'Faltas_Mandante_FT', key: 'faltasMandanteFT', width: 18 },
    { header: 'Faltas_Visitante_FT', key: 'faltasVisitanteFT', width: 18 },
    { header: 'Escanteios_Mandante_FT', key: 'escanteiosMandanteFT', width: 22 },
    { header: 'Escanteios_Visitante_FT', key: 'escanteiosVisitanteFT', width: 22 },
    { header: 'Cartao_Amarelo_Mandante_FT', key: 'cartaoAmareloMandanteFT', width: 24 },
    { header: 'Cartao_Amarelo_Visitante_FT', key: 'cartaoAmareloVisitanteFT', width: 24 },
    { header: 'Cartao_Vermelho_Mandante_FT', key: 'cartaoVermelhoMandanteFT', width: 24 },
    { header: 'Cartao_Vermelho_Visitante_FT', key: 'cartaoVermelhoVisitanteFT', width: 24 },
    { header: 'Odd_Home_FT', key: 'oddHomeFT', width: 14 },
    { header: 'Odd_Draw_FT', key: 'oddDrawFT', width: 14 },
    { header: 'Odd_Away_FT', key: 'oddAwayFT', width: 14 },
    { header: 'Odd_Over25_FT', key: 'oddOver25FT', width: 14 },
    { header: 'Odd_Under25_FT', key: 'oddUnder25FT', width: 14 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F766E' }, // Teal 700
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  if (targetMatches.length > 0) {
    targetMatches.forEach(m => {
      const { date, time } = splitDateTimeForExcel(m.matchDate);
      const st = m.stats || {};
      const od = m.odds || {};
      worksheet.addRow({
        pais: m.countryName || '',
        liga: m.leagueName || '',
        data: date,
        hora: time,
        mandante: m.homeTeamName || '',
        visitante: m.awayTeamName || '',
        placarMandanteFT: m.homeScore !== null && m.homeScore !== undefined ? m.homeScore : '',
        placarVisitanteFT: m.awayScore !== null && m.awayScore !== undefined ? m.awayScore : '',
        placarMandanteHT: st.halftimeHomeScore !== null && st.halftimeHomeScore !== undefined ? st.halftimeHomeScore : '',
        placarVisitanteHT: st.halftimeAwayScore !== null && st.halftimeAwayScore !== undefined ? st.halftimeAwayScore : '',
        arbitro: m.referee || '',
        estadio: m.stadium || '',
        publico: m.attendance !== null && m.attendance !== undefined ? m.attendance : '',
        capacidade: m.stadiumCapacity !== null && m.stadiumCapacity !== undefined ? m.stadiumCapacity : '',
        xgMandanteFT: st.xgHomeFT ?? '',
        xgVisitanteFT: st.xgAwayFT ?? '',
        finalizacoesMandanteFT: st.shotsHomeFT ?? '',
        finalizacoesVisitanteFT: st.shotsAwayFT ?? '',
        chutesGolMandanteFT: st.shotsOnTargetHomeFT ?? '',
        chutesGolVisitanteFT: st.shotsOnTargetAwayFT ?? '',
        faltasMandanteFT: st.foulsHomeFT ?? '',
        faltasVisitanteFT: st.foulsAwayFT ?? '',
        escanteiosMandanteFT: st.cornersHomeFT ?? '',
        escanteiosVisitanteFT: st.cornersAwayFT ?? '',
        cartaoAmareloMandanteFT: st.yellowCardsHomeFT ?? '',
        cartaoAmareloVisitanteFT: st.yellowCardsAwayFT ?? '',
        cartaoVermelhoMandanteFT: st.redCardsHomeFT ?? '',
        cartaoVermelhoVisitanteFT: st.redCardsAwayFT ?? '',
        oddHomeFT: od.homeFT ?? '',
        oddDrawFT: od.drawFT ?? '',
        oddAwayFT: od.awayFT ?? '',
        oddOver25FT: od.over25FT ?? '',
        oddUnder25FT: od.under25FT ?? '',
      });
    });
  } else {
    sampleRows.forEach(r => worksheet.addRow(r));
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `planilha_jogos_finalizados_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// -------------------------------------------------------------
// 3. PARSERS FOR JOGOS FUTUROS (EXCEL / CSV / TEXT)
// -------------------------------------------------------------

export async function parseMatchExcelOrCsvFile(file: File): Promise<ParsedMatchRow[]> {
  const fileName = file.name.toLowerCase();
  if (fileName.endsWith('.csv') || file.type.includes('csv') || file.type.includes('text')) {
    const text = await file.text();
    return parseFutureMatchesText(text);
  }

  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const headers: string[] = [];
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell, colNumber) => {
    headers[colNumber] = normalizeHeaderKey(String(cell.value || ''));
  });

  const rows: ParsedMatchRow[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const rowData: Record<string, any> = {};
    row.eachCell((cell, colNumber) => {
      const headerKey = headers[colNumber];
      if (headerKey) {
        rowData[headerKey] = cell.value;
      }
    });

    const countryName = String(
      getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.country, 1) || ''
    ).trim();
    const leagueName = String(
      getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.league, 2) || ''
    ).trim();
    const dateVal = getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.date, 3);
    const timeVal = getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.time, 4);
    const homeTeamName = String(
      getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.homeTeam, 5) || ''
    ).trim();
    const awayTeamName = String(
      getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.awayTeam, 6) || ''
    ).trim();
    const referee = String(
      getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.referee, 12) || ''
    ).trim();
    const stadium = String(
      getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.stadium, 13) || ''
    ).trim();
    const stadiumCapacity = parseInteger(
      getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.capacity, 14)
    );

    const oddHomeFT = parseNumber(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.oddHome, 7));
    const oddDrawFT = parseNumber(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.oddDraw, 8));
    const oddAwayFT = parseNumber(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.oddAway, 9));
    const oddOver25FT = parseNumber(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.oddOver25, 10));
    const oddUnder25FT = parseNumber(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.oddUnder25, 11));

    const ahHomeLine = parseNumber(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.ahHomeLine));
    const ahHomeOdd = parseNumber(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.ahHomeOdd));
    let ahAwayLine = parseNumber(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.ahAwayLine));
    if (ahAwayLine === null && ahHomeLine !== null) {
      ahAwayLine = -ahHomeLine;
    }
    const ahAwayOdd = parseNumber(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.ahAwayOdd));

    if (homeTeamName && awayTeamName) {
      const matchDateIso = formatIsoDateTime(dateVal, timeVal);
      rows.push({
        rowIndex: rowNumber,
        matchDate: matchDateIso,
        countryName: countryName || 'Outro',
        leagueName: leagueName || 'Liga Principal',
        homeTeamName,
        awayTeamName,
        referee,
        stadium,
        stadiumCapacity,
        notes: '',
        oddHomeFT,
        oddDrawFT,
        oddAwayFT,
        oddOver25FT,
        oddUnder25FT,
        asianHandicapHomeLine: ahHomeLine,
        asianHandicapHomeOdd: ahHomeOdd,
        asianHandicapAwayLine: ahAwayLine,
        asianHandicapAwayOdd: ahAwayOdd,
        isValid: true,
      });
    }
  });

  return rows;
}

export function parseFutureMatchesText(rawText: string): ParsedMatchRow[] {
  const lines = rawText.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];

  const delimiter = lines[0].includes(';') ? ';' : lines[0].includes('\t') ? '\t' : ',';
  const headers = lines[0].split(delimiter).map(h => normalizeHeaderKey(h.replace(/^["']|["']$/g, '')));

  const rows: ParsedMatchRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(delimiter).map(c => c.replace(/^["']|["']$/g, '').trim());
    if (cells.length === 0 || cells.every(c => c === '')) continue;

    const rowData: Record<string, string> = {};
    headers.forEach((h, idx) => {
      if (h) rowData[h] = cells[idx] || '';
    });

    const countryName = String(
      getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.country) || cells[0] || ''
    ).trim();
    const leagueName = String(
      getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.league) || cells[1] || ''
    ).trim();
    const dateVal = getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.date) || cells[2] || '';
    const timeVal = getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.time) || cells[3] || '';
    const homeTeamName = String(
      getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.homeTeam) || cells[4] || ''
    ).trim();
    const awayTeamName = String(
      getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.awayTeam) || cells[5] || ''
    ).trim();
    const referee = String(
      getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.referee) || cells[11] || ''
    ).trim();
    const stadium = String(
      getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.stadium) || cells[12] || ''
    ).trim();
    const stadiumCapacity = parseInteger(
      getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.capacity) || cells[13]
    );

    const oddHomeFT = parseNumber(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.oddHome) || cells[6]);
    const oddDrawFT = parseNumber(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.oddDraw) || cells[7]);
    const oddAwayFT = parseNumber(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.oddAway) || cells[8]);
    const oddOver25FT = parseNumber(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.oddOver25) || cells[9]);
    const oddUnder25FT = parseNumber(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.oddUnder25) || cells[10]);

    const ahHomeLine = parseNumber(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.ahHomeLine));
    const ahHomeOdd = parseNumber(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.ahHomeOdd));
    let ahAwayLine = parseNumber(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.ahAwayLine));
    if (ahAwayLine === null && ahHomeLine !== null) {
      ahAwayLine = -ahHomeLine;
    }
    const ahAwayOdd = parseNumber(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.ahAwayOdd));

    if (homeTeamName && awayTeamName) {
      const matchDateIso = formatIsoDateTime(dateVal, timeVal);
      rows.push({
        rowIndex: i + 1,
        matchDate: matchDateIso,
        countryName: countryName || 'Outro',
        leagueName: leagueName || 'Liga Principal',
        homeTeamName,
        awayTeamName,
        referee,
        stadium,
        stadiumCapacity,
        notes: '',
        oddHomeFT,
        oddDrawFT,
        oddAwayFT,
        oddOver25FT,
        oddUnder25FT,
        asianHandicapHomeLine: ahHomeLine,
        asianHandicapHomeOdd: ahHomeOdd,
        asianHandicapAwayLine: ahAwayLine,
        asianHandicapAwayOdd: ahAwayOdd,
        isValid: true,
      });
    }
  }

  return rows;
}

// -------------------------------------------------------------
// 4. PARSERS FOR JOGOS FINALIZADOS (RESULTADOS & STATS & AUTO-MERGE)
// -------------------------------------------------------------

export function findMatchingMatch(
  homeTeamName: string,
  awayTeamName: string,
  matchDateIso: string,
  matchId: string | undefined,
  existingMatches: Match[]
): Match | undefined {
  if (matchId) {
    const foundById = existingMatches.find(m => m.id === matchId);
    if (foundById) return foundById;
  }

  const normHome = normalizeTextForMatch(homeTeamName);
  const normAway = normalizeTextForMatch(awayTeamName);
  const matchDateYmd = matchDateIso ? matchDateIso.slice(0, 10) : '';

  // 1. Exact match by normalized team names AND date
  if (matchDateYmd) {
    const exactMatch = existingMatches.find(m => {
      const h = normalizeTextForMatch(m.homeTeamName);
      const a = normalizeTextForMatch(m.awayTeamName);
      const mYmd = m.matchDate ? m.matchDate.slice(0, 10) : '';
      return h === normHome && a === normAway && mYmd === matchDateYmd;
    });
    if (exactMatch) return exactMatch;
  }

  // 2. Future/Scheduled match by team names (status === 'AGENDADO' or incomplete scores) to update when results arrive
  const scheduledMatch = existingMatches.find(m => {
    const h = normalizeTextForMatch(m.homeTeamName);
    const a = normalizeTextForMatch(m.awayTeamName);
    const isUnfinished = m.status === 'AGENDADO' || m.homeScore === null || m.awayScore === null;
    return h === normHome && a === normAway && isUnfinished;
  });
  if (scheduledMatch) return scheduledMatch;

  // 3. Fallback only if no date was provided and there is an unfinished match between the teams
  if (!matchDateYmd) {
    const anyUnfinished = existingMatches.find(m => {
      const h = normalizeTextForMatch(m.homeTeamName);
      const a = normalizeTextForMatch(m.awayTeamName);
      return h === normHome && a === normAway && (m.homeScore === null || m.awayScore === null);
    });
    if (anyUnfinished) return anyUnfinished;
  }

  return undefined;
}

export async function parseBulkMatchUpdateExcel(
  file: File,
  existingMatches: Match[]
): Promise<ParsedMatchUpdateRow[]> {
  const fileName = file.name.toLowerCase();
  if (fileName.endsWith('.csv') || file.type.includes('csv') || file.type.includes('text')) {
    const text = await file.text();
    return parseFinishedMatchesText(text, existingMatches);
  }

  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const headers: string[] = [];
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell, colNumber) => {
    headers[colNumber] = normalizeHeaderKey(String(cell.value || ''));
  });

  const parsedRows: ParsedMatchUpdateRow[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const rowData: Record<string, any> = {};
    row.eachCell((cell, colNumber) => {
      const headerKey = headers[colNumber];
      if (headerKey) {
        rowData[headerKey] = cell.value;
      }
    });

    const countryName = String(
      getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.country, 1) || ''
    ).trim();
    const leagueName = String(
      getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.league, 2) || ''
    ).trim();
    const dateVal = getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.date, 3);
    const timeVal = getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.time, 4);
    const homeTeamName = String(
      getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.homeTeam, 5) || ''
    ).trim();
    const awayTeamName = String(
      getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.awayTeam, 6) || ''
    ).trim();

    const homeScore = parseInteger(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.scoreHomeFT, 7));
    const awayScore = parseInteger(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.scoreAwayFT, 8));
    const halftimeHomeScore = parseInteger(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.scoreHomeHT, 9));
    const halftimeAwayScore = parseInteger(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.scoreAwayHT, 10));

    const referee = String(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.referee, 11) || '').trim();
    const stadium = String(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.stadium, 12) || '').trim();
    const attendance = parseInteger(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.attendance, 13));
    const stadiumCapacity = parseInteger(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.capacity, 14));

    const xgHomeFT = parseNumber(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.xgHome, 15));
    const xgAwayFT = parseNumber(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.xgAway, 16));
    const shotsHomeFT = parseInteger(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.shotsHome, 17));
    const shotsAwayFT = parseInteger(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.shotsAway, 18));
    const shotsOnTargetHomeFT = parseInteger(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.shotsOnTargetHome, 19));
    const shotsOnTargetAwayFT = parseInteger(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.shotsOnTargetAway, 20));
    const foulsHomeFT = parseInteger(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.foulsHome, 21));
    const foulsAwayFT = parseInteger(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.foulsAway, 22));
    const cornersHomeFT = parseInteger(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.cornersHome, 23));
    const cornersAwayFT = parseInteger(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.cornersAway, 24));
    const yellowCardsHomeFT = parseInteger(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.yellowHome, 25));
    const yellowCardsAwayFT = parseInteger(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.yellowAway, 26));
    const redCardsHomeFT = parseInteger(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.redHome, 27));
    const redCardsAwayFT = parseInteger(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.redAway, 28));

    const oddHomeFT = parseNumber(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.oddHome, 29));
    const oddDrawFT = parseNumber(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.oddDraw, 30));
    const oddAwayFT = parseNumber(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.oddAway, 31));
    const oddOver25FT = parseNumber(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.oddOver25, 32));
    const oddUnder25FT = parseNumber(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.oddUnder25, 33));

    const ahHomeLine = parseNumber(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.ahHomeLine));
    const ahHomeOdd = parseNumber(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.ahHomeOdd));
    let ahAwayLine = parseNumber(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.ahAwayLine));
    if (ahAwayLine === null && ahHomeLine !== null) {
      ahAwayLine = -ahHomeLine;
    }
    const ahAwayOdd = parseNumber(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.ahAwayOdd));

    const matchDateIso = formatIsoDateTime(dateVal, timeVal);
    const matchId = String(getFlexibleValue(rowData, row, EXCEL_HEADER_ALIASES.matchId) || '').trim() || undefined;

    const matchedMatch = findMatchingMatch(
      homeTeamName,
      awayTeamName,
      matchDateIso,
      matchId,
      existingMatches
    );

    const isNewMatch = !matchedMatch;

    if (homeTeamName && awayTeamName) {
      parsedRows.push({
        rowIndex: rowNumber,
        matchId: matchedMatch?.id || matchId,
        matchDate: matchedMatch?.matchDate || matchDateIso,
        countryName: countryName || matchedMatch?.countryName || 'Outro',
        leagueName: leagueName || matchedMatch?.leagueName || 'Liga Principal',
        homeTeamName: homeTeamName || matchedMatch?.homeTeamName || '',
        awayTeamName: awayTeamName || matchedMatch?.awayTeamName || '',
        referee: referee || matchedMatch?.referee || '',
        stadium: stadium || matchedMatch?.stadium || '',
        stadiumCapacity: stadiumCapacity ?? matchedMatch?.stadiumCapacity ?? null,
        attendance: attendance ?? matchedMatch?.attendance ?? null,
        status: homeScore !== null && awayScore !== null ? 'FINALIZADO' : 'AGENDADO',
        matchedMatch,
        isNewMatch,

        homeScore,
        awayScore,
        halftimeHomeScore,
        halftimeAwayScore,

        xgHomeFT,
        xgAwayFT,
        shotsHomeFT,
        shotsAwayFT,
        shotsOnTargetHomeFT,
        shotsOnTargetAwayFT,
        foulsHomeFT,
        foulsAwayFT,
        cornersHomeFT,
        cornersAwayFT,
        yellowCardsHomeFT,
        yellowCardsAwayFT,
        redCardsHomeFT,
        redCardsAwayFT,

        oddHomeFT,
        oddDrawFT,
        oddAwayFT,
        oddOver25FT,
        oddUnder25FT,

        isValid: true,
      });
    }
  });

  return parsedRows;
}

export function parseFinishedMatchesText(
  rawText: string,
  existingMatches: Match[]
): ParsedMatchUpdateRow[] {
  const lines = rawText.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];

  const delimiter = lines[0].includes(';') ? ';' : lines[0].includes('\t') ? '\t' : ',';
  const headers = lines[0].split(delimiter).map(h => normalizeHeaderKey(h.replace(/^["']|["']$/g, '')));

  const parsedRows: ParsedMatchUpdateRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(delimiter).map(c => c.replace(/^["']|["']$/g, '').trim());
    if (cells.length === 0 || cells.every(c => c === '')) continue;

    const rowData: Record<string, string> = {};
    headers.forEach((h, idx) => {
      if (h) rowData[h] = cells[idx] || '';
    });

    const countryName = String(
      getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.country) || cells[0] || ''
    ).trim();
    const leagueName = String(
      getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.league) || cells[1] || ''
    ).trim();
    const dateVal = getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.date) || cells[2] || '';
    const timeVal = getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.time) || cells[3] || '';
    const homeTeamName = String(
      getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.homeTeam) || cells[4] || ''
    ).trim();
    const awayTeamName = String(
      getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.awayTeam) || cells[5] || ''
    ).trim();

    const homeScore = parseInteger(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.scoreHomeFT) || cells[6]);
    const awayScore = parseInteger(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.scoreAwayFT) || cells[7]);
    const halftimeHomeScore = parseInteger(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.scoreHomeHT) || cells[8]);
    const halftimeAwayScore = parseInteger(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.scoreAwayHT) || cells[9]);

    const referee = String(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.referee) || cells[10] || '').trim();
    const stadium = String(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.stadium) || cells[11] || '').trim();
    const attendance = parseInteger(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.attendance) || cells[12]);
    const stadiumCapacity = parseInteger(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.capacity) || cells[13]);

    const xgHomeFT = parseNumber(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.xgHome) || cells[14]);
    const xgAwayFT = parseNumber(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.xgAway) || cells[15]);
    const shotsHomeFT = parseInteger(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.shotsHome) || cells[16]);
    const shotsAwayFT = parseInteger(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.shotsAway) || cells[17]);
    const shotsOnTargetHomeFT = parseInteger(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.shotsOnTargetHome) || cells[18]);
    const shotsOnTargetAwayFT = parseInteger(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.shotsOnTargetAway) || cells[19]);
    const foulsHomeFT = parseInteger(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.foulsHome) || cells[20]);
    const foulsAwayFT = parseInteger(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.foulsAway) || cells[21]);
    const cornersHomeFT = parseInteger(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.cornersHome) || cells[22]);
    const cornersAwayFT = parseInteger(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.cornersAway) || cells[23]);
    const yellowCardsHomeFT = parseInteger(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.yellowHome) || cells[24]);
    const yellowCardsAwayFT = parseInteger(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.yellowAway) || cells[25]);
    const redCardsHomeFT = parseInteger(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.redHome) || cells[26]);
    const redCardsAwayFT = parseInteger(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.redAway) || cells[27]);

    const oddHomeFT = parseNumber(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.oddHome) || cells[28]);
    const oddDrawFT = parseNumber(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.oddDraw) || cells[29]);
    const oddAwayFT = parseNumber(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.oddAway) || cells[30]);
    const oddOver25FT = parseNumber(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.oddOver25) || cells[31]);
    const oddUnder25FT = parseNumber(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.oddUnder25) || cells[32]);

    const ahHomeLine = parseNumber(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.ahHomeLine));
    const ahHomeOdd = parseNumber(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.ahHomeOdd));
    let ahAwayLine = parseNumber(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.ahAwayLine));
    if (ahAwayLine === null && ahHomeLine !== null) {
      ahAwayLine = -ahHomeLine;
    }
    const ahAwayOdd = parseNumber(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.ahAwayOdd));

    const matchDateIso = formatIsoDateTime(dateVal, timeVal);
    const matchId = String(getFlexibleValue(rowData, null, EXCEL_HEADER_ALIASES.matchId) || '').trim() || undefined;

    const matchedMatch = findMatchingMatch(
      homeTeamName,
      awayTeamName,
      matchDateIso,
      matchId,
      existingMatches
    );

    const isNewMatch = !matchedMatch;

    if (homeTeamName && awayTeamName) {
      parsedRows.push({
        rowIndex: i + 1,
        matchId: matchedMatch?.id || matchId,
        matchDate: matchedMatch?.matchDate || matchDateIso,
        countryName: countryName || matchedMatch?.countryName || 'Outro',
        leagueName: leagueName || matchedMatch?.leagueName || 'Liga Principal',
        homeTeamName: homeTeamName || matchedMatch?.homeTeamName || '',
        awayTeamName: awayTeamName || matchedMatch?.awayTeamName || '',
        referee: referee || matchedMatch?.referee || '',
        stadium: stadium || matchedMatch?.stadium || '',
        stadiumCapacity: stadiumCapacity ?? matchedMatch?.stadiumCapacity ?? null,
        attendance: attendance ?? matchedMatch?.attendance ?? null,
        status: homeScore !== null && awayScore !== null ? 'FINALIZADO' : 'AGENDADO',
        matchedMatch,
        isNewMatch,

        homeScore,
        awayScore,
        halftimeHomeScore,
        halftimeAwayScore,

        xgHomeFT,
        xgAwayFT,
        shotsHomeFT,
        shotsAwayFT,
        shotsOnTargetHomeFT,
        shotsOnTargetAwayFT,
        foulsHomeFT,
        foulsAwayFT,
        cornersHomeFT,
        cornersAwayFT,
        yellowCardsHomeFT,
        yellowCardsAwayFT,
        redCardsHomeFT,
        redCardsAwayFT,

        oddHomeFT,
        oddDrawFT,
        oddAwayFT,
        oddOver25FT,
        oddUnder25FT,
        asianHandicapHomeLine: ahHomeLine,
        asianHandicapHomeOdd: ahHomeOdd,
        asianHandicapAwayLine: ahAwayLine,
        asianHandicapAwayOdd: ahAwayOdd,

        isValid: true,
      });
    }
  }

  return parsedRows;
}

export async function parseMatchUpdateExcelOrCsvFile(
  file: File,
  existingMatches: Match[]
): Promise<ParsedMatchUpdateRow[]> {
  return parseBulkMatchUpdateExcel(file, existingMatches);
}

// -------------------------------------------------------------
// 5. LEGACY EXPORTS & BACKWARDS COMPATIBILITY
// -------------------------------------------------------------

export async function exportMatchesToExcel(
  matches: Match[],
  onlyIncomplete: boolean = false
): Promise<void> {
  return downloadFinishedMatchesTemplate(
    matches,
    'xlsx',
    onlyIncomplete ? 'future_only' : 'all'
  );
}

export async function downloadIncompleteMatchesTemplate(
  matches: Match[],
  onlyIncomplete: boolean = true
): Promise<void> {
  return downloadFinishedMatchesTemplate(
    matches,
    'xlsx',
    onlyIncomplete ? 'future_only' : 'all'
  );
}

export async function downloadMatchImportTemplate(): Promise<void> {
  return downloadFutureMatchesTemplate('xlsx');
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

export async function exportTeamsToExcel(
  teams: Team[],
  leagues: League[] = [],
  countries: Country[] = [],
  customFileName?: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FUTLFM2 Master System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Relatório de Times', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  worksheet.columns = [
    { header: 'País', key: 'countryName', width: 24 },
    { header: 'Liga', key: 'leagueName', width: 32 },
    { header: 'Nome do Time', key: 'teamName', width: 32 },
    { header: 'ID Time', key: 'teamId', width: 16 },
    { header: 'ID País', key: 'countryId', width: 14 },
    { header: 'ID Liga', key: 'leagueId', width: 14 },
    { header: 'URL Escudo', key: 'logoUrl', width: 45 },
    { header: 'Data de Cadastro', key: 'createdAt', width: 22 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F766E' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 28;

  const countryById = new Map(countries.map(c => [c.id, c.name]));
  const leagueById = new Map(leagues.map(l => [l.id, l.name]));

  const sortedTeams = [...teams].sort((a, b) => {
    const cA = a.countryName || countryById.get(a.countryId) || '';
    const cB = b.countryName || countryById.get(b.countryId) || '';
    const compCountry = cA.localeCompare(cB, 'pt-BR', { sensitivity: 'base' });
    if (compCountry !== 0) return compCountry;

    const lA = a.leagueName || leagueById.get(a.leagueId) || '';
    const lB = b.leagueName || leagueById.get(b.leagueId) || '';
    const compLeague = lA.localeCompare(lB, 'pt-BR', { sensitivity: 'base' });
    if (compLeague !== 0) return compLeague;

    return (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' });
  });

  sortedTeams.forEach((team, index) => {
    const countryName = team.countryName || countryById.get(team.countryId) || '';
    let leagueName = team.leagueName || '';
    if (!leagueName && team.leagueId) {
      leagueName = leagueById.get(team.leagueId) || '';
    }
    if (team.leagueIds && team.leagueIds.length > 0) {
      const allNames = team.leagueIds
        .map(lid => leagueById.get(lid))
        .filter(Boolean);
      if (allNames.length > 0) {
        leagueName = allNames.join(', ');
      }
    }

    const createdFormatted = team.createdAt
      ? new Date(team.createdAt).toLocaleString('pt-BR')
      : '';

    const row = worksheet.addRow({
      countryName: countryName,
      leagueName: leagueName,
      teamName: team.name,
      teamId: team.id,
      countryId: team.countryId || '',
      leagueId: team.leagueId || '',
      logoUrl: team.logoUrl || '',
      createdAt: createdFormatted,
    });

    if (index % 2 === 1) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0FDFA' },
      };
    }
    row.alignment = { vertical: 'middle' };
  });

  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 8 },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fileName = customFileName || `relatorio_times_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportTeamsToCsv(
  teams: Team[],
  leagues: League[] = [],
  countries: Country[] = [],
  customFileName?: string
): void {
  const countryById = new Map(countries.map(c => [c.id, c.name]));
  const leagueById = new Map(leagues.map(l => [l.id, l.name]));

  const sortedTeams = [...teams].sort((a, b) => {
    const cA = a.countryName || countryById.get(a.countryId) || '';
    const cB = b.countryName || countryById.get(b.countryId) || '';
    const compCountry = cA.localeCompare(cB, 'pt-BR', { sensitivity: 'base' });
    if (compCountry !== 0) return compCountry;

    const lA = a.leagueName || leagueById.get(a.leagueId) || '';
    const lB = b.leagueName || leagueById.get(b.leagueId) || '';
    const compLeague = lA.localeCompare(lB, 'pt-BR', { sensitivity: 'base' });
    if (compLeague !== 0) return compLeague;

    return (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' });
  });

  const headers = ['Pais', 'Liga', 'Time', 'ID_Time', 'ID_Pais', 'ID_Liga', 'URL_Escudo', 'Data_Cadastro'];
  const csvRows: string[] = [];
  csvRows.push(headers.join(';'));

  sortedTeams.forEach(team => {
    const countryName = team.countryName || countryById.get(team.countryId) || '';
    let leagueName = team.leagueName || '';
    if (!leagueName && team.leagueId) {
      leagueName = leagueById.get(team.leagueId) || '';
    }
    if (team.leagueIds && team.leagueIds.length > 0) {
      const allNames = team.leagueIds.map(lid => leagueById.get(lid)).filter(Boolean);
      if (allNames.length > 0) leagueName = allNames.join(', ');
    }

    const createdFormatted = team.createdAt ? new Date(team.createdAt).toISOString() : '';
    const escapeCsv = (val: string) => {
      if (val.includes(';') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const row = [
      escapeCsv(countryName),
      escapeCsv(leagueName),
      escapeCsv(team.name),
      escapeCsv(team.id),
      escapeCsv(team.countryId || ''),
      escapeCsv(team.leagueId || ''),
      escapeCsv(team.logoUrl || ''),
      escapeCsv(createdFormatted)
    ];

    csvRows.push(row.join(';'));
  });

  const csvContent = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fileName = customFileName || `relatorio_times_${new Date().toISOString().slice(0, 10)}.csv`;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function parseExcelOrCsvFile(file: File): Promise<ParsedTeamRow[]> {
  const fileName = file.name.toLowerCase();
  if (fileName.endsWith('.csv') || file.type.includes('csv') || file.type.includes('text')) {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return [];
    const delimiter = lines[0].includes(';') ? ';' : lines[0].includes('\t') ? '\t' : ',';
    const headers = lines[0].split(delimiter).map(h => normalizeHeaderKey(h.replace(/^["']|["']$/g, '')));
    const rows: ParsedTeamRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(delimiter).map(c => c.replace(/^["']|["']$/g, '').trim());
      if (cells.length === 0 || cells.every(c => c === '')) continue;
      const rowData: Record<string, string> = {};
      headers.forEach((h, idx) => {
        if (h) rowData[h] = cells[idx] || '';
      });

      const teamName = String(
        rowData['time'] || rowData['team'] || rowData['nome'] || rowData['clube'] || cells[0] || ''
      ).trim();
      const estadio = String(
        rowData['estadio'] || rowData['stadium'] || rowData['arena'] || ''
      ).trim();
      const urlEscudo = String(
        rowData['url_escudo'] || rowData['urlescudo'] || rowData['escudo'] || rowData['logo'] || rowData['url'] || cells[1] || ''
      ).trim();

      if (teamName) {
        rows.push({
          rowIndex: i + 1,
          time: teamName,
          estadio,
          urlEscudo,
          isValid: true,
        });
      }
    }
    return rows;
  }

  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const headers: string[] = [];
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell, colNumber) => {
    headers[colNumber] = normalizeHeaderKey(String(cell.value || ''));
  });

  const rows: ParsedTeamRow[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const rowData: Record<string, any> = {};
    row.eachCell((cell, colNumber) => {
      const headerKey = headers[colNumber];
      if (headerKey) {
        rowData[headerKey] = cell.value;
      }
    });

    const time = String(
      rowData['time'] || rowData['team'] || rowData['nome'] || rowData['clube'] || row.getCell(1).value || ''
    ).trim();
    const estadio = String(
      rowData['estadio'] || rowData['stadium'] || rowData['arena'] || ''
    ).trim();
    const urlEscudo = String(
      rowData['url_escudo'] || rowData['urlescudo'] || rowData['escudo'] || rowData['logo'] || rowData['url'] || row.getCell(2).value || ''
    ).trim();

    if (time) {
      rows.push({
        rowIndex: rowNumber,
        time,
        estadio,
        urlEscudo,
        isValid: true,
      });
    }
  });
  return rows;
}

export interface PendingLogoItem {
  type: 'TEAM' | 'LEAGUE' | 'COUNTRY' | 'REFEREE';
  id: string;
  name: string;
  context: string;
  url: string;
}

export interface ParsedPendingLogoRow {
  rowIndex: number;
  type: 'TEAM' | 'LEAGUE' | 'COUNTRY' | 'REFEREE' | 'UNKNOWN';
  id?: string;
  name?: string;
  url: string;
  isValid: boolean;
}

export async function exportPendingLogosToExcel(
  items: PendingLogoItem[],
  fileNameSuffix: string = 'pendencias_imagens'
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Imagens_Pendentes');

  worksheet.columns = [
    { header: 'Tipo', key: 'type', width: 14 },
    { header: 'ID', key: 'id', width: 16 },
    { header: 'Nome', key: 'name', width: 30 },
    { header: 'Contexto_Pais_Liga', key: 'context', width: 30 },
    { header: 'URL_Imagem', key: 'url', width: 60 },
  ];

  items.forEach(item => {
    worksheet.addRow({
      type: item.type,
      id: item.id,
      name: item.name,
      context: item.context,
      url: item.url || '',
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileNameSuffix}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function parsePendingLogosExcelFile(file: File): Promise<ParsedPendingLogoRow[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const rows: ParsedPendingLogoRow[] = [];
  const headers: string[] = [];
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell, colNumber) => {
    headers[colNumber] = String(cell.value || '').trim();
  });

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const rowData: Record<string, any> = {};
    row.eachCell((cell, colNumber) => {
      const header = headers[colNumber];
      if (header) {
        rowData[header] = cell.value;
      }
    });

    const typeRaw = String(rowData['Tipo'] || row.getCell(1).value || '').trim().toUpperCase();
    const id = String(rowData['ID'] || row.getCell(2).value || '').trim();
    const name = String(rowData['Nome'] || row.getCell(3).value || '').trim();
    const url = String(
      rowData['URL_Imagem'] || rowData['URL'] || row.getCell(5).value || row.getCell(4).value || ''
    ).trim();

    let type: 'TEAM' | 'LEAGUE' | 'COUNTRY' | 'REFEREE' | 'UNKNOWN' = 'UNKNOWN';
    if (typeRaw.includes('TIME') || typeRaw.includes('TEAM') || id.startsWith('TIME')) {
      type = 'TEAM';
    } else if (typeRaw.includes('LIGA') || typeRaw.includes('LEAGUE') || id.startsWith('LIGA')) {
      type = 'LEAGUE';
    } else if (
      typeRaw.includes('PAIS') ||
      typeRaw.includes('PAÍS') ||
      typeRaw.includes('COUNTRY') ||
      id.startsWith('PAIS')
    ) {
      type = 'COUNTRY';
    } else if (
      typeRaw.includes('ARBITRO') ||
      typeRaw.includes('ÁRBITRO') ||
      typeRaw.includes('REFEREE') ||
      typeRaw.includes('JUIZ') ||
      id.startsWith('REF')
    ) {
      type = 'REFEREE';
    }

    if (url && (id || name)) {
      rows.push({
        rowIndex: rowNumber,
        type,
        id: id || undefined,
        name: name || undefined,
        url,
        isValid: true,
      });
    }
  });

  return rows;
}

export async function exportRefereesToExcel(
  refereesData: any[],
  customFileName?: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Football Manager';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Estatísticas de Árbitros', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  worksheet.columns = [
    { header: 'Árbitro', key: 'name', width: 28 },
    { header: 'Jogos Avaliados', key: 'finishedMatches', width: 16 },
    { header: 'Jogos Futuros', key: 'scheduledMatches', width: 14 },
    { header: 'Total Jogos', key: 'totalMatches', width: 14 },
    { header: 'Média Cartões', key: 'avgTotalCards', width: 16 },
    { header: 'Média Amarelos', key: 'avgYellowCards', width: 16 },
    { header: 'Amarelos Mandante', key: 'avgYellowCardsHome', width: 18 },
    { header: 'Amarelos Visitante', key: 'avgYellowCardsAway', width: 18 },
    { header: 'Média Vermelhos', key: 'avgRedCards', width: 16 },
    { header: '% Jogos c/ Vermelho', key: 'redCardMatchPct', width: 20 },
    { header: 'Média Faltas', key: 'avgFouls', width: 16 },
    { header: 'Faltas Mandante', key: 'avgFoulsHome', width: 16 },
    { header: 'Faltas Visitante', key: 'avgFoulsAway', width: 16 },
    { header: 'Faltas p/ Cartão', key: 'foulsPerCard', width: 16 },
    { header: 'Média Gols', key: 'avgGoals', width: 14 },
    { header: 'Gols Mandante', key: 'avgHomeGoals', width: 16 },
    { header: 'Gols Visitante', key: 'avgAwayGoals', width: 16 },
    { header: '% Over 2.5', key: 'over25Pct', width: 14 },
    { header: '% Ambas Marcam', key: 'bttsPct', width: 16 },
    { header: '% Vitória Mandante', key: 'homeWinPct', width: 18 },
    { header: '% Empate', key: 'drawPct', width: 12 },
    { header: '% Vitória Visitante', key: 'awayWinPct', width: 18 },
    { header: 'Perfil Disciplinar', key: 'disciplineLevel', width: 20 },
    { header: 'Ligas Atuadas', key: 'leagues', width: 35 },
    { header: 'URL da Foto', key: 'photoUrl', width: 45 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' },
  };

  refereesData.forEach((ref, index) => {
    const row = worksheet.addRow({
      name: ref.name,
      finishedMatches: ref.finishedMatches,
      scheduledMatches: ref.scheduledMatches,
      totalMatches: ref.totalMatches,
      avgTotalCards: Number(ref.avgTotalCards.toFixed(2)),
      avgYellowCards: Number(ref.avgYellowCards.toFixed(2)),
      avgYellowCardsHome: Number(ref.avgYellowCardsHome.toFixed(2)),
      avgYellowCardsAway: Number(ref.avgYellowCardsAway.toFixed(2)),
      avgRedCards: Number(ref.avgRedCards.toFixed(2)),
      redCardMatchPct: `${ref.redCardMatchPct.toFixed(1)}%`,
      avgFouls: Number(ref.avgFouls.toFixed(1)),
      avgFoulsHome: Number(ref.avgFoulsHome.toFixed(1)),
      avgFoulsAway: Number(ref.avgFoulsAway.toFixed(1)),
      foulsPerCard: Number(ref.foulsPerCard.toFixed(1)),
      avgGoals: Number(ref.avgGoals.toFixed(2)),
      avgHomeGoals: Number(ref.avgHomeGoals.toFixed(2)),
      avgAwayGoals: Number(ref.avgAwayGoals.toFixed(2)),
      over25Pct: `${ref.over25Pct.toFixed(1)}%`,
      bttsPct: `${ref.bttsPct.toFixed(1)}%`,
      homeWinPct: `${ref.homeWinPct.toFixed(1)}%`,
      drawPct: `${ref.drawPct.toFixed(1)}%`,
      awayWinPct: `${ref.awayWinPct.toFixed(1)}%`,
      disciplineLevel:
        ref.disciplineLevel === 'VERY_STRICT'
          ? 'Muito Rigoroso'
          : ref.disciplineLevel === 'STRICT'
          ? 'Rigoroso'
          : ref.disciplineLevel === 'LENIENT'
          ? 'Deixa Jogar'
          : 'Moderado',
      leagues: (ref.leagues || []).join(', '),
      photoUrl: ref.photoUrl || '',
    });

    if (index % 2 === 1) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8FAFC' },
      };
    }
    row.alignment = { vertical: 'middle' };
  });

  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 24 },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fileName =
    customFileName || `estatisticas_arbitros_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

