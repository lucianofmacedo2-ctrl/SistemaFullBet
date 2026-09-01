import { DbState, Country, League, Team, Match } from '../types';
import { normalizeText } from './countryLeagueHelper';

export interface SanitizeStats {
  foreignLeaguesRemoved: number;
  teamsCleaned: number;
  duplicatesRemoved: number;
  matchesFixed: number;
  details: string[];
}

/**
 * Base de conhecimento canônica de aliases e variações de nomes de ligas/campeonatos.
 */
export const CANONICAL_LEAGUE_ALIASES: Record<string, { canonicalName: string; countryCode?: string }> = {
  // USA
  'mls': { canonicalName: 'Major League Soccer', countryCode: 'USA' },
  'major league soccer': { canonicalName: 'Major League Soccer', countryCode: 'USA' },
  'usa major league soccer': { canonicalName: 'Major League Soccer', countryCode: 'USA' },
  'us major league soccer': { canonicalName: 'Major League Soccer', countryCode: 'USA' },
  'usl': { canonicalName: 'USL Championship', countryCode: 'USA' },
  'usl championship': { canonicalName: 'USL Championship', countryCode: 'USA' },

  // Brasil
  'brasileirao': { canonicalName: 'Brasileirão Série A', countryCode: 'BRA' },
  'brasileirão': { canonicalName: 'Brasileirão Série A', countryCode: 'BRA' },
  'brasileirao serie a': { canonicalName: 'Brasileirão Série A', countryCode: 'BRA' },
  'brasileirão série a': { canonicalName: 'Brasileirão Série A', countryCode: 'BRA' },
  'campeonato brasileiro': { canonicalName: 'Brasileirão Série A', countryCode: 'BRA' },
  'campeonato brasileiro serie a': { canonicalName: 'Brasileirão Série A', countryCode: 'BRA' },
  'campeonato brasileiro série a': { canonicalName: 'Brasileirão Série A', countryCode: 'BRA' },
  'brasileirao betano': { canonicalName: 'Brasileirão Série A', countryCode: 'BRA' },
  'brasileirão betano': { canonicalName: 'Brasileirão Série A', countryCode: 'BRA' },
  'serie a brasil': { canonicalName: 'Brasileirão Série A', countryCode: 'BRA' },
  'brasileirao serie b': { canonicalName: 'Brasileirão Série B', countryCode: 'BRA' },
  'brasileirão série b': { canonicalName: 'Brasileirão Série B', countryCode: 'BRA' },
  'serie b brasil': { canonicalName: 'Brasileirão Série B', countryCode: 'BRA' },
  'campeonato brasileiro serie b': { canonicalName: 'Brasileirão Série B', countryCode: 'BRA' },
  'copa do brasil': { canonicalName: 'Copa do Brasil', countryCode: 'BRA' },
  'copa do nordeste': { canonicalName: 'Copa do Nordeste', countryCode: 'BRA' },

  // Inglaterra
  'premier league': { canonicalName: 'Premier League', countryCode: 'ENG' },
  'epl': { canonicalName: 'Premier League', countryCode: 'ENG' },
  'english premier league': { canonicalName: 'Premier League', countryCode: 'ENG' },
  'inglaterra premier league': { canonicalName: 'Premier League', countryCode: 'ENG' },
  'championship': { canonicalName: 'Championship', countryCode: 'ENG' },
  'efl championship': { canonicalName: 'Championship', countryCode: 'ENG' },
  'championship ing': { canonicalName: 'Championship', countryCode: 'ENG' },
  'league one': { canonicalName: 'League One', countryCode: 'ENG' },
  'league two': { canonicalName: 'League Two', countryCode: 'ENG' },

  // Espanha
  'laliga': { canonicalName: 'La Liga', countryCode: 'ESP' },
  'la liga': { canonicalName: 'La Liga', countryCode: 'ESP' },
  'laliga ea sports': { canonicalName: 'La Liga', countryCode: 'ESP' },
  'primera division': { canonicalName: 'La Liga', countryCode: 'ESP' },
  'primera división': { canonicalName: 'La Liga', countryCode: 'ESP' },
  'laliga 2': { canonicalName: 'La Liga 2', countryCode: 'ESP' },
  'laliga hypermotion': { canonicalName: 'La Liga 2', countryCode: 'ESP' },
  'segunda division': { canonicalName: 'La Liga 2', countryCode: 'ESP' },
  'segunda división': { canonicalName: 'La Liga 2', countryCode: 'ESP' },

  // Itália
  'serie a italia': { canonicalName: 'Serie A', countryCode: 'ITA' },
  'serie a itália': { canonicalName: 'Serie A', countryCode: 'ITA' },
  'serie a tim': { canonicalName: 'Serie A', countryCode: 'ITA' },
  'serie b italia': { canonicalName: 'Serie B', countryCode: 'ITA' },
  'serie b itália': { canonicalName: 'Serie B', countryCode: 'ITA' },

  // Alemanha
  'bundesliga': { canonicalName: 'Bundesliga', countryCode: 'GER' },
  '1. bundesliga': { canonicalName: 'Bundesliga', countryCode: 'GER' },
  'bundesliga 1': { canonicalName: 'Bundesliga', countryCode: 'GER' },
  '2. bundesliga': { canonicalName: '2. Bundesliga', countryCode: 'GER' },
  'bundesliga 2': { canonicalName: '2. Bundesliga', countryCode: 'GER' },

  // França
  'ligue 1': { canonicalName: 'Ligue 1', countryCode: 'FRA' },
  'ligue 1 mcdonalds': { canonicalName: 'Ligue 1', countryCode: 'FRA' },
  'ligue 1 uber eats': { canonicalName: 'Ligue 1', countryCode: 'FRA' },
  'ligue 2': { canonicalName: 'Ligue 2', countryCode: 'FRA' },

  // Portugal
  'primeira liga': { canonicalName: 'Liga Portugal', countryCode: 'POR' },
  'liga portugal': { canonicalName: 'Liga Portugal', countryCode: 'POR' },
  'liga portugal betclic': { canonicalName: 'Liga Portugal', countryCode: 'POR' },
  'liga nos': { canonicalName: 'Liga Portugal', countryCode: 'POR' },
  'segunda liga': { canonicalName: 'Liga Portugal 2', countryCode: 'POR' },
  'liga portugal 2': { canonicalName: 'Liga Portugal 2', countryCode: 'POR' },

  // Holanda
  'eredivisie': { canonicalName: 'Eredivisie', countryCode: 'HOL' },
  'eerste divisie': { canonicalName: 'Eerste Divisie', countryCode: 'HOL' },
  'keuken kampioen divisie': { canonicalName: 'Eerste Divisie', countryCode: 'HOL' },

  // Turquia
  'super lig': { canonicalName: 'Süper Lig', countryCode: 'TUR' },
  'superlig': { canonicalName: 'Süper Lig', countryCode: 'TUR' },
  'süper lig': { canonicalName: 'Süper Lig', countryCode: 'TUR' },
  'trendyol super lig': { canonicalName: 'Süper Lig', countryCode: 'TUR' },
  'trendyol süper lig': { canonicalName: 'Süper Lig', countryCode: 'TUR' },

  // Bélgica
  'jupiler pro league': { canonicalName: 'Jupiler Pro League', countryCode: 'BEL' },
  'belgian pro league': { canonicalName: 'Jupiler Pro League', countryCode: 'BEL' },
  'pro league belgica': { canonicalName: 'Jupiler Pro League', countryCode: 'BEL' },

  // Dinamarca
  'superliga': { canonicalName: 'Superligaen', countryCode: 'DEN' },
  'superligaen': { canonicalName: 'Superligaen', countryCode: 'DEN' },
  'danish superliga': { canonicalName: 'Superligaen', countryCode: 'DEN' },

  // Noruega
  'eliteserien': { canonicalName: 'Eliteserien', countryCode: 'NOR' },
  'norwegian eliteserien': { canonicalName: 'Eliteserien', countryCode: 'NOR' },
  'obos-ligaen': { canonicalName: 'OBOS-ligaen', countryCode: 'NOR' },
  'obos ligaen': { canonicalName: 'OBOS-ligaen', countryCode: 'NOR' },

  // Suécia
  'allsvenskan': { canonicalName: 'Allsvenskan', countryCode: 'SWE' },
  'superettan': { canonicalName: 'Superettan', countryCode: 'SWE' },

  // Islândia
  'besta deild': { canonicalName: 'Besta deild karla', countryCode: 'ISL' },
  'besta deild karla': { canonicalName: 'Besta deild karla', countryCode: 'ISL' },
  '1. deild karla': { canonicalName: '1. deild karla', countryCode: 'ISL' },
  '1. deild': { canonicalName: '1. deild karla', countryCode: 'ISL' },

  // Escócia
  'scottish premiership': { canonicalName: 'Scottish Premiership', countryCode: 'ESC' },
  'premiership escocia': { canonicalName: 'Scottish Premiership', countryCode: 'ESC' },
  'premiership': { canonicalName: 'Scottish Premiership', countryCode: 'ESC' },
  'scottish championship': { canonicalName: 'Championship', countryCode: 'ESC' },
  'championship escocia': { canonicalName: 'Championship', countryCode: 'ESC' },

  // Grécia
  'super league greece': { canonicalName: 'Super League Grécia', countryCode: 'GRÉ' },
  'super league grecia': { canonicalName: 'Super League Grécia', countryCode: 'GRÉ' },
  'super league 1': { canonicalName: 'Super League Grécia', countryCode: 'GRÉ' },
  'grecia super league': { canonicalName: 'Super League Grécia', countryCode: 'GRÉ' },

  // País de Gales
  'cymru premier': { canonicalName: 'Cymru Premier', countryCode: 'PAÍ' },
  'welsh premier league': { canonicalName: 'Cymru Premier', countryCode: 'PAÍ' },
  'liga do pais de gales': { canonicalName: 'Cymru Premier', countryCode: 'PAÍ' },

  // Sérvia
  'superliga servia': { canonicalName: 'SuperLiga Sérvia', countryCode: 'SÉR' },
  'superliga serbia': { canonicalName: 'SuperLiga Sérvia', countryCode: 'SÉR' },
  'serbian superliga': { canonicalName: 'SuperLiga Sérvia', countryCode: 'SÉR' },

  // Suíça
  'super league suica': { canonicalName: 'Super League', countryCode: 'SUÍ' },
  'swiss super league': { canonicalName: 'Super League', countryCode: 'SUÍ' },
  'credit suisse super league': { canonicalName: 'Super League', countryCode: 'SUÍ' },

  // Áustria
  'bundesliga austria': { canonicalName: 'Bundesliga', countryCode: 'ÁUS' },
  'austrian bundesliga': { canonicalName: 'Bundesliga', countryCode: 'ÁUS' },
  'admiral bundesliga': { canonicalName: 'Bundesliga', countryCode: 'ÁUS' },

  // Egito
  'egyptian premier league': { canonicalName: 'Premier League', countryCode: 'EGI' },
  'premier league egito': { canonicalName: 'Premier League', countryCode: 'EGI' },
  'egypt premier league': { canonicalName: 'Premier League', countryCode: 'EGI' },

  // Singapura
  'singapore premier league': { canonicalName: 'Premier League', countryCode: 'SIN' },
  'premier league singapura': { canonicalName: 'Premier League', countryCode: 'SIN' },
  'spl': { canonicalName: 'Premier League', countryCode: 'SIN' },

  // Arábia Saudita
  'saudi pro league': { canonicalName: 'Saudi Pro League', countryCode: 'ARÁ' },
  'roshn saudi league': { canonicalName: 'Saudi Pro League', countryCode: 'ARÁ' },

  // Argentina
  'liga profesional': { canonicalName: 'Liga Profesional', countryCode: 'ARG' },
  'copa de la liga': { canonicalName: 'Copa de la Liga Profesional', countryCode: 'ARG' },
};

export function lookupCanonicalLeague(leagueName?: string): { canonicalName: string; countryCode?: string } | undefined {
  if (!leagueName) return undefined;
  const norm = normalizeText(leagueName);
  if (CANONICAL_LEAGUE_ALIASES[norm]) {
    return CANONICAL_LEAGUE_ALIASES[norm];
  }
  for (const [alias, data] of Object.entries(CANONICAL_LEAGUE_ALIASES)) {
    if (norm === alias || norm.replace(/\s+/g, '') === alias.replace(/\s+/g, '')) {
      return data;
    }
  }
  return undefined;
}

/**
 * Base de conhecimento canônica de clubes conhecidos para desambiguação automática
 * e garantia de vínculo correto de País e Liga principal.
 */
export const CANONICAL_CLUBS: Record<string, { countryCode: string; defaultLeaguePattern: string }> = {
  // Holanda (HOL / NLD)
  ajax: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  'afc ajax': { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  'psv eindhoven': { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  psv: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  eindhoven: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  'fc eindhoven': { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  feyenoord: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  'feyenoord rotterdam': { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  'az alkmaar': { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  az: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  utrecht: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  'fc utrecht': { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  twente: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  'fc twente': { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  heerenveen: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  'sc heerenveen': { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  zwolle: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  'pec zwolle': { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  groningen: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  'fc groningen': { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  'sparta rotterdam': { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  sparta: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  'den haag': { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  'ado den haag': { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  'for sittard': { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  'fortuna sittard': { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  'willem ii': { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  'willem 2': { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  'go ahead eagles': { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  'go ahead': { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  telstar: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  nijmegen: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  nec: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  'nec nijmegen': { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  excelsior: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  cambuur: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  'sc cambuur': { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  vitesse: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  'vitesse arnhem': { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  volendam: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  'fc volendam': { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  breda: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  'nac breda': { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  'almere city': { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  almere: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  heracles: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  'heracles almelo': { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  waalwijk: { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  'rkc waalwijk': { countryCode: 'HOL', defaultLeaguePattern: 'Eredivisie' },
  dordrecht: { countryCode: 'HOL', defaultLeaguePattern: 'Eerste Divisie' },
  'de graafschap': { countryCode: 'HOL', defaultLeaguePattern: 'Eerste Divisie' },
  emmen: { countryCode: 'HOL', defaultLeaguePattern: 'Eerste Divisie' },
  'fc emmen': { countryCode: 'HOL', defaultLeaguePattern: 'Eerste Divisie' },
  'helmond sport': { countryCode: 'HOL', defaultLeaguePattern: 'Eerste Divisie' },
  'mvv maastricht': { countryCode: 'HOL', defaultLeaguePattern: 'Eerste Divisie' },
  'roda jc': { countryCode: 'HOL', defaultLeaguePattern: 'Eerste Divisie' },
  'top oss': { countryCode: 'HOL', defaultLeaguePattern: 'Eerste Divisie' },
  'vvv venlo': { countryCode: 'HOL', defaultLeaguePattern: 'Eerste Divisie' },

  // Turquia (TUR)
  galatasaray: { countryCode: 'TUR', defaultLeaguePattern: 'Futbol Ligi' },
  fenerbahce: { countryCode: 'TUR', defaultLeaguePattern: 'Futbol Ligi' },
  fenerbahçe: { countryCode: 'TUR', defaultLeaguePattern: 'Futbol Ligi' },
  besiktas: { countryCode: 'TUR', defaultLeaguePattern: 'Futbol Ligi' },
  beşiktaş: { countryCode: 'TUR', defaultLeaguePattern: 'Futbol Ligi' },
  trabzonspor: { countryCode: 'TUR', defaultLeaguePattern: 'Futbol Ligi' },
  basaksehir: { countryCode: 'TUR', defaultLeaguePattern: 'Futbol Ligi' },
  başakşehir: { countryCode: 'TUR', defaultLeaguePattern: 'Futbol Ligi' },
  'istanbul basaksehir': { countryCode: 'TUR', defaultLeaguePattern: 'Futbol Ligi' },
  kasimpasa: { countryCode: 'TUR', defaultLeaguePattern: 'Futbol Ligi' },
  kasımpaşa: { countryCode: 'TUR', defaultLeaguePattern: 'Futbol Ligi' },
  konyaspor: { countryCode: 'TUR', defaultLeaguePattern: 'Futbol Ligi' },
  rizespor: { countryCode: 'TUR', defaultLeaguePattern: 'Futbol Ligi' },
  'caykur rizespor': { countryCode: 'TUR', defaultLeaguePattern: 'Futbol Ligi' },
  antalyaspor: { countryCode: 'TUR', defaultLeaguePattern: 'Futbol Ligi' },
  sivasspor: { countryCode: 'TUR', defaultLeaguePattern: 'Futbol Ligi' },
  'adana demirspor': { countryCode: 'TUR', defaultLeaguePattern: 'Futbol Ligi' },
  alanyaspor: { countryCode: 'TUR', defaultLeaguePattern: 'Futbol Ligi' },
  gaziantep: { countryCode: 'TUR', defaultLeaguePattern: 'Futbol Ligi' },
  'gaziantep fk': { countryCode: 'TUR', defaultLeaguePattern: 'Futbol Ligi' },
  hatayspor: { countryCode: 'TUR', defaultLeaguePattern: 'Futbol Ligi' },
  samsunspor: { countryCode: 'TUR', defaultLeaguePattern: 'Futbol Ligi' },
  kayserispor: { countryCode: 'TUR', defaultLeaguePattern: 'Futbol Ligi' },
  eyupspor: { countryCode: 'TUR', defaultLeaguePattern: 'Futbol Ligi' },
  eyüpspor: { countryCode: 'TUR', defaultLeaguePattern: 'Futbol Ligi' },
  'bodrum fk': { countryCode: 'TUR', defaultLeaguePattern: 'Futbol Ligi' },
  bodrum: { countryCode: 'TUR', defaultLeaguePattern: 'Futbol Ligi' },
  goztepe: { countryCode: 'TUR', defaultLeaguePattern: 'Futbol Ligi' },
  göztepe: { countryCode: 'TUR', defaultLeaguePattern: 'Futbol Ligi' },
  corum: { countryCode: 'TUR', defaultLeaguePattern: 'Futbol Ligi' },
  çorum: { countryCode: 'TUR', defaultLeaguePattern: 'Futbol Ligi' },
  'corum fk': { countryCode: 'TUR', defaultLeaguePattern: 'Futbol Ligi' },
  sakaryaspor: { countryCode: 'TUR', defaultLeaguePattern: 'Futbol Ligi' },
  bandirmaspor: { countryCode: 'TUR', defaultLeaguePattern: 'Futbol Ligi' },
  umraniyespor: { countryCode: 'TUR', defaultLeaguePattern: 'Futbol Ligi' },
  pendikspor: { countryCode: 'TUR', defaultLeaguePattern: 'Futbol Ligi' },
  istanbulspor: { countryCode: 'TUR', defaultLeaguePattern: 'Futbol Ligi' },
  ankaragucu: { countryCode: 'TUR', defaultLeaguePattern: 'Futbol Ligi' },

  // Bélgica (BEL)
  'raal la louviere': { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  'la louviere': { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  'club brugge': { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  brugge: { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  kortrijk: { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  standard: { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  'standard liege': { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  'cercle brugge': { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  'st truiden': { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  'sint-truiden': { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  'lommel sk': { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  lommel: { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  westerlo: { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  'st. gilloise': { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  'union st. gilloise': { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  'union sg': { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  gent: { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  'kaa gent': { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  mechelen: { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  charleroi: { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  'oud-heverlee leuven': { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  'oh leuven': { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  waregem: { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  'zulte waregem': { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  genk: { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  'krc genk': { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  anderlecht: { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  antwerp: { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  'royal antwerp': { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  eupen: { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  beerschot: { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },
  dender: { countryCode: 'BEL', defaultLeaguePattern: 'Jupiler' },

  // Escócia (ESC / SCO)
  dunfermline: { countryCode: 'ESC', defaultLeaguePattern: 'Division 1' },
  ayr: { countryCode: 'ESC', defaultLeaguePattern: 'Division 1' },
  'ayr united': { countryCode: 'ESC', defaultLeaguePattern: 'Division 1' },
  arbroath: { countryCode: 'ESC', defaultLeaguePattern: 'Division 1' },
  'inverness c': { countryCode: 'ESC', defaultLeaguePattern: 'Division 1' },
  inverness: { countryCode: 'ESC', defaultLeaguePattern: 'Division 1' },
  livingston: { countryCode: 'ESC', defaultLeaguePattern: 'Division 1' },
  'queens park': { countryCode: 'ESC', defaultLeaguePattern: 'Division 1' },
  morton: { countryCode: 'ESC', defaultLeaguePattern: 'Division 1' },
  partick: { countryCode: 'ESC', defaultLeaguePattern: 'Division 1' },
  'partick thistle': { countryCode: 'ESC', defaultLeaguePattern: 'Division 1' },
  'raith rvs': { countryCode: 'ESC', defaultLeaguePattern: 'Division 1' },
  'raith rovers': { countryCode: 'ESC', defaultLeaguePattern: 'Division 1' },
  stenhousemuir: { countryCode: 'ESC', defaultLeaguePattern: 'Division 1' },
  alloa: { countryCode: 'ESC', defaultLeaguePattern: 'Division 2' },
  'alloa athletic': { countryCode: 'ESC', defaultLeaguePattern: 'Division 2' },
  'east fife': { countryCode: 'ESC', defaultLeaguePattern: 'Division 2' },
  'cove rangers': { countryCode: 'ESC', defaultLeaguePattern: 'Division 2' },
  'airdrie utd': { countryCode: 'ESC', defaultLeaguePattern: 'Division 2' },
  'airdrieonians': { countryCode: 'ESC', defaultLeaguePattern: 'Division 2' },
  'east kilbride': { countryCode: 'ESC', defaultLeaguePattern: 'Division 2' },
  'queen of sth': { countryCode: 'ESC', defaultLeaguePattern: 'Division 2' },
  'queen of the south': { countryCode: 'ESC', defaultLeaguePattern: 'Division 2' },
  montrose: { countryCode: 'ESC', defaultLeaguePattern: 'Division 2' },
  hamilton: { countryCode: 'ESC', defaultLeaguePattern: 'Division 2' },
  'hamilton academical': { countryCode: 'ESC', defaultLeaguePattern: 'Division 2' },
  peterhead: { countryCode: 'ESC', defaultLeaguePattern: 'Division 2' },
  'ross county': { countryCode: 'ESC', defaultLeaguePattern: 'Division 2' },
  'annan athletic': { countryCode: 'ESC', defaultLeaguePattern: 'Division 3' },
  spartans: { countryCode: 'ESC', defaultLeaguePattern: 'Division 3' },
  clyde: { countryCode: 'ESC', defaultLeaguePattern: 'Division 3' },
  stranraer: { countryCode: 'ESC', defaultLeaguePattern: 'Division 3' },
  'edinburgh city': { countryCode: 'ESC', defaultLeaguePattern: 'Division 3' },
  elgin: { countryCode: 'ESC', defaultLeaguePattern: 'Division 3' },
  'elgin city': { countryCode: 'ESC', defaultLeaguePattern: 'Division 3' },
  forfar: { countryCode: 'ESC', defaultLeaguePattern: 'Division 3' },
  'forfar athletic': { countryCode: 'ESC', defaultLeaguePattern: 'Division 3' },
  'kelty hearts': { countryCode: 'ESC', defaultLeaguePattern: 'Division 3' },
  stirling: { countryCode: 'ESC', defaultLeaguePattern: 'Division 3' },
  'stirling albion': { countryCode: 'ESC', defaultLeaguePattern: 'Division 3' },
  dumbarton: { countryCode: 'ESC', defaultLeaguePattern: 'Division 3' },
  'dundee united': { countryCode: 'ESC', defaultLeaguePattern: 'Premiere' },
  rangers: { countryCode: 'ESC', defaultLeaguePattern: 'Premiere' },
  falkirk: { countryCode: 'ESC', defaultLeaguePattern: 'Premiere' },
  'st mirren': { countryCode: 'ESC', defaultLeaguePattern: 'Premiere' },
  aberdeen: { countryCode: 'ESC', defaultLeaguePattern: 'Premiere' },
  hearts: { countryCode: 'ESC', defaultLeaguePattern: 'Premiere' },
  'heart of midlothian': { countryCode: 'ESC', defaultLeaguePattern: 'Premiere' },
  'st johnstone': { countryCode: 'ESC', defaultLeaguePattern: 'Premiere' },
  kilmarnock: { countryCode: 'ESC', defaultLeaguePattern: 'Premiere' },
  hibernian: { countryCode: 'ESC', defaultLeaguePattern: 'Premiere' },
  motherwell: { countryCode: 'ESC', defaultLeaguePattern: 'Premiere' },
  celtic: { countryCode: 'ESC', defaultLeaguePattern: 'Premiere' },
  dundee: { countryCode: 'ESC', defaultLeaguePattern: 'Premiere' },

  // Inglaterra (ING)
  arsenal: { countryCode: 'ING', defaultLeaguePattern: 'Premier' },
  'aston villa': { countryCode: 'ING', defaultLeaguePattern: 'Premier' },
  bournemouth: { countryCode: 'ING', defaultLeaguePattern: 'Premier' },
  brentford: { countryCode: 'ING', defaultLeaguePattern: 'Premier' },
  brighton: { countryCode: 'ING', defaultLeaguePattern: 'Premier' },
  chelsea: { countryCode: 'ING', defaultLeaguePattern: 'Premier' },
  'crystal palace': { countryCode: 'ING', defaultLeaguePattern: 'Premier' },
  everton: { countryCode: 'ING', defaultLeaguePattern: 'Premier' },
  fulham: { countryCode: 'ING', defaultLeaguePattern: 'Premier' },
  ipswich: { countryCode: 'ING', defaultLeaguePattern: 'Premier' },
  'ipswich town': { countryCode: 'ING', defaultLeaguePattern: 'Premier' },
  leicester: { countryCode: 'ING', defaultLeaguePattern: 'Premier' },
  'leicester city': { countryCode: 'ING', defaultLeaguePattern: 'Premier' },
  liverpool: { countryCode: 'ING', defaultLeaguePattern: 'Premier' },
  'manchester city': { countryCode: 'ING', defaultLeaguePattern: 'Premier' },
  'man city': { countryCode: 'ING', defaultLeaguePattern: 'Premier' },
  'manchester united': { countryCode: 'ING', defaultLeaguePattern: 'Premier' },
  'man united': { countryCode: 'ING', defaultLeaguePattern: 'Premier' },
  'man utd': { countryCode: 'ING', defaultLeaguePattern: 'Premier' },
  newcastle: { countryCode: 'ING', defaultLeaguePattern: 'Premier' },
  'newcastle united': { countryCode: 'ING', defaultLeaguePattern: 'Premier' },
  'nottingham forest': { countryCode: 'ING', defaultLeaguePattern: 'Premier' },
  'nottm forest': { countryCode: 'ING', defaultLeaguePattern: 'Premier' },
  southampton: { countryCode: 'ING', defaultLeaguePattern: 'Premier' },
  tottenham: { countryCode: 'ING', defaultLeaguePattern: 'Premier' },
  'tottenham hotspur': { countryCode: 'ING', defaultLeaguePattern: 'Premier' },
  spurs: { countryCode: 'ING', defaultLeaguePattern: 'Premier' },
  'west ham': { countryCode: 'ING', defaultLeaguePattern: 'Premier' },
  'west ham united': { countryCode: 'ING', defaultLeaguePattern: 'Premier' },
  wolves: { countryCode: 'ING', defaultLeaguePattern: 'Premier' },
  wolverhampton: { countryCode: 'ING', defaultLeaguePattern: 'Premier' },
  blackburn: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  'blackburn rovers': { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  bolton: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  preston: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  'preston north end': { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  'bristol city': { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  millwall: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  charlton: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  derby: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  'derby county': { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  middlesbrough: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  lincoln: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  norwich: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  'norwich city': { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  'west brom': { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  'west bromwich': { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  portsmouth: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  qpr: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  'queens park rangers': { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  stoke: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  'stoke city': { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  swansea: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  'swansea city': { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  'sheffield united': { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  'sheffield utd': { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  'sheffield wednesday': { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  'sheff wed': { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  birmingham: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  'birmingham city': { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  watford: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  burnley: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  cardiff: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  'cardiff city': { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  wrexham: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  coventry: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  'coventry city': { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  hull: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  'hull city': { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  leeds: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  'leeds united': { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  luton: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  'luton town': { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  oxford: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  'oxford united': { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  plymouth: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  'plymouth argyle': { countryCode: 'ING', defaultLeaguePattern: 'Championship' },
  sunderland: { countryCode: 'ING', defaultLeaguePattern: 'Championship' },

  // Espanha (ESP)
  'real madrid': { countryCode: 'ESP', defaultLeaguePattern: 'La Liga' },
  barcelona: { countryCode: 'ESP', defaultLeaguePattern: 'La Liga' },
  'fc barcelona': { countryCode: 'ESP', defaultLeaguePattern: 'La Liga' },
  'atletico madrid': { countryCode: 'ESP', defaultLeaguePattern: 'La Liga' },
  'atlético madrid': { countryCode: 'ESP', defaultLeaguePattern: 'La Liga' },
  'athletic bilbao': { countryCode: 'ESP', defaultLeaguePattern: 'La Liga' },
  'athletic club': { countryCode: 'ESP', defaultLeaguePattern: 'La Liga' },
  'real sociedad': { countryCode: 'ESP', defaultLeaguePattern: 'La Liga' },
  betis: { countryCode: 'ESP', defaultLeaguePattern: 'La Liga' },
  'real betis': { countryCode: 'ESP', defaultLeaguePattern: 'La Liga' },
  sevilla: { countryCode: 'ESP', defaultLeaguePattern: 'La Liga' },
  villarreal: { countryCode: 'ESP', defaultLeaguePattern: 'La Liga' },
  valencia: { countryCode: 'ESP', defaultLeaguePattern: 'La Liga' },
  girona: { countryCode: 'ESP', defaultLeaguePattern: 'La Liga' },
  'celta vigo': { countryCode: 'ESP', defaultLeaguePattern: 'La Liga' },
  celta: { countryCode: 'ESP', defaultLeaguePattern: 'La Liga' },
  osasuna: { countryCode: 'ESP', defaultLeaguePattern: 'La Liga' },
  mallorca: { countryCode: 'ESP', defaultLeaguePattern: 'La Liga' },
  getafe: { countryCode: 'ESP', defaultLeaguePattern: 'La Liga' },
  'rayo vallecano': { countryCode: 'ESP', defaultLeaguePattern: 'La Liga' },
  'las palmas': { countryCode: 'ESP', defaultLeaguePattern: 'La Liga' },
  alaves: { countryCode: 'ESP', defaultLeaguePattern: 'La Liga' },
  alavés: { countryCode: 'ESP', defaultLeaguePattern: 'La Liga' },
  espanyol: { countryCode: 'ESP', defaultLeaguePattern: 'La Liga' },
  leganes: { countryCode: 'ESP', defaultLeaguePattern: 'La Liga' },
  leganés: { countryCode: 'ESP', defaultLeaguePattern: 'La Liga' },
  valladolid: { countryCode: 'ESP', defaultLeaguePattern: 'La Liga' },

  // Itália (ITA)
  inter: { countryCode: 'ITA', defaultLeaguePattern: 'Serie A' },
  internazionale: { countryCode: 'ITA', defaultLeaguePattern: 'Serie A' },
  milan: { countryCode: 'ITA', defaultLeaguePattern: 'Serie A' },
  'ac milan': { countryCode: 'ITA', defaultLeaguePattern: 'Serie A' },
  juventus: { countryCode: 'ITA', defaultLeaguePattern: 'Serie A' },
  napoli: { countryCode: 'ITA', defaultLeaguePattern: 'Serie A' },
  roma: { countryCode: 'ITA', defaultLeaguePattern: 'Serie A' },
  'as roma': { countryCode: 'ITA', defaultLeaguePattern: 'Serie A' },
  lazio: { countryCode: 'ITA', defaultLeaguePattern: 'Serie A' },
  atalanta: { countryCode: 'ITA', defaultLeaguePattern: 'Serie A' },
  fiorentina: { countryCode: 'ITA', defaultLeaguePattern: 'Serie A' },
  bologna: { countryCode: 'ITA', defaultLeaguePattern: 'Serie A' },
  torino: { countryCode: 'ITA', defaultLeaguePattern: 'Serie A' },
  udinese: { countryCode: 'ITA', defaultLeaguePattern: 'Serie A' },
  genoa: { countryCode: 'ITA', defaultLeaguePattern: 'Serie A' },
  parma: { countryCode: 'ITA', defaultLeaguePattern: 'Serie A' },
  como: { countryCode: 'ITA', defaultLeaguePattern: 'Serie A' },
  cagliari: { countryCode: 'ITA', defaultLeaguePattern: 'Serie A' },
  empoli: { countryCode: 'ITA', defaultLeaguePattern: 'Serie A' },
  verona: { countryCode: 'ITA', defaultLeaguePattern: 'Serie A' },
  'hellas verona': { countryCode: 'ITA', defaultLeaguePattern: 'Serie A' },
  monza: { countryCode: 'ITA', defaultLeaguePattern: 'Serie A' },
  venezia: { countryCode: 'ITA', defaultLeaguePattern: 'Serie A' },
  lecce: { countryCode: 'ITA', defaultLeaguePattern: 'Serie A' },

  // Alemanha (ALE) - 1. Bundesliga
  bayern: { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  'bayern munich': { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  'bayern munchen': { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  'bayern munique': { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  'bayern münchen': { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  dortmund: { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  'borussia dortmund': { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  leverkusen: { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  'bayer leverkusen': { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  leipzig: { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  'rb leipzig': { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  frankfurt: { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  'eintracht frankfurt': { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  stuttgart: { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  'vfb stuttgart': { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  gladbach: { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  'borussia monchengladbach': { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  "borussia m'gladbach": { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  'borussia mönchengladbach': { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  freiburg: { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  'sc freiburg': { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  augsburg: { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  'fc augsburg': { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  bremen: { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  'werder bremen': { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  mainz: { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  'mainz 05': { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  '1. fsv mainz 05': { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  'union berlin': { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  '1. fc union berlin': { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  hoffenheim: { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  'tsg hoffenheim': { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  'tsg 1899 hoffenheim': { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  '1. fc koln': { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  '1. fc köln': { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  'fc koln': { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  'fc köln': { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  'hamburger sv': { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  hsv: { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  'sc paderborn 07': { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  'paderborn 07': { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  'schalke 04': { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  schalke: { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  'fc schalke 04': { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  elversberg: { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },
  'sv elversberg': { countryCode: 'ALE', defaultLeaguePattern: 'Bundesliga' },

  // Alemanha (ALE) - 2. Bundesliga
  'holstein kiel': { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },
  kiel: { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },
  heidenheim: { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },
  '1. fc heidenheim': { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },
  'fc st. pauli': { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },
  'st. pauli': { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },
  'st pauli': { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },
  'sv darmstadt 98': { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },
  darmstadt: { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },
  magdeburg: { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },
  '1. fc magdeburg': { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },
  'hertha bsc': { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },
  hertha: { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },
  'hertha berlin': { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },
  'hannover 96': { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },
  hannover: { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },
  osnabruck: { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },
  'vfl osnabrück': { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },
  bochum: { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },
  'vfl bochum': { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },
  wolfsburg: { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },
  'vfl wolfsburg': { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },
  kaiserslautern: { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },
  '1. fc kaiserslautern': { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },
  '1. fc nurnberg': { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },
  '1. fc nürnberg': { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },
  nurnberg: { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },
  nürnberg: { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },
  bielefeld: { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },
  'arminia bielefeld': { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },
  braunschweig: { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },
  'eintracht braunschweig': { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },
  cottbus: { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },
  'energie cottbus': { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },
  dresden: { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },
  'dynamo dresden': { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },
  furth: { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },
  'greuther furth': { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },
  'greuther fürth': { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },
  karlsruher: { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },
  'karlsruher sc': { countryCode: 'ALE', defaultLeaguePattern: '2. Bundesliga' },

  // Alemanha (ALE) - 3. Liga
  aachen: { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },
  'alemannia aachen': { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },
  duisburg: { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },
  'msv duisburg': { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },
  'fortuna dusseldorf': { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },
  'fortuna düsseldorf': { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },
  'fortuna koln': { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },
  'fortuna köln': { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },
  grossaspach: { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },
  havelse: { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },
  'hoffenheim ii': { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },
  ingolstadt: { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },
  'fc ingolstadt 04': { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },
  mannheim: { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },
  'waldhof mannheim': { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },
  meppen: { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },
  'sv meppen': { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },
  munster: { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },
  münster: { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },
  'preussen munster': { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },
  'preußen münster': { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },
  'rw essen': { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },
  'rot-weiss essen': { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },
  regensburg: { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },
  'jahn regensburg': { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },
  rostock: { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },
  'hansa rostock': { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },
  saarbrucken: { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },
  saarbrücken: { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },
  '1. fc saarbrücken': { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },
  'stuttgart ii': { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },
  'vfb stuttgart ii': { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },
  verl: { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },
  'sc verl': { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },
  'viktoria koln': { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },
  'viktoria köln': { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },
  wehen: { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },
  'wehen wiesbaden': { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },
  'sv wehen wiesbaden': { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },
  'wurzburger kickers': { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },
  'würzburger kickers': { countryCode: 'ALE', defaultLeaguePattern: '3. Liga' },

  // França (FRA)
  psg: { countryCode: 'FRA', defaultLeaguePattern: 'Championnat' },
  'paris saint-germain': { countryCode: 'FRA', defaultLeaguePattern: 'Championnat' },
  'paris sg': { countryCode: 'FRA', defaultLeaguePattern: 'Championnat' },
  monaco: { countryCode: 'FRA', defaultLeaguePattern: 'Championnat' },
  marseille: { countryCode: 'FRA', defaultLeaguePattern: 'Championnat' },
  'olympique marseille': { countryCode: 'FRA', defaultLeaguePattern: 'Championnat' },
  lyon: { countryCode: 'FRA', defaultLeaguePattern: 'Championnat' },
  'olympique lyonnais': { countryCode: 'FRA', defaultLeaguePattern: 'Championnat' },
  lille: { countryCode: 'FRA', defaultLeaguePattern: 'Championnat' },
  nice: { countryCode: 'FRA', defaultLeaguePattern: 'Championnat' },
  lens: { countryCode: 'FRA', defaultLeaguePattern: 'Championnat' },
  rennes: { countryCode: 'FRA', defaultLeaguePattern: 'Championnat' },
  reims: { countryCode: 'FRA', defaultLeaguePattern: 'Championnat' },
  strasbourg: { countryCode: 'FRA', defaultLeaguePattern: 'Championnat' },
  brest: { countryCode: 'FRA', defaultLeaguePattern: 'Championnat' },
  toulouse: { countryCode: 'FRA', defaultLeaguePattern: 'Championnat' },
  montpellier: { countryCode: 'FRA', defaultLeaguePattern: 'Championnat' },
  nantes: { countryCode: 'FRA', defaultLeaguePattern: 'Championnat' },
  auxerre: { countryCode: 'FRA', defaultLeaguePattern: 'Championnat' },
  'le havre': { countryCode: 'FRA', defaultLeaguePattern: 'Championnat' },
  'saint-etienne': { countryCode: 'FRA', defaultLeaguePattern: 'Championnat' },
  angers: { countryCode: 'FRA', defaultLeaguePattern: 'Championnat' },

  // Portugal (POR)
  benfica: { countryCode: 'POR', defaultLeaguePattern: 'Liga' },
  porto: { countryCode: 'POR', defaultLeaguePattern: 'Liga' },
  'fc porto': { countryCode: 'POR', defaultLeaguePattern: 'Liga' },
  sporting: { countryCode: 'POR', defaultLeaguePattern: 'Liga' },
  'sporting cp': { countryCode: 'POR', defaultLeaguePattern: 'Liga' },
  'sporting lisbon': { countryCode: 'POR', defaultLeaguePattern: 'Liga' },
  braga: { countryCode: 'POR', defaultLeaguePattern: 'Liga' },
  'sc braga': { countryCode: 'POR', defaultLeaguePattern: 'Liga' },
  'vitoria guimaraes': { countryCode: 'POR', defaultLeaguePattern: 'Liga' },
  'vitoria de guimaraes': { countryCode: 'POR', defaultLeaguePattern: 'Liga' },
  famalicao: { countryCode: 'POR', defaultLeaguePattern: 'Liga' },
  arouca: { countryCode: 'POR', defaultLeaguePattern: 'Liga' },
  moreirense: { countryCode: 'POR', defaultLeaguePattern: 'Liga' },
  'rio ave': { countryCode: 'POR', defaultLeaguePattern: 'Liga' },
  'gil vicente': { countryCode: 'POR', defaultLeaguePattern: 'Liga' },
  estoril: { countryCode: 'POR', defaultLeaguePattern: 'Liga' },
  boavista: { countryCode: 'POR', defaultLeaguePattern: 'Liga' },
  'santa clara': { countryCode: 'POR', defaultLeaguePattern: 'Liga' },
  nacional: { countryCode: 'POR', defaultLeaguePattern: 'Liga' },
  farense: { countryCode: 'POR', defaultLeaguePattern: 'Liga' },
  'estrela amadora': { countryCode: 'POR', defaultLeaguePattern: 'Liga' },
  avs: { countryCode: 'POR', defaultLeaguePattern: 'Liga' },

  // Brasil (BRA)
  flamengo: { countryCode: 'BRA', defaultLeaguePattern: 'Brasileir' },
  palmeiras: { countryCode: 'BRA', defaultLeaguePattern: 'Brasileir' },
  'sao paulo': { countryCode: 'BRA', defaultLeaguePattern: 'Brasileir' },
  'são paulo': { countryCode: 'BRA', defaultLeaguePattern: 'Brasileir' },
  corinthians: { countryCode: 'BRA', defaultLeaguePattern: 'Brasileir' },
  fluminense: { countryCode: 'BRA', defaultLeaguePattern: 'Brasileir' },
  botafogo: { countryCode: 'BRA', defaultLeaguePattern: 'Brasileir' },
  vasco: { countryCode: 'BRA', defaultLeaguePattern: 'Brasileir' },
  'vasco da gama': { countryCode: 'BRA', defaultLeaguePattern: 'Brasileir' },
  gremio: { countryCode: 'BRA', defaultLeaguePattern: 'Brasileir' },
  grêmio: { countryCode: 'BRA', defaultLeaguePattern: 'Brasileir' },
  internacional: { countryCode: 'BRA', defaultLeaguePattern: 'Brasileir' },
  'atletico mineiro': { countryCode: 'BRA', defaultLeaguePattern: 'Brasileir' },
  'atlético mineiro': { countryCode: 'BRA', defaultLeaguePattern: 'Brasileir' },
  'atletico-mg': { countryCode: 'BRA', defaultLeaguePattern: 'Brasileir' },
  cruzeiro: { countryCode: 'BRA', defaultLeaguePattern: 'Brasileir' },
  'athletico-pr': { countryCode: 'BRA', defaultLeaguePattern: 'Brasileir' },
  'athletico paranaense': { countryCode: 'BRA', defaultLeaguePattern: 'Brasileir' },
  bahia: { countryCode: 'BRA', defaultLeaguePattern: 'Brasileir' },
  fortaleza: { countryCode: 'BRA', defaultLeaguePattern: 'Brasileir' },
  vitoria: { countryCode: 'BRA', defaultLeaguePattern: 'Brasileir' },
  vitória: { countryCode: 'BRA', defaultLeaguePattern: 'Brasileir' },
  cuiaba: { countryCode: 'BRA', defaultLeaguePattern: 'Brasileir' },
  cuiabá: { countryCode: 'BRA', defaultLeaguePattern: 'Brasileir' },
  criciuma: { countryCode: 'BRA', defaultLeaguePattern: 'Brasileir' },
  criciúma: { countryCode: 'BRA', defaultLeaguePattern: 'Brasileir' },
  juventude: { countryCode: 'BRA', defaultLeaguePattern: 'Brasileir' },
  bragantino: { countryCode: 'BRA', defaultLeaguePattern: 'Brasileir' },
  'red bull bragantino': { countryCode: 'BRA', defaultLeaguePattern: 'Brasileir' },
  santos: { countryCode: 'BRA', defaultLeaguePattern: 'Brasileir' },
  sport: { countryCode: 'BRA', defaultLeaguePattern: 'Brasileir' },
  ceara: { countryCode: 'BRA', defaultLeaguePattern: 'Brasileir' },
  ceará: { countryCode: 'BRA', defaultLeaguePattern: 'Brasileir' },
  goias: { countryCode: 'BRA', defaultLeaguePattern: 'Brasileir' },
  goiás: { countryCode: 'BRA', defaultLeaguePattern: 'Brasileir' },
  coritiba: { countryCode: 'BRA', defaultLeaguePattern: 'Brasileir' },
  'america-mg': { countryCode: 'BRA', defaultLeaguePattern: 'Brasileir' },
  'américa-mg': { countryCode: 'BRA', defaultLeaguePattern: 'Brasileir' },
};

/**
 * Compara o nome da liga com um padrão canônico (evitando falso-positivo entre 1ª, 2ª e 3ª divisões).
 */
export function matchLeagueByPattern(leagueName: string, pattern: string): boolean {
  const normLeague = (leagueName || '').toLowerCase().trim();
  const normPattern = (pattern || '').toLowerCase().trim();
  if (!normLeague || !normPattern) return false;

  if (normPattern === '2. bundesliga' || normPattern === '2.bundesliga' || normPattern === 'bundesliga 2' || normPattern === '2 bundesliga') {
    return normLeague.includes('2. bundesliga') || normLeague.includes('bundesliga 2') || normLeague.includes('2 bundesliga');
  }
  if (normPattern === '3. liga' || normPattern === '3 liga' || normPattern === 'liga 3') {
    return normLeague.includes('3. liga') || normLeague.includes('3 liga') || normLeague.includes('liga 3');
  }
  if (normPattern === 'bundesliga' || normPattern === 'bundesliga 1' || normPattern === '1. bundesliga') {
    // Não pode casar com 2. Bundesliga nem 3. Liga
    return (normLeague.includes('bundesliga') && !normLeague.includes('2.') && !normLeague.includes('2 ') && !normLeague.includes('bundesliga 2')) || normLeague === 'bundesliga' || normLeague.includes('bundesliga 1');
  }
  if (normPattern === 'serie a') {
    return (normLeague.includes('serie a') && !normLeague.includes('serie a2') && !normLeague.includes('serie b')) || normLeague === 'serie a';
  }
  if (normPattern === 'serie b') {
    return normLeague.includes('serie b');
  }
  if (normPattern === 'la liga' || normPattern === 'la liga 1') {
    return (normLeague.includes('la liga') && !normLeague.includes('la liga 2') && !normLeague.includes('hypermotion')) || normLeague === 'la liga';
  }
  if (normPattern === 'la liga 2' || normPattern === 'segunda división') {
    return normLeague.includes('la liga 2') || normLeague.includes('segunda') || normLeague.includes('hypermotion');
  }
  if (normPattern === 'premier league' || normPattern === 'premier') {
    return normLeague.includes('premier') && !normLeague.includes('2');
  }
  if (normPattern === 'championship') {
    return normLeague.includes('championship');
  }
  if (normPattern === 'league 1' || normPattern === 'league one') {
    return normLeague.includes('league 1') || normLeague.includes('league one');
  }
  if (normPattern === 'league 2' || normPattern === 'league two') {
    return normLeague.includes('league 2') || normLeague.includes('league two');
  }
  return normLeague.includes(normPattern);
}

/**
 * Retorna dados canônicos de País e Liga se o time for reconhecido.
 */
export function lookupCanonicalTeam(teamName?: string): { countryCode: string; defaultLeaguePattern: string } | undefined {
  if (!teamName) return undefined;
  const norm = teamName.trim().toLowerCase();
  return CANONICAL_CLUBS[norm];
}

/**
 * Sanitiza e repara o banco de dados contra inconsistências:
 * 1. Remove ligas estrangeiras indevidas de `team.leagueIds` (ex: tira Championship ING de times da Holanda, Escócia, Bélgica, etc.).
 * 2. Restaura o país e a liga corretos para times conhecidos.
 * 3. Remove duplicidades de times com mesmo nome e país.
 * 4. Garante sincronia 100% perfeita entre países, ligas, times e partidas.
 */
export function sanitizeAndCleanDb(dbState: DbState): { cleanedDb: DbState; stats: SanitizeStats } {
  const stats: SanitizeStats = {
    foreignLeaguesRemoved: 0,
    teamsCleaned: 0,
    duplicatesRemoved: 0,
    matchesFixed: 0,
    details: [],
  };

  if (!dbState) {
    return { cleanedDb: { countries: [], leagues: [], teams: [], matches: [], users: [] }, stats };
  }

  const countries = [...(dbState.countries || [])];
  const leagues = [...(dbState.leagues || [])];
  const teams = [...(dbState.teams || [])];
  const matches = [...(dbState.matches || [])];
  const users = [...(dbState.users || [])];

  // Mapas auxiliares rápidos
  const countryById = new Map<string, Country>();
  const countryByCode = new Map<string, Country>();
  countries.forEach(c => {
    countryById.set(c.id, c);
    if (c.code) countryByCode.set(c.code.toUpperCase(), c);
    countryByCode.set(c.name.toUpperCase(), c);
  });

  // 0. Sanitizar e deduplicar ligas
  const cleanedLeagues: League[] = [];
  const leagueNameToId = new Map<string, string>(); // `countryKey_normLeagueName` -> canonicalLeagueId
  const leagueRemap = new Map<string, string>(); // oldDuplicateId -> canonicalLeagueId

  for (const league of leagues) {
    if (!league || !league.name) continue;
    const l: League = { ...league };
    const canonInfo = lookupCanonicalLeague(l.name);
    const effectiveName = canonInfo?.canonicalName || l.name.trim();
    const normName = normalizeText(effectiveName);

    // Garantir país da liga
    if (!l.countryId && canonInfo?.countryCode) {
      const c = countryByCode.get(canonInfo.countryCode);
      if (c) {
        l.countryId = c.id;
        l.countryName = c.name;
      }
    }
    if (l.countryId && !l.countryName) {
      const c = countryById.get(l.countryId);
      if (c) l.countryName = c.name;
    }

    const countryKey = (l.countryId || l.countryName || 'NO_COUNTRY').trim().toLowerCase();
    const lookupKey = `${countryKey}_${normName}`;
    const rawLookupKey = `${countryKey}_${normalizeText(l.name)}`;

    const existingLeagueId =
      leagueNameToId.get(lookupKey) ||
      leagueNameToId.get(rawLookupKey) ||
      leagueNameToId.get(`no_country_${normName}`);

    if (existingLeagueId && existingLeagueId !== l.id) {
      leagueRemap.set(l.id, existingLeagueId);
      stats.duplicatesRemoved++;
      stats.details.push(`Liga duplicada mesclada: "${l.name}" (${l.id}) unificada em "${effectiveName}" (${existingLeagueId}).`);
      const targetL = cleanedLeagues.find(cl => cl.id === existingLeagueId);
      if (targetL && !targetL.logoUrl && l.logoUrl) {
        targetL.logoUrl = l.logoUrl;
      }
      continue;
    }

    l.name = effectiveName;
    leagueNameToId.set(lookupKey, l.id);
    leagueNameToId.set(rawLookupKey, l.id);
    leagueRemap.set(l.id, l.id);
    cleanedLeagues.push(l);
  }

  const leagueById = new Map<string, League>();
  cleanedLeagues.forEach(l => {
    leagueById.set(l.id, l);
  });

  // 1. Sanitizar e corrigir cada time
  const cleanedTeams: Team[] = [];
  const teamNameToId = new Map<string, string>(); // `countryId_normalizedTeamName` -> teamId

  for (const team of teams) {
    let modified = false;
    const cloned: Team = { ...team };
    const normName = (cloned.name || '').trim().toLowerCase();

    // A. Verificar se é clube canônico conhecido
    const canonical = CANONICAL_CLUBS[normName];
    if (canonical) {
      const targetCountry = countryByCode.get(canonical.countryCode) ||
        countries.find(c => c.name.toUpperCase().includes(canonical.countryCode) || (c.code && c.code.toUpperCase() === canonical.countryCode));

      if (targetCountry && cloned.countryId !== targetCountry.id) {
        cloned.countryId = targetCountry.id;
        cloned.countryName = targetCountry.name;
        modified = true;
        stats.details.push(`Time "${cloned.name}" corrigido para o país ${targetCountry.name}.`);
      }

      // Procurar liga correta no país alvo SOMENTE se o time não possuir nenhuma liga ou sua liga for de outro país
      if (targetCountry && (!cloned.leagueId || !leagueById.has(cloned.leagueId) || leagueById.get(cloned.leagueId)?.countryId !== targetCountry.id)) {
        const matchingLeague = leagues.find(
          l => l.countryId === targetCountry.id && matchLeagueByPattern(l.name, canonical.defaultLeaguePattern)
        );
        if (matchingLeague && cloned.leagueId !== matchingLeague.id) {
          cloned.leagueId = matchingLeague.id;
          cloned.leagueName = matchingLeague.name;
          modified = true;
        }
      }
    }

    // B. Garantir que o país do time exista
    if (!cloned.countryId && cloned.leagueId) {
      const l = leagueById.get(cloned.leagueId);
      if (l && l.countryId) {
        cloned.countryId = l.countryId;
        cloned.countryName = l.countryName || countryById.get(l.countryId)?.name || '';
        modified = true;
      }
    }

    // Remap de liga se foi mesclada
    if (cloned.leagueId && leagueRemap.has(cloned.leagueId)) {
      const mappedLid = leagueRemap.get(cloned.leagueId)!;
      if (cloned.leagueId !== mappedLid) {
        cloned.leagueId = mappedLid;
        cloned.leagueName = leagueById.get(mappedLid)?.name || cloned.leagueName;
        modified = true;
      }
    }

    if (cloned.countryId && !cloned.countryName) {
      const c = countryById.get(cloned.countryId);
      if (c) {
        cloned.countryName = c.name;
        modified = true;
      }
    }

    // C. Limpar `leagueIds` - NUNCA permitir ligas de outro país!
    const rawLeagueIds = (cloned.leagueIds ? [...cloned.leagueIds] : (cloned.leagueId ? [cloned.leagueId] : []))
      .map(lid => leagueRemap.get(lid) || lid);
    const validLeagueIds: string[] = [];

    for (const lid of rawLeagueIds) {
      const l = leagueById.get(lid);
      if (!l) continue; // Liga não existe mais

      // Se a liga pertencer a um país diferente do país do time, É LIGA CRUZADA INVÁLIDA!
      if (cloned.countryId && l.countryId && l.countryId !== cloned.countryId) {
        stats.foreignLeaguesRemoved++;
        modified = true;
        stats.details.push(`Removida liga indevida "${l.name}" do time "${cloned.name}" (${cloned.countryName || 'País'}).`);
        continue;
      }

      if (!validLeagueIds.includes(lid)) {
        validLeagueIds.push(lid);
      }
    }

    // Se o time tem uma liga principal válida dentro de seu país
    if (cloned.leagueId) {
      const primLeague = leagueById.get(cloned.leagueId);
      if (primLeague && primLeague.countryId && cloned.countryId && primLeague.countryId !== cloned.countryId) {
        // A liga principal apontava para outro país! Corrigir
        const validLocalLeague = leagues.find(l => l.countryId === cloned.countryId);
        if (validLocalLeague) {
          cloned.leagueId = validLocalLeague.id;
          cloned.leagueName = validLocalLeague.name;
          modified = true;
        } else {
          cloned.leagueId = undefined;
          cloned.leagueName = undefined;
          modified = true;
        }
      } else if (primLeague) {
        cloned.leagueName = primLeague.name;
      }
    }

    // Se validLeagueIds ficou vazio mas o time tem liga no país
    if (validLeagueIds.length === 0 && cloned.leagueId) {
      validLeagueIds.push(cloned.leagueId);
      modified = true;
    } else if (validLeagueIds.length > 0 && !cloned.leagueId) {
      cloned.leagueId = validLeagueIds[0];
      const l = leagueById.get(cloned.leagueId);
      cloned.leagueName = l?.name;
      modified = true;
    }

    cloned.leagueIds = validLeagueIds;

    if (modified) {
      stats.teamsCleaned++;
    }

    // D. Deduplicação de times duplicados dentro do mesmo país
    const lookupKey = `${cloned.countryId || 'NO_COUNTRY'}_${normName}`;
    const existingTeamId = teamNameToId.get(lookupKey);

    if (existingTeamId) {
      // Já temos esse time registrado no mesmo país! Vamos mesclar escudos e ligas
      const existingTeam = cleanedTeams.find(t => t.id === existingTeamId);
      if (existingTeam) {
        if (!existingTeam.logoUrl && cloned.logoUrl) {
          existingTeam.logoUrl = cloned.logoUrl;
        }
        if (cloned.leagueIds) {
          cloned.leagueIds.forEach(lid => {
            if (!existingTeam.leagueIds?.includes(lid)) {
              existingTeam.leagueIds = [...(existingTeam.leagueIds || []), lid];
            }
          });
        }
        stats.duplicatesRemoved++;
        stats.details.push(`Duplicidade mesclada: Time "${cloned.name}" (ID ${cloned.id} incorporado ao ${existingTeam.id}).`);
        continue;
      }
    }

    teamNameToId.set(lookupKey, cloned.id);
    cleanedTeams.push(cloned);
  }

  // 2. Corrigir referências, deduplicar e garantir IDs únicos nas partidas
  let maxTeamNum = 0;
  const teamNumRegex = /^TIME[-_]?(\d+)$/i;
  for (const t of cleanedTeams) {
    if (t?.id) {
      const found = String(t.id).match(teamNumRegex);
      if (found) {
        const n = parseInt(found[1], 10);
        if (!isNaN(n) && n > maxTeamNum) maxTeamNum = n;
      }
    }
  }

  const teamById = new Map<string, Team>(cleanedTeams.map(t => [t.id, t]));
  const teamByNameAndCountry = new Map<string, Team>();
  const teamByName = new Map<string, Team>();
  cleanedTeams.forEach(t => {
    const norm = (t.name || '').trim().toLowerCase();
    if (t.countryId) teamByNameAndCountry.set(`${t.countryId}_${norm}`, t);
    if (!teamByName.has(norm)) teamByName.set(norm, t);
  });

  const seenMatchIds = new Set<string>();
  const seenMatchSignatures = new Map<string, Match>();
  const cleanedMatches: Match[] = [];

  // Calcular o maior ID de partida já existente para resolver conflitos de ID
  let maxMatchNum = 0;
  const matchNumRegex = /^JOGO[-_]?(\d+)$/i;
  for (const m of matches) {
    if (m?.id) {
      const matchFound = String(m.id).match(matchNumRegex);
      if (matchFound) {
        const n = parseInt(matchFound[1], 10);
        if (!isNaN(n) && n > maxMatchNum) maxMatchNum = n;
      }
    }
  }

  for (const m of matches) {
    if (!m) continue;
    let matchModified = false;
    const match = { ...m };

    // Se o time mandante ou visitante foi mesclado/atualizado
    if (match.homeTeamId && teamById.has(match.homeTeamId)) {
      const ht = teamById.get(match.homeTeamId)!;
      if (match.homeTeamName !== ht.name) {
        match.homeTeamName = ht.name;
        matchModified = true;
      }
      if (ht.logoUrl && !match.homeTeamLogoUrl) {
        match.homeTeamLogoUrl = ht.logoUrl;
        matchModified = true;
      }
    } else if (match.homeTeamName && match.homeTeamName.trim()) {
      const normHome = match.homeTeamName.trim().toLowerCase();
      const found = (match.countryId ? teamByNameAndCountry.get(`${match.countryId}_${normHome}`) : null) || teamByName.get(normHome);
      if (found) {
        match.homeTeamId = found.id;
        match.homeTeamName = found.name;
        if (found.logoUrl && !match.homeTeamLogoUrl) match.homeTeamLogoUrl = found.logoUrl;
        matchModified = true;
      } else {
        maxTeamNum++;
        const newTeamId = `TIME-${String(maxTeamNum).padStart(3, '0')}`;
        const newTeam: Team = {
          id: newTeamId,
          name: match.homeTeamName.trim(),
          countryId: match.countryId || '',
          countryName: match.countryName || '',
          leagueId: match.leagueId || undefined,
          leagueName: match.leagueName || undefined,
          leagueIds: match.leagueId ? [match.leagueId] : [],
          logoUrl: match.homeTeamLogoUrl || undefined,
          createdAt: new Date().toISOString(),
        };
        cleanedTeams.push(newTeam);
        teamById.set(newTeamId, newTeam);
        if (newTeam.countryId) teamByNameAndCountry.set(`${newTeam.countryId}_${normHome}`, newTeam);
        teamByName.set(normHome, newTeam);
        match.homeTeamId = newTeamId;
        matchModified = true;
      }
    }

    if (match.awayTeamId && teamById.has(match.awayTeamId)) {
      const at = teamById.get(match.awayTeamId)!;
      if (match.awayTeamName !== at.name) {
        match.awayTeamName = at.name;
        matchModified = true;
      }
      if (at.logoUrl && !match.awayTeamLogoUrl) {
        match.awayTeamLogoUrl = at.logoUrl;
        matchModified = true;
      }
    } else if (match.awayTeamName && match.awayTeamName.trim()) {
      const normAway = match.awayTeamName.trim().toLowerCase();
      const found = (match.countryId ? teamByNameAndCountry.get(`${match.countryId}_${normAway}`) : null) || teamByName.get(normAway);
      if (found) {
        match.awayTeamId = found.id;
        match.awayTeamName = found.name;
        if (found.logoUrl && !match.awayTeamLogoUrl) match.awayTeamLogoUrl = found.logoUrl;
        matchModified = true;
      } else {
        maxTeamNum++;
        const newTeamId = `TIME-${String(maxTeamNum).padStart(3, '0')}`;
        const newTeam: Team = {
          id: newTeamId,
          name: match.awayTeamName.trim(),
          countryId: match.countryId || '',
          countryName: match.countryName || '',
          leagueId: match.leagueId || undefined,
          leagueName: match.leagueName || undefined,
          leagueIds: match.leagueId ? [match.leagueId] : [],
          logoUrl: match.awayTeamLogoUrl || undefined,
          createdAt: new Date().toISOString(),
        };
        cleanedTeams.push(newTeam);
        teamById.set(newTeamId, newTeam);
        if (newTeam.countryId) teamByNameAndCountry.set(`${newTeam.countryId}_${normAway}`, newTeam);
        teamByName.set(normAway, newTeam);
        match.awayTeamId = newTeamId;
        matchModified = true;
      }
    }

    // -------------------------------------------------------------------------
    // RECONCILIAÇÃO INTELIGENTE DE PAÍS E LIGA DA PARTIDA COM BASE NOS TIMES
    // -------------------------------------------------------------------------
    const ht = match.homeTeamId ? teamById.get(match.homeTeamId) : undefined;
    const at = match.awayTeamId ? teamById.get(match.awayTeamId) : undefined;

    const htCanonical = lookupCanonicalTeam(match.homeTeamName);
    const atCanonical = lookupCanonicalTeam(match.awayTeamName);

    let targetCountryId = '';
    let targetCountryName = '';
    let targetLeagueId = '';
    let targetLeagueName = '';

    // Determinar país canônico dos times
    if (htCanonical && atCanonical && htCanonical.countryCode === atCanonical.countryCode) {
      const c = countryByCode.get(htCanonical.countryCode) || countries.find(c => c.code === htCanonical.countryCode || c.name.toUpperCase().includes(htCanonical.countryCode));
      if (c) {
        targetCountryId = c.id;
        targetCountryName = c.name;
        const matchingLeague = leagues.find(l => l.countryId === c.id && matchLeagueByPattern(l.name, htCanonical.defaultLeaguePattern));
        if (matchingLeague) {
          targetLeagueId = matchingLeague.id;
          targetLeagueName = matchingLeague.name;
        }
      }
    } else if (ht?.countryId && at?.countryId && ht.countryId === at.countryId) {
      targetCountryId = ht.countryId;
      targetCountryName = ht.countryName || countryById.get(ht.countryId)?.name || '';
      if (ht.leagueId && at.leagueId && ht.leagueId === at.leagueId) {
        targetLeagueId = ht.leagueId;
        targetLeagueName = ht.leagueName || leagueById.get(ht.leagueId)?.name || '';
      } else if (ht.leagueId && leagueById.has(ht.leagueId)) {
        targetLeagueId = ht.leagueId;
        targetLeagueName = ht.leagueName || leagueById.get(ht.leagueId)?.name || '';
      } else if (at.leagueId && leagueById.has(at.leagueId)) {
        targetLeagueId = at.leagueId;
        targetLeagueName = at.leagueName || leagueById.get(at.leagueId)?.name || '';
      }
    } else if (htCanonical) {
      const c = countryByCode.get(htCanonical.countryCode) || countries.find(c => c.code === htCanonical.countryCode || c.name.toUpperCase().includes(htCanonical.countryCode));
      if (c) {
        targetCountryId = c.id;
        targetCountryName = c.name;
        const matchingLeague = leagues.find(l => l.countryId === c.id && matchLeagueByPattern(l.name, htCanonical.defaultLeaguePattern));
        if (matchingLeague) {
          targetLeagueId = matchingLeague.id;
          targetLeagueName = matchingLeague.name;
        }
      }
    } else if (atCanonical) {
      const c = countryByCode.get(atCanonical.countryCode) || countries.find(c => c.code === atCanonical.countryCode || c.name.toUpperCase().includes(atCanonical.countryCode));
      if (c) {
        targetCountryId = c.id;
        targetCountryName = c.name;
        const matchingLeague = leagues.find(l => l.countryId === c.id && matchLeagueByPattern(l.name, atCanonical.defaultLeaguePattern));
        if (matchingLeague) {
          targetLeagueId = matchingLeague.id;
          targetLeagueName = matchingLeague.name;
        }
      }
    } else if (ht?.countryId) {
      targetCountryId = ht.countryId;
      targetCountryName = ht.countryName || countryById.get(ht.countryId)?.name || '';
      if (ht.leagueId && leagueById.has(ht.leagueId)) {
        targetLeagueId = ht.leagueId;
        targetLeagueName = ht.leagueName || leagueById.get(ht.leagueId)?.name || '';
      }
    } else if (at?.countryId) {
      targetCountryId = at.countryId;
      targetCountryName = at.countryName || countryById.get(at.countryId)?.name || '';
      if (at.leagueId && leagueById.has(at.leagueId)) {
        targetLeagueId = at.leagueId;
        targetLeagueName = at.leagueName || leagueById.get(at.leagueId)?.name || '';
      }
    }

    // 1. Remap de liga se foi mesclada
    if (match.leagueId && leagueRemap.has(match.leagueId)) {
      const mappedLid = leagueRemap.get(match.leagueId)!;
      if (match.leagueId !== mappedLid) {
        match.leagueId = mappedLid;
        const targetL = leagueById.get(mappedLid);
        if (targetL) {
          match.leagueName = targetL.name;
          if (targetL.logoUrl) match.leagueLogoUrl = targetL.logoUrl;
          if (targetL.countryId) {
            match.countryId = targetL.countryId;
            match.countryName = targetL.countryName || countryById.get(targetL.countryId)?.name || match.countryName;
          }
        }
        matchModified = true;
      }
    }

    // 2. Se ambos os times pertencem comprovadamente à mesma liga (ex: ambos da 2. Bundesliga), alinhar a partida a essa liga
    if (ht?.leagueId && at?.leagueId && ht.leagueId === at.leagueId && match.leagueId !== ht.leagueId) {
      const l = leagueById.get(ht.leagueId);
      if (l) {
        stats.details.push(`Partida "${match.homeTeamName} x ${match.awayTeamName}" realinhada para a liga "${l.name}" de ambos os clubes.`);
        match.leagueId = l.id;
        match.leagueName = l.name;
        if (l.logoUrl) match.leagueLogoUrl = l.logoUrl;
        if (l.countryId) {
          match.countryId = l.countryId;
          match.countryName = l.countryName || countryById.get(l.countryId)?.name || match.countryName;
        }
        matchModified = true;
      }
    }

    // Se encontramos país alvo e o país da partida está diferente ou incorreto:
    if (targetCountryId && match.countryId !== targetCountryId) {
      stats.details.push(`Partida "${match.homeTeamName} x ${match.awayTeamName}" reclassificada de "${match.countryName || 'País'}" para "${targetCountryName}".`);
      match.countryId = targetCountryId;
      match.countryName = targetCountryName;
      const c = countryById.get(targetCountryId);
      if (c?.flagUrl) match.countryFlagUrl = c.flagUrl;
      matchModified = true;
    }

    // Se a partida estiver sem liga ou com liga de outro país, usar liga alvo
    const currentLeague = match.leagueId ? leagueById.get(match.leagueId) : null;
    const isCurrentLeagueValid = currentLeague && (!currentLeague.countryId || !match.countryId || currentLeague.countryId === match.countryId);

    if (!isCurrentLeagueValid && targetLeagueId) {
      stats.details.push(`Partida "${match.homeTeamName} x ${match.awayTeamName}" reclassificada de "${match.leagueName || 'Liga'}" para "${targetLeagueName}".`);
      match.leagueId = targetLeagueId;
      match.leagueName = targetLeagueName;
      const l = leagueById.get(targetLeagueId);
      if (l?.logoUrl) match.leagueLogoUrl = l.logoUrl;
      matchModified = true;
    } else if (match.leagueId && leagueById.has(match.leagueId)) {
      const l = leagueById.get(match.leagueId)!;
      if (match.leagueName !== l.name) {
        match.leagueName = l.name;
        matchModified = true;
      }
      if (l.countryId && match.countryId !== l.countryId) {
        match.countryId = l.countryId;
        match.countryName = l.countryName || countryById.get(l.countryId)?.name || match.countryName;
        const c = countryById.get(l.countryId);
        if (c?.flagUrl) match.countryFlagUrl = c.flagUrl;
        matchModified = true;
      }
    }

    // Auto status finalizado se possuir placares
    if (match.homeScore !== null && match.homeScore !== undefined && match.awayScore !== null && match.awayScore !== undefined) {
      if (match.status !== 'FINALIZADO') {
        match.status = 'FINALIZADO';
        matchModified = true;
      }
    }

    // Identificar e mesclar jogos idênticos (mesma data e mesmos times)
    const matchDateYmd = match.matchDate ? match.matchDate.substring(0, 10) : '';
    const normHome = (match.homeTeamName || '').trim().toLowerCase();
    const normAway = (match.awayTeamName || '').trim().toLowerCase();
    const matchSig = matchDateYmd && normHome && normAway ? `${matchDateYmd}__${normHome}__vs__${normAway}` : '';

    if (matchSig && seenMatchSignatures.has(matchSig)) {
      const existingMatch = seenMatchSignatures.get(matchSig)!;
      // Mesclar propriedades caso a cópia duplicada tenha preenchimentos mais recentes
      if (existingMatch.homeScore === null && match.homeScore !== null) existingMatch.homeScore = match.homeScore;
      if (existingMatch.awayScore === null && match.awayScore !== null) existingMatch.awayScore = match.awayScore;
      if (!existingMatch.stats && match.stats) existingMatch.stats = match.stats;
      if (!existingMatch.odds && match.odds) existingMatch.odds = match.odds;
      if (!existingMatch.pressureData && match.pressureData) existingMatch.pressureData = match.pressureData;
      stats.duplicatesRemoved++;
      stats.details.push(`Partida duplicada mesclada: ${match.homeTeamName} x ${match.awayTeamName} (${matchDateYmd}).`);
      continue;
    }

    // Garantir que o ID da partida seja único e não duplique (ex: JOGO-100)
    if (!match.id || seenMatchIds.has(match.id)) {
      maxMatchNum++;
      const newId = `JOGO-${String(maxMatchNum).padStart(3, '0')}`;
      stats.details.push(`ID duplicado corrigido: Partida "${match.homeTeamName} x ${match.awayTeamName}" reatribuída de "${match.id}" para "${newId}".`);
      match.id = newId;
      matchModified = true;
    }

    seenMatchIds.add(match.id);
    if (matchSig) {
      seenMatchSignatures.set(matchSig, match);
    }

    if (matchModified) {
      stats.matchesFixed++;
    }

    cleanedMatches.push(match);
  }

  return {
    cleanedDb: {
      countries,
      leagues: cleanedLeagues,
      teams: cleanedTeams,
      matches: cleanedMatches,
      users,
    },
    stats,
  };
}

export interface AnomalyReport {
  duplicateLeagues: Array<{
    canonicalName: string;
    countryName: string;
    count: number;
    leagueNames: string[];
    leagueIds: string[];
    totalMatches: number;
  }>;
  crossCountryTeams: Array<{
    teamId: string;
    teamName: string;
    countryName: string;
    countryId: string;
    invalidLeagues: Array<{ id: string; name: string; countryName: string }>;
    validLeagues: Array<{ id: string; name: string }>;
  }>;
  duplicateTeams: Array<{
    name: string;
    countryName: string;
    count: number;
    teamIds: string[];
  }>;
  orphanTeams: Team[];
  totalAnomaliesCount: number;
}

/**
 * Analisa o banco de dados e retorna todas as anomalias, duplicidades e ligas cruzadas detectadas.
 */
export function diagnoseDatabaseAnomalies(dbState: DbState): AnomalyReport {
  if (!dbState) {
    return {
      duplicateLeagues: [],
      crossCountryTeams: [],
      duplicateTeams: [],
      orphanTeams: [],
      totalAnomaliesCount: 0,
    };
  }

  const leagueById = new Map<string, League>(dbState.leagues.map(l => [l.id, l]));
  const countryById = new Map<string, Country>(dbState.countries.map(c => [c.id, c]));

  // 1. Diagnosticar Ligas Duplicadas (ex: MLS e Major League Soccer)
  const leagueGroups = new Map<string, Array<{ league: League; matchesCount: number }>>();
  for (const l of dbState.leagues || []) {
    if (!l?.name) continue;
    const canonInfo = lookupCanonicalLeague(l.name);
    const effectiveName = canonInfo?.canonicalName || l.name.trim();
    const countryKey = (l.countryId || l.countryName || 'NO_COUNTRY').trim().toLowerCase();
    const groupKey = `${countryKey}__${normalizeText(effectiveName)}`;
    
    const matchesCount = (dbState.matches || []).filter(m => m.leagueId === l.id).length;
    const group = leagueGroups.get(groupKey) || [];
    group.push({ league: l, matchesCount });
    leagueGroups.set(groupKey, group);
  }

  const duplicateLeagues: AnomalyReport['duplicateLeagues'] = [];
  for (const group of leagueGroups.values()) {
    if (group.length > 1) {
      const first = group[0].league;
      const canonInfo = lookupCanonicalLeague(first.name);
      const canonicalName = canonInfo?.canonicalName || first.name;
      const totalMatches = group.reduce((acc, item) => acc + item.matchesCount, 0);
      duplicateLeagues.push({
        canonicalName,
        countryName: first.countryName || 'País',
        count: group.length,
        leagueNames: group.map(g => `${g.league.name} (${g.matchesCount} partidas)`),
        leagueIds: group.map(g => g.league.id),
        totalMatches,
      });
    }
  }

  const crossCountryTeams: AnomalyReport['crossCountryTeams'] = [];
  const nameAndCountryMap = new Map<string, string[]>(); // `countryId_normName` -> teamIds[]
  const orphanTeams: Team[] = [];

  for (const team of dbState.teams) {
    if (!team.countryId || !countryById.has(team.countryId)) {
      orphanTeams.push(team);
    }

    const teamCountryId = team.countryId;
    const allLeagueIds = team.leagueIds ? [...team.leagueIds] : (team.leagueId ? [team.leagueId] : []);
    
    const invalidLeagues: Array<{ id: string; name: string; countryName: string }> = [];
    const validIds: Array<{ id: string; name: string }> = [];

    for (const lid of allLeagueIds) {
      const l = leagueById.get(lid);
      if (!l) continue;
      if (teamCountryId && l.countryId && l.countryId !== teamCountryId) {
        const leagueCountry = countryById.get(l.countryId);
        invalidLeagues.push({
          id: l.id,
          name: l.name,
          countryName: leagueCountry?.name || l.countryName || 'Outro País',
        });
      } else {
        validIds.push({
          id: l.id,
          name: l.name,
        });
      }
    }

    if (invalidLeagues.length > 0) {
      crossCountryTeams.push({
        teamId: team.id,
        teamName: team.name,
        countryName: team.countryName || countryById.get(teamCountryId)?.name || 'Sem País',
        countryId: teamCountryId,
        invalidLeagues,
        validLeagues: validIds,
      });
    }

    const normKey = `${teamCountryId || 'NONE'}_${(team.name || '').trim().toLowerCase()}`;
    const existing = nameAndCountryMap.get(normKey) || [];
    existing.push(team.id);
    nameAndCountryMap.set(normKey, existing);
  }

  const duplicateTeams: AnomalyReport['duplicateTeams'] = [];
  for (const [key, ids] of nameAndCountryMap.entries()) {
    if (ids.length > 1) {
      const firstTeam = dbState.teams.find(t => t.id === ids[0]);
      duplicateTeams.push({
        name: firstTeam?.name || 'Time',
        countryName: firstTeam?.countryName || 'País',
        count: ids.length,
        teamIds: ids,
      });
    }
  }

  const totalAnomaliesCount = duplicateLeagues.length + crossCountryTeams.length + duplicateTeams.length + orphanTeams.length;

  return {
    duplicateLeagues,
    crossCountryTeams,
    duplicateTeams,
    orphanTeams,
    totalAnomaliesCount,
  };
}
