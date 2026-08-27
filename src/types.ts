export type MatchStatus = 'AGENDADO' | 'EM_ANDAMENTO' | 'FINALIZADO' | 'ADIADO';

export interface MatchStats {
  // Gols & Placar HT (Único mercado HT mantido)
  halftimeHomeScore?: number | null;
  halftimeAwayScore?: number | null;

  // Estatísticas FT (Full Time)
  xgHomeFT?: number | null;
  xgAwayFT?: number | null;
  shotsHomeFT?: number | null; // Finalizações Mandante FT
  shotsAwayFT?: number | null; // Finalizações Visitante FT
  shotsOnTargetHomeFT?: number | null; // Chutes a Gol Mandante FT
  shotsOnTargetAwayFT?: number | null; // Chutes a Gol Visitante FT
  foulsHomeFT?: number | null; // Faltas Mandante FT
  foulsAwayFT?: number | null; // Faltas Visitante FT
  cornersHomeFT?: number | null; // Escanteios Mandante FT
  cornersAwayFT?: number | null; // Escanteios Visitante FT
  yellowCardsHomeFT?: number | null; // Cartão Amarelo Mandante FT
  yellowCardsAwayFT?: number | null; // Cartão Amarelo Visitante FT
  redCardsHomeFT?: number | null; // Cartão Vermelho Mandante FT
  redCardsAwayFT?: number | null; // Cartão Vermelho Visitante FT

  // Informações de Estádio e Público
  stadium?: string; // Estadio
  stadiumCapacity?: number | null; // Capacidade
  attendance?: number | null; // Publico

  // Posse de bola FT opcional se disponível
  possessionHomeFT?: number | null;
  possessionAwayFT?: number | null;
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
