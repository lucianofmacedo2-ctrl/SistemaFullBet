import ExcelJS from 'exceljs';
import { Match, MatchStatus, MatchStats, MatchOdds, Team, League, Country } from '../types';
import { parseDateToBrasilia, BRASILIA_TIMEZONE } from './dateTimeUtils';

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

  // Posse de Bola
  possessionHomeFT?: number | null;
  possessionAwayFT?: number | null;

  // Cartões
  yellowCardsHomeFT?: number | null;
  yellowCardsAwayFT?: number | null;
  redCardsHomeFT?: number | null;
  redCardsAwayFT?: number | null;

  // Grupo Finalizações
  xgHomeFT?: number | null;
  xgAwayFT?: number | null;
  xgotHomeFT?: number | null;
  xgotAwayFT?: number | null;
  shotsHomeFT?: number | null;
  shotsAwayFT?: number | null;
  shotsOnTargetHomeFT?: number | null;
  shotsOnTargetAwayFT?: number | null;
  shotsOffTargetHomeFT?: number | null;
  shotsOffTargetAwayFT?: number | null;
  shotsBlockedHomeFT?: number | null;
  shotsBlockedAwayFT?: number | null;
  shotsInsideBoxHomeFT?: number | null;
  shotsInsideBoxAwayFT?: number | null;
  shotsOutsideBoxHomeFT?: number | null;
  shotsOutsideBoxAwayFT?: number | null;
  shotsWoodworkHomeFT?: number | null;
  shotsWoodworkAwayFT?: number | null;

  // Grupo Ataques
  bigChancesHomeFT?: number | null;
  bigChancesAwayFT?: number | null;
  cornersHomeFT?: number | null;
  cornersAwayFT?: number | null;
  touchesOppBoxHomeFT?: number | null;
  touchesOppBoxAwayFT?: number | null;
  throughBallsHomeFT?: number | null;
  throughBallsAwayFT?: number | null;
  offsidesHomeFT?: number | null;
  offsidesAwayFT?: number | null;
  foulsDrawnHomeFT?: number | null;
  foulsDrawnAwayFT?: number | null;

  // Grupo Passes
  passesAccurateHomeFT?: number | null;
  passesTotalHomeFT?: number | null;
  passesPctHomeFT?: number | null;
  passesAccurateAwayFT?: number | null;
  passesTotalAwayFT?: number | null;
  passesPctAwayFT?: number | null;

  longPassesAccurateHomeFT?: number | null;
  longPassesTotalHomeFT?: number | null;
  longPassesPctHomeFT?: number | null;
  longPassesAccurateAwayFT?: number | null;
  longPassesTotalAwayFT?: number | null;
  longPassesPctAwayFT?: number | null;

  finalThirdPassesAccurateHomeFT?: number | null;
  finalThirdPassesTotalHomeFT?: number | null;
  finalThirdPassesPctHomeFT?: number | null;
  finalThirdPassesAccurateAwayFT?: number | null;
  finalThirdPassesTotalAwayFT?: number | null;
  finalThirdPassesPctAwayFT?: number | null;

  crossesAccurateHomeFT?: number | null;
  crossesTotalHomeFT?: number | null;
  crossesPctHomeFT?: number | null;
  crossesAccurateAwayFT?: number | null;
  crossesTotalAwayFT?: number | null;
  crossesPctAwayFT?: number | null;

  xaHomeFT?: number | null;
  xaAwayFT?: number | null;
  throwInsHomeFT?: number | null;
  throwInsAwayFT?: number | null;

  // Grupo Defesa
  foulsHomeFT?: number | null;
  foulsAwayFT?: number | null;
  tacklesAccurateHomeFT?: number | null;
  tacklesTotalHomeFT?: number | null;
  tacklesPctHomeFT?: number | null;
  tacklesAccurateAwayFT?: number | null;
  tacklesTotalAwayFT?: number | null;
  tacklesPctAwayFT?: number | null;

  duelsWonHomeFT?: number | null;
  duelsWonAwayFT?: number | null;
  clearancesHomeFT?: number | null;
  clearancesAwayFT?: number | null;
  interceptionsHomeFT?: number | null;
  interceptionsAwayFT?: number | null;

  errorsLeadToShotHomeFT?: number | null;
  errorsLeadToShotAwayFT?: number | null;
  errorsLeadToGoalHomeFT?: number | null;
  errorsLeadToGoalAwayFT?: number | null;

  goalkeeperDefActionHomeFT?: number | null;
  goalkeeperDefActionAwayFT?: number | null;

  // Grupo Goleiro
  savesHomeFT?: number | null;
  savesAwayFT?: number | null;
  xgotFacedHomeFT?: number | null;
  xgotFacedAwayFT?: number | null;
  goalsPreventedHomeFT?: number | null;
  goalsPreventedAwayFT?: number | null;
  goalKicksHomeFT?: number | null;
  goalKicksAwayFT?: number | null;

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

  // Posse de Bola
  possessionHome: ['posse_bola_mandante_ft', 'posse_bola_mandante', 'posse_mandante_ft', 'posse_mandante', 'possession_home_ft', 'possession_home'],
  possessionAway: ['posse_bola_visitante_ft', 'posse_bola_visitante', 'posse_visitante_ft', 'posse_visitante', 'possession_away_ft', 'possession_away'],

  // Disciplina / Cartões
  yellowHome: ['cartao_amarelo_mandante_ft', 'cartao_amarelo_mandante', 'amarelos_mandante', 'yellow_cards_home_ft', 'yellow_cards_home', 'hy'],
  yellowAway: ['cartao_amarelo_visitante_ft', 'cartao_amarelo_visitante', 'amarelos_visitante', 'yellow_cards_away_ft', 'yellow_cards_away', 'ay'],
  redHome: ['cartao_vermelho_mandante_ft', 'cartao_vermelho_mandante', 'vermelhos_mandante', 'red_cards_home_ft', 'red_cards_home', 'hr'],
  redAway: ['cartao_vermelho_visitante_ft', 'cartao_vermelho_visitante', 'vermelhos_visitante', 'red_cards_away_ft', 'red_cards_away', 'ar'],

  // Grupo Finalizações
  xgHome: ['finalizacoes_xg_mandante_ft', 'xg_mandante_ft', 'xg_mandante', 'xg_home_ft', 'xg_home', 'hxg', 'xg_h'],
  xgAway: ['finalizacoes_xg_visitante_ft', 'xg_visitante_ft', 'xg_visitante', 'xg_away_ft', 'xg_away', 'axg', 'xg_a'],
  xgotHome: ['finalizacoes_xgot_mandante_ft', 'xgot_mandante_ft', 'xgot_mandante', 'xgot_home_ft', 'xgot_home', 'hxgot'],
  xgotAway: ['finalizacoes_xgot_visitante_ft', 'xgot_visitante_ft', 'xgot_visitante', 'xgot_away_ft', 'xgot_away', 'axgot'],
  shotsHome: ['finalizacoes_totais_mandante_ft', 'finalizacoes_mandante_ft', 'finalizacoes_mandante', 'chutes_mandante', 'shots_home_ft', 'shots_home', 'hs'],
  shotsAway: ['finalizacoes_totais_visitante_ft', 'finalizacoes_visitante_ft', 'finalizacoes_visitante', 'chutes_visitante', 'shots_away_ft', 'shots_away', 'as'],
  shotsOnTargetHome: ['finalizacoes_no_alvo_mandante_ft', 'chutes_gol_mandante_ft', 'chutes_gol_mandante', 'chutes_no_alvo_mandante', 'shots_on_target_home_ft', 'shots_on_target_home', 'hst'],
  shotsOnTargetAway: ['finalizacoes_no_alvo_visitante_ft', 'chutes_gol_visitante_ft', 'chutes_gol_visitante', 'chutes_no_alvo_visitante', 'shots_on_target_away_ft', 'shots_on_target_away', 'ast'],
  shotsOffTargetHome: ['finalizacoes_para_fora_mandante_ft', 'chutes_fora_mandante_ft', 'shots_off_target_home_ft'],
  shotsOffTargetAway: ['finalizacoes_para_fora_visitante_ft', 'chutes_fora_visitante_ft', 'shots_off_target_away_ft'],
  shotsBlockedHome: ['finalizacoes_bloqueadas_mandante_ft', 'chutes_bloqueados_mandante_ft', 'shots_blocked_home_ft'],
  shotsBlockedAway: ['finalizacoes_bloqueadas_visitante_ft', 'chutes_bloqueados_visitante_ft', 'shots_blocked_away_ft'],
  shotsInsideBoxHome: ['finalizacoes_dentro_area_mandante_ft', 'chutes_dentro_area_mandante_ft', 'shots_inside_box_home_ft'],
  shotsInsideBoxAway: ['finalizacoes_dentro_area_visitante_ft', 'chutes_dentro_area_visitante_ft', 'shots_inside_box_away_ft'],
  shotsOutsideBoxHome: ['finalizacoes_fora_area_mandante_ft', 'chutes_fora_da_area_mandante_ft', 'shots_outside_box_home_ft'],
  shotsOutsideBoxAway: ['finalizacoes_fora_area_visitante_ft', 'chutes_fora_da_area_visitante_ft', 'shots_outside_box_away_ft'],
  shotsWoodworkHome: ['finalizacoes_trave_mandante_ft', 'chutes_trave_mandante_ft', 'shots_woodwork_home_ft', 'trave_mandante_ft'],
  shotsWoodworkAway: ['finalizacoes_trave_visitante_ft', 'chutes_trave_visitante_ft', 'shots_woodwork_away_ft', 'trave_visitante_ft'],

  // Grupo Ataques
  bigChancesHome: ['ataque_chances_claras_mandante_ft', 'chances_claras_mandante_ft', 'big_chances_home_ft'],
  bigChancesAway: ['ataque_chances_claras_visitante_ft', 'chances_claras_visitante_ft', 'big_chances_away_ft'],
  cornersHome: ['ataque_escanteios_mandante_ft', 'escanteios_mandante_ft', 'escanteios_mandante', 'cantos_mandante', 'corners_home_ft', 'corners_home', 'hc'],
  cornersAway: ['ataque_escanteios_visitante_ft', 'escanteios_visitante_ft', 'escanteios_visitante', 'cantos_visitante', 'corners_away_ft', 'corners_away', 'ac'],
  touchesOppBoxHome: ['ataque_toques_area_adv_mandante_ft', 'toques_area_adv_mandante_ft', 'toques_area_adversaria_mandante_ft', 'touches_opp_box_home_ft'],
  touchesOppBoxAway: ['ataque_toques_area_adv_visitante_ft', 'toques_area_adv_visitante_ft', 'toques_area_adversaria_visitante_ft', 'touches_opp_box_away_ft'],
  throughBallsHome: ['ataque_passes_profundidade_certos_mandante_ft', 'passes_profundidade_certos_mandante_ft', 'through_balls_home_ft'],
  throughBallsAway: ['ataque_passes_profundidade_certos_visitante_ft', 'passes_profundidade_certos_visitante_ft', 'through_balls_away_ft'],
  offsidesHome: ['ataque_impedimentos_mandante_ft', 'impedimentos_mandante_ft', 'offsides_home_ft'],
  offsidesAway: ['ataque_impedimentos_visitante_ft', 'impedimentos_visitante_ft', 'offsides_away_ft'],
  foulsDrawnHome: ['ataque_faltas_cobradas_mandante_ft', 'faltas_cobradas_mandante_ft', 'faltas_sofridas_mandante_ft', 'fouls_drawn_home_ft'],
  foulsDrawnAway: ['ataque_faltas_cobradas_visitante_ft', 'faltas_cobradas_visitante_ft', 'faltas_sofridas_visitante_ft', 'fouls_drawn_away_ft'],

  // Grupo Passes
  passesAccurateHome: ['passes_certos_mandante_ft', 'passes_certos_mandante', 'passes_accurate_home_ft'],
  passesTotalHome: ['passes_totais_mandante_ft', 'passes_totais_mandante', 'passes_total_home_ft'],
  passesPctHome: ['passes_precisao_pct_mandante_ft', 'passes_pct_mandante_ft', 'precisao_passes_mandante_ft'],
  passesAccurateAway: ['passes_certos_visitante_ft', 'passes_certos_visitante', 'passes_accurate_away_ft'],
  passesTotalAway: ['passes_totais_visitante_ft', 'passes_totais_visitante', 'passes_total_away_ft'],
  passesPctAway: ['passes_precisao_pct_visitante_ft', 'passes_pct_visitante_ft', 'precisao_passes_visitante_ft'],

  longPassesAccurateHome: ['passes_longos_certos_mandante_ft', 'long_passes_accurate_home_ft'],
  longPassesTotalHome: ['passes_longos_totais_mandante_ft', 'long_passes_total_home_ft'],
  longPassesPctHome: ['passes_longos_pct_mandante_ft', 'long_passes_pct_home_ft'],
  longPassesAccurateAway: ['passes_longos_certos_visitante_ft', 'long_passes_accurate_away_ft'],
  longPassesTotalAway: ['passes_longos_totais_visitante_ft', 'long_passes_total_away_ft'],
  longPassesPctAway: ['passes_longos_pct_visitante_ft', 'long_passes_pct_away_ft'],

  finalThirdPassesAccurateHome: ['passes_terco_final_certos_mandante_ft', 'passes_terco_final_certos_mandante', 'final_third_passes_accurate_home_ft'],
  finalThirdPassesTotalHome: ['passes_terco_final_totais_mandante_ft', 'final_third_passes_total_home_ft'],
  finalThirdPassesPctHome: ['passes_terco_final_pct_mandante_ft', 'final_third_passes_pct_home_ft'],
  finalThirdPassesAccurateAway: ['passes_terco_final_certos_visitante_ft', 'passes_terco_final_certos_visitante', 'final_third_passes_accurate_away_ft'],
  finalThirdPassesTotalAway: ['passes_terco_final_totais_visitante_ft', 'final_third_passes_total_away_ft'],
  finalThirdPassesPctAway: ['passes_terco_final_pct_visitante_ft', 'final_third_passes_pct_visitante_ft'],

  crossesAccurateHome: ['passes_cruzamentos_certos_mandante_ft', 'cruzamentos_certos_mandante_ft', 'crosses_accurate_home_ft'],
  crossesTotalHome: ['passes_cruzamentos_totais_mandante_ft', 'cruzamentos_totais_mandante_ft', 'crosses_total_home_ft'],
  crossesPctHome: ['passes_cruzamentos_pct_mandante_ft', 'cruzamentos_pct_mandante_ft', 'crosses_pct_home_ft'],
  crossesAccurateAway: ['passes_cruzamentos_certos_visitante_ft', 'cruzamentos_certos_visitante_ft', 'crosses_accurate_away_ft'],
  crossesTotalAway: ['passes_cruzamentos_totais_visitante_ft', 'cruzamentos_totais_visitante_ft', 'crosses_total_away_ft'],
  crossesPctAway: ['passes_cruzamentos_pct_visitante_ft', 'cruzamentos_pct_visitante_ft', 'crosses_pct_away_ft'],

  xaHome: ['passes_xa_mandante_ft', 'xa_mandante_ft', 'xa_mandante', 'expected_assists_home_ft'],
  xaAway: ['passes_xa_visitante_ft', 'xa_visitante_ft', 'xa_visitante', 'expected_assists_away_ft'],
  throwInsHome: ['passes_laterais_cobrados_mandante_ft', 'laterais_cobrados_mandante_ft', 'throw_ins_home_ft'],
  throwInsAway: ['passes_laterais_cobrados_visitante_ft', 'laterais_cobrados_visitante_ft', 'throw_ins_away_ft'],

  // Grupo Defesa
  foulsHome: ['defesa_faltas_mandante_ft', 'faltas_mandante_ft', 'faltas_mandante', 'fouls_home_ft', 'fouls_home', 'hf'],
  foulsAway: ['defesa_faltas_visitante_ft', 'faltas_visitante_ft', 'faltas_visitante', 'fouls_away_ft', 'fouls_away', 'af'],
  tacklesAccurateHome: ['defesa_desarmes_certos_mandante_ft', 'desarmes_certos_mandante_ft', 'tackles_accurate_home_ft'],
  tacklesTotalHome: ['defesa_desarmes_totais_mandante_ft', 'desarmes_totais_mandante_ft', 'tackles_total_home_ft'],
  tacklesPctHome: ['defesa_desarmes_pct_mandante_ft', 'desarmes_pct_mandante_ft', 'tackles_pct_home_ft'],
  tacklesAccurateAway: ['defesa_desarmes_certos_visitante_ft', 'desarmes_certos_visitante_ft', 'tackles_accurate_away_ft'],
  tacklesTotalAway: ['defesa_desarmes_totais_visitante_ft', 'desarmes_totais_visitante_ft', 'tackles_total_away_ft'],
  tacklesPctAway: ['defesa_desarmes_pct_visitante_ft', 'desarmes_pct_visitante_ft', 'tackles_pct_away_ft'],

  duelsWonHome: ['defesa_duelos_ganhos_mandante_ft', 'duelos_ganhos_mandante_ft', 'duels_won_home_ft'],
  duelsWonAway: ['defesa_duelos_ganhos_visitante_ft', 'duelos_ganhos_visitante_ft', 'duels_won_away_ft'],
  clearancesHome: ['defesa_rebatidas_mandante_ft', 'rebatidas_mandante_ft', 'cortes_mandante_ft', 'clearances_home_ft'],
  clearancesAway: ['defesa_rebatidas_visitante_ft', 'rebatidas_visitante_ft', 'cortes_visitante_ft', 'clearances_away_ft'],
  interceptionsHome: ['defesa_interceptacoes_mandante_ft', 'interceptacoes_mandante_ft', 'interceptions_home_ft'],
  interceptionsAway: ['defesa_interceptacoes_visitante_ft', 'interceptacoes_visitante_ft', 'interceptions_away_ft'],

  errorsLeadToShotHome: ['defesa_erros_resultaram_finalizacao_mandante_ft', 'erros_finalizacao_mandante_ft', 'errors_to_shot_home_ft'],
  errorsLeadToShotAway: ['defesa_erros_resultaram_finalizacao_visitante_ft', 'erros_finalizacao_visitante_ft', 'errors_to_shot_away_ft'],
  errorsLeadToGoalHome: ['defesa_erros_resultaram_gol_mandante_ft', 'erros_gol_mandante_ft', 'errors_to_goal_home_ft'],
  errorsLeadToGoalAway: ['defesa_erros_resultaram_gol_visitante_ft', 'erros_gol_visitante_ft', 'errors_to_goal_away_ft'],

  goalkeeperDefActionHome: ['defesa_goleiro_mandante_ft', 'acoes_defensivas_goleiro_mandante_ft', 'gk_def_action_home_ft'],
  goalkeeperDefActionAway: ['defesa_goleiro_visitante_ft', 'acoes_defensivas_goleiro_visitante_ft', 'gk_def_action_away_ft'],

  // Grupo Goleiro
  savesHome: ['goleiro_defesas_mandante_ft', 'defesas_goleiro_mandante_ft', 'saves_home_ft'],
  savesAway: ['goleiro_defesas_visitante_ft', 'defesas_goleiro_visitante_ft', 'saves_away_ft'],
  xgotFacedHome: ['goleiro_xgot_enfrentado_mandante_ft', 'xgot_enfrentado_mandante_ft', 'xgot_faced_home_ft'],
  xgotFacedAway: ['goleiro_xgot_enfrentado_visitante_ft', 'xgot_enfrentado_visitante_ft', 'xgot_faced_away_ft'],
  goalsPreventedHome: ['goleiro_gols_evitados_mandante_ft', 'gols_evitados_mandante_ft', 'goals_prevented_home_ft', 'gsax_home_ft'],
  goalsPreventedAway: ['goleiro_gols_evitados_visitante_ft', 'gols_evitados_visitante_ft', 'goals_prevented_away_ft', 'gsax_away_ft'],
  goalKicksHome: ['goleiro_tiros_de_meta_mandante_ft', 'tiros_de_meta_mandante_ft', 'goal_kicks_home_ft'],
  goalKicksAway: ['goleiro_tiros_de_meta_visitante_ft', 'tiros_de_meta_visitante_ft', 'goal_kicks_away_ft'],
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

export function splitDateTimeForExcel(isoString?: string): { date: string; time: string } {
  try {
    if (!isoString) return { date: '', time: '' };

    const d = parseDateToBrasilia(isoString);
    if (!d) return { date: '', time: '' };

    const dateFormatted = d.toLocaleDateString('pt-BR', {
      timeZone: BRASILIA_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timeFormatted = d.toLocaleTimeString('pt-BR', {
      timeZone: BRASILIA_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return { date: dateFormatted, time: timeFormatted };
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
  'posse_bola_mandante_FT',
  'posse_bola_visitante_FT',
  'cartao_amarelo_mandante_FT',
  'cartao_amarelo_visitante_FT',
  'cartao_vermelho_mandante_FT',
  'cartao_vermelho_visitante_FT',
  'finalizacoes_xg_mandante_FT',
  'finalizacoes_xg_visitante_FT',
  'finalizacoes_xgot_mandante_FT',
  'finalizacoes_xgot_visitante_FT',
  'finalizacoes_totais_mandante_FT',
  'finalizacoes_totais_visitante_FT',
  'finalizacoes_no_alvo_mandante_FT',
  'finalizacoes_no_alvo_visitante_FT',
  'finalizacoes_para_fora_mandante_FT',
  'finalizacoes_para_fora_visitante_FT',
  'finalizacoes_bloqueadas_mandante_FT',
  'finalizacoes_bloqueadas_visitante_FT',
  'finalizacoes_dentro_area_mandante_FT',
  'finalizacoes_dentro_area_visitante_FT',
  'finalizacoes_fora_area_mandante_FT',
  'finalizacoes_fora_area_visitante_FT',
  'finalizacoes_trave_mandante_FT',
  'finalizacoes_trave_visitante_FT',
  'ataque_chances_claras_mandante_FT',
  'ataque_chances_claras_visitante_FT',
  'ataque_escanteios_mandante_FT',
  'ataque_escanteios_visitante_FT',
  'ataque_toques_area_adv_mandante_FT',
  'ataque_toques_area_adv_visitante_FT',
  'ataque_passes_profundidade_certos_mandante_FT',
  'ataque_passes_profundidade_certos_visitante_FT',
  'ataque_impedimentos_mandante_FT',
  'ataque_impedimentos_visitante_FT',
  'ataque_faltas_cobradas_mandante_FT',
  'ataque_faltas_cobradas_visitante_FT',
  'passes_certos_mandante_FT',
  'passes_totais_mandante_FT',
  'passes_precisao_pct_mandante_FT',
  'passes_certos_visitante_FT',
  'passes_totais_visitante_FT',
  'passes_precisao_pct_visitante_FT',
  'passes_longos_certos_mandante_FT',
  'passes_longos_totais_mandante_FT',
  'passes_longos_pct_mandante_FT',
  'passes_longos_certos_visitante_FT',
  'passes_longos_totais_visitante_FT',
  'passes_longos_pct_visitante_FT',
  'passes_terco_final_certos_mandante_FT',
  'passes_terco_final_totais_mandante_FT',
  'passes_terco_final_pct_mandante_FT',
  'passes_terco_final_certos_visitante_FT',
  'passes_terco_final_totais_visitante_FT',
  'passes_terco_final_pct_visitante_FT',
  'passes_cruzamentos_certos_mandante_FT',
  'passes_cruzamentos_totais_mandante_FT',
  'passes_cruzamentos_pct_mandante_FT',
  'passes_cruzamentos_certos_visitante_FT',
  'passes_cruzamentos_totais_visitante_FT',
  'passes_cruzamentos_pct_visitante_FT',
  'passes_xa_mandante_FT',
  'passes_xa_visitante_FT',
  'passes_laterais_cobrados_mandante_FT',
  'passes_laterais_cobrados_visitante_FT',
  'defesa_faltas_mandante_FT',
  'defesa_faltas_visitante_FT',
  'defesa_desarmes_certos_mandante_FT',
  'defesa_desarmes_totais_mandante_FT',
  'defesa_desarmes_pct_mandante_FT',
  'defesa_desarmes_certos_visitante_FT',
  'defesa_desarmes_totais_visitante_FT',
  'defesa_desarmes_pct_visitante_FT',
  'defesa_duelos_ganhos_mandante_FT',
  'defesa_duelos_ganhos_visitante_FT',
  'defesa_rebatidas_mandante_FT',
  'defesa_rebatidas_visitante_FT',
  'defesa_interceptacoes_mandante_FT',
  'defesa_interceptacoes_visitante_FT',
  'defesa_erros_resultaram_finalizacao_mandante_FT',
  'defesa_erros_resultaram_finalizacao_visitante_FT',
  'defesa_erros_resultaram_gol_mandante_FT',
  'defesa_erros_resultaram_gol_visitante_FT',
  'defesa_goleiro_mandante_FT',
  'defesa_goleiro_visitante_FT',
  'goleiro_defesas_mandante_FT',
  'goleiro_defesas_visitante_FT',
  'goleiro_xgot_enfrentado_mandante_FT',
  'goleiro_xgot_enfrentado_visitante_FT',
  'goleiro_gols_evitados_mandante_FT',
  'goleiro_gols_evitados_visitante_FT',
  'goleiro_tiros_de_meta_mandante_FT',
  'goleiro_tiros_de_meta_visitante_FT',
  'Odd_Home_FT',
  'Odd_Draw_FT',
  'Odd_Away_FT',
  'Odd_Over25_FT',
  'Odd_Under25_FT',
];

function buildFinishedMatchRowValues(
  countryName: string,
  leagueName: string,
  date: string,
  time: string,
  homeTeamName: string,
  awayTeamName: string,
  homeScore: any,
  awayScore: any,
  st: MatchStats = {},
  od: MatchOdds = {},
  referee: string = '',
  stadium: string = '',
  attendance: any = '',
  stadiumCapacity: any = ''
): Record<string, any> {
  const v = (val: any) => (val !== null && val !== undefined && !isNaN(val) ? val : '');
  return {
    pais: countryName,
    liga: leagueName,
    data: date,
    hora: time,
    mandante: homeTeamName,
    visitante: awayTeamName,
    placarMandanteFT: v(homeScore),
    placarVisitanteFT: v(awayScore),
    placarMandanteHT: v(st.halftimeHomeScore),
    placarVisitanteHT: v(st.halftimeAwayScore),
    arbitro: referee,
    estadio: stadium,
    publico: v(attendance),
    capacidade: v(stadiumCapacity),

    // Posse
    posseBolaMandanteFT: v(st.possessionHomeFT),
    posseBolaVisitanteFT: v(st.possessionAwayFT),

    // Cartoes
    cartaoAmareloMandanteFT: v(st.yellowCardsHomeFT),
    cartaoAmareloVisitanteFT: v(st.yellowCardsAwayFT),
    cartaoVermelhoMandanteFT: v(st.redCardsHomeFT),
    cartaoVermelhoVisitanteFT: v(st.redCardsAwayFT),

    // Grupo Finalizações
    finalizacoesXgMandanteFT: v(st.xgHomeFT),
    finalizacoesXgVisitanteFT: v(st.xgAwayFT),
    finalizacoesXgotMandanteFT: v(st.xgotHomeFT),
    finalizacoesXgotVisitanteFT: v(st.xgotAwayFT),
    finalizacoesTotaisMandanteFT: v(st.shotsHomeFT),
    finalizacoesTotaisVisitanteFT: v(st.shotsAwayFT),
    finalizacoesNoAlvoMandanteFT: v(st.shotsOnTargetHomeFT),
    finalizacoesNoAlvoVisitanteFT: v(st.shotsOnTargetAwayFT),
    finalizacoesParaForaMandanteFT: v(st.shotsOffTargetHomeFT),
    finalizacoesParaForaVisitanteFT: v(st.shotsOffTargetAwayFT),
    finalizacoesBloqueadasMandanteFT: v(st.shotsBlockedHomeFT),
    finalizacoesBloqueadasVisitanteFT: v(st.shotsBlockedAwayFT),
    finalizacoesDentroAreaMandanteFT: v(st.shotsInsideBoxHomeFT),
    finalizacoesDentroAreaVisitanteFT: v(st.shotsInsideBoxAwayFT),
    finalizacoesForaAreaMandanteFT: v(st.shotsOutsideBoxHomeFT),
    finalizacoesForaAreaVisitanteFT: v(st.shotsOutsideBoxAwayFT),
    finalizacoesTraveMandanteFT: v(st.shotsWoodworkHomeFT),
    finalizacoesTraveVisitanteFT: v(st.shotsWoodworkAwayFT),

    // Grupo Ataques
    ataqueChancesClarasMandanteFT: v(st.bigChancesHomeFT),
    ataqueChancesClarasVisitanteFT: v(st.bigChancesAwayFT),
    ataqueEscanteiosMandanteFT: v(st.cornersHomeFT),
    ataqueEscanteiosVisitanteFT: v(st.cornersAwayFT),
    ataqueToquesAreaAdvMandanteFT: v(st.touchesOppBoxHomeFT),
    ataqueToquesAreaAdvVisitanteFT: v(st.touchesOppBoxAwayFT),
    ataquePassesProfundidadeCertosMandanteFT: v(st.throughBallsHomeFT),
    ataquePassesProfundidadeCertosVisitanteFT: v(st.throughBallsAwayFT),
    ataqueImpedimentosMandanteFT: v(st.offsidesHomeFT),
    ataqueImpedimentosVisitanteFT: v(st.offsidesAwayFT),
    ataqueFaltasCobradasMandanteFT: v(st.foulsDrawnHomeFT),
    ataqueFaltasCobradasVisitanteFT: v(st.foulsDrawnAwayFT),

    // Grupo Passes
    passesCertosMandanteFT: v(st.passesAccurateHomeFT),
    passesTotaisMandanteFT: v(st.passesTotalHomeFT),
    passesPrecisaoPctMandanteFT: v(st.passesPctHomeFT),
    passesCertosVisitanteFT: v(st.passesAccurateAwayFT),
    passesTotaisVisitanteFT: v(st.passesTotalAwayFT),
    passesPrecisaoPctVisitanteFT: v(st.passesPctAwayFT),

    passesLongosCertosMandanteFT: v(st.longPassesAccurateHomeFT),
    passesLongosTotaisMandanteFT: v(st.longPassesTotalHomeFT),
    passesLongosPctMandanteFT: v(st.longPassesPctHomeFT),
    passesLongosCertosVisitanteFT: v(st.longPassesAccurateAwayFT),
    passesLongosTotaisVisitanteFT: v(st.longPassesTotalAwayFT),
    passesLongosPctVisitanteFT: v(st.longPassesPctAwayFT),

    passesTercoFinalCertosMandanteFT: v(st.finalThirdPassesAccurateHomeFT),
    passesTercoFinalTotaisMandanteFT: v(st.finalThirdPassesTotalHomeFT),
    passesTercoFinalPctMandanteFT: v(st.finalThirdPassesPctHomeFT),
    passesTercoFinalCertosVisitanteFT: v(st.finalThirdPassesAccurateAwayFT),
    passesTercoFinalTotaisVisitanteFT: v(st.finalThirdPassesTotalAwayFT),
    passesTercoFinalPctVisitanteFT: v(st.finalThirdPassesPctAwayFT),

    passesCruzamentosCertosMandanteFT: v(st.crossesAccurateHomeFT),
    passesCruzamentosTotaisMandanteFT: v(st.crossesTotalHomeFT),
    passesCruzamentosPctMandanteFT: v(st.crossesPctHomeFT),
    passesCruzamentosCertosVisitanteFT: v(st.crossesAccurateAwayFT),
    passesCruzamentosTotaisVisitanteFT: v(st.crossesTotalAwayFT),
    passesCruzamentosPctVisitanteFT: v(st.crossesPctAwayFT),

    passesXaMandanteFT: v(st.xaHomeFT),
    passesXaVisitanteFT: v(st.xaAwayFT),
    passesLateraisCobradosMandanteFT: v(st.throwInsHomeFT),
    passesLateraisCobradosVisitanteFT: v(st.throwInsAwayFT),

    // Grupo Defesa
    defesaFaltasMandanteFT: v(st.foulsHomeFT),
    defesaFaltasVisitanteFT: v(st.foulsAwayFT),
    defesaDesarmesCertosMandanteFT: v(st.tacklesAccurateHomeFT),
    defesaDesarmesTotaisMandanteFT: v(st.tacklesTotalHomeFT),
    defesaDesarmesPctMandanteFT: v(st.tacklesPctHomeFT),
    defesaDesarmesCertosVisitanteFT: v(st.tacklesAccurateAwayFT),
    defesaDesarmesTotaisVisitanteFT: v(st.tacklesTotalAwayFT),
    defesaDesarmesPctVisitanteFT: v(st.tacklesPctAwayFT),

    defesaDuelosGanhosMandanteFT: v(st.duelsWonHomeFT),
    defesaDuelosGanhosVisitanteFT: v(st.duelsWonAwayFT),
    defesaRebatidasMandanteFT: v(st.clearancesHomeFT),
    defesaRebatidasVisitanteFT: v(st.clearancesAwayFT),
    defesaInterceptacoesMandanteFT: v(st.interceptionsHomeFT),
    defesaInterceptacoesVisitanteFT: v(st.interceptionsAwayFT),

    defesaErrosResultaramFinalizacaoMandanteFT: v(st.errorsLeadToShotHomeFT),
    defesaErrosResultaramFinalizacaoVisitanteFT: v(st.errorsLeadToShotAwayFT),
    defesaErrosResultaramGolMandanteFT: v(st.errorsLeadToGoalHomeFT),
    defesaErrosResultaramGolVisitanteFT: v(st.errorsLeadToGoalAwayFT),

    defesaGoleiroMandanteFT: v(st.goalkeeperDefActionHomeFT),
    defesaGoleiroVisitanteFT: v(st.goalkeeperDefActionAwayFT),

    // Grupo Goleiro
    goleiroDefesasMandanteFT: v(st.savesHomeFT),
    goleiroDefesasVisitanteFT: v(st.savesAwayFT),
    goleiroXgotEnfrentadoMandanteFT: v(st.xgotFacedHomeFT),
    goleiroXgotEnfrentadoVisitanteFT: v(st.xgotFacedAwayFT),
    goleiroGolsEvitadosMandanteFT: v(st.goalsPreventedHomeFT),
    goleiroGolsEvitadosVisitanteFT: v(st.goalsPreventedAwayFT),
    goleiroTirosDeMetaMandanteFT: v(st.goalKicksHomeFT),
    goleiroTirosDeMetaVisitanteFT: v(st.goalKicksAwayFT),

    // Odds FT
    oddHomeFT: v(od.homeFT),
    oddDrawFT: v(od.drawFT),
    oddAwayFT: v(od.awayFT),
    oddOver25FT: v(od.over25FT),
    oddUnder25FT: v(od.under25FT),
  };
}

/**
 * Baixa o modelo da Planilha de Jogos Finalizados (com opção de pré-preencher com jogos agendados/futuros)
 */
export async function downloadFinishedMatchesTemplate(
  matches: Match[] = [],
  format: 'xlsx' | 'csv' = 'xlsx',
  mode: 'all' | 'future_only' | 'empty_samples' = 'empty_samples'
): Promise<void> {
  const safeMatches = Array.isArray(matches) ? matches : [];
  let targetMatches: Match[] = [];

  if (mode === 'future_only') {
    targetMatches = safeMatches.filter(m => m.status === 'AGENDADO' || m.homeScore === null || m.awayScore === null);
  } else if (mode === 'all') {
    targetMatches = safeMatches;
  }

  const sampleMatch1 = buildFinishedMatchRowValues(
    'Inglaterra',
    'Premier League ING',
    '23/08/2026',
    '16:00',
    'Arsenal',
    'Chelsea',
    2,
    1,
    {
      halftimeHomeScore: 1,
      halftimeAwayScore: 0,
      possessionHomeFT: 58,
      possessionAwayFT: 42,
      yellowCardsHomeFT: 2,
      yellowCardsAwayFT: 3,
      redCardsHomeFT: 0,
      redCardsAwayFT: 0,
      xgHomeFT: 2.15,
      xgAwayFT: 1.08,
      xgotHomeFT: 2.30,
      xgotAwayFT: 0.95,
      shotsHomeFT: 15,
      shotsAwayFT: 9,
      shotsOnTargetHomeFT: 6,
      shotsOnTargetAwayFT: 3,
      shotsOffTargetHomeFT: 5,
      shotsOffTargetAwayFT: 4,
      shotsBlockedHomeFT: 4,
      shotsBlockedAwayFT: 2,
      shotsInsideBoxHomeFT: 10,
      shotsInsideBoxAwayFT: 5,
      shotsOutsideBoxHomeFT: 5,
      shotsOutsideBoxAwayFT: 4,
      shotsWoodworkHomeFT: 1,
      shotsWoodworkAwayFT: 0,
      bigChancesHomeFT: 3,
      bigChancesAwayFT: 1,
      cornersHomeFT: 7,
      cornersAwayFT: 4,
      touchesOppBoxHomeFT: 28,
      touchesOppBoxAwayFT: 14,
      throughBallsHomeFT: 4,
      throughBallsAwayFT: 1,
      offsidesHomeFT: 2,
      offsidesAwayFT: 1,
      foulsDrawnHomeFT: 14,
      foulsDrawnAwayFT: 11,
      passesAccurateHomeFT: 480,
      passesTotalHomeFT: 560,
      passesPctHomeFT: 85.7,
      passesAccurateAwayFT: 320,
      passesTotalAwayFT: 390,
      passesPctAwayFT: 82.0,
      longPassesAccurateHomeFT: 28,
      longPassesTotalHomeFT: 42,
      longPassesPctHomeFT: 66.7,
      longPassesAccurateAwayFT: 20,
      longPassesTotalAwayFT: 35,
      longPassesPctAwayFT: 57.1,
      finalThirdPassesAccurateHomeFT: 95,
      finalThirdPassesTotalHomeFT: 125,
      finalThirdPassesPctHomeFT: 76.0,
      finalThirdPassesAccurateAwayFT: 50,
      finalThirdPassesTotalAwayFT: 72,
      finalThirdPassesPctAwayFT: 69.4,
      crossesAccurateHomeFT: 6,
      crossesTotalHomeFT: 20,
      crossesPctHomeFT: 30.0,
      crossesAccurateAwayFT: 3,
      crossesTotalAwayFT: 14,
      crossesPctAwayFT: 21.4,
      xaHomeFT: 1.80,
      xaAwayFT: 0.85,
      throwInsHomeFT: 18,
      throwInsAwayFT: 15,
      foulsHomeFT: 11,
      foulsAwayFT: 14,
      tacklesAccurateHomeFT: 14,
      tacklesTotalHomeFT: 20,
      tacklesPctHomeFT: 70.0,
      tacklesAccurateAwayFT: 16,
      tacklesTotalAwayFT: 24,
      tacklesPctAwayFT: 66.7,
      duelsWonHomeFT: 54,
      duelsWonAwayFT: 46,
      clearancesHomeFT: 18,
      clearancesAwayFT: 25,
      interceptionsHomeFT: 8,
      interceptionsAwayFT: 11,
      errorsLeadToShotHomeFT: 0,
      errorsLeadToShotAwayFT: 1,
      errorsLeadToGoalHomeFT: 0,
      errorsLeadToGoalAwayFT: 0,
      goalkeeperDefActionHomeFT: 2,
      goalkeeperDefActionAwayFT: 4,
      savesHomeFT: 2,
      savesAwayFT: 4,
      xgotFacedHomeFT: 0.95,
      xgotFacedAwayFT: 2.30,
      goalsPreventedHomeFT: 0.05,
      goalsPreventedAwayFT: 0.30,
      goalKicksHomeFT: 6,
      goalKicksAwayFT: 9,
    },
    {
      homeFT: 2.10,
      drawFT: 3.40,
      awayFT: 3.50,
      over25FT: 1.85,
      under25FT: 1.95,
    },
    'Michael Oliver',
    'Emirates Stadium',
    60214,
    60704
  );

  const sampleMatch2 = buildFinishedMatchRowValues(
    'Espanha',
    'La Liga 1 ESP',
    '23/08/2026',
    '17:00',
    'Real Madrid',
    'Barcelona',
    3,
    2,
    {
      halftimeHomeScore: 1,
      halftimeAwayScore: 1,
      possessionHomeFT: 52,
      possessionAwayFT: 48,
      yellowCardsHomeFT: 3,
      yellowCardsAwayFT: 4,
      redCardsHomeFT: 0,
      redCardsAwayFT: 0,
      xgHomeFT: 2.45,
      xgAwayFT: 1.80,
      xgotHomeFT: 2.70,
      xgotAwayFT: 1.95,
      shotsHomeFT: 18,
      shotsAwayFT: 14,
      shotsOnTargetHomeFT: 8,
      shotsOnTargetAwayFT: 5,
      shotsOffTargetHomeFT: 6,
      shotsOffTargetAwayFT: 6,
      shotsBlockedHomeFT: 4,
      shotsBlockedAwayFT: 3,
      shotsInsideBoxHomeFT: 12,
      shotsInsideBoxAwayFT: 9,
      shotsOutsideBoxHomeFT: 6,
      shotsOutsideBoxAwayFT: 5,
      shotsWoodworkHomeFT: 1,
      shotsWoodworkAwayFT: 1,
      bigChancesHomeFT: 4,
      bigChancesAwayFT: 3,
      cornersHomeFT: 8,
      cornersAwayFT: 6,
      touchesOppBoxHomeFT: 32,
      touchesOppBoxAwayFT: 26,
      throughBallsHomeFT: 5,
      throughBallsAwayFT: 4,
      offsidesHomeFT: 1,
      offsidesAwayFT: 3,
      foulsDrawnHomeFT: 16,
      foulsDrawnAwayFT: 13,
      passesAccurateHomeFT: 440,
      passesTotalHomeFT: 510,
      passesPctHomeFT: 86.3,
      passesAccurateAwayFT: 410,
      passesTotalAwayFT: 485,
      passesPctAwayFT: 84.5,
      longPassesAccurateHomeFT: 32,
      longPassesTotalHomeFT: 48,
      longPassesPctHomeFT: 66.7,
      longPassesAccurateAwayFT: 25,
      longPassesTotalAwayFT: 40,
      longPassesPctAwayFT: 62.5,
      finalThirdPassesAccurateHomeFT: 110,
      finalThirdPassesTotalHomeFT: 140,
      finalThirdPassesPctHomeFT: 78.6,
      finalThirdPassesAccurateAwayFT: 95,
      finalThirdPassesTotalAwayFT: 125,
      finalThirdPassesPctAwayFT: 76.0,
      crossesAccurateHomeFT: 7,
      crossesTotalHomeFT: 22,
      crossesPctHomeFT: 31.8,
      crossesAccurateAwayFT: 5,
      crossesTotalAwayFT: 18,
      crossesPctAwayFT: 27.8,
      xaHomeFT: 2.10,
      xaAwayFT: 1.55,
      throwInsHomeFT: 20,
      throwInsAwayFT: 18,
      foulsHomeFT: 13,
      foulsAwayFT: 16,
      tacklesAccurateHomeFT: 17,
      tacklesTotalHomeFT: 25,
      tacklesPctHomeFT: 68.0,
      tacklesAccurateAwayFT: 18,
      tacklesTotalAwayFT: 27,
      tacklesPctAwayFT: 66.7,
      duelsWonHomeFT: 58,
      duelsWonAwayFT: 52,
      clearancesHomeFT: 20,
      clearancesAwayFT: 22,
      interceptionsHomeFT: 10,
      interceptionsAwayFT: 9,
      errorsLeadToShotHomeFT: 1,
      errorsLeadToShotAwayFT: 1,
      errorsLeadToGoalHomeFT: 0,
      errorsLeadToGoalAwayFT: 0,
      goalkeeperDefActionHomeFT: 3,
      goalkeeperDefActionAwayFT: 4,
      savesHomeFT: 3,
      savesAwayFT: 5,
      xgotFacedHomeFT: 1.95,
      xgotFacedAwayFT: 2.70,
      goalsPreventedHomeFT: -0.05,
      goalsPreventedAwayFT: -0.30,
      goalKicksHomeFT: 7,
      goalKicksAwayFT: 8,
    },
    {
      homeFT: 2.25,
      drawFT: 3.60,
      awayFT: 3.00,
      over25FT: 1.65,
      under25FT: 2.20,
    },
    'Jesús Gil Manzano',
    'Santiago Bernabéu',
    79850,
    81044
  );

  const sampleRows = [sampleMatch1, sampleMatch2];

  if (format === 'csv') {
    const csvLines: string[] = [];
    csvLines.push(FINISHED_MATCHES_COLUMNS.join(';'));

    if (targetMatches.length > 0) {
      targetMatches.forEach(m => {
        const { date, time } = splitDateTimeForExcel(m.matchDate);
        const rowData = buildFinishedMatchRowValues(
          m.countryName || '',
          m.leagueName || '',
          date,
          time,
          m.homeTeamName || '',
          m.awayTeamName || '',
          m.homeScore,
          m.awayScore,
          m.stats || {},
          m.odds || {},
          m.referee || '',
          m.stadium || '',
          m.attendance,
          m.stadiumCapacity
        );
        csvLines.push(Object.values(rowData).map(v => (v !== null && v !== undefined ? String(v) : '')).join(';'));
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

  const columnDefinitions = [
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
    { header: 'posse_bola_mandante_FT', key: 'posseBolaMandanteFT', width: 22 },
    { header: 'posse_bola_visitante_FT', key: 'posseBolaVisitanteFT', width: 22 },
    { header: 'cartao_amarelo_mandante_FT', key: 'cartaoAmareloMandanteFT', width: 24 },
    { header: 'cartao_amarelo_visitante_FT', key: 'cartaoAmareloVisitanteFT', width: 24 },
    { header: 'cartao_vermelho_mandante_FT', key: 'cartaoVermelhoMandanteFT', width: 24 },
    { header: 'cartao_vermelho_visitante_FT', key: 'cartaoVermelhoVisitanteFT', width: 24 },
    { header: 'finalizacoes_xg_mandante_FT', key: 'finalizacoesXgMandanteFT', width: 24 },
    { header: 'finalizacoes_xg_visitante_FT', key: 'finalizacoesXgVisitanteFT', width: 24 },
    { header: 'finalizacoes_xgot_mandante_FT', key: 'finalizacoesXgotMandanteFT', width: 24 },
    { header: 'finalizacoes_xgot_visitante_FT', key: 'finalizacoesXgotVisitanteFT', width: 24 },
    { header: 'finalizacoes_totais_mandante_FT', key: 'finalizacoesTotaisMandanteFT', width: 26 },
    { header: 'finalizacoes_totais_visitante_FT', key: 'finalizacoesTotaisVisitanteFT', width: 26 },
    { header: 'finalizacoes_no_alvo_mandante_FT', key: 'finalizacoesNoAlvoMandanteFT', width: 26 },
    { header: 'finalizacoes_no_alvo_visitante_FT', key: 'finalizacoesNoAlvoVisitanteFT', width: 26 },
    { header: 'finalizacoes_para_fora_mandante_FT', key: 'finalizacoesParaForaMandanteFT', width: 26 },
    { header: 'finalizacoes_para_fora_visitante_FT', key: 'finalizacoesParaForaVisitanteFT', width: 26 },
    { header: 'finalizacoes_bloqueadas_mandante_FT', key: 'finalizacoesBloqueadasMandanteFT', width: 26 },
    { header: 'finalizacoes_bloqueadas_visitante_FT', key: 'finalizacoesBloqueadasVisitanteFT', width: 26 },
    { header: 'finalizacoes_dentro_area_mandante_FT', key: 'finalizacoesDentroAreaMandanteFT', width: 28 },
    { header: 'finalizacoes_dentro_area_visitante_FT', key: 'finalizacoesDentroAreaVisitanteFT', width: 28 },
    { header: 'finalizacoes_fora_area_mandante_FT', key: 'finalizacoesForaAreaMandanteFT', width: 28 },
    { header: 'finalizacoes_fora_area_visitante_FT', key: 'finalizacoesForaAreaVisitanteFT', width: 28 },
    { header: 'finalizacoes_trave_mandante_FT', key: 'finalizacoesTraveMandanteFT', width: 24 },
    { header: 'finalizacoes_trave_visitante_FT', key: 'finalizacoesTraveVisitanteFT', width: 24 },
    { header: 'ataque_chances_claras_mandante_FT', key: 'ataqueChancesClarasMandanteFT', width: 28 },
    { header: 'ataque_chances_claras_visitante_FT', key: 'ataqueChancesClarasVisitanteFT', width: 28 },
    { header: 'ataque_escanteios_mandante_FT', key: 'ataqueEscanteiosMandanteFT', width: 24 },
    { header: 'ataque_escanteios_visitante_FT', key: 'ataqueEscanteiosVisitanteFT', width: 24 },
    { header: 'ataque_toques_area_adv_mandante_FT', key: 'ataqueToquesAreaAdvMandanteFT', width: 28 },
    { header: 'ataque_toques_area_adv_visitante_FT', key: 'ataqueToquesAreaAdvVisitanteFT', width: 28 },
    { header: 'ataque_passes_profundidade_certos_mandante_FT', key: 'ataquePassesProfundidadeCertosMandanteFT', width: 34 },
    { header: 'ataque_passes_profundidade_certos_visitante_FT', key: 'ataquePassesProfundidadeCertosVisitanteFT', width: 34 },
    { header: 'ataque_impedimentos_mandante_FT', key: 'ataqueImpedimentosMandanteFT', width: 26 },
    { header: 'ataque_impedimentos_visitante_FT', key: 'ataqueImpedimentosVisitanteFT', width: 26 },
    { header: 'ataque_faltas_cobradas_mandante_FT', key: 'ataqueFaltasCobradasMandanteFT', width: 28 },
    { header: 'ataque_faltas_cobradas_visitante_FT', key: 'ataqueFaltasCobradasVisitanteFT', width: 28 },
    { header: 'passes_certos_mandante_FT', key: 'passesCertosMandanteFT', width: 22 },
    { header: 'passes_totais_mandante_FT', key: 'passesTotaisMandanteFT', width: 22 },
    { header: 'passes_precisao_pct_mandante_FT', key: 'passesPrecisaoPctMandanteFT', width: 24 },
    { header: 'passes_certos_visitante_FT', key: 'passesCertosVisitanteFT', width: 22 },
    { header: 'passes_totais_visitante_FT', key: 'passesTotaisVisitanteFT', width: 22 },
    { header: 'passes_precisao_pct_visitante_FT', key: 'passesPrecisaoPctVisitanteFT', width: 24 },
    { header: 'passes_longos_certos_mandante_FT', key: 'passesLongosCertosMandanteFT', width: 26 },
    { header: 'passes_longos_totais_mandante_FT', key: 'passesLongosTotaisMandanteFT', width: 26 },
    { header: 'passes_longos_pct_mandante_FT', key: 'passesLongosPctMandanteFT', width: 24 },
    { header: 'passes_longos_certos_visitante_FT', key: 'passesLongosCertosVisitanteFT', width: 26 },
    { header: 'passes_longos_totais_visitante_FT', key: 'passesLongosTotaisVisitanteFT', width: 26 },
    { header: 'passes_longos_pct_visitante_FT', key: 'passesLongosPctVisitanteFT', width: 24 },
    { header: 'passes_terco_final_certos_mandante_FT', key: 'passesTercoFinalCertosMandanteFT', width: 30 },
    { header: 'passes_terco_final_totais_mandante_FT', key: 'passesTercoFinalTotaisMandanteFT', width: 30 },
    { header: 'passes_terco_final_pct_mandante_FT', key: 'passesTercoFinalPctMandanteFT', width: 26 },
    { header: 'passes_terco_final_certos_visitante_FT', key: 'passesTercoFinalCertosVisitanteFT', width: 30 },
    { header: 'passes_terco_final_totais_visitante_FT', key: 'passesTercoFinalTotaisVisitanteFT', width: 30 },
    { header: 'passes_terco_final_pct_visitante_FT', key: 'passesTercoFinalPctVisitanteFT', width: 26 },
    { header: 'passes_cruzamentos_certos_mandante_FT', key: 'passesCruzamentosCertosMandanteFT', width: 28 },
    { header: 'passes_cruzamentos_totais_mandante_FT', key: 'passesCruzamentosTotaisMandanteFT', width: 28 },
    { header: 'passes_cruzamentos_pct_mandante_FT', key: 'passesCruzamentosPctMandanteFT', width: 26 },
    { header: 'passes_cruzamentos_certos_visitante_FT', key: 'passesCruzamentosCertosVisitanteFT', width: 28 },
    { header: 'passes_cruzamentos_totais_visitante_FT', key: 'passesCruzamentosTotaisVisitanteFT', width: 28 },
    { header: 'passes_cruzamentos_pct_visitante_FT', key: 'passesCruzamentosPctVisitanteFT', width: 26 },
    { header: 'passes_xa_mandante_FT', key: 'passesXaMandanteFT', width: 22 },
    { header: 'passes_xa_visitante_FT', key: 'passesXaVisitanteFT', width: 22 },
    { header: 'passes_laterais_cobrados_mandante_FT', key: 'passesLateraisCobradosMandanteFT', width: 28 },
    { header: 'passes_laterais_cobrados_visitante_FT', key: 'passesLateraisCobradosVisitanteFT', width: 28 },
    { header: 'defesa_faltas_mandante_FT', key: 'defesaFaltasMandanteFT', width: 22 },
    { header: 'defesa_faltas_visitante_FT', key: 'defesaFaltasVisitanteFT', width: 22 },
    { header: 'defesa_desarmes_certos_mandante_FT', key: 'defesaDesarmesCertosMandanteFT', width: 26 },
    { header: 'defesa_desarmes_totais_mandante_FT', key: 'defesaDesarmesTotaisMandanteFT', width: 26 },
    { header: 'defesa_desarmes_pct_mandante_FT', key: 'defesaDesarmesPctMandanteFT', width: 24 },
    { header: 'defesa_desarmes_certos_visitante_FT', key: 'defesaDesarmesCertosVisitanteFT', width: 26 },
    { header: 'defesa_desarmes_totais_visitante_FT', key: 'defesaDesarmesTotaisVisitanteFT', width: 26 },
    { header: 'defesa_desarmes_pct_visitante_FT', key: 'defesaDesarmesPctVisitanteFT', width: 24 },
    { header: 'defesa_duelos_ganhos_mandante_FT', key: 'defesaDuelosGanhosMandanteFT', width: 26 },
    { header: 'defesa_duelos_ganhos_visitante_FT', key: 'defesaDuelosGanhosVisitanteFT', width: 26 },
    { header: 'defesa_rebatidas_mandante_FT', key: 'defesaRebatidasMandanteFT', width: 24 },
    { header: 'defesa_rebatidas_visitante_FT', key: 'defesaRebatidasVisitanteFT', width: 24 },
    { header: 'defesa_interceptacoes_mandante_FT', key: 'defesaInterceptacoesMandanteFT', width: 26 },
    { header: 'defesa_interceptacoes_visitante_FT', key: 'defesaInterceptacoesVisitanteFT', width: 26 },
    { header: 'defesa_erros_resultaram_finalizacao_mandante_FT', key: 'defesaErrosResultaramFinalizacaoMandanteFT', width: 34 },
    { header: 'defesa_erros_resultaram_finalizacao_visitante_FT', key: 'defesaErrosResultaramFinalizacaoVisitanteFT', width: 34 },
    { header: 'defesa_erros_resultaram_gol_mandante_FT', key: 'defesaErrosResultaramGolMandanteFT', width: 30 },
    { header: 'defesa_erros_resultaram_gol_visitante_FT', key: 'defesaErrosResultaramGolVisitanteFT', width: 30 },
    { header: 'defesa_goleiro_mandante_FT', key: 'defesaGoleiroMandanteFT', width: 24 },
    { header: 'defesa_goleiro_visitante_FT', key: 'defesaGoleiroVisitanteFT', width: 24 },
    { header: 'goleiro_defesas_mandante_FT', key: 'goleiroDefesasMandanteFT', width: 24 },
    { header: 'goleiro_defesas_visitante_FT', key: 'goleiroDefesasVisitanteFT', width: 24 },
    { header: 'goleiro_xgot_enfrentado_mandante_FT', key: 'goleiroXgotEnfrentadoMandanteFT', width: 28 },
    { header: 'goleiro_xgot_enfrentado_visitante_FT', key: 'goleiroXgotEnfrentadoVisitanteFT', width: 28 },
    { header: 'goleiro_gols_evitados_mandante_FT', key: 'goleiroGolsEvitadosMandanteFT', width: 26 },
    { header: 'goleiro_gols_evitados_visitante_FT', key: 'goleiroGolsEvitadosVisitanteFT', width: 26 },
    { header: 'goleiro_tiros_de_meta_mandante_FT', key: 'goleiroTirosDeMetaMandanteFT', width: 26 },
    { header: 'goleiro_tiros_de_meta_visitante_FT', key: 'goleiroTirosDeMetaVisitanteFT', width: 26 },
    { header: 'Odd_Home_FT', key: 'oddHomeFT', width: 14 },
    { header: 'Odd_Draw_FT', key: 'oddDrawFT', width: 14 },
    { header: 'Odd_Away_FT', key: 'oddAwayFT', width: 14 },
    { header: 'Odd_Over25_FT', key: 'oddOver25FT', width: 14 },
    { header: 'Odd_Under25_FT', key: 'oddUnder25FT', width: 14 },
  ];

  worksheet.columns = columnDefinitions;

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
      const rowData = buildFinishedMatchRowValues(
        m.countryName || '',
        m.leagueName || '',
        date,
        time,
        m.homeTeamName || '',
        m.awayTeamName || '',
        m.homeScore,
        m.awayScore,
        m.stats || {},
        m.odds || {},
        m.referee || '',
        m.stadium || '',
        m.attendance,
        m.stadiumCapacity
      );
      worksheet.addRow(rowData);
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

export function extractBulkMatchUpdateFields(
  getValue: (aliases: string[], colIndex?: number) => any
) {
  const countryName = String(getValue(EXCEL_HEADER_ALIASES.country, 1) || '').trim();
  const leagueName = String(getValue(EXCEL_HEADER_ALIASES.league, 2) || '').trim();
  const dateVal = getValue(EXCEL_HEADER_ALIASES.date, 3);
  const timeVal = getValue(EXCEL_HEADER_ALIASES.time, 4);
  const homeTeamName = String(getValue(EXCEL_HEADER_ALIASES.homeTeam, 5) || '').trim();
  const awayTeamName = String(getValue(EXCEL_HEADER_ALIASES.awayTeam, 6) || '').trim();

  const homeScore = parseInteger(getValue(EXCEL_HEADER_ALIASES.scoreHomeFT, 7));
  const awayScore = parseInteger(getValue(EXCEL_HEADER_ALIASES.scoreAwayFT, 8));
  const halftimeHomeScore = parseInteger(getValue(EXCEL_HEADER_ALIASES.scoreHomeHT, 9));
  const halftimeAwayScore = parseInteger(getValue(EXCEL_HEADER_ALIASES.scoreAwayHT, 10));

  const referee = String(getValue(EXCEL_HEADER_ALIASES.referee, 11) || '').trim();
  const stadium = String(getValue(EXCEL_HEADER_ALIASES.stadium, 12) || '').trim();
  const attendance = parseInteger(getValue(EXCEL_HEADER_ALIASES.attendance, 13));
  const stadiumCapacity = parseInteger(getValue(EXCEL_HEADER_ALIASES.capacity, 14));

  // Posse
  const possessionHomeFT = parseNumber(getValue(EXCEL_HEADER_ALIASES.possessionHome, 15));
  const possessionAwayFT = parseNumber(getValue(EXCEL_HEADER_ALIASES.possessionAway, 16));

  // Cartoes
  const yellowCardsHomeFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.yellowHome, 17));
  const yellowCardsAwayFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.yellowAway, 18));
  const redCardsHomeFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.redHome, 19));
  const redCardsAwayFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.redAway, 20));

  // Finalizações
  const xgHomeFT = parseNumber(getValue(EXCEL_HEADER_ALIASES.xgHome, 21));
  const xgAwayFT = parseNumber(getValue(EXCEL_HEADER_ALIASES.xgAway, 22));
  const xgotHomeFT = parseNumber(getValue(EXCEL_HEADER_ALIASES.xgotHome, 23));
  const xgotAwayFT = parseNumber(getValue(EXCEL_HEADER_ALIASES.xgotAway, 24));
  const shotsHomeFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.shotsHome, 25));
  const shotsAwayFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.shotsAway, 26));
  const shotsOnTargetHomeFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.shotsOnTargetHome, 27));
  const shotsOnTargetAwayFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.shotsOnTargetAway, 28));
  const shotsOffTargetHomeFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.shotsOffTargetHome, 29));
  const shotsOffTargetAwayFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.shotsOffTargetAway, 30));
  const shotsBlockedHomeFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.shotsBlockedHome, 31));
  const shotsBlockedAwayFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.shotsBlockedAway, 32));
  const shotsInsideBoxHomeFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.shotsInsideBoxHome, 33));
  const shotsInsideBoxAwayFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.shotsInsideBoxAway, 34));
  const shotsOutsideBoxHomeFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.shotsOutsideBoxHome, 35));
  const shotsOutsideBoxAwayFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.shotsOutsideBoxAway, 36));
  const shotsWoodworkHomeFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.shotsWoodworkHome, 37));
  const shotsWoodworkAwayFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.shotsWoodworkAway, 38));

  // Ataques
  const bigChancesHomeFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.bigChancesHome, 39));
  const bigChancesAwayFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.bigChancesAway, 40));
  const cornersHomeFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.cornersHome, 41));
  const cornersAwayFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.cornersAway, 42));
  const touchesOppBoxHomeFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.touchesOppBoxHome, 43));
  const touchesOppBoxAwayFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.touchesOppBoxAway, 44));
  const throughBallsHomeFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.throughBallsHome, 45));
  const throughBallsAwayFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.throughBallsAway, 46));
  const offsidesHomeFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.offsidesHome, 47));
  const offsidesAwayFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.offsidesAway, 48));
  const foulsDrawnHomeFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.foulsDrawnHome, 49));
  const foulsDrawnAwayFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.foulsDrawnAway, 50));

  // Passes
  const passesAccurateHomeFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.passesAccurateHome, 51));
  const passesTotalHomeFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.passesTotalHome, 52));
  const passesPctHomeFT = parseNumber(getValue(EXCEL_HEADER_ALIASES.passesPctHome, 53));
  const passesAccurateAwayFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.passesAccurateAway, 54));
  const passesTotalAwayFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.passesTotalAway, 55));
  const passesPctAwayFT = parseNumber(getValue(EXCEL_HEADER_ALIASES.passesPctAway, 56));

  const longPassesAccurateHomeFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.longPassesAccurateHome, 57));
  const longPassesTotalHomeFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.longPassesTotalHome, 58));
  const longPassesPctHomeFT = parseNumber(getValue(EXCEL_HEADER_ALIASES.longPassesPctHome, 59));
  const longPassesAccurateAwayFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.longPassesAccurateAway, 60));
  const longPassesTotalAwayFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.longPassesTotalAway, 61));
  const longPassesPctAwayFT = parseNumber(getValue(EXCEL_HEADER_ALIASES.longPassesPctAway, 62));

  const finalThirdPassesAccurateHomeFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.finalThirdPassesAccurateHome, 63));
  const finalThirdPassesTotalHomeFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.finalThirdPassesTotalHome, 64));
  const finalThirdPassesPctHomeFT = parseNumber(getValue(EXCEL_HEADER_ALIASES.finalThirdPassesPctHome, 65));
  const finalThirdPassesAccurateAwayFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.finalThirdPassesAccurateAway, 66));
  const finalThirdPassesTotalAwayFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.finalThirdPassesTotalAway, 67));
  const finalThirdPassesPctAwayFT = parseNumber(getValue(EXCEL_HEADER_ALIASES.finalThirdPassesPctAway, 68));

  const crossesAccurateHomeFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.crossesAccurateHome, 69));
  const crossesTotalHomeFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.crossesTotalHome, 70));
  const crossesPctHomeFT = parseNumber(getValue(EXCEL_HEADER_ALIASES.crossesPctHome, 71));
  const crossesAccurateAwayFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.crossesAccurateAway, 72));
  const crossesTotalAwayFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.crossesTotalAway, 73));
  const crossesPctAwayFT = parseNumber(getValue(EXCEL_HEADER_ALIASES.crossesPctAway, 74));

  const xaHomeFT = parseNumber(getValue(EXCEL_HEADER_ALIASES.xaHome, 75));
  const xaAwayFT = parseNumber(getValue(EXCEL_HEADER_ALIASES.xaAway, 76));
  const throwInsHomeFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.throwInsHome, 77));
  const throwInsAwayFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.throwInsAway, 78));

  // Defesa
  const foulsHomeFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.foulsHome, 79));
  const foulsAwayFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.foulsAway, 80));
  const tacklesAccurateHomeFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.tacklesAccurateHome, 81));
  const tacklesTotalHomeFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.tacklesTotalHome, 82));
  const tacklesPctHomeFT = parseNumber(getValue(EXCEL_HEADER_ALIASES.tacklesPctHome, 83));
  const tacklesAccurateAwayFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.tacklesAccurateAway, 84));
  const tacklesTotalAwayFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.tacklesTotalAway, 85));
  const tacklesPctAwayFT = parseNumber(getValue(EXCEL_HEADER_ALIASES.tacklesPctAway, 86));

  const duelsWonHomeFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.duelsWonHome, 87));
  const duelsWonAwayFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.duelsWonAway, 88));
  const clearancesHomeFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.clearancesHome, 89));
  const clearancesAwayFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.clearancesAway, 90));
  const interceptionsHomeFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.interceptionsHome, 91));
  const interceptionsAwayFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.interceptionsAway, 92));

  const errorsLeadToShotHomeFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.errorsLeadToShotHome, 93));
  const errorsLeadToShotAwayFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.errorsLeadToShotAway, 94));
  const errorsLeadToGoalHomeFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.errorsLeadToGoalHome, 95));
  const errorsLeadToGoalAwayFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.errorsLeadToGoalAway, 96));
  const goalkeeperDefActionHomeFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.goalkeeperDefActionHome, 97));
  const goalkeeperDefActionAwayFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.goalkeeperDefActionAway, 98));

  // Goleiro
  const savesHomeFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.savesHome, 99));
  const savesAwayFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.savesAway, 100));
  const xgotFacedHomeFT = parseNumber(getValue(EXCEL_HEADER_ALIASES.xgotFacedHome, 101));
  const xgotFacedAwayFT = parseNumber(getValue(EXCEL_HEADER_ALIASES.xgotFacedAway, 102));
  const goalsPreventedHomeFT = parseNumber(getValue(EXCEL_HEADER_ALIASES.goalsPreventedHome, 103));
  const goalsPreventedAwayFT = parseNumber(getValue(EXCEL_HEADER_ALIASES.goalsPreventedAway, 104));
  const goalKicksHomeFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.goalKicksHome, 105));
  const goalKicksAwayFT = parseInteger(getValue(EXCEL_HEADER_ALIASES.goalKicksAway, 106));

  // Odds
  const oddHomeFT = parseNumber(getValue(EXCEL_HEADER_ALIASES.oddHome, 107));
  const oddDrawFT = parseNumber(getValue(EXCEL_HEADER_ALIASES.oddDraw, 108));
  const oddAwayFT = parseNumber(getValue(EXCEL_HEADER_ALIASES.oddAway, 109));
  const oddOver25FT = parseNumber(getValue(EXCEL_HEADER_ALIASES.oddOver25, 110));
  const oddUnder25FT = parseNumber(getValue(EXCEL_HEADER_ALIASES.oddUnder25, 111));

  const ahHomeLine = parseNumber(getValue(EXCEL_HEADER_ALIASES.ahHomeLine));
  const ahHomeOdd = parseNumber(getValue(EXCEL_HEADER_ALIASES.ahHomeOdd));
  let ahAwayLine = parseNumber(getValue(EXCEL_HEADER_ALIASES.ahAwayLine));
  if (ahAwayLine === null && ahHomeLine !== null) {
    ahAwayLine = -ahHomeLine;
  }
  const ahAwayOdd = parseNumber(getValue(EXCEL_HEADER_ALIASES.ahAwayOdd));

  const matchId = String(getValue(EXCEL_HEADER_ALIASES.matchId) || '').trim() || undefined;
  const matchDateIso = formatIsoDateTime(dateVal, timeVal);

  return {
    countryName,
    leagueName,
    dateVal,
    timeVal,
    homeTeamName,
    awayTeamName,
    homeScore,
    awayScore,
    halftimeHomeScore,
    halftimeAwayScore,
    referee,
    stadium,
    attendance,
    stadiumCapacity,
    possessionHomeFT,
    possessionAwayFT,
    yellowCardsHomeFT,
    yellowCardsAwayFT,
    redCardsHomeFT,
    redCardsAwayFT,
    xgHomeFT,
    xgAwayFT,
    xgotHomeFT,
    xgotAwayFT,
    shotsHomeFT,
    shotsAwayFT,
    shotsOnTargetHomeFT,
    shotsOnTargetAwayFT,
    shotsOffTargetHomeFT,
    shotsOffTargetAwayFT,
    shotsBlockedHomeFT,
    shotsBlockedAwayFT,
    shotsInsideBoxHomeFT,
    shotsInsideBoxAwayFT,
    shotsOutsideBoxHomeFT,
    shotsOutsideBoxAwayFT,
    shotsWoodworkHomeFT,
    shotsWoodworkAwayFT,
    bigChancesHomeFT,
    bigChancesAwayFT,
    cornersHomeFT,
    cornersAwayFT,
    touchesOppBoxHomeFT,
    touchesOppBoxAwayFT,
    throughBallsHomeFT,
    throughBallsAwayFT,
    offsidesHomeFT,
    offsidesAwayFT,
    foulsDrawnHomeFT,
    foulsDrawnAwayFT,
    passesAccurateHomeFT,
    passesTotalHomeFT,
    passesPctHomeFT,
    passesAccurateAwayFT,
    passesTotalAwayFT,
    passesPctAwayFT,
    longPassesAccurateHomeFT,
    longPassesTotalHomeFT,
    longPassesPctHomeFT,
    longPassesAccurateAwayFT,
    longPassesTotalAwayFT,
    longPassesPctAwayFT,
    finalThirdPassesAccurateHomeFT,
    finalThirdPassesTotalHomeFT,
    finalThirdPassesPctHomeFT,
    finalThirdPassesAccurateAwayFT,
    finalThirdPassesTotalAwayFT,
    finalThirdPassesPctAwayFT,
    crossesAccurateHomeFT,
    crossesTotalHomeFT,
    crossesPctHomeFT,
    crossesAccurateAwayFT,
    crossesTotalAwayFT,
    crossesPctAwayFT,
    xaHomeFT,
    xaAwayFT,
    throwInsHomeFT,
    throwInsAwayFT,
    foulsHomeFT,
    foulsAwayFT,
    tacklesAccurateHomeFT,
    tacklesTotalHomeFT,
    tacklesPctHomeFT,
    tacklesAccurateAwayFT,
    tacklesTotalAwayFT,
    tacklesPctAwayFT,
    duelsWonHomeFT,
    duelsWonAwayFT,
    clearancesHomeFT,
    clearancesAwayFT,
    interceptionsHomeFT,
    interceptionsAwayFT,
    errorsLeadToShotHomeFT,
    errorsLeadToShotAwayFT,
    errorsLeadToGoalHomeFT,
    errorsLeadToGoalAwayFT,
    goalkeeperDefActionHomeFT,
    goalkeeperDefActionAwayFT,
    savesHomeFT,
    savesAwayFT,
    xgotFacedHomeFT,
    xgotFacedAwayFT,
    goalsPreventedHomeFT,
    goalsPreventedAwayFT,
    goalKicksHomeFT,
    goalKicksAwayFT,
    oddHomeFT,
    oddDrawFT,
    oddAwayFT,
    oddOver25FT,
    oddUnder25FT,
    asianHandicapHomeLine: ahHomeLine,
    asianHandicapHomeOdd: ahHomeOdd,
    asianHandicapAwayLine: ahAwayLine,
    asianHandicapAwayOdd: ahAwayOdd,
    matchId,
    matchDateIso,
  };
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

    const fields = extractBulkMatchUpdateFields((aliases, colIndex) =>
      getFlexibleValue(rowData, row, aliases, colIndex)
    );

    if (fields.homeTeamName && fields.awayTeamName) {
      const matchedMatch = findMatchingMatch(
        fields.homeTeamName,
        fields.awayTeamName,
        fields.matchDateIso,
        fields.matchId,
        existingMatches
      );

      const isNewMatch = !matchedMatch;

      parsedRows.push({
        rowIndex: rowNumber,
        matchId: matchedMatch?.id || fields.matchId,
        matchDate: matchedMatch?.matchDate || fields.matchDateIso,
        countryName: fields.countryName || matchedMatch?.countryName || 'Outro',
        leagueName: fields.leagueName || matchedMatch?.leagueName || 'Liga Principal',
        homeTeamName: fields.homeTeamName || matchedMatch?.homeTeamName || '',
        awayTeamName: fields.awayTeamName || matchedMatch?.awayTeamName || '',
        referee: fields.referee || matchedMatch?.referee || '',
        stadium: fields.stadium || matchedMatch?.stadium || '',
        stadiumCapacity: fields.stadiumCapacity ?? matchedMatch?.stadiumCapacity ?? null,
        attendance: fields.attendance ?? matchedMatch?.attendance ?? null,
        status: fields.homeScore !== null && fields.awayScore !== null ? 'FINALIZADO' : 'AGENDADO',
        matchedMatch,
        isNewMatch,

        homeScore: fields.homeScore,
        awayScore: fields.awayScore,
        halftimeHomeScore: fields.halftimeHomeScore,
        halftimeAwayScore: fields.halftimeAwayScore,

        possessionHomeFT: fields.possessionHomeFT,
        possessionAwayFT: fields.possessionAwayFT,
        yellowCardsHomeFT: fields.yellowCardsHomeFT,
        yellowCardsAwayFT: fields.yellowCardsAwayFT,
        redCardsHomeFT: fields.redCardsHomeFT,
        redCardsAwayFT: fields.redCardsAwayFT,

        xgHomeFT: fields.xgHomeFT,
        xgAwayFT: fields.xgAwayFT,
        xgotHomeFT: fields.xgotHomeFT,
        xgotAwayFT: fields.xgotAwayFT,
        shotsHomeFT: fields.shotsHomeFT,
        shotsAwayFT: fields.shotsAwayFT,
        shotsOnTargetHomeFT: fields.shotsOnTargetHomeFT,
        shotsOnTargetAwayFT: fields.shotsOnTargetAwayFT,
        shotsOffTargetHomeFT: fields.shotsOffTargetHomeFT,
        shotsOffTargetAwayFT: fields.shotsOffTargetAwayFT,
        shotsBlockedHomeFT: fields.shotsBlockedHomeFT,
        shotsBlockedAwayFT: fields.shotsBlockedAwayFT,
        shotsInsideBoxHomeFT: fields.shotsInsideBoxHomeFT,
        shotsInsideBoxAwayFT: fields.shotsInsideBoxAwayFT,
        shotsOutsideBoxHomeFT: fields.shotsOutsideBoxHomeFT,
        shotsOutsideBoxAwayFT: fields.shotsOutsideBoxAwayFT,
        shotsWoodworkHomeFT: fields.shotsWoodworkHomeFT,
        shotsWoodworkAwayFT: fields.shotsWoodworkAwayFT,

        bigChancesHomeFT: fields.bigChancesHomeFT,
        bigChancesAwayFT: fields.bigChancesAwayFT,
        cornersHomeFT: fields.cornersHomeFT,
        cornersAwayFT: fields.cornersAwayFT,
        touchesOppBoxHomeFT: fields.touchesOppBoxHomeFT,
        touchesOppBoxAwayFT: fields.touchesOppBoxAwayFT,
        throughBallsHomeFT: fields.throughBallsHomeFT,
        throughBallsAwayFT: fields.throughBallsAwayFT,
        offsidesHomeFT: fields.offsidesHomeFT,
        offsidesAwayFT: fields.offsidesAwayFT,
        foulsDrawnHomeFT: fields.foulsDrawnHomeFT,
        foulsDrawnAwayFT: fields.foulsDrawnAwayFT,

        passesAccurateHomeFT: fields.passesAccurateHomeFT,
        passesTotalHomeFT: fields.passesTotalHomeFT,
        passesPctHomeFT: fields.passesPctHomeFT,
        passesAccurateAwayFT: fields.passesAccurateAwayFT,
        passesTotalAwayFT: fields.passesTotalAwayFT,
        passesPctAwayFT: fields.passesPctAwayFT,
        longPassesAccurateHomeFT: fields.longPassesAccurateHomeFT,
        longPassesTotalHomeFT: fields.longPassesTotalHomeFT,
        longPassesPctHomeFT: fields.longPassesPctHomeFT,
        longPassesAccurateAwayFT: fields.longPassesAccurateAwayFT,
        longPassesTotalAwayFT: fields.longPassesTotalAwayFT,
        longPassesPctAwayFT: fields.longPassesPctAwayFT,
        finalThirdPassesAccurateHomeFT: fields.finalThirdPassesAccurateHomeFT,
        finalThirdPassesTotalHomeFT: fields.finalThirdPassesTotalHomeFT,
        finalThirdPassesPctHomeFT: fields.finalThirdPassesPctHomeFT,
        finalThirdPassesAccurateAwayFT: fields.finalThirdPassesAccurateAwayFT,
        finalThirdPassesTotalAwayFT: fields.finalThirdPassesTotalAwayFT,
        finalThirdPassesPctAwayFT: fields.finalThirdPassesPctAwayFT,
        crossesAccurateHomeFT: fields.crossesAccurateHomeFT,
        crossesTotalHomeFT: fields.crossesTotalHomeFT,
        crossesPctHomeFT: fields.crossesPctHomeFT,
        crossesAccurateAwayFT: fields.crossesAccurateAwayFT,
        crossesTotalAwayFT: fields.crossesTotalAwayFT,
        crossesPctAwayFT: fields.crossesPctAwayFT,
        xaHomeFT: fields.xaHomeFT,
        xaAwayFT: fields.xaAwayFT,
        throwInsHomeFT: fields.throwInsHomeFT,
        throwInsAwayFT: fields.throwInsAwayFT,

        foulsHomeFT: fields.foulsHomeFT,
        foulsAwayFT: fields.foulsAwayFT,
        tacklesAccurateHomeFT: fields.tacklesAccurateHomeFT,
        tacklesTotalHomeFT: fields.tacklesTotalHomeFT,
        tacklesPctHomeFT: fields.tacklesPctHomeFT,
        tacklesAccurateAwayFT: fields.tacklesAccurateAwayFT,
        tacklesTotalAwayFT: fields.tacklesTotalAwayFT,
        tacklesPctAwayFT: fields.tacklesPctAwayFT,
        duelsWonHomeFT: fields.duelsWonHomeFT,
        duelsWonAwayFT: fields.duelsWonAwayFT,
        clearancesHomeFT: fields.clearancesHomeFT,
        clearancesAwayFT: fields.clearancesAwayFT,
        interceptionsHomeFT: fields.interceptionsHomeFT,
        interceptionsAwayFT: fields.interceptionsAwayFT,
        errorsLeadToShotHomeFT: fields.errorsLeadToShotHomeFT,
        errorsLeadToShotAwayFT: fields.errorsLeadToShotAwayFT,
        errorsLeadToGoalHomeFT: fields.errorsLeadToGoalHomeFT,
        errorsLeadToGoalAwayFT: fields.errorsLeadToGoalAwayFT,
        goalkeeperDefActionHomeFT: fields.goalkeeperDefActionHomeFT,
        goalkeeperDefActionAwayFT: fields.goalkeeperDefActionAwayFT,

        savesHomeFT: fields.savesHomeFT,
        savesAwayFT: fields.savesAwayFT,
        xgotFacedHomeFT: fields.xgotFacedHomeFT,
        xgotFacedAwayFT: fields.xgotFacedAwayFT,
        goalsPreventedHomeFT: fields.goalsPreventedHomeFT,
        goalsPreventedAwayFT: fields.goalsPreventedAwayFT,
        goalKicksHomeFT: fields.goalKicksHomeFT,
        goalKicksAwayFT: fields.goalKicksAwayFT,

        oddHomeFT: fields.oddHomeFT,
        oddDrawFT: fields.oddDrawFT,
        oddAwayFT: fields.oddAwayFT,
        oddOver25FT: fields.oddOver25FT,
        oddUnder25FT: fields.oddUnder25FT,
        asianHandicapHomeLine: fields.asianHandicapHomeLine,
        asianHandicapHomeOdd: fields.asianHandicapHomeOdd,
        asianHandicapAwayLine: fields.asianHandicapAwayLine,
        asianHandicapAwayOdd: fields.asianHandicapAwayOdd,

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

    const fields = extractBulkMatchUpdateFields((aliases, colIndex) => {
      const v = getFlexibleValue(rowData, null, aliases);
      if (v !== undefined && v !== null && v !== '') return v;
      if (colIndex !== undefined && colIndex >= 1 && colIndex <= cells.length) {
        return cells[colIndex - 1];
      }
      return undefined;
    });

    if (fields.homeTeamName && fields.awayTeamName) {
      const matchedMatch = findMatchingMatch(
        fields.homeTeamName,
        fields.awayTeamName,
        fields.matchDateIso,
        fields.matchId,
        existingMatches
      );

      const isNewMatch = !matchedMatch;

      parsedRows.push({
        rowIndex: i + 1,
        matchId: matchedMatch?.id || fields.matchId,
        matchDate: matchedMatch?.matchDate || fields.matchDateIso,
        countryName: fields.countryName || matchedMatch?.countryName || 'Outro',
        leagueName: fields.leagueName || matchedMatch?.leagueName || 'Liga Principal',
        homeTeamName: fields.homeTeamName || matchedMatch?.homeTeamName || '',
        awayTeamName: fields.awayTeamName || matchedMatch?.awayTeamName || '',
        referee: fields.referee || matchedMatch?.referee || '',
        stadium: fields.stadium || matchedMatch?.stadium || '',
        stadiumCapacity: fields.stadiumCapacity ?? matchedMatch?.stadiumCapacity ?? null,
        attendance: fields.attendance ?? matchedMatch?.attendance ?? null,
        status: fields.homeScore !== null && fields.awayScore !== null ? 'FINALIZADO' : 'AGENDADO',
        matchedMatch,
        isNewMatch,

        homeScore: fields.homeScore,
        awayScore: fields.awayScore,
        halftimeHomeScore: fields.halftimeHomeScore,
        halftimeAwayScore: fields.halftimeAwayScore,

        possessionHomeFT: fields.possessionHomeFT,
        possessionAwayFT: fields.possessionAwayFT,
        yellowCardsHomeFT: fields.yellowCardsHomeFT,
        yellowCardsAwayFT: fields.yellowCardsAwayFT,
        redCardsHomeFT: fields.redCardsHomeFT,
        redCardsAwayFT: fields.redCardsAwayFT,

        xgHomeFT: fields.xgHomeFT,
        xgAwayFT: fields.xgAwayFT,
        xgotHomeFT: fields.xgotHomeFT,
        xgotAwayFT: fields.xgotAwayFT,
        shotsHomeFT: fields.shotsHomeFT,
        shotsAwayFT: fields.shotsAwayFT,
        shotsOnTargetHomeFT: fields.shotsOnTargetHomeFT,
        shotsOnTargetAwayFT: fields.shotsOnTargetAwayFT,
        shotsOffTargetHomeFT: fields.shotsOffTargetHomeFT,
        shotsOffTargetAwayFT: fields.shotsOffTargetAwayFT,
        shotsBlockedHomeFT: fields.shotsBlockedHomeFT,
        shotsBlockedAwayFT: fields.shotsBlockedAwayFT,
        shotsInsideBoxHomeFT: fields.shotsInsideBoxHomeFT,
        shotsInsideBoxAwayFT: fields.shotsInsideBoxAwayFT,
        shotsOutsideBoxHomeFT: fields.shotsOutsideBoxHomeFT,
        shotsOutsideBoxAwayFT: fields.shotsOutsideBoxAwayFT,
        shotsWoodworkHomeFT: fields.shotsWoodworkHomeFT,
        shotsWoodworkAwayFT: fields.shotsWoodworkAwayFT,

        bigChancesHomeFT: fields.bigChancesHomeFT,
        bigChancesAwayFT: fields.bigChancesAwayFT,
        cornersHomeFT: fields.cornersHomeFT,
        cornersAwayFT: fields.cornersAwayFT,
        touchesOppBoxHomeFT: fields.touchesOppBoxHomeFT,
        touchesOppBoxAwayFT: fields.touchesOppBoxAwayFT,
        throughBallsHomeFT: fields.throughBallsHomeFT,
        throughBallsAwayFT: fields.throughBallsAwayFT,
        offsidesHomeFT: fields.offsidesHomeFT,
        offsidesAwayFT: fields.offsidesAwayFT,
        foulsDrawnHomeFT: fields.foulsDrawnHomeFT,
        foulsDrawnAwayFT: fields.foulsDrawnAwayFT,

        passesAccurateHomeFT: fields.passesAccurateHomeFT,
        passesTotalHomeFT: fields.passesTotalHomeFT,
        passesPctHomeFT: fields.passesPctHomeFT,
        passesAccurateAwayFT: fields.passesAccurateAwayFT,
        passesTotalAwayFT: fields.passesTotalAwayFT,
        passesPctAwayFT: fields.passesPctAwayFT,
        longPassesAccurateHomeFT: fields.longPassesAccurateHomeFT,
        longPassesTotalHomeFT: fields.longPassesTotalHomeFT,
        longPassesPctHomeFT: fields.longPassesPctHomeFT,
        longPassesAccurateAwayFT: fields.longPassesAccurateAwayFT,
        longPassesTotalAwayFT: fields.longPassesTotalAwayFT,
        longPassesPctAwayFT: fields.longPassesPctAwayFT,
        finalThirdPassesAccurateHomeFT: fields.finalThirdPassesAccurateHomeFT,
        finalThirdPassesTotalHomeFT: fields.finalThirdPassesTotalHomeFT,
        finalThirdPassesPctHomeFT: fields.finalThirdPassesPctHomeFT,
        finalThirdPassesAccurateAwayFT: fields.finalThirdPassesAccurateAwayFT,
        finalThirdPassesTotalAwayFT: fields.finalThirdPassesTotalAwayFT,
        finalThirdPassesPctAwayFT: fields.finalThirdPassesPctAwayFT,
        crossesAccurateHomeFT: fields.crossesAccurateHomeFT,
        crossesTotalHomeFT: fields.crossesTotalHomeFT,
        crossesPctHomeFT: fields.crossesPctHomeFT,
        crossesAccurateAwayFT: fields.crossesAccurateAwayFT,
        crossesTotalAwayFT: fields.crossesTotalAwayFT,
        crossesPctAwayFT: fields.crossesPctAwayFT,
        xaHomeFT: fields.xaHomeFT,
        xaAwayFT: fields.xaAwayFT,
        throwInsHomeFT: fields.throwInsHomeFT,
        throwInsAwayFT: fields.throwInsAwayFT,

        foulsHomeFT: fields.foulsHomeFT,
        foulsAwayFT: fields.foulsAwayFT,
        tacklesAccurateHomeFT: fields.tacklesAccurateHomeFT,
        tacklesTotalHomeFT: fields.tacklesTotalHomeFT,
        tacklesPctHomeFT: fields.tacklesPctHomeFT,
        tacklesAccurateAwayFT: fields.tacklesAccurateAwayFT,
        tacklesTotalAwayFT: fields.tacklesTotalAwayFT,
        tacklesPctAwayFT: fields.tacklesPctAwayFT,
        duelsWonHomeFT: fields.duelsWonHomeFT,
        duelsWonAwayFT: fields.duelsWonAwayFT,
        clearancesHomeFT: fields.clearancesHomeFT,
        clearancesAwayFT: fields.clearancesAwayFT,
        interceptionsHomeFT: fields.interceptionsHomeFT,
        interceptionsAwayFT: fields.interceptionsAwayFT,
        errorsLeadToShotHomeFT: fields.errorsLeadToShotHomeFT,
        errorsLeadToShotAwayFT: fields.errorsLeadToShotAwayFT,
        errorsLeadToGoalHomeFT: fields.errorsLeadToGoalHomeFT,
        errorsLeadToGoalAwayFT: fields.errorsLeadToGoalAwayFT,
        goalkeeperDefActionHomeFT: fields.goalkeeperDefActionHomeFT,
        goalkeeperDefActionAwayFT: fields.goalkeeperDefActionAwayFT,

        savesHomeFT: fields.savesHomeFT,
        savesAwayFT: fields.savesAwayFT,
        xgotFacedHomeFT: fields.xgotFacedHomeFT,
        xgotFacedAwayFT: fields.xgotFacedAwayFT,
        goalsPreventedHomeFT: fields.goalsPreventedHomeFT,
        goalsPreventedAwayFT: fields.goalsPreventedAwayFT,
        goalKicksHomeFT: fields.goalKicksHomeFT,
        goalKicksAwayFT: fields.goalKicksAwayFT,

        oddHomeFT: fields.oddHomeFT,
        oddDrawFT: fields.oddDrawFT,
        oddAwayFT: fields.oddAwayFT,
        oddOver25FT: fields.oddOver25FT,
        oddUnder25FT: fields.oddUnder25FT,
        asianHandicapHomeLine: fields.asianHandicapHomeLine,
        asianHandicapHomeOdd: fields.asianHandicapHomeOdd,
        asianHandicapAwayLine: fields.asianHandicapAwayLine,
        asianHandicapAwayOdd: fields.asianHandicapAwayOdd,

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

// ============================================================================
// EXPORTAÇÃO E IMPORTAÇÃO DE RIVALIDADES & CLÁSSICOS (EXCEL .XLSX)
// ============================================================================

export async function exportRivalriesToExcel(
  teams: Team[],
  leagues: League[] = [],
  countries: Country[] = [],
  customFileName?: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Football Analysis Pro';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Rivalidades e Clássicos', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  const countryById = new Map(countries.map(c => [c.id, c.name]));
  const leagueById = new Map(leagues.map(l => [l.id, l.name]));
  const teamById = new Map(teams.map(t => [t.id, t.name]));

  worksheet.columns = [
    { header: 'ID_Time', key: 'teamId', width: 16 },
    { header: 'Nome_Time', key: 'teamName', width: 28 },
    { header: 'Pais', key: 'country', width: 20 },
    { header: 'Liga_Principal', key: 'league', width: 26 },
    { header: 'Rivais_Nomes (separados por vírgula)', key: 'rivalNames', width: 48 },
    { header: 'Rivais_IDs (opcional)', key: 'rivalIds', width: 36 },
    { header: 'Total_Rivais', key: 'totalRivals', width: 14 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.height = 30;
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF92400E' }, // Amber 800
  };

  const sortedTeams = [...teams].sort((a, b) => {
    const cA = a.countryName || countryById.get(a.countryId) || '';
    const cB = b.countryName || countryById.get(b.countryId) || '';
    const compC = cA.localeCompare(cB, 'pt-BR', { sensitivity: 'base' });
    if (compC !== 0) return compC;

    const lA = a.leagueName || leagueById.get(a.leagueId || '') || '';
    const lB = b.leagueName || leagueById.get(b.leagueId || '') || '';
    const compL = lA.localeCompare(lB, 'pt-BR', { sensitivity: 'base' });
    if (compL !== 0) return compL;

    return a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
  });

  sortedTeams.forEach((team, index) => {
    const countryName = team.countryName || countryById.get(team.countryId) || '';
    const leagueName = team.leagueName || (team.leagueId ? leagueById.get(team.leagueId) : '') || '';

    // Obter nomes dos rivais cadastrados
    let rivalNamesList: string[] = [];
    if (team.rivalTeamNames && team.rivalTeamNames.length > 0) {
      rivalNamesList = [...team.rivalTeamNames];
    } else if (team.rivalTeamIds && team.rivalTeamIds.length > 0) {
      rivalNamesList = team.rivalTeamIds.map(id => teamById.get(id) || id);
    }

    const row = worksheet.addRow({
      teamId: team.id,
      teamName: team.name,
      country: countryName,
      league: leagueName,
      rivalNames: rivalNamesList.join(', '),
      rivalIds: (team.rivalTeamIds || []).join(', '),
      totalRivals: rivalNamesList.length,
    });

    if (index % 2 === 1) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFBEB' }, // Amber 50
      };
    }
    row.alignment = { vertical: 'middle' };
  });

  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 7 },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fileName =
    customFileName || `tabela_rivalidades_equipes_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function parseRivalriesWorkbook(
  buffer: ArrayBuffer | Uint8Array,
  currentTeams: Team[]
): Promise<{ updatedTeams: Team[]; importedCount: number; errors: string[] }> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('Nenhuma planilha encontrada no arquivo Excel.');
  }

  const teamById = new Map<string, Team>();
  const teamByName = new Map<string, Team>();

  currentTeams.forEach(t => {
    teamById.set(t.id.trim().toLowerCase(), t);
    teamByName.set(t.name.trim().toLowerCase(), t);
  });

  // Mapa de mutabilidade: teamId -> Team clone
  const teamsMap = new Map<string, Team>();
  currentTeams.forEach(t => {
    teamsMap.set(t.id, {
      ...t,
      rivalTeamIds: [...(t.rivalTeamIds || [])],
      rivalTeamNames: [...(t.rivalTeamNames || [])],
    });
  });

  let importedCount = 0;
  const errors: string[] = [];

  // Mapear cabeçalhos
  const headerRow = worksheet.getRow(1);
  let idCol = 1;
  let nameCol = 2;
  let rivalNamesCol = 5;
  let rivalIdsCol = 6;

  headerRow.eachCell((cell, colNumber) => {
    const val = String(cell.value || '').trim().toLowerCase();
    if (val.includes('id_time') || val === 'id' || val === 'time_id') idCol = colNumber;
    else if (val.includes('nome_time') || val === 'time' || val === 'equipe') nameCol = colNumber;
    else if (val.includes('rivais_nomes') || val.includes('rival_nomes') || val.includes('rivais') || val.includes('classicos')) rivalNamesCol = colNumber;
    else if (val.includes('rivais_ids') || val.includes('rival_ids')) rivalIdsCol = colNumber;
  });

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header

    const cellId = String(row.getCell(idCol).value || '').trim();
    const cellName = String(row.getCell(nameCol).value || '').trim();
    const cellRivalNames = String(row.getCell(rivalNamesCol).value || '').trim();
    const cellRivalIds = String(row.getCell(rivalIdsCol).value || '').trim();

    if (!cellId && !cellName) return;

    // Localizar time principal
    let targetTeam: Team | undefined;
    if (cellId && teamById.has(cellId.toLowerCase())) {
      targetTeam = teamsMap.get(teamById.get(cellId.toLowerCase())!.id);
    } else if (cellName && teamByName.has(cellName.toLowerCase())) {
      targetTeam = teamsMap.get(teamByName.get(cellName.toLowerCase())!.id);
    }

    if (!targetTeam) {
      if (cellName || cellId) {
        errors.push(`Linha ${rowNumber}: Equipe "${cellName || cellId}" não encontrada no banco de dados.`);
      }
      return;
    }

    // Processar rivais informados por nome ou ID
    const rawRivalTokens: string[] = [];
    if (cellRivalNames) {
      cellRivalNames.split(/[,;\n]+/).forEach(s => {
        const trimmed = s.trim();
        if (trimmed) rawRivalTokens.push(trimmed);
      });
    }
    if (cellRivalIds) {
      cellRivalIds.split(/[,;\n]+/).forEach(s => {
        const trimmed = s.trim();
        if (trimmed) rawRivalTokens.push(trimmed);
      });
    }

    rawRivalTokens.forEach(token => {
      const tokenLower = token.toLowerCase();
      // Buscar por ID ou Nome
      let rivalTeam = teamById.get(tokenLower) || teamByName.get(tokenLower);

      if (!rivalTeam) {
        // Busca flexível
        const found = currentTeams.find(t =>
          t.name.toLowerCase().includes(tokenLower) || tokenLower.includes(t.name.toLowerCase())
        );
        if (found) rivalTeam = found;
      }

      if (rivalTeam && rivalTeam.id !== targetTeam!.id) {
        const mutableTarget = targetTeam!;
        const mutableRival = teamsMap.get(rivalTeam.id)!;

        // Adicionar no alvo
        if (!mutableTarget.rivalTeamIds) mutableTarget.rivalTeamIds = [];
        if (!mutableTarget.rivalTeamNames) mutableTarget.rivalTeamNames = [];

        if (!mutableTarget.rivalTeamIds.includes(rivalTeam.id)) {
          mutableTarget.rivalTeamIds.push(rivalTeam.id);
        }
        if (!mutableTarget.rivalTeamNames.includes(rivalTeam.name)) {
          mutableTarget.rivalTeamNames.push(rivalTeam.name);
        }

        // Adicionar reciprocidade no rival
        if (!mutableRival.rivalTeamIds) mutableRival.rivalTeamIds = [];
        if (!mutableRival.rivalTeamNames) mutableRival.rivalTeamNames = [];

        if (!mutableRival.rivalTeamIds.includes(mutableTarget.id)) {
          mutableRival.rivalTeamIds.push(mutableTarget.id);
        }
        if (!mutableRival.rivalTeamNames.includes(mutableTarget.name)) {
          mutableRival.rivalTeamNames.push(mutableTarget.name);
        }

        importedCount++;
      }
    });
  });

  return {
    updatedTeams: Array.from(teamsMap.values()),
    importedCount,
    errors,
  };
}

