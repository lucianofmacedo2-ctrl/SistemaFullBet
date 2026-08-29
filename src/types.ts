export type MatchStatus = 'AGENDADO' | 'EM_ANDAMENTO' | 'FINALIZADO' | 'ADIADO';

export interface MatchStats {
  // Gols & Placar HT
  halftimeHomeScore?: number | null;
  halftimeAwayScore?: number | null;

  // Informações de Estádio e Público
  stadium?: string;
  stadiumCapacity?: number | null;
  attendance?: number | null;

  // Posse de Bola
  possessionHomeFT?: number | null; // posse_bola_mandante_FT
  possessionAwayFT?: number | null; // posse_bola_visitante_FT

  // Disciplina / Cartões
  yellowCardsHomeFT?: number | null; // cartao_amarelo_mandante_FT
  yellowCardsAwayFT?: number | null; // cartao_amarelo_visitante_FT
  redCardsHomeFT?: number | null; // cartao_vermelho_mandante_FT
  redCardsAwayFT?: number | null; // cartao_vermelho_visitante_FT

  // Grupo de Finalizações
  xgHomeFT?: number | null; // finalizacoes_xg_mandante_FT
  xgAwayFT?: number | null; // finalizacoes_xg_visitante_FT
  xgotHomeFT?: number | null; // finalizacoes_xgot_mandante_FT
  xgotAwayFT?: number | null; // finalizacoes_xgot_visitante_FT
  shotsHomeFT?: number | null; // finalizacoes_totais_mandante_FT
  shotsAwayFT?: number | null; // finalizacoes_totais_visitante_FT
  shotsOnTargetHomeFT?: number | null; // finalizacoes_no_alvo_mandante_FT
  shotsOnTargetAwayFT?: number | null; // finalizacoes_no_alvo_visitante_FT
  shotsOffTargetHomeFT?: number | null; // finalizacoes_para_fora_mandante_FT
  shotsOffTargetAwayFT?: number | null; // finalizacoes_para_fora_visitante_FT
  shotsBlockedHomeFT?: number | null; // finalizacoes_bloqueadas_mandante_FT
  shotsBlockedAwayFT?: number | null; // finalizacoes_bloqueadas_visitante_FT
  shotsInsideBoxHomeFT?: number | null; // finalizacoes_dentro_area_mandante_FT
  shotsInsideBoxAwayFT?: number | null; // finalizacoes_dentro_area_visitante_FT
  shotsOutsideBoxHomeFT?: number | null; // finalizacoes_fora_area_mandante_FT
  shotsOutsideBoxAwayFT?: number | null; // finalizacoes_fora_area_visitante_FT
  shotsWoodworkHomeFT?: number | null; // finalizacoes_trave_mandante_FT
  shotsWoodworkAwayFT?: number | null; // finalizacoes_trave_visitante_FT

  // Grupo de Ataques
  bigChancesHomeFT?: number | null; // ataque_chances_claras_mandante_FT
  bigChancesAwayFT?: number | null; // ataque_chances_claras_visitante_FT
  cornersHomeFT?: number | null; // ataque_escanteios_mandante_FT
  cornersAwayFT?: number | null; // ataque_escanteios_visitante_FT
  touchesOppBoxHomeFT?: number | null; // ataque_toques_area_adv_mandante_FT
  touchesOppBoxAwayFT?: number | null; // ataque_toques_area_adv_visitante_FT
  throughBallsHomeFT?: number | null; // ataque_passes_profundidade_certos_mandante_FT
  throughBallsAwayFT?: number | null; // ataque_passes_profundidade_certos_visitante_FT
  offsidesHomeFT?: number | null; // ataque_impedimentos_mandante_FT
  offsidesAwayFT?: number | null; // ataque_impedimentos_visitante_FT
  foulsDrawnHomeFT?: number | null; // ataque_faltas_cobradas_mandante_FT
  foulsDrawnAwayFT?: number | null; // ataque_faltas_cobradas_visitante_FT

  // Grupo de Passes
  passesAccurateHomeFT?: number | null; // passes_certos_mandante_FT
  passesTotalHomeFT?: number | null; // passes_totais_mandante_FT
  passesPctHomeFT?: number | null; // passes_precisao_pct_mandante_FT
  passesAccurateAwayFT?: number | null; // passes_certos_visitante_FT
  passesTotalAwayFT?: number | null; // passes_totais_visitante_FT
  passesPctAwayFT?: number | null; // passes_precisao_pct_visitante_FT

  longPassesAccurateHomeFT?: number | null; // passes_longos_certos_mandante_FT
  longPassesTotalHomeFT?: number | null; // passes_longos_totais_mandante_FT
  longPassesPctHomeFT?: number | null; // passes_longos_pct_mandante_FT
  longPassesAccurateAwayFT?: number | null; // passes_longos_certos_visitante_FT
  longPassesTotalAwayFT?: number | null; // passes_longos_totais_visitante_FT
  longPassesPctAwayFT?: number | null; // passes_longos_pct_visitante_FT

  finalThirdPassesAccurateHomeFT?: number | null; // passes_terco_final_certos_mandante_FT
  finalThirdPassesTotalHomeFT?: number | null; // passes_terco_final_totais_mandante_FT
  finalThirdPassesPctHomeFT?: number | null; // passes_terco_final_pct_mandante_FT
  finalThirdPassesAccurateAwayFT?: number | null; // passes_terco_final_certos_visitante_FT
  finalThirdPassesTotalAwayFT?: number | null; // passes_terco_final_totais_visitante_FT
  finalThirdPassesPctAwayFT?: number | null; // passes_terco_final_pct_visitante_FT

  crossesAccurateHomeFT?: number | null; // passes_cruzamentos_certos_mandante_FT
  crossesTotalHomeFT?: number | null; // passes_cruzamentos_totais_mandante_FT
  crossesPctHomeFT?: number | null; // passes_cruzamentos_pct_mandante_FT
  crossesAccurateAwayFT?: number | null; // passes_cruzamentos_certos_visitante_FT
  crossesTotalAwayFT?: number | null; // passes_cruzamentos_totais_visitante_FT
  crossesPctAwayFT?: number | null; // passes_cruzamentos_pct_visitante_FT

  xaHomeFT?: number | null; // passes_xa_mandante_FT
  xaAwayFT?: number | null; // passes_xa_visitante_FT
  throwInsHomeFT?: number | null; // passes_laterais_cobrados_mandante_FT
  throwInsAwayFT?: number | null; // passes_laterais_cobrados_visitante_FT

  // Grupo de Defesa
  foulsHomeFT?: number | null; // defesa_faltas_mandante_FT
  foulsAwayFT?: number | null; // defesa_faltas_visitante_FT
  tacklesAccurateHomeFT?: number | null; // defesa_desarmes_certos_mandante_FT
  tacklesTotalHomeFT?: number | null; // defesa_desarmes_totais_mandante_FT
  tacklesPctHomeFT?: number | null; // defesa_desarmes_pct_mandante_FT
  tacklesAccurateAwayFT?: number | null; // defesa_desarmes_certos_visitante_FT
  tacklesTotalAwayFT?: number | null; // defesa_desarmes_totais_visitante_FT
  tacklesPctAwayFT?: number | null; // defesa_desarmes_pct_visitante_FT

  duelsWonHomeFT?: number | null; // defesa_duelos_ganhos_mandante_FT
  duelsWonAwayFT?: number | null; // defesa_duelos_ganhos_visitante_FT
  clearancesHomeFT?: number | null; // defesa_rebatidas_mandante_FT
  clearancesAwayFT?: number | null; // defesa_rebatidas_visitante_FT
  interceptionsHomeFT?: number | null; // defesa_interceptacoes_mandante_FT
  interceptionsAwayFT?: number | null; // defesa_interceptacoes_visitante_FT

  errorsLeadToShotHomeFT?: number | null; // defesa_erros_resultaram_finalizacao_mandante_FT
  errorsLeadToShotAwayFT?: number | null; // defesa_erros_resultaram_finalizacao_visitante_FT
  errorsLeadToGoalHomeFT?: number | null; // defesa_erros_resultaram_gol_mandante_FT
  errorsLeadToGoalAwayFT?: number | null; // defesa_erros_resultaram_gol_visitante_FT

  goalkeeperDefActionHomeFT?: number | null; // defesa_goleiro_mandante_FT
  goalkeeperDefActionAwayFT?: number | null; // defesa_goleiro_visitante_FT

  // Grupo Goleiro
  savesHomeFT?: number | null; // goleiro_defesas_mandante_FT
  savesAwayFT?: number | null; // goleiro_defesas_visitante_FT
  xgotFacedHomeFT?: number | null; // goleiro_xgot_enfrentado_mandante_FT
  xgotFacedAwayFT?: number | null; // goleiro_xgot_enfrentado_visitante_FT
  goalsPreventedHomeFT?: number | null; // goleiro_gols_evitados_mandante_FT
  goalsPreventedAwayFT?: number | null; // goleiro_gols_evitados_visitante_FT
  goalKicksHomeFT?: number | null; // goleiro_tiros_de_meta_mandante_FT
  goalKicksAwayFT?: number | null; // goleiro_tiros_de_meta_visitante_FT

  // Minutagem dos Gols
  goalMinutesHomeFT?: string | null; // minutos_gols_mandante_ft (ex: "9,19,43,74")
  goalMinutesAwayFT?: string | null; // minutos_gols_visitante_ft (ex: "12,65")
}

export type RadarCategory =
  | 'BTTS_HT' // Ambas Marcam HT (1º Tempo)
  | 'BTTS_FT' // Ambas Marcam FT (Jogo Completo)
  | 'OVER_25_FT' // Over 2.5 Gols FT
  | 'OVER_35_FT' // Over 3.5 Gols FT
  | 'HOME_WIN' // Mandante para Vencer (Home Win)
  | 'OVER_15_HT'; // Over 1.5 Gols HT (1º Tempo)

export interface RadarMatchProjection {
  match: Match;
  category: RadarCategory;
  categoryLabel: string;
  categoryMarketBadge: string;
  dateFormatted: string;
  timeFormatted: string;
  probPoisson: number;
  probSampleReal: number;
  confidenceScore: number;
  marketOddJusta: number;
  marketOddBookie?: number;
  evPercent?: number;
  ratingTier: 'DIAMOND' | 'GOLD' | 'SILVER' | 'BRONZE';
  highlights: string[];
  metrics: Record<string, any>;
}

export interface Country {
  id: string; // e.g. "PAIS-001"
  name: string;
  code?: string;
  flagUrl?: string;
  createdAt: string;
}

export type TiebreakerCriterion =
  | 'POINTS' // Pontos Ganhos (Sempre 1º critério em ligas por pontos corridos)
  | 'WINS' // Número de Vitórias
  | 'GOAL_DIFFERENCE' // Saldo de Gols Geral
  | 'GOALS_FOR' // Gols Pró / Marcados Geral
  | 'HEAD_TO_HEAD' // Confronto Direto (Pontos -> Saldo -> Gols Fora no H2H)
  | 'AWAY_GOALS' // Gols Marcados Fora de Casa Geral
  | 'LEAST_RED_CARDS' // Menos Cartões Vermelhos (Fair Play)
  | 'LEAST_YELLOW_CARDS' // Menos Cartões Amarelos (Fair Play)
  | 'DRAW_LOTS'; // Sorteio / Ordem Alfabética

export interface LeagueZoneRule {
  id: string;
  name: string; // Ex: "Fase de Grupos Libertadores", "Sul-Americana", "Champions League", "Rebaixamento"
  fromPos: number; // Ex: 1
  toPos: number; // Ex: 4
  colorClass: string; // Tailwind color classes
  type: 'CHAMPION' | 'PROMOTION' | 'CONTINENTAL_1' | 'CONTINENTAL_2' | 'CONTINENTAL_3' | 'PLAYOFF' | 'RELEGATION' | 'RELEGATION_PLAYOFF' | 'CUSTOM';
}

export interface LeagueRegulationConfig {
  leagueId: string;
  leagueName?: string;
  model: 'GOAL_DIFFERENCE' | 'HEAD_TO_HEAD' | 'WINS_FIRST' | 'CUSTOM';
  rulesSequence: TiebreakerCriterion[];
  pointsPerWin?: number; // default 3
  pointsPerDraw?: number; // default 1
  pointsPerLoss?: number; // default 0
  zones?: LeagueZoneRule[];
  notes?: string;
}

export interface League {
  id: string; // e.g. "LIGA-001"
  name: string;
  countryId: string;
  countryName: string;
  type?: string; // e.g., "Pontos Corridos", "Mata-Mata", "Copa"
  logoUrl?: string;
  regulationConfig?: LeagueRegulationConfig;
  tiebreakerModel?: 'GOAL_DIFFERENCE' | 'HEAD_TO_HEAD' | 'WINS_FIRST' | 'CUSTOM';
  tiebreakerSequence?: TiebreakerCriterion[];
  zones?: LeagueZoneRule[];
  createdAt: string;
}

export interface Team {
  id: string; // e.g. "TIME-001"
  name: string;
  countryId: string;
  countryName: string;
  leagueId?: string; // e.g. "LIGA-001"
  leagueName?: string;
  leagueIds?: string[];
  logoUrl?: string;
  rivalTeamIds?: string[];
  rivalTeamNames?: string[];
  stadium?: string;
  stadiumCapacity?: number | null;
  createdAt: string;
}

export interface PressureTimelinePoint {
  minute: number;
  value: number;
  team: 'home' | 'away' | 'neutral';
  isPeak?: boolean;
  event?: 'goal_home' | 'goal_away' | 'yellow_home' | 'yellow_away' | 'red_home' | 'red_away' | 'corner_home' | 'corner_away' | 'none';
  eventDescription?: string;
}

export interface PressureInterval {
  interval: string;
  homePressure?: number;
  awayPressure?: number;
  netIndex?: number;
  dominantTeam: 'home' | 'away' | 'balanced' | string;
  contextHighlight?: string;
  cornersAndCards?: string;
  goalsAndHighlights?: string;
  homeAttackingVolume?: number;
  awayAttackingVolume?: number;
}

export interface PressureEvent {
  minute: number;
  type: 'goal' | 'card' | 'red_card' | 'corner' | 'sub';
  team: 'home' | 'away';
  description?: string;
  cardType?: 'yellow' | 'red';
}

export interface MatchPressureData {
  timeline: PressureTimelinePoint[];
  homeDominancePct: number;
  awayDominancePct: number;
  homePeakCount: number;
  awayPeakCount: number;
  intervals: PressureInterval[];
  events: PressureEvent[];
  cornersSummary?: {
    homeFT: number;
    awayFT: number;
    homeHT: number;
    awayHT: number;
    total: number;
  };
  cardsSummary?: {
    yellowHomeFT: number;
    yellowAwayFT: number;
    yellowHomeHT: number;
    yellowAwayHT: number;
    redHomeFT: number;
    redAwayFT: number;
    total: number;
  };
  goalsSummary?: {
    homeFT: number;
    awayFT: number;
    homeHT: number;
    awayHT: number;
    goalMinutesHome: string[];
    goalMinutesAway: string[];
    firstGoalMinHome: number | null;
    firstGoalMinAway: number | null;
    firstGoalMinMatch: number | null;
  };
  extractedTeams?: {
    homeCode?: string;
    awayCode?: string;
    homeName?: string;
    awayName?: string;
  };
  totalMinutes?: number;
  tacticalSummary?: string;
  sourceImageUrl?: string;
  rawCsvText?: string;
  importedAt?: string;
}

export interface MatchOdds {
  // Odds 1X2 FT
  homeFT?: number | null; // Odd_Home_FT
  drawFT?: number | null; // Odd_Draw_FT
  awayFT?: number | null; // Odd_Away_FT

  // Odds Gols FT
  over25FT?: number | null; // Odd_Over25_FT
  under25FT?: number | null; // Odd_Under25_FT

  // Handicap Asiático FT
  asianHandicapHomeLine?: number | null; // Linha_Handicap_Asiático_Mandante_FT
  asianHandicapHomeOdd?: number | null; // Odd_Handicap_Asiático_Mandante_FT
  asianHandicapAwayLine?: number | null; // Linha_Handicap_Asiático_Visitante_FT
  asianHandicapAwayOdd?: number | null; // Odd_Handicap_Asiático_Visitante_FT
}

export interface Referee {
  id: string; // e.g. "REF-001"
  name: string;
  photoUrl?: string;
  countryId?: string;
  countryName?: string;
  createdAt: string;
}

export interface Match {
  id: string; // e.g. "JOGO-001"
  countryId: string;
  countryName: string;
  countryFlagUrl?: string;
  leagueId: string;
  leagueName: string;
  leagueLogoUrl?: string;
  homeTeamId: string;
  homeTeamName: string;
  homeTeamLogoUrl?: string;
  awayTeamId: string;
  awayTeamName: string;
  awayTeamLogoUrl?: string;
  homeScore: number | null;
  awayScore: number | null;
  matchDate: string; // ISO date-time string
  referee?: string; // Arbitro
  refereePhotoUrl?: string; // URL da Foto do Arbitro
  stadium?: string; // Estadio
  stadiumCapacity?: number | null; // Capacidade
  attendance?: number | null; // Publico
  status: MatchStatus;
  notes?: string;
  stats?: MatchStats;
  odds?: MatchOdds;
  pressureData?: MatchPressureData;
  isContinental?: boolean;
  createdAt: string;
}

export type UserRole = 'MASTER' | 'CONSULTOR';
export type UserAccessDuration = '30_DAYS' | '60_DAYS' | '90_DAYS' | '180_DAYS' | '1_YEAR' | 'LIFETIME' | 'CUSTOM';
export type UserStatus = 'ACTIVE' | 'EXPIRED' | 'BLOCKED';

export interface AppUser {
  id: string; // e.g. "USER-001"
  name: string;
  username: string; // login identifier
  password?: string;
  role: UserRole;
  duration: UserAccessDuration;
  customDays?: number | null;
  status: UserStatus;
  createdAt: string; // ISO date
  expiresAt: string | null; // ISO date string or null for lifetime
  lastLogin?: string;
  notes?: string;
}

export interface DbState {
  countries: Country[];
  leagues: League[];
  teams: Team[];
  matches: Match[];
  users?: AppUser[];
  referees?: Referee[];
}

export interface NewEntityCreatedNotification {
  type: 'country' | 'league' | 'team' | 'match' | 'user' | 'referee';
  id: string;
  name: string;
}
