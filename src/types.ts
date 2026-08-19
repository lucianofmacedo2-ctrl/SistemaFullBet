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

export interface League {
  id: string; // e.g. "LIGA-001"
  name: string;
  countryId: string;
  countryName: string;
  type?: string; // e.g., "Pontos Corridos", "Mata-Mata", "Copa"
  logoUrl?: string;
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
  status: MatchStatus;
  notes?: string;
  stats?: MatchStats;
  odds?: MatchOdds;
  pressureData?: MatchPressureData;
  isContinental?: boolean;
  createdAt: string;
}

export interface DbState {
  countries: Country[];
  leagues: League[];
  teams: Team[];
  matches: Match[];
}

export interface NewEntityCreatedNotification {
  type: 'country' | 'league' | 'team' | 'match';
  id: string;
  name: string;
}
