export type MatchStatus = 'AGENDADO' | 'EM_ANDAMENTO' | 'FINALIZADO' | 'ADIADO';

export interface MatchStats {
  // Gols & Placar
  halftimeHomeScore?: number | null;
  halftimeAwayScore?: number | null;
  goalMinutesHome?: string;
  goalMinutesAway?: string;
  firstGoalMinuteHome?: number | null;
  firstGoalMinuteAway?: number | null;
  firstGoalMinuteMatch?: number | null;

  // Cantos (Escanteios)
  cornersHomeFT?: number | null;
  cornersAwayFT?: number | null;
  cornersHomeHT?: number | null;
  cornersAwayHT?: number | null;

  // Posse de Bola (%)
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

  // Chutes ao Gol (On Target)
  shotsOnTargetHomeFT?: number | null;
  shotsOnTargetAwayFT?: number | null;
  shotsOnTargetHomeHT?: number | null;
  shotsOnTargetAwayHT?: number | null;

  // Finalizações (Chutes Totais)
  shotsHomeFT?: number | null;
  shotsAwayFT?: number | null;
  shotsHomeHT?: number | null;
  shotsAwayHT?: number | null;

  // Campos legados para compatibilidade
  possessionHome?: number | null;
  possessionAway?: number | null;
  shotsHome?: number | null;
  shotsAway?: number | null;
  shotsOnTargetHome?: number | null;
  shotsOnTargetAway?: number | null;
  cornersHome?: number | null;
  cornersAway?: number | null;
  foulsHome?: number | null;
  foulsAway?: number | null;
  yellowCardsHome?: number | null;
  yellowCardsAway?: number | null;
  redCardsHome?: number | null;
  redCardsAway?: number | null;
  offsidesHome?: number | null;
  offsidesAway?: number | null;
  scorersHome?: string;
  scorersAway?: string;
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
  leagueIds?: string[]; // Multiple leagues (e.g. domestic league + cup + continental)
  stadium?: string;
  logoUrl?: string;
  createdAt: string;
}

export interface MinuteAndOdd {
  minute?: number | null;
  odd?: number | null;
}

export interface PressureTimelinePoint {
  minute: number; // 1 to 90+
  value: number; // -100 to +100 (positive: home team pressure, negative: away team pressure)
  team: 'home' | 'away' | 'neutral';
  isPeak?: boolean; // Reached high intensity / critical attack threshold
  event?: 'goal_home' | 'goal_away' | 'yellow_home' | 'yellow_away' | 'red_home' | 'red_away' | 'none';
  eventDescription?: string;
}

export interface PressureInterval {
  interval: string; // e.g. "0-15'", "16-30'", "31-45'+", "46-60'", "61-75'", "76-90'+"
  homeAvg: number; // 0-100
  awayAvg: number; // 0-100
  dominantTeam: 'home' | 'away' | 'balanced';
  homeAttackingVolume?: number;
  awayAttackingVolume?: number;
}

export interface PressureEvent {
  minute: number;
  type: 'goal' | 'card' | 'red_card' | 'sub';
  team: 'home' | 'away';
  description?: string;
}

export interface MatchPressureData {
  timeline: PressureTimelinePoint[];
  homeDominancePct: number; // 0 to 100
  awayDominancePct: number; // 0 to 100
  homePeakCount: number; // count of dangerous attacks above threshold
  awayPeakCount: number;
  intervals: PressureInterval[];
  events: PressureEvent[];
  extractedTeams?: {
    homeCode?: string;
    awayCode?: string;
    homeName?: string;
    awayName?: string;
  };
  totalMinutes?: number;
  tacticalSummary?: string;
  sourceImageUrl?: string;
  importedAt?: string;
}

export interface MatchOdds {
  // Odds FT (Full Time)
  homeFT?: number | null;
  drawFT?: number | null;
  awayFT?: number | null;
  over25FT?: number | null;
  under25FT?: number | null;
  bttsFT?: number | null;

  // Odds HT (Half Time)
  homeHT?: number | null;
  drawHT?: number | null;
  awayHT?: number | null;
  over05HT?: number | null;
  under05HT?: number | null;
  bttsHT?: number | null;

  // Goal moments & odds
  firstGoalHome?: MinuteAndOdd;
  firstGoalAway?: MinuteAndOdd;
  earlyGameGoal?: MinuteAndOdd;
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
  round?: string; // e.g. "Rodada 1", "Final"
  stadium?: string;
  referee?: string;
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
