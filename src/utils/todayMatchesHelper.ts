import { DbState, Match } from '../types';

export const USER_VERIFIED_TODAY_DATE = '2026-09-08';

export const USER_VERIFIED_TODAY_MATCHES = [
  {
    leagueName: 'Brasileirão Série B',
    time: '20:00',
    homeTeamName: 'Náutico',
    awayTeamName: 'Botafogo-SP',
    countryName: 'Brasil',
  },
  {
    leagueName: 'Copa Betano do Brasil',
    time: '20:00',
    homeTeamName: 'Grêmio',
    awayTeamName: 'Internacional',
    countryName: 'Brasil',
  },
  {
    leagueName: 'La Liga',
    time: '16:00',
    homeTeamName: 'Real Sociedad',
    awayTeamName: 'Celta de Vigo',
    countryName: 'Espanha',
  },
  {
    leagueName: 'Ligue 1',
    time: '15:45',
    homeTeamName: 'Toulouse',
    awayTeamName: 'Lille',
    countryName: 'França',
  },
];

/**
 * Garante que os jogos de hoje (data de referência 08/09/2026) sejam estritamente
 * os jogos oficiais corretos fornecidos pelo usuário, removendo quaisquer jogos errôneos
 * vindos de anomalias no CSV do GitHub (ex: Real Madrid x Inter cadastrado erroneamente nesta data).
 */
export function enforceUserVerifiedTodayMatches(db: DbState): DbState {
  if (!db || !Array.isArray(db.matches)) return db;

  // 1. Garantir que a liga Copa Betano do Brasil exista no cadastro de ligas
  let copa = db.leagues.find(l => 
    l.name === 'Copa Betano do Brasil' || 
    (l.name.toLowerCase().includes('copa') && (l.countryName || '').toLowerCase().includes('brasil'))
  );
  const brasil = db.countries.find(c => (c.name || '').toLowerCase().includes('brasil'));
  if (!copa && brasil) {
    copa = {
      id: 'LIGA-COPA-BR',
      name: 'Copa Betano do Brasil',
      countryId: brasil.id,
      countryName: brasil.name,
      type: 'Mata-Mata',
      createdAt: new Date().toISOString(),
    };
    db.leagues.push(copa);
  } else if (copa) {
    copa.name = 'Copa Betano do Brasil';
  }

  // 2. Partidas que NÃO são de 2026-09-08
  const nonTodayMatches = db.matches.filter(m => !(m.matchDate || '').startsWith(USER_VERIFIED_TODAY_DATE));

  // 3. Montar as 4 partidas oficiais de hoje
  const verifiedMatches: Match[] = USER_VERIFIED_TODAY_MATCHES.map((target, idx) => {
    const matchDate = `${USER_VERIFIED_TODAY_DATE}T${target.time}:00`;

    // Buscar times no banco
    const homeTeam = db.teams.find(t => t.name.toLowerCase() === target.homeTeamName.toLowerCase());
    const awayTeam = db.teams.find(t => t.name.toLowerCase() === target.awayTeamName.toLowerCase());

    // Buscar liga correspondente
    let league = db.leagues.find(l => l.name.toLowerCase() === target.leagueName.toLowerCase());
    if (!league && target.leagueName.includes('Copa')) {
      league = copa;
    }

    // Buscar país correspondente
    const country = db.countries.find(c => c.name.toLowerCase() === target.countryName.toLowerCase());

    return {
      id: `JOGO-HOJE-${idx + 1}`,
      matchDate,
      status: 'AGENDADO',
      leagueId: league ? league.id : 'LIGA-GEN',
      leagueName: target.leagueName,
      countryId: country ? country.id : (league?.countryId || 'PAIS-GEN'),
      countryName: target.countryName,
      homeTeamId: homeTeam ? homeTeam.id : `TIME-${target.homeTeamName}`,
      homeTeamName: target.homeTeamName,
      homeTeamLogoUrl: homeTeam?.logoUrl,
      awayTeamId: awayTeam ? awayTeam.id : `TIME-${target.awayTeamName}`,
      awayTeamName: target.awayTeamName,
      awayTeamLogoUrl: awayTeam?.logoUrl,
      homeScore: null,
      awayScore: null,
      createdAt: new Date().toISOString(),
    };
  });

  return {
    ...db,
    matches: [...nonTodayMatches, ...verifiedMatches],
  };
}
