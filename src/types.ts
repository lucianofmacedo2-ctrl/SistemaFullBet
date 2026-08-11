export type MatchStatus = 'AGENDADO' | 'EM_ANDAMENTO' | 'FINALIZADO' | 'ADIADO';

export interface MatchStats {
  halftimeHomeScore?: number | null;
  halftimeAwayScore?: number | null;
  possessionHome?: number | null; // e.g. 55 (%)
  possessionAway?: number | null; // e.g. 45 (%)
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
  scorersHome?: string; // e.g. "Pedro (23', 45'), Gabigol (80')"
  scorersAway?: string; // e.g. "Veiga (12')"
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
  stadium?: string;
  logoUrl?: string;
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
  round?: string; // e.g. "Rodada 1", "Final"
  stadium?: string;
  status: MatchStatus;
  notes?: string;
  stats?: MatchStats;
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
