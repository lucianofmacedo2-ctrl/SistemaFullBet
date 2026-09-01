import { DbState, Country, League, Team, Match } from '../types';

/**
 * Normalizes text for accent-insensitive, case-insensitive and punctuation-free comparison
 */
export function normalizeText(str?: string | null): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/ø/g, 'o')
    .replace(/æ/g, 'ae')
    .replace(/ß/g, 'ss')
    .replace(/ð/g, 'd')
    .replace(/þ/g, 'th')
    .replace(/đ/g, 'd')
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Canonical metadata for known football countries, standard leagues and popular teams
 */
export interface CanonicalCountryDef {
  code: string;
  name: string;
  flag: string;
  leagues: Array<{
    name: string;
    type?: string;
    teams: string[];
  }>;
}

export const CANONICAL_COUNTRIES: CanonicalCountryDef[] = [
  {
    code: 'ING',
    name: 'Inglaterra',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    leagues: [
      {
        name: 'Premier League',
        type: 'Pontos Corridos',
        teams: [
          'Manchester City', 'Arsenal', 'Liverpool', 'Aston Villa', 'Tottenham',
          'Chelsea', 'Newcastle', 'Manchester United', 'West Ham', 'Crystal Palace',
          'Brighton', 'Bournemouth', 'Fulham', 'Wolverhampton', 'Everton',
          'Brentford', 'Nottingham Forest', 'Leicester City', 'Ipswich Town', 'Southampton'
        ],
      },
      {
        name: 'Championship',
        type: 'Pontos Corridos',
        teams: [
          'Leeds United', 'Burnley', 'Sheffield United', 'Sunderland', 'West Bromwich',
          'Middlesbrough', 'Norwich City', 'Coventry City', 'Watford', 'Bristol City',
          'Swansea City', 'Millwall', 'Blackburn Rovers', 'Preston North End', 'Stoke City',
          'Queens Park Rangers', 'Sheffield Wednesday', 'Hull City', 'Derby County', 'Portsmouth',
          'Plymouth Argyle', 'Cardiff City', 'Luton Town', 'Oxford United'
        ],
      },
      {
        name: 'League One',
        type: 'Pontos Corridos',
        teams: [
          'Birmingham City', 'Wrexham', 'Huddersfield Town', 'Barnsley', 'Stockport County',
          'Lincoln City', 'Charlton Athletic', 'Reading', 'Bolton Wanderers', 'Blackpool',
          'Peterborough United', 'Wigan Athletic', 'Rotherham United', 'Wycombe Wanderers'
        ],
      },
      {
        name: 'League Two',
        type: 'Pontos Corridos',
        teams: [
          'Notts County', 'Gillingham', 'Doncaster Rovers', 'Walsall', 'Barrow',
          'Chesterfield', 'Bradford City', 'Crewe Alexandra', 'AFC Wimbledon', 'Milton Keynes Dons'
        ],
      },
    ],
  },
  {
    code: 'ALE',
    name: 'Alemanha',
    flag: '🇩🇪',
    leagues: [
      {
        name: 'Bundesliga',
        type: 'Pontos Corridos',
        teams: [
          'Bayer Leverkusen', 'Bayern München', 'VfB Stuttgart', 'RB Leipzig', 'Borussia Dortmund',
          'Eintracht Frankfurt', 'TSG Hoffenheim', '1. FC Heidenheim', 'SV Werder Bremen', 'SC Freiburg',
          'FC Augsburg', 'VfL Wolfsburg', 'Borussia Mönchengladbach', '1. FC Union Berlin', 'VfL Bochum',
          'FC St. Pauli', 'Holstein Kiel', '1. FSV Mainz 05'
        ],
      },
      {
        name: '2. Bundesliga',
        type: 'Pontos Corridos',
        teams: [
          '1. FC Köln', 'SV Darmstadt 98', 'Fortuna Düsseldorf', 'Hamburger SV', 'Karlsruher SC',
          'Hannover 96', 'SC Paderborn 07', 'SpVgg Greuther Fürth', 'Hertha BSC', 'FC Schalke 04',
          'SV Elversberg', '1. FC Nürnberg', '1. FC Kaiserslautern', '1. FC Magdeburg', 'Eintracht Braunschweig',
          'SSV Ulm 1846', 'Preußen Münster', 'SSV Jahn Regensburg'
        ],
      },
      {
        name: '3. Liga',
        type: 'Pontos Corridos',
        teams: [
          'SV Sandhausen', 'Dynamo Dresden', 'Arminia Bielefeld', 'FC Erzgebirge Aue', 'FC Ingolstadt 04',
          '1. FC Saarbrücken', 'Rot-Weiss Essen', 'TSV 1860 München', 'VfL Osnabrück', 'SV Wehen Wiesbaden'
        ],
      },
    ],
  },
  {
    code: 'BRA',
    name: 'Brasil',
    flag: '🇧🇷',
    leagues: [
      {
        name: 'Brasileirão Série A',
        type: 'Pontos Corridos',
        teams: [
          'Botafogo', 'Palmeiras', 'Flamengo', 'Fortaleza', 'Internacional',
          'São Paulo', 'Bahia', 'Cruzeiro', 'Vasco da Gama', 'Atlético-MG',
          'Corinthians', 'Grêmio', 'Criciúma', 'Fluminense', 'Vitória',
          'Athletico-PR', 'Juventude', 'Red Bull Bragantino', 'Cuiabá', 'Atlético-GO'
        ],
      },
      {
        name: 'Brasileirão Série B',
        type: 'Pontos Corridos',
        teams: [
          'Santos', 'Novorizontino', 'Sport Recife', 'Mirassol', 'Ceará',
          'Vila Nova', 'América-MG', 'Coritiba', 'Amazonas', 'Avaí',
          'Operário-PR', 'Goiás', 'Botafogo-SP', 'Chapecoense', 'CRB',
          'Paysandu', 'Ponte Preta', 'Brusque', 'Ituano', 'Guarani'
        ],
      },
      {
        name: 'Copa do Brasil',
        type: 'Mata-Mata',
        teams: [
          'Flamengo', 'Atlético-MG', 'Corinthians', 'Vasco da Gama', 'São Paulo',
          'Palmeiras', 'Bahia', 'Athletico-PR', 'Juventude', 'Botafogo'
        ],
      },
    ],
  },
  {
    code: 'ESP',
    name: 'Espanha',
    flag: '🇪🇸',
    leagues: [
      {
        name: 'La Liga',
        type: 'Pontos Corridos',
        teams: [
          'Real Madrid', 'Barcelona', 'Girona', 'Atlético Madrid', 'Athletic Club',
          'Real Sociedad', 'Real Betis', 'Villarreal', 'Valencia', 'Deportivo Alavés',
          'Osasuna', 'Getafe', 'Celta de Vigo', 'Sevilla', 'Mallorca',
          'Las Palmas', 'Rayo Vallecano', 'Leganés', 'Real Valladolid', 'Espanyol'
        ],
      },
      {
        name: 'La Liga 2',
        type: 'Pontos Corridos',
        teams: [
          'Cádiz', 'Almería', 'Granada', 'Real Oviedo', 'Sporting Gijón',
          'Racing Santander', 'Levante', 'Eibar', 'Elche', 'Burgos',
          'Racing Ferrol', 'Tenerife', 'Albacete', 'Cartagena', 'Zaragoza',
          'Huesca', 'Mirandés', 'Eldense', 'Córdoba', 'Málaga', 'Deportivo La Coruña', 'Castellón'
        ],
      },
    ],
  },
  {
    code: 'ITA',
    name: 'Itália',
    flag: '🇮🇹',
    leagues: [
      {
        name: 'Serie A',
        type: 'Pontos Corridos',
        teams: [
          'Inter de Milão', 'Milan', 'Juventus', 'Atalanta', 'Bologna',
          'Roma', 'Lazio', 'Fiorentina', 'Torino', 'Napoli',
          'Genoa', 'Monza', 'Hellas Verona', 'Lecce', 'Udinese',
          'Cagliari', 'Empoli', 'Parma', 'Como', 'Venezia'
        ],
      },
      {
        name: 'Serie B',
        type: 'Pontos Corridos',
        teams: [
          'Frosinone', 'Sassuolo', 'Salernitana', 'Cremonese', 'Catanzaro',
          'Palermo', 'Sampdoria', 'Brescia', 'Südtirol', 'Reggiana',
          'Pisa', 'Cittadella', 'Cosenza', 'Modena', 'Bari',
          'Spezia', 'Cesena', 'Mantova', 'Juve Stabia', 'Carrarese'
        ],
      },
    ],
  },
  {
    code: 'FRA',
    name: 'França',
    flag: '🇫🇷',
    leagues: [
      {
        name: 'Ligue 1',
        type: 'Pontos Corridos',
        teams: [
          'Paris Saint-Germain', 'Monaco', 'Brest', 'Lille', 'Nice',
          'Lyon', 'Lens', 'Marseille', 'Reims', 'Rennes',
          'Toulouse', 'Montpellier', 'Strasbourg', 'Nantes', 'Le Havre',
          'Auxerre', 'Angers', 'Saint-Étienne'
        ],
      },
      {
        name: 'Ligue 2',
        type: 'Pontos Corridos',
        teams: [
          'Metz', 'Lorient', 'Clermont', 'Rodez', 'Paris FC',
          'Caen', 'Laval', 'Amiens', 'Guingamp', 'Pau FC',
          'Grenoble', 'Bastia', 'Annecy', 'Ajaccio', 'Dunkerque',
          'Troyes', 'Red Star', 'Martigues'
        ],
      },
    ],
  },
  {
    code: 'POR',
    name: 'Portugal',
    flag: '🇵🇹',
    leagues: [
      {
        name: 'Liga Portugal',
        type: 'Pontos Corridos',
        teams: [
          'Sporting CP', 'Benfica', 'Porto', 'Braga', 'Vitória de Guimarães',
          'Moreirense', 'Arouca', 'Famalicão', 'Casa Pia', 'Farense',
          'Rio Ave', 'Gil Vicente', 'Estoril', 'Boavista', 'Estrela da Amadora',
          'Santa Clara', 'Nacional', 'AVS Futebol SAD'
        ],
      },
      {
        name: 'Liga Portugal 2',
        type: 'Pontos Corridos',
        teams: [
          'Portimonense', 'Vizela', 'Chaves', 'Marítimo', 'Paços de Ferreira',
          'Tondela', 'Torreense', 'Mafra', 'Académico de Viseu', 'União de Leiria',
          'Penafiel', 'Leixões', 'Feirense', 'Oliveirense', 'Porto B', 'Benfica B', 'Alverca', 'Felgueiras'
        ],
      },
    ],
  },
  {
    code: 'HOL',
    name: 'Holanda',
    flag: '🇳🇱',
    leagues: [
      {
        name: 'Eredivisie',
        type: 'Pontos Corridos',
        teams: [
          'PSV Eindhoven', 'Feyenoord', 'FC Twente', 'AZ Alkmaar', 'AFC Ajax',
          'NEC Nijmegen', 'FC Utrecht', 'Sparta Rotterdam', 'Go Ahead Eagles', 'Fortuna Sittard',
          'SC Heerenveen', 'PEC Zwolle', 'Almere City', 'Heracles Almelo', 'RKC Waalwijk',
          'Willem II', 'FC Groningen', 'NAC Breda'
        ],
      },
      {
        name: 'Eerste Divisie',
        type: 'Pontos Corridos',
        teams: [
          'Excelsior', 'FC Volendam', 'Vitesse', 'FC Dordrecht', 'ADO Den Haag',
          'De Graafschap', 'FC Emmen', 'SC Cambuur', 'VVV-Venlo', 'Helmond Sport',
          'Roda JC', 'MVV Maastricht', 'FC Eindhoven', 'TOP Oss', 'Telstar'
        ],
      },
    ],
  },
  {
    code: 'BEL',
    name: 'Bélgica',
    flag: '🇧🇪',
    leagues: [
      {
        name: 'Jupiler Pro League',
        type: 'Pontos Corridos',
        teams: [
          'Club Brugge', 'Union Saint-Gilloise', 'Anderlecht', 'Cercle Brugge', 'KRC Genk',
          'Royal Antwerp', 'KAA Gent', 'KV Mechelen', 'Sint-Truiden', 'Standard Liège',
          'KVC Westerlo', 'OH Leuven', 'Charleroi', 'KV Kortrijk', 'FCV Dender EH', 'Beerschot'
        ],
      },
    ],
  },
  {
    code: 'TUR',
    name: 'Turquia',
    flag: '🇹🇷',
    leagues: [
      {
        name: 'Süper Lig',
        type: 'Pontos Corridos',
        teams: [
          'Galatasaray', 'Fenerbahçe', 'Beşiktaş', 'Trabzonspor', 'İstanbul Başakşehir',
          'Kasımpaşa', 'Sivasspor', 'Alanyaspor', 'Çaykur Rizespor', 'Antalyaspor',
          'Gaziantep FK', 'Adana Demirspor', 'Samsunspor', 'Kayserispor', 'Hatayspor',
          'Konyaspor', 'Eyüpspor', 'Göztepe', 'Bodrum FK'
        ],
      },
    ],
  },
  {
    code: 'ÁUS',
    name: 'Áustria',
    flag: '🇦🇹',
    leagues: [
      {
        name: 'Bundesliga',
        type: 'Pontos Corridos',
        teams: [
          'Sturm Graz', 'Red Bull Salzburg', 'LASK', 'Rapid Wien', 'TSV Hartberg',
          'Austria Klagenfurt', 'Wolfsberger AC', 'Austria Wien', 'Blau-Weiß Linz', 'SCR Altach',
          'WSG Tirol', 'Grazer AK'
        ],
      },
      {
        name: '2. Liga',
        type: 'Pontos Corridos',
        teams: [
          'Austria Lustenau', 'SV Ried', 'Floridsdorfer AC', 'Admira Wacker', 'First Vienna FC',
          'SV Horn', 'SKN St. Pölten', 'FC Liefering', 'Kapfenberger SV', 'SV Stripfing'
        ],
      },
    ],
  },
  {
    code: 'SUÍ',
    name: 'Suíça',
    flag: '🇨🇭',
    leagues: [
      {
        name: 'Super League',
        type: 'Pontos Corridos',
        teams: [
          'BSC Young Boys', 'FC Lugano', 'Servette FC', 'FC Zürich', 'FC St. Gallen',
          'FC Winterthur', 'FC Luzern', 'FC Basel', 'Yverdon Sport', 'FC Lausanne-Sport',
          'Grasshopper Club', 'FC Sion'
        ],
      },
      {
        name: 'Challenge League',
        type: 'Pontos Corridos',
        teams: [
          'Stade Lausanne-Ouchy', 'FC Thun', 'FC Vaduz', 'FC Aarau', 'FC Wil 1900',
          'FC Schaffhausen', 'Stade Nyonnais', 'Neuchâtel Xamax', 'AC Bellinzona', 'Étoile Carouge'
        ],
      },
    ],
  },
  {
    code: 'DIN',
    name: 'Dinamarca',
    flag: '🇩🇰',
    leagues: [
      {
        name: 'Superliga',
        type: 'Pontos Corridos',
        teams: [
          'FC Midtjylland', 'Brøndby IF', 'FC København', 'FC Nordsjælland', 'AGF Aarhus',
          'Silkeborg IF', 'Randers FC', 'Viborg FF', 'Vejle Boldklub', 'Lyngby BK',
          'AaB Aalborg', 'Sønderjyske'
        ],
      },
      {
        name: '1. Division',
        type: 'Pontos Corridos',
        teams: [
          'OB Odense', 'Hvidovre IF', 'FC Fredericia', 'Kolding IF', 'Hobro IK',
          'Vendsyssel FF', 'B.93', 'AC Horsens', 'Hillerød Fodbold', 'HB Køge'
        ],
      },
    ],
  },
  {
    code: 'ESC',
    name: 'Escócia',
    flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    leagues: [
      {
        name: 'Scottish Premiership',
        type: 'Pontos Corridos',
        teams: [
          'Celtic', 'Rangers', 'Heart of Midlothian', 'Kilmarnock', 'St. Mirren',
          'Dundee FC', 'Aberdeen', 'Hibernian', 'Motherwell', 'St. Johnstone',
          'Ross County', 'Dundee United'
        ],
      },
      {
        name: 'Championship',
        type: 'Pontos Corridos',
        teams: [
          'Livingston', 'Partick Thistle', 'Airdrieonians', 'Raith Rovers', 'Dunfermline Athletic',
          'Greenock Morton', 'Queen\'s Park', 'Ayr United', 'Falkirk', 'Hamilton Academical'
        ],
      },
    ],
  },
  {
    code: 'EST',
    name: 'Estados Unidos',
    flag: '🇺🇸',
    leagues: [
      {
        name: 'Major League Soccer',
        type: 'Pontos Corridos',
        teams: [
          'Inter Miami', 'Columbus Crew', 'FC Cincinnati', 'Orlando City', 'Charlotte FC',
          'New York City FC', 'New York Red Bulls', 'Atlanta United', 'Philadelphia Union', 'DC United',
          'Los Angeles FC', 'LA Galaxy', 'Real Salt Lake', 'Seattle Sounders', 'Houston Dynamo',
          'Minnesota United', 'Colorado Rapids', 'Portland Timbers', 'Austin FC', 'FC Dallas'
        ],
      },
      {
        name: 'USL Championship',
        type: 'Pontos Corridos',
        teams: [
          'Louisville City', 'Charleston Battery', 'Tampa Bay Rowdies', 'Detroit City', 'Indy Eleven',
          'New Mexico United', 'Sacramento Republic', 'Colorado Springs Switchbacks', 'Memphis 901', 'Orange County SC'
        ],
      },
    ],
  },
  {
    code: 'GRÉ',
    name: 'Grécia',
    flag: '🇬🇷',
    leagues: [
      {
        name: 'Super League Grécia',
        type: 'Pontos Corridos',
        teams: [
          'PAOK', 'AEK Atenas', 'Olympiacos', 'Panathinaikos', 'Aris Thessaloniki',
          'Lamia', 'Panserraikos', 'Asteras Tripolis', 'OFI Creta', 'Atromitos',
          'Panetolikos', 'Volos NFC', 'Levadiakos', 'Athens Kallithea'
        ],
      },
    ],
  },
  {
    code: 'PAÍ',
    name: 'País De Gales',
    flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
    leagues: [
      {
        name: 'Cymru Premier',
        type: 'Pontos Corridos',
        teams: [
          'The New Saints', 'Connah\'s Quay Nomads', 'Bala Town', 'Newtown', 'Penybont',
          'Caernarfon Town', 'Cardiff Met University', 'Haverfordwest County', 'Aberystwyth Town', 'Barry Town United',
          'Flint Town United', 'Briton Ferry Llansawel'
        ],
      },
    ],
  },
  {
    code: 'SÉR',
    name: 'Sérvia',
    flag: '🇷🇸',
    leagues: [
      {
        name: 'SuperLiga Sérvia',
        type: 'Pontos Corridos',
        teams: [
          'Estrela Vermelha', 'Partizan', 'FK TSC Bačka Topola', 'FK Vojvodina', 'FK Radnički 1923',
          'FK Čukarički', 'Mladost Lučani', 'Napredak Kruševac', 'Novi Pazar', 'Spartak Subotica',
          'IMT Novi Beograd', 'Železničar Pančevo', 'Radnički Niš', 'Tekstilac Odžaci', 'Jedinstvo Ub', 'OFK Beograd'
        ],
      },
    ],
  },
  {
    code: 'EGI',
    name: 'Egito',
    flag: '🇪🇬',
    leagues: [
      {
        name: 'Premier League',
        type: 'Pontos Corridos',
        teams: [
          'Al Ahly', 'Pyramids FC', 'Zamalek', 'Modern Future', 'Al Masry',
          'Smouha', 'ZED FC', 'Ceramica Cleopatra', 'ENPPI', 'Tala\'ea El Gaish',
          'Al Ittihad Alexandria', 'Ismaily', 'El Gouna', 'National Bank of Egypt', 'Pharco FC',
          'Petrojet', 'Haras El Hodood', 'Ghazl El Mahalla'
        ],
      },
    ],
  },
  {
    code: 'SIN',
    name: 'Singapura',
    flag: '🇸🇬',
    leagues: [
      {
        name: 'Premier League',
        type: 'Pontos Corridos',
        teams: [
          'Albirex Niigata (S)', 'Lion City Sailors', 'Tampines Rovers', 'Geylang International', 'Balestier Khalsa',
          'Hougang United', 'DPMM FC', 'Tanjong Pagar United', 'Young Lions'
        ],
      },
    ],
  },
  {
    code: 'ISL',
    name: 'Islândia',
    flag: '🇮🇸',
    leagues: [
      {
        name: 'Besta deild karla',
        type: 'Pontos Corridos',
        teams: [
          'Víkingur Reykjavík', 'Breiðablik', 'Valur', 'KR Reykjavík', 'Stjarnan',
          'FH Hafnarfjörður', 'KA Akureyri', 'ÍA Akranes', 'HK Kópavogur', 'Fylkir',
          'Fram Reykjavík', 'Vestri'
        ],
      },
      {
        name: '1. deild karla',
        type: 'Pontos Corridos',
        teams: [
          'Afturelding', 'Keflavík', 'Grindavík', 'Fjölnir', 'Þór Akureyri',
          'Leiknir Reykjavík', 'Njarðvík', 'Grótta', 'ÍBV Vestmannaeyjar', 'Dalvík/Reynir'
        ],
      },
    ],
  },
  {
    code: 'NOR',
    name: 'Noruega',
    flag: '🇳🇴',
    leagues: [
      {
        name: 'Eliteserien',
        type: 'Pontos Corridos',
        teams: [
          'Bodø/Glimt', 'Brann', 'Molde', 'Viking', 'Rosenborg',
          'Fredrikstad', 'KFUM Oslo', 'Sarpsborg 08', 'Strømsgodset', 'HamKam',
          'Kristiansund', 'Haugesund', 'Tromsø', 'Sandefjord', 'Lillestrøm', 'Odd'
        ],
      },
      {
        name: 'OBOS-ligaen',
        type: 'Pontos Corridos',
        teams: [
          'Vålerenga', 'Bryne', 'Moss', 'Lyn', 'Aalesund',
          'Kongsvinger', 'Sogndal', 'Stabæk', 'Raufoss', 'Ranheim',
          'Mjøndalen', 'Start', 'Åsane', 'Levanger', 'Egersund', 'Sandnes Ulf'
        ],
      },
    ],
  },
  {
    code: 'SUÉ',
    name: 'Suécia',
    flag: '🇸🇪',
    leagues: [
      {
        name: 'Allsvenskan',
        type: 'Pontos Corridos',
        teams: [
          'Malmö FF', 'Hammarby IF', 'Djurgårdens IF', 'AIK', 'IF Elfsborg',
          'BK Häcken', 'GAIS', 'Mjällby AIF', 'IK Sirius', 'IFK Norrköping',
          'IFK Göteborg', 'Halmstads BK', 'IFK Värnamo', 'Brommapojkarna', 'Kalmar FF', 'Västerås SK'
        ],
      },
      {
        name: 'Superettan',
        type: 'Pontos Corridos',
        teams: [
          'Degerfors IF', 'Östers IF', 'Landskrona BoIS', 'Sandvikens IF', 'IK Brage',
          'Helsingborgs IF', 'Örgryte IS', 'Varbergs BoIS', 'Örebro SK', 'Trelleborgs FF'
        ],
      },
    ],
  },
  {
    code: 'FIN',
    name: 'Finlândia',
    flag: '🇫🇮',
    leagues: [
      {
        name: 'Veikkausliiga',
        type: 'Pontos Corridos',
        teams: [
          'KuPS', 'HJK Helsinki', 'Ilves', 'SJK Seinäjoki', 'VPS Vaasa',
          'Haka', 'Inter Turku', 'Gnistan', 'AC Oulu', 'EIF Ekenäs', 'IFK Mariehamn', 'Lahti'
        ],
      },
    ],
  },
  {
    code: 'ARG',
    name: 'Argentina',
    flag: '🇦🇷',
    leagues: [
      {
        name: 'Liga Profesional',
        type: 'Pontos Corridos',
        teams: [
          'River Plate', 'Boca Juniors', 'Racing Club', 'Independiente', 'San Lorenzo',
          'Vélez Sarsfield', 'Estudiantes', 'Talleres Córdoba', 'Huracán', 'Godoy Cruz',
          'Argentinos Juniors', 'Lanús', 'Newell\'s Old Boys', 'Rosario Central', 'Belgrano',
          'Defensa y Justicia', 'Unión Santa Fe', 'Platense', 'Gimnasia La Plata', 'Instituto'
        ],
      },
    ],
  },
  {
    code: 'MÉX',
    name: 'México',
    flag: '🇲🇽',
    leagues: [
      {
        name: 'Liga MX',
        type: 'Pontos Corridos',
        teams: [
          'Club América', 'Cruz Azul', 'Toluca', 'Tigres UANL', 'Monterrey',
          'Guadalajara', 'Pumas UNAM', 'Atlético San Luis', 'Tijuana', 'Atlas',
          'Necaxa', 'Pachuca', 'Santos Laguna', 'Club León', 'Mazatlán', 'Puebla', 'Juárez', 'Querétaro'
        ],
      },
    ],
  },
  {
    code: 'ARÁ',
    name: 'Arábia Saudita',
    flag: '🇸🇦',
    leagues: [
      {
        name: 'Saudi Pro League',
        type: 'Pontos Corridos',
        teams: [
          'Al-Hilal', 'Al-Nassr', 'Al-Ahli', 'Al-Ittihad', 'Al-Taawoun',
          'Al-Ettifaq', 'Al-Fateh', 'Al-Shabab', 'Al-Fayha', 'Damac',
          'Al-Khaleej', 'Al-Raed', 'Al-Wehda', 'Al-Riyadh', 'Al-Okhdood',
          'Al-Qadsiah', 'Al-Orobah', 'Al-Kholood'
        ],
      },
    ],
  },
  {
    code: 'REP',
    name: 'República Tcheca',
    flag: '🇨🇿',
    leagues: [
      {
        name: 'Chance Liga',
        type: 'Pontos Corridos',
        teams: [
          'Slavia Praga', 'Sparta Praga', 'Viktoria Plzen', 'Baník Ostrava', 'FK Jablonec',
          'Sigma Olomouc', 'Mladá Boleslav', 'Hradec Králové', 'Slovan Liberec', 'FK Teplice',
          'Bohemians 1905', '1. FC Slovácko', 'FK Pardubice', 'MFK Karviná', 'Dukla Praga', 'České Budějovice'
        ],
      },
    ],
  },
  {
    code: 'POL',
    name: 'Polônia',
    flag: '🇵🇱',
    leagues: [
      {
        name: 'Ekstraklasa',
        type: 'Pontos Corridos',
        teams: [
          'Lech Poznań', 'Raków Częstochowa', 'Jagiellonia Białystok', 'Legia Varsóvia', 'Cracovia',
          'Górnik Zabrze', 'Pogoń Szczecin', 'Widzew Łódź', 'Motor Lublin', 'Piast Gliwice',
          'GKS Katowice', 'Korona Kielce', 'Radomiak Radom', 'Zagłębie Lubin', 'Stal Mielec',
          'Puszcza Niepołomice', 'Lechia Gdańsk', 'Śląsk Wrocław'
        ],
      },
    ],
  },
  {
    code: 'CRO',
    name: 'Croácia',
    flag: '🇭🇷',
    leagues: [
      {
        name: 'HNL',
        type: 'Pontos Corridos',
        teams: [
          'Hajduk Split', 'Dinamo Zagreb', 'HNK Rijeka', 'NK Osijek', 'NK Varaždin',
          'NK Istra 1961', 'HNK Šibenik', 'HNK Gorica', 'Lokomotiva Zagreb', 'Slaven Belupo'
        ],
      },
    ],
  },
  {
    code: 'AUS',
    name: 'Austrália',
    flag: '🇦🇺',
    leagues: [
      {
        name: 'A-League',
        type: 'Pontos Corridos',
        teams: [
          'Central Coast Mariners', 'Wellington Phoenix', 'Melbourne Victory', 'Sydney FC', 'Macarthur FC',
          'Melbourne City', 'Western Sydney Wanderers', 'Adelaide United', 'Brisane Roar', 'Newcastle Jets',
          'Western United', 'Perth Glory', 'Auckland FC'
        ],
      },
    ],
  },
  {
    code: 'NOV',
    name: 'Nova Zelândia',
    flag: '🇳🇿',
    leagues: [
      {
        name: 'National League',
        type: 'Pontos Corridos',
        teams: [
          'Auckland City', 'Wellington Olympic', 'Auckland United', 'Eastern Suburbs', 'Birkenhead United',
          'Western Suburbs', 'Napier City Rovers', 'Cashmere Technical', 'Coastal Spirit', 'Wellington Phoenix Res.'
        ],
      },
    ],
  },
  {
    code: 'EST',
    name: 'Estônia',
    flag: '🇪🇪',
    leagues: [
      {
        name: 'Premium Liiga',
        type: 'Pontos Corridos',
        teams: [
          'FCI Levadia Tallinn', 'FC Flora Tallinn', 'Paide Linnameeskond', 'Nõmme Kalju FC', 'JK Tammeka Tartu',
          'JK Narva Trans', 'Pärnu JK Vaprus', 'FC Kuressaare', 'JK Tallinna Kalev', 'FC Nõmme United'
        ],
      },
    ],
  },
  {
    code: 'BOL',
    name: 'Bolívia',
    flag: '🇧🇴',
    leagues: [
      {
        name: 'División Profesional',
        type: 'Pontos Corridos',
        teams: [
          'Bolívar', 'The Strongest', 'Always Ready', 'Jorge Wilstermann', 'Oriente Petrolero',
          'Blooming', 'Nacional Potosí', 'Aurora', 'Guabirá', 'Real Tomayapo',
          'San Antonio Bulo Bulo', 'Universitario de Vinto', 'Independiente Petrolero', 'Royal Pari', 'Real Santa Cruz'
        ],
      },
    ],
  },
];

/**
 * Maps any country name or code variation to standard friendly name
 */
export function getCanonicalCountryName(query: string): string {
  const norm = normalizeText(query);
  if (!norm) return query;

  for (const c of CANONICAL_COUNTRIES) {
    if (
      normalizeText(c.name) === norm ||
      normalizeText(c.code) === norm ||
      norm.includes(normalizeText(c.name)) ||
      normalizeText(c.name).includes(norm)
    ) {
      return c.name;
    }
  }

  // Common country aliases
  const aliasMap: Record<string, string> = {
    islandia: 'Islândia',
    iceland: 'Islândia',
    noruega: 'Noruega',
    norway: 'Noruega',
    dinamarca: 'Dinamarca',
    denmark: 'Dinamarca',
    suecia: 'Suécia',
    sweden: 'Suécia',
    finlandia: 'Finlândia',
    finland: 'Finlândia',
    brasil: 'Brasil',
    brazil: 'Brasil',
    argentina: 'Argentina',
    austria: 'Áustria',
    suica: 'Suíça',
    switzerland: 'Suíça',
    estadosunidos: 'Estados Unidos',
    usa: 'Estados Unidos',
    mexico: 'México',
    inglaterra: 'Inglaterra',
    england: 'Inglaterra',
    escocia: 'Escócia',
    scotland: 'Escócia',
    alemanha: 'Alemanha',
    germany: 'Alemanha',
    espanha: 'Espanha',
    spain: 'Espanha',
    franca: 'França',
    france: 'França',
    belgica: 'Bélgica',
    belgium: 'Bélgica',
    portugal: 'Portugal',
    italia: 'Itália',
    italy: 'Itália',
    turquia: 'Turquia',
    turkey: 'Turquia',
    grecia: 'Grécia',
    greece: 'Grécia',
    holanda: 'Holanda',
    netherlands: 'Holanda',
    paisdegales: 'País De Gales',
    wales: 'País De Gales',
    servia: 'Sérvia',
    serbia: 'Sérvia',
    egito: 'Egito',
    egypt: 'Egito',
    singapura: 'Singapura',
    singapore: 'Singapura',
    republicatcheca: 'República Tcheca',
    czechia: 'República Tcheca',
    polonia: 'Polônia',
    poland: 'Polônia',
    croacia: 'Croácia',
    croatia: 'Croácia',
    arabiasaudita: 'Arábia Saudita',
    saudiarabia: 'Arábia Saudita',
    australia: 'Austrália',
    novazelandia: 'Nova Zelândia',
    newzealand: 'Nova Zelândia',
    estonia: 'Estônia',
    bolivia: 'Bolívia',
  };

  const cleanKey = norm.replace(/\s+/g, '');
  if (aliasMap[cleanKey]) return aliasMap[cleanKey];

  return query;
}

/**
 * Checks if a league belongs to a country using strict disambiguation.
 * Prevents cross-contamination when leagues share identical names across different countries.
 */
export function isLeagueInCountry(
  league: League,
  countryIdOrObj?: string | Country | null,
  countriesList: Country[] = []
): boolean {
  if (!countryIdOrObj || countryIdOrObj === 'ALL' || countryIdOrObj === '') return true;

  const targetCountry: Country | undefined =
    typeof countryIdOrObj === 'object'
      ? countryIdOrObj
      : countriesList.find(c => c.id === countryIdOrObj || c.name === countryIdOrObj || c.code === countryIdOrObj);

  const targetId = typeof countryIdOrObj === 'string' ? countryIdOrObj : countryIdOrObj?.id;
  const targetName = targetCountry?.name || (typeof countryIdOrObj === 'string' ? countryIdOrObj : '');
  const targetCode = targetCountry?.code || '';

  const normTargetName = normalizeText(targetName);
  const normTargetId = normalizeText(targetId);
  const normLeagueCountryName = normalizeText(league.countryName);
  const normLeagueCountryId = normalizeText(league.countryId);
  const normLeagueName = normalizeText(league.name);

  // 1. Direct ID match
  if (targetId && (league.countryId === targetId || normLeagueCountryId === normTargetId)) {
    return true;
  }

  // 2. Direct Code match (e.g. NOR, ISL, BRA, ENG)
  if (targetCode && targetCode.length >= 2) {
    const ucCode = targetCode.toUpperCase();
    if (
      league.countryId?.toUpperCase() === ucCode ||
      league.countryName?.toUpperCase() === ucCode
    ) {
      return true;
    }
  }

  // 3. Direct Country Name match
  if (normTargetName) {
    if (normLeagueCountryName && normLeagueCountryName === normTargetName) return true;
    if (normLeagueCountryId && normLeagueCountryId === normTargetName) return true;
  }

  // IMPORTANT: If league explicitly belongs to ANOTHER country, STRICTLY reject it!
  if (league.countryId && targetId && league.countryId !== targetId) {
    const leagueCountry = countriesList.find(c => c.id === league.countryId || c.code === league.countryId);
    if (leagueCountry && normalizeText(leagueCountry.name) !== normTargetName) {
      return false;
    }
  }
  if (normLeagueCountryName && normTargetName && normLeagueCountryName !== normTargetName) {
    return false;
  }

  // 4. Check canonical country database definition (ONLY if league has no conflicting country)
  const canonicalDef = CANONICAL_COUNTRIES.find(
    c =>
      normalizeText(c.name) === normTargetName ||
      (targetCode && c.code.toUpperCase() === targetCode.toUpperCase())
  );

  if (canonicalDef) {
    const isCanonicalLeague = canonicalDef.leagues.some(
      cl => normalizeText(cl.name) === normLeagueName
    );
    if (isCanonicalLeague) return true;
  }

  return false;
}

/**
 * Resiliently finds and returns all available leagues for a given country,
 * combining dbState.leagues, matches distinct leagues, and canonical league definitions.
 */
export function getLeaguesForCountry(dbState: DbState, selectedCountryId?: string): League[] {
  let leaguesList: League[] = [];

  if (!selectedCountryId || selectedCountryId === 'ALL') {
    leaguesList = dbState.leagues || [];
  } else {
    const country = (dbState.countries || []).find(
      c => c.id === selectedCountryId || c.name === selectedCountryId || c.code === selectedCountryId
    );

    const directLeagues = (dbState.leagues || []).filter(l =>
      isLeagueInCountry(l, country || selectedCountryId, dbState.countries || [])
    );

    const leaguesMap = new Map<string, League>();
    directLeagues.forEach(l => {
      const norm = normalizeText(l.name);
      if (!leaguesMap.has(norm)) {
        leaguesMap.set(norm, l);
      }
    });

    // Also check matches in case there are leagues linked to this country in matches
    const normCountryName = normalizeText(country?.name || selectedCountryId);
    const countryMatches = (dbState.matches || []).filter(m => {
      if (m.countryId === selectedCountryId) return true;
      if (m.countryName && normalizeText(m.countryName) === normCountryName) return true;
      if (country?.code && m.countryId?.toUpperCase() === country.code.toUpperCase()) return true;
      return false;
    });

    for (const m of countryMatches) {
      if (m.leagueName) {
        const norm = normalizeText(m.leagueName);
        if (!leaguesMap.has(norm)) {
          const lid = m.leagueId || `LIGA-EXTRA-${norm.replace(/\s+/g, '-')}`;
          const syntheticLeague: League = {
            id: lid,
            name: m.leagueName,
            countryId: country?.id || selectedCountryId,
            countryName: country?.name || m.countryName || 'País',
            type: 'Pontos Corridos',
            createdAt: new Date().toISOString(),
          };
          leaguesMap.set(norm, syntheticLeague);
        }
      }
    }

    // If still empty or incomplete, check canonical database definition
    if (country) {
      const canonicalDef = CANONICAL_COUNTRIES.find(
        c =>
          normalizeText(c.name) === normCountryName ||
          (country.code && c.code.toUpperCase() === country.code.toUpperCase()) ||
          c.name.toLowerCase() === country.name.toLowerCase()
      );

      if (canonicalDef) {
        canonicalDef.leagues.forEach((cl, idx) => {
          const norm = normalizeText(cl.name);
          if (!leaguesMap.has(norm)) {
            const generatedId = `LIGA-${canonicalDef.code}-${String(idx + 1).padStart(3, '0')}`;
            const canonicalLeague: League = {
              id: generatedId,
              name: cl.name,
              countryId: country.id,
              countryName: country.name,
              type: cl.type || 'Pontos Corridos',
              createdAt: new Date().toISOString(),
            };
            leaguesMap.set(norm, canonicalLeague);
          }
        });
      } else if (leaguesMap.size === 0) {
        // Generic fallback for any custom country
        const fallbackId = `LIGA-${normalizeText(country.name).toUpperCase().substring(0, 3)}-001`;
        const fallbackLeague: League = {
          id: fallbackId,
          name: `Liga Principal ${country.name}`,
          countryId: country.id,
          countryName: country.name,
          type: 'Pontos Corridos',
          createdAt: new Date().toISOString(),
        };
        leaguesMap.set(normalizeText(fallbackLeague.name), fallbackLeague);
      }
    }

    leaguesList = Array.from(leaguesMap.values());
  }

  // Deduplicate leagues by normalized name
  const deduplicated = new Map<string, League>();
  for (const l of leaguesList) {
    if (!l || !l.name) continue;
    const norm = normalizeText(l.name);
    if (!norm) continue;
    if (!deduplicated.has(norm)) {
      deduplicated.set(norm, l);
    }
  }

  return Array.from(deduplicated.values()).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

/**
 * Resiliently finds all available teams for a given league and/or country.
 * Guarantees zero cross-contamination when league names are identical (e.g. Bundesliga, Premier League, Süper Lig, Championship, Serie A).
 */
export function getTeamsForLeagueOrCountry(
  dbState: DbState,
  selectedLeagueId?: string,
  selectedCountryId?: string
): Team[] {
  const teams = dbState.teams || [];
  const matches = dbState.matches || [];

  const country = (dbState.countries || []).find(
    c => c.id === selectedCountryId || c.name === selectedCountryId || c.code === selectedCountryId
  );
  const league = (dbState.leagues || []).find(l => l.id === selectedLeagueId || l.name === selectedLeagueId);

  const normCountryName = normalizeText(country?.name || (selectedCountryId && selectedCountryId !== 'ALL' ? selectedCountryId : ''));
  const normLeagueName = normalizeText(league?.name || (selectedLeagueId && selectedLeagueId !== 'ALL' ? selectedLeagueId : ''));
  const targetCountryId = country?.id || (selectedCountryId && selectedCountryId !== 'ALL' ? selectedCountryId : '');

  // Determine effective league country if known
  const leagueCountryId = league?.countryId;
  const normLeagueCountryName = normalizeText(league?.countryName);

  const matchedTeamsMap = new Map<string, Team>();

  // Helper to test if a team matches the target country
  const isTeamInTargetCountry = (t: Partial<Team> | { countryId?: string; countryName?: string }): boolean => {
    if (!normCountryName && !targetCountryId) return true; // No country filter
    if (targetCountryId && (t.countryId === targetCountryId || normalizeText(t.countryId) === normalizeText(targetCountryId))) return true;
    if (country?.code && t.countryId?.toUpperCase() === country.code.toUpperCase()) return true;
    if (normCountryName && t.countryName && normalizeText(t.countryName) === normCountryName) return true;
    if (normLeagueCountryName && t.countryName && normalizeText(t.countryName) === normLeagueCountryName) return true;
    if (!t.countryName && !t.countryId) return true; // If untagged and matched by league
    return false;
  };

  // 1. If league is selected:
  if (selectedLeagueId && selectedLeagueId !== '' && selectedLeagueId !== 'ALL') {
    // 1.1 Teams matching leagueId directly
    teams.forEach(t => {
      const matchesLeagueId = t.leagueId === selectedLeagueId || t.leagueIds?.includes(selectedLeagueId);
      if (matchesLeagueId) {
        if (isTeamInTargetCountry(t)) {
          matchedTeamsMap.set(t.id, t);
        }
      } else if (normLeagueName && t.leagueName && normalizeText(t.leagueName) === normLeagueName) {
        // ONLY match by league name if the team belongs to the target country or league country
        if (isTeamInTargetCountry(t) || (normLeagueCountryName && normalizeText(t.countryName) === normLeagueCountryName)) {
          matchedTeamsMap.set(t.id, t);
        }
      }
    });

    // 1.2 Teams from matches of this league
    matches.forEach(m => {
      const matchesLeague =
        m.leagueId === selectedLeagueId ||
        (normLeagueName && m.leagueName && normalizeText(m.leagueName) === normLeagueName &&
          (!normCountryName || normalizeText(m.countryName) === normCountryName || m.countryId === targetCountryId));

      if (matchesLeague) {
        if (m.homeTeamId && !matchedTeamsMap.has(m.homeTeamId)) {
          const t = teams.find(team => team.id === m.homeTeamId);
          if (t && isTeamInTargetCountry(t)) {
            matchedTeamsMap.set(t.id, t);
          } else if (m.homeTeamName && isTeamInTargetCountry(m)) {
            matchedTeamsMap.set(m.homeTeamId, {
              id: m.homeTeamId,
              name: m.homeTeamName,
              countryId: country?.id || m.countryId || leagueCountryId || '',
              countryName: country?.name || m.countryName || league?.countryName || '',
              leagueId: selectedLeagueId,
              leagueName: league?.name || m.leagueName,
              createdAt: new Date().toISOString(),
            });
          }
        }
        if (m.awayTeamId && !matchedTeamsMap.has(m.awayTeamId)) {
          const t = teams.find(team => team.id === m.awayTeamId);
          if (t && isTeamInTargetCountry(t)) {
            matchedTeamsMap.set(t.id, t);
          } else if (m.awayTeamName && isTeamInTargetCountry(m)) {
            matchedTeamsMap.set(m.awayTeamId, {
              id: m.awayTeamId,
              name: m.awayTeamName,
              countryId: country?.id || m.countryId || leagueCountryId || '',
              countryName: country?.name || m.countryName || league?.countryName || '',
              leagueId: selectedLeagueId,
              leagueName: league?.name || m.leagueName,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    });

    // 1.3 If still empty, check canonical country database for this league AND country
    if (matchedTeamsMap.size === 0) {
      const searchCountries = normCountryName
        ? CANONICAL_COUNTRIES.filter(
            c =>
              normalizeText(c.name) === normCountryName ||
              (country?.code && c.code.toUpperCase() === country.code.toUpperCase())
          )
        : normLeagueCountryName
        ? CANONICAL_COUNTRIES.filter(c => normalizeText(c.name) === normLeagueCountryName)
        : CANONICAL_COUNTRIES;

      for (const cDef of searchCountries) {
        for (const lDef of cDef.leagues) {
          if (
            normalizeText(lDef.name) === normLeagueName ||
            (normLeagueName && (normLeagueName.includes(normalizeText(lDef.name)) || normalizeText(lDef.name).includes(normLeagueName)))
          ) {
            lDef.teams.forEach((tName, idx) => {
              const tid = `TIME-${cDef.code}-${String(idx + 1).padStart(3, '0')}`;
              matchedTeamsMap.set(tid, {
                id: tid,
                name: tName,
                countryId: country?.id || `PAIS-${cDef.code}`,
                countryName: country?.name || cDef.name,
                leagueId: selectedLeagueId,
                leagueName: league?.name || lDef.name,
                createdAt: new Date().toISOString(),
              });
            });
            break;
          }
        }
        if (matchedTeamsMap.size > 0) break;
      }
    }
  }

  // 2. If no league selected or league has no teams, filter by country
  if (matchedTeamsMap.size === 0 && selectedCountryId && selectedCountryId !== 'ALL') {
    teams.forEach(t => {
      if (isTeamInTargetCountry(t)) {
        matchedTeamsMap.set(t.id, t);
      }
    });

    matches.forEach(m => {
      if (isTeamInTargetCountry(m)) {
        if (m.homeTeamId && !matchedTeamsMap.has(m.homeTeamId)) {
          const t = teams.find(team => team.id === m.homeTeamId);
          if (t && isTeamInTargetCountry(t)) matchedTeamsMap.set(t.id, t);
          else if (m.homeTeamName) {
            matchedTeamsMap.set(m.homeTeamId, {
              id: m.homeTeamId,
              name: m.homeTeamName,
              countryId: country?.id || m.countryId || '',
              countryName: country?.name || m.countryName || '',
              leagueId: m.leagueId,
              leagueName: m.leagueName,
              createdAt: new Date().toISOString(),
            });
          }
        }
        if (m.awayTeamId && !matchedTeamsMap.has(m.awayTeamId)) {
          const t = teams.find(team => team.id === m.awayTeamId);
          if (t && isTeamInTargetCountry(t)) matchedTeamsMap.set(t.id, t);
          else if (m.awayTeamName) {
            matchedTeamsMap.set(m.awayTeamId, {
              id: m.awayTeamId,
              name: m.awayTeamName,
              countryId: country?.id || m.countryId || '',
              countryName: country?.name || m.countryName || '',
              leagueId: m.leagueId,
              leagueName: m.leagueName,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    });

    // Check canonical country teams
    if (matchedTeamsMap.size === 0 && country) {
      const canonicalDef = CANONICAL_COUNTRIES.find(
        c =>
          normalizeText(c.name) === normCountryName ||
          (country.code && c.code.toUpperCase() === country.code.toUpperCase())
      );
      if (canonicalDef) {
        canonicalDef.leagues.forEach(lDef => {
          lDef.teams.forEach((tName, idx) => {
            const tid = `TIME-${canonicalDef.code}-${String(idx + 1).padStart(3, '0')}`;
            if (!matchedTeamsMap.has(tid)) {
              matchedTeamsMap.set(tid, {
                id: tid,
                name: tName,
                countryId: country.id,
                countryName: country.name,
                leagueId: selectedLeagueId || undefined,
                leagueName: league?.name || lDef.name,
                createdAt: new Date().toISOString(),
              });
            }
          });
        });
      }
    }
  }

  // 3. If completely unfiltered and nothing found, return all teams
  if (
    matchedTeamsMap.size === 0 &&
    (!selectedCountryId || selectedCountryId === 'ALL') &&
    (!selectedLeagueId || selectedLeagueId === '' || selectedLeagueId === 'ALL')
  ) {
    teams.forEach(t => matchedTeamsMap.set(t.id, t));
  }

  // Deduplicate teams by normalized name
  const deduplicated = new Map<string, Team>();
  for (const t of matchedTeamsMap.values()) {
    if (!t || !t.name) continue;
    const norm = normalizeText(t.name);
    if (!norm) continue;
    if (!deduplicated.has(norm)) {
      deduplicated.set(norm, t);
    }
  }

  return Array.from(deduplicated.values()).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

/**
 * Enriches and heals the DbState so all canonical countries, leagues and teams are integrated
 * and properly cross-linked with consistent IDs and clean names.
 */
export function ensureCanonicalCountriesAndLeagues(dbState: DbState): DbState {
  if (!dbState) return dbState;

  const countries = [...(dbState.countries || [])];
  const leagues = [...(dbState.leagues || [])];
  const teams = [...(dbState.teams || [])];
  const matches = [...(dbState.matches || [])];
  const users = [...(dbState.users || [])];

  const countryById = new Map<string, Country>();
  const countryByNorm = new Map<string, Country>();

  // Map existing countries
  countries.forEach(c => {
    countryById.set(c.id, c);
    countryByNorm.set(normalizeText(c.name), c);
    if (c.code) countryByNorm.set(c.code.toUpperCase(), c);
  });

  // Calculate highest IDs
  let maxCountryNum = 0;
  countries.forEach(c => {
    const m = c.id?.match(/PAIS[-_]?(\d+)/i);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!isNaN(n) && n > maxCountryNum) maxCountryNum = n;
    }
  });

  let maxLeagueNum = 0;
  leagues.forEach(l => {
    const m = l.id?.match(/LIGA[-_]?(\d+)/i);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!isNaN(n) && n > maxLeagueNum) maxLeagueNum = n;
    }
  });

  let maxTeamNum = 0;
  teams.forEach(t => {
    const m = t.id?.match(/TIME[-_]?(\d+)/i);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!isNaN(n) && n > maxTeamNum) maxTeamNum = n;
    }
  });

  // 1. Enrich existing countries with standard code & flag if available
  for (const country of countries) {
    const canon = CANONICAL_COUNTRIES.find(
      c => normalizeText(c.name) === normalizeText(country.name) || (country.code && c.code.toUpperCase() === country.code.toUpperCase())
    );
    if (canon) {
      if (!country.code) country.code = canon.code;
      if (!country.flagUrl) country.flagUrl = canon.flag;
    }
  }

  // 2. Add any missing canonical countries
  for (const canon of CANONICAL_COUNTRIES) {
    const existing = countryByNorm.get(normalizeText(canon.name)) || (canon.code ? countryByNorm.get(canon.code.toUpperCase()) : null);
    if (!existing) {
      maxCountryNum += 1;
      const newCountry: Country = {
        id: `PAIS-${String(maxCountryNum).padStart(3, '0')}`,
        name: canon.name,
        code: canon.code,
        flagUrl: canon.flag,
        createdAt: new Date().toISOString(),
      };
      countries.push(newCountry);
      countryById.set(newCountry.id, newCountry);
      countryByNorm.set(normalizeText(newCountry.name), newCountry);
      if (newCountry.code) countryByNorm.set(newCountry.code.toUpperCase(), newCountry);
    }
  }

  // 3. Heal known corrupted league names (e.g. Süper Lig in Dinamarca, Suíça, Sérvia, Grécia)
  leagues.forEach(l => {
    const normCountry = normalizeText(l.countryName || (l.countryId ? countryById.get(l.countryId)?.name : ''));
    const normLeague = normalizeText(l.name);

    if (normCountry === 'dinamarca' && normLeague === 'super lig') {
      l.name = 'Superliga';
    } else if (normCountry === 'suica' && normLeague === 'super lig') {
      l.name = 'Super League';
    } else if (normCountry === 'servia' && normLeague === 'super lig') {
      l.name = 'SuperLiga Sérvia';
    } else if (normCountry === 'grecia' && normLeague === 'super lig') {
      l.name = 'Super League Grécia';
    } else if (normCountry === 'pais de gales' && (normLeague === 'premier league' || normLeague === 'super lig')) {
      l.name = 'Cymru Premier';
    } else if (normCountry === 'escocia' && normLeague === 'championship') {
      l.name = 'Championship';
    } else if (normCountry === 'estados unidos' && normLeague === 'championship') {
      l.name = 'USL Championship';
    }

    // Fix country link if missing or invalid
    if (!l.countryId || !countryById.has(l.countryId)) {
      const matchCountry =
        countryByNorm.get(normalizeText(l.countryName)) ||
        (l.countryId ? countryByNorm.get(normalizeText(l.countryId)) : null) ||
        (l.countryId ? countryByNorm.get(l.countryId.toUpperCase()) : null);
      if (matchCountry) {
        l.countryId = matchCountry.id;
        l.countryName = matchCountry.name;
      }
    }
  });

  // 4. Ensure each country has its canonical leagues and teams
  const leagueByCountryAndName = new Map<string, League>();
  leagues.forEach(l => {
    leagueByCountryAndName.set(`${l.countryId}:${normalizeText(l.name)}`, l);
  });

  const teamByCountryAndName = new Map<string, Team>();
  teams.forEach(t => {
    teamByCountryAndName.set(`${t.countryId}:${normalizeText(t.name)}`, t);
    teamByCountryAndName.set(`GLOBAL:${normalizeText(t.name)}`, t);
  });

  const canonicalClubMap = new Map<string, { country: Country; league: League }>();

  for (const canon of CANONICAL_COUNTRIES) {
    const targetCountry = countryByNorm.get(normalizeText(canon.name));
    if (!targetCountry) continue;

    for (const cLeague of canon.leagues) {
      const key = `${targetCountry.id}:${normalizeText(cLeague.name)}`;
      let leagueObj = leagueByCountryAndName.get(key);

      if (!leagueObj) {
        maxLeagueNum += 1;
        leagueObj = {
          id: `LIGA-${String(maxLeagueNum).padStart(3, '0')}`,
          name: cLeague.name,
          countryId: targetCountry.id,
          countryName: targetCountry.name,
          type: cLeague.type || 'Pontos Corridos',
          createdAt: new Date().toISOString(),
        };
        leagues.push(leagueObj);
        leagueByCountryAndName.set(key, leagueObj);
      }

      // Ensure teams exist for this league and map them
      for (const teamName of cLeague.teams) {
        const normTName = normalizeText(teamName);
        canonicalClubMap.set(normTName, { country: targetCountry, league: leagueObj });

        const teamKey = `${targetCountry.id}:${normTName}`;
        if (!teamByCountryAndName.has(teamKey)) {
          maxTeamNum += 1;
          const newTeam: Team = {
            id: `TIME-${String(maxTeamNum).padStart(3, '0')}`,
            name: teamName,
            countryId: targetCountry.id,
            countryName: targetCountry.name,
            leagueId: leagueObj.id,
            leagueName: leagueObj.name,
            createdAt: new Date().toISOString(),
          };
          teams.push(newTeam);
          teamByCountryAndName.set(teamKey, newTeam);
        }
      }
    }
  }

  // 5. Realign any misassigned teams and matches using canonical knowledge
  teams.forEach(t => {
    const norm = normalizeText(t.name);
    const canonInfo = canonicalClubMap.get(norm);
    if (canonInfo) {
      t.countryId = canonInfo.country.id;
      t.countryName = canonInfo.country.name;
      if (canonInfo.league) {
        t.leagueId = canonInfo.league.id;
        t.leagueName = canonInfo.league.name;
      }
    }
  });

  matches.forEach(m => {
    const normHome = normalizeText(m.homeTeamName);
    const normAway = normalizeText(m.awayTeamName);
    const canonHome = canonicalClubMap.get(normHome);
    const canonAway = canonicalClubMap.get(normAway);
    const canon = canonHome || canonAway;

    if (canon) {
      m.countryId = canon.country.id;
      m.countryName = canon.country.name;
      if (canon.league) {
        m.leagueId = canon.league.id;
        m.leagueName = canon.league.name;
      }
    } else {
      const normCountry = normalizeText(m.countryName || (m.countryId ? countryById.get(m.countryId)?.name : ''));
      const normLeague = normalizeText(m.leagueName);

      if (normCountry === 'dinamarca' && normLeague === 'super lig') {
        m.leagueName = 'Superliga';
      } else if (normCountry === 'suica' && normLeague === 'super lig') {
        m.leagueName = 'Super League';
      } else if (normCountry === 'servia' && normLeague === 'super lig') {
        m.leagueName = 'SuperLiga Sérvia';
      } else if (normCountry === 'grecia' && normLeague === 'super lig') {
        m.leagueName = 'Super League Grécia';
      } else if (normCountry === 'pais de gales' && (normLeague === 'premier league' || normLeague === 'super lig')) {
        m.leagueName = 'Cymru Premier';
      }
    }
  });

  return {
    ...dbState,
    countries,
    leagues,
    teams,
    matches,
    users,
  };
}
