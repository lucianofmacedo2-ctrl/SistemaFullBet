import { Match, League, Team, DbState } from '../types';

export type TiebreakerModel = 
  | 'GOAL_DIFFERENCE' // Premier League, Bundesliga, Championship, Ligue 1, Eredivisie, Escócia
  | 'HEAD_TO_HEAD'    // La Liga, Serie A, Liga Portugal, Süper Lig, Grécia
  | 'WINS_FIRST'      // Jupiler Pro League Bélgica, Brasileirão
  | 'STANDARD';

export type ZoneType = 'CHAMPIONS_DIRECT' | 'CHAMPIONS_QUAL' | 'EUROPA_LEAGUE' | 'CONFERENCE_LEAGUE' | 'PROMOTION_DIRECT' | 'PROMOTION_PLAYOFF' | 'RELEGATION_PLAYOUT' | 'RELEGATION_DIRECT' | 'NEUTRAL';

export interface CompetitionZoneRule {
  type: ZoneType;
  label: string;
  shortLabel: string;
  minPos: number;
  maxPos: number;
  badgeBg: string;
  badgeText: string;
  rowHighlight: string;
  indicatorColor: string;
  description: string;
}

export interface CompetitionRegulation {
  leagueId?: string;
  leagueNamePattern?: string; // regex or substring matching
  countryPattern?: string;
  tiebreakerModel: TiebreakerModel;
  tiebreakerDescription: string;
  rulesSequence: string[];
  zones: CompetitionZoneRule[];
  specialNotes?: string;
  expectedTeamsCount?: number;
}

// Catálogo de Regulamentos Oficiais mapeados
export const COMPETITION_REGULATIONS: CompetitionRegulation[] = [
  // INGLATERRA - Premier League
  {
    leagueNamePattern: 'premier league|premiership',
    countryPattern: 'inglaterra|england|reino unido',
    tiebreakerModel: 'GOAL_DIFFERENCE',
    tiebreakerDescription: '1º Saldo de Gols Geral ➔ 2º Gols Pró Geral ➔ 3º Confronto Direto (Pts ➔ Gols Fora)',
    rulesSequence: ['Pontos Ganhos', 'Saldo de Gols Geral', 'Gols Pró Geral', 'Pontos em Confronto Direto', 'Gols Fora no Confronto Direto', 'Play-off em Campo Neutro'],
    zones: [
      { type: 'CHAMPIONS_DIRECT', label: 'Fase de Liga da UEFA Champions League', shortLabel: 'Champions League', minPos: 1, maxPos: 4, indicatorColor: '#1e3a8a', badgeBg: 'bg-blue-900', badgeText: 'text-blue-100', rowHighlight: 'border-l-4 border-l-blue-600 bg-blue-950/20', description: 'Vaga Direta na Fase de Liga da Champions League' },
      { type: 'EUROPA_LEAGUE', label: 'Fase de Liga da UEFA Europa League', shortLabel: 'Europa League', minPos: 5, maxPos: 5, indicatorColor: '#0284c7', badgeBg: 'bg-sky-800', badgeText: 'text-sky-100', rowHighlight: 'border-l-4 border-l-sky-500 bg-sky-950/15', description: 'Vaga na Fase de Liga da Europa League' },
      { type: 'CONFERENCE_LEAGUE', label: 'Play-offs da UEFA Conference League', shortLabel: 'Conference League', minPos: 6, maxPos: 6, indicatorColor: '#059669', badgeBg: 'bg-emerald-800', badgeText: 'text-emerald-100', rowHighlight: 'border-l-4 border-l-emerald-500 bg-emerald-950/15', description: 'Play-off de Classificação para Conference League' },
      { type: 'RELEGATION_DIRECT', label: 'Rebaixamento para a EFL Championship', shortLabel: 'Rebaixamento Direto', minPos: 18, maxPos: 20, indicatorColor: '#dc2626', badgeBg: 'bg-red-900', badgeText: 'text-red-100', rowHighlight: 'border-l-4 border-l-red-600 bg-red-950/20', description: 'Rebaixamento direto para a 2ª Divisão' }
    ]
  },
  // INGLATERRA - Championship
  {
    leagueNamePattern: 'championship',
    countryPattern: 'inglaterra|england|reino unido',
    tiebreakerModel: 'GOAL_DIFFERENCE',
    tiebreakerDescription: '1º Saldo de Gols Geral ➔ 2º Gols Pró Geral ➔ 3º Confronto Direto',
    rulesSequence: ['Pontos Ganhos', 'Saldo de Gols Geral', 'Gols Pró Geral', 'Pontos no Confronto Direto', 'Número de Vitórias'],
    zones: [
      { type: 'PROMOTION_DIRECT', label: 'Promoção Direta para a Premier League', shortLabel: 'Acesso Direto', minPos: 1, maxPos: 2, indicatorColor: '#1e3a8a', badgeBg: 'bg-blue-900', badgeText: 'text-blue-100', rowHighlight: 'border-l-4 border-l-blue-600 bg-blue-950/20', description: 'Acesso automático à Premier League' },
      { type: 'PROMOTION_PLAYOFF', label: 'Play-offs de Acesso à Premier League', shortLabel: 'Playoffs Acesso', minPos: 3, maxPos: 6, indicatorColor: '#0284c7', badgeBg: 'bg-sky-800', badgeText: 'text-sky-100', rowHighlight: 'border-l-4 border-l-sky-500 bg-sky-950/15', description: 'Disputa de semifinais e final em Wembley' },
      { type: 'RELEGATION_DIRECT', label: 'Rebaixamento para a EFL League One', shortLabel: 'Rebaixamento', minPos: 22, maxPos: 24, indicatorColor: '#dc2626', badgeBg: 'bg-red-900', badgeText: 'text-red-100', rowHighlight: 'border-l-4 border-l-red-600 bg-red-950/20', description: 'Rebaixamento direto para a 3ª Divisão' }
    ]
  },
  // INGLATERRA - League One
  {
    leagueNamePattern: 'league 1|league one',
    countryPattern: 'inglaterra|england',
    tiebreakerModel: 'GOAL_DIFFERENCE',
    tiebreakerDescription: '1º Saldo de Gols Geral ➔ 2º Gols Pró Geral ➔ 3º Confronto Direto',
    rulesSequence: ['Pontos Ganhos', 'Saldo de Gols Geral', 'Gols Pró Geral', 'Pontos no Confronto Direto'],
    zones: [
      { type: 'PROMOTION_DIRECT', label: 'Promoção Direta para a Championship', shortLabel: 'Acesso Direto', minPos: 1, maxPos: 2, indicatorColor: '#1e3a8a', badgeBg: 'bg-blue-900', badgeText: 'text-blue-100', rowHighlight: 'border-l-4 border-l-blue-600 bg-blue-950/20', description: 'Acesso automático à 2ª Divisão' },
      { type: 'PROMOTION_PLAYOFF', label: 'Play-offs de Acesso', shortLabel: 'Playoffs Acesso', minPos: 3, maxPos: 6, indicatorColor: '#0284c7', badgeBg: 'bg-sky-800', badgeText: 'text-sky-100', rowHighlight: 'border-l-4 border-l-sky-500 bg-sky-950/15', description: 'Playoffs de Promoção' },
      { type: 'RELEGATION_DIRECT', label: 'Rebaixamento para League Two', shortLabel: 'Rebaixamento', minPos: 21, maxPos: 24, indicatorColor: '#dc2626', badgeBg: 'bg-red-900', badgeText: 'text-red-100', rowHighlight: 'border-l-4 border-l-red-600 bg-red-950/20', description: 'Rebaixamento para a 4ª Divisão' }
    ]
  },
  // INGLATERRA - League Two
  {
    leagueNamePattern: 'league 2|league two',
    countryPattern: 'inglaterra|england',
    tiebreakerModel: 'GOAL_DIFFERENCE',
    tiebreakerDescription: '1º Saldo de Gols Geral ➔ 2º Gols Pró Geral ➔ 3º Confronto Direto',
    rulesSequence: ['Pontos Ganhos', 'Saldo de Gols Geral', 'Gols Pró Geral', 'Pontos no Confronto Direto'],
    zones: [
      { type: 'PROMOTION_DIRECT', label: 'Promoção Direta para League One', shortLabel: 'Acesso Direto', minPos: 1, maxPos: 3, indicatorColor: '#1e3a8a', badgeBg: 'bg-blue-900', badgeText: 'text-blue-100', rowHighlight: 'border-l-4 border-l-blue-600 bg-blue-950/20', description: 'Top 3 sobem direto' },
      { type: 'PROMOTION_PLAYOFF', label: 'Play-offs de Acesso', shortLabel: 'Playoffs Acesso', minPos: 4, maxPos: 7, indicatorColor: '#0284c7', badgeBg: 'bg-sky-800', badgeText: 'text-sky-100', rowHighlight: 'border-l-4 border-l-sky-500 bg-sky-950/15', description: 'Playoffs de Acesso' },
      { type: 'RELEGATION_DIRECT', label: 'Rebaixamento para National League', shortLabel: 'Rebaixamento', minPos: 23, maxPos: 24, indicatorColor: '#dc2626', badgeBg: 'bg-red-900', badgeText: 'text-red-100', rowHighlight: 'border-l-4 border-l-red-600 bg-red-950/20', description: 'Rebaixamento para o futebol semiprofissional' }
    ]
  },
  // ESPANHA - La Liga 1
  {
    leagueNamePattern: 'la liga 1|la liga$|primera divisi|laliga',
    countryPattern: 'espanha|spain',
    tiebreakerModel: 'HEAD_TO_HEAD',
    tiebreakerDescription: '1º Confronto Direto (Pts ➔ Saldo de Gols) ➔ 2º Saldo de Gols Geral ➔ 3º Gols Pró Geral',
    rulesSequence: ['Pontos Ganhos', 'Pontos no Confronto Direto (após os 2 turnos)', 'Saldo de Gols no Confronto Direto', 'Saldo de Gols Geral', 'Gols Pró Geral', 'Fair Play (Cartões)'],
    zones: [
      { type: 'CHAMPIONS_DIRECT', label: 'Fase de Liga da UEFA Champions League', shortLabel: 'Champions League', minPos: 1, maxPos: 4, indicatorColor: '#1e3a8a', badgeBg: 'bg-blue-900', badgeText: 'text-blue-100', rowHighlight: 'border-l-4 border-l-blue-600 bg-blue-950/20', description: 'Vaga Direta na Champions League' },
      { type: 'EUROPA_LEAGUE', label: 'Fase de Liga da UEFA Europa League', shortLabel: 'Europa League', minPos: 5, maxPos: 5, indicatorColor: '#0284c7', badgeBg: 'bg-sky-800', badgeText: 'text-sky-100', rowHighlight: 'border-l-4 border-l-sky-500 bg-sky-950/15', description: 'Vaga na Europa League' },
      { type: 'CONFERENCE_LEAGUE', label: 'Play-offs da UEFA Conference League', shortLabel: 'Conference League', minPos: 6, maxPos: 6, indicatorColor: '#059669', badgeBg: 'bg-emerald-800', badgeText: 'text-emerald-100', rowHighlight: 'border-l-4 border-l-emerald-500 bg-emerald-950/15', description: 'Play-off da Conference League' },
      { type: 'RELEGATION_DIRECT', label: 'Rebaixamento para La Liga 2 (Hypermotion)', shortLabel: 'Rebaixamento Direto', minPos: 18, maxPos: 20, indicatorColor: '#dc2626', badgeBg: 'bg-red-900', badgeText: 'text-red-100', rowHighlight: 'border-l-4 border-l-red-600 bg-red-950/20', description: 'Rebaixamento direto para a 2ª Divisão Espanhola' }
    ]
  },
  // ESPANHA - La Liga 2
  {
    leagueNamePattern: 'la liga 2|segunda divisi|hypermotion',
    countryPattern: 'espanha|spain',
    tiebreakerModel: 'HEAD_TO_HEAD',
    tiebreakerDescription: '1º Confronto Direto ➔ 2º Saldo de Gols Geral ➔ 3º Gols Pró Geral',
    rulesSequence: ['Pontos Ganhos', 'Pontos no Confronto Direto', 'Saldo de Gols no Confronto Direto', 'Saldo de Gols Geral', 'Gols Pró Geral'],
    zones: [
      { type: 'PROMOTION_DIRECT', label: 'Promoção Direta para La Liga', shortLabel: 'Acesso Direto', minPos: 1, maxPos: 2, indicatorColor: '#1e3a8a', badgeBg: 'bg-blue-900', badgeText: 'text-blue-100', rowHighlight: 'border-l-4 border-l-blue-600 bg-blue-950/20', description: 'Acesso direto à 1ª Divisão' },
      { type: 'PROMOTION_PLAYOFF', label: 'Play-offs de Promoção para La Liga', shortLabel: 'Playoffs Acesso', minPos: 3, maxPos: 6, indicatorColor: '#0284c7', badgeBg: 'bg-sky-800', badgeText: 'text-sky-100', rowHighlight: 'border-l-4 border-l-sky-500 bg-sky-950/15', description: 'Mata-mata de Acesso' },
      { type: 'RELEGATION_DIRECT', label: 'Rebaixamento para Primera RFEF', shortLabel: 'Rebaixamento', minPos: 19, maxPos: 22, indicatorColor: '#dc2626', badgeBg: 'bg-red-900', badgeText: 'text-red-100', rowHighlight: 'border-l-4 border-l-red-600 bg-red-950/20', description: 'Rebaixamento para a 3ª Divisão' }
    ]
  },
  // ALEMANHA - Bundesliga 1
  {
    leagueNamePattern: 'bundesliga 1|bundesliga$|^bundesliga',
    countryPattern: 'alemanha|germany',
    tiebreakerModel: 'GOAL_DIFFERENCE',
    tiebreakerDescription: '1º Saldo de Gols Geral ➔ 2º Gols Pró Geral ➔ 3º Confronto Direto (Pontos ➔ Gols Fora)',
    rulesSequence: ['Pontos Ganhos', 'Saldo de Gols Geral', 'Gols Marcados Geral', 'Pontos no Confronto Direto', 'Gols Marcados Fora no Confronto Direto', 'Gols Marcados Fora Geral'],
    zones: [
      { type: 'CHAMPIONS_DIRECT', label: 'Fase de Liga da UEFA Champions League', shortLabel: 'Champions League', minPos: 1, maxPos: 4, indicatorColor: '#1e3a8a', badgeBg: 'bg-blue-900', badgeText: 'text-blue-100', rowHighlight: 'border-l-4 border-l-blue-600 bg-blue-950/20', description: 'Vaga Direta na Champions League' },
      { type: 'EUROPA_LEAGUE', label: 'Fase de Liga da UEFA Europa League', shortLabel: 'Europa League', minPos: 5, maxPos: 5, indicatorColor: '#0284c7', badgeBg: 'bg-sky-800', badgeText: 'text-sky-100', rowHighlight: 'border-l-4 border-l-sky-500 bg-sky-950/15', description: 'Vaga na Europa League' },
      { type: 'CONFERENCE_LEAGUE', label: 'Play-offs da UEFA Conference League', shortLabel: 'Conference League', minPos: 6, maxPos: 6, indicatorColor: '#059669', badgeBg: 'bg-emerald-800', badgeText: 'text-emerald-100', rowHighlight: 'border-l-4 border-l-emerald-500 bg-emerald-950/15', description: 'Play-off da Conference League' },
      { type: 'RELEGATION_PLAYOUT', label: 'Play-off de Rebaixamento (Relegation-Playoffs)', shortLabel: 'Play-off Rebaixamento', minPos: 16, maxPos: 16, indicatorColor: '#ea580c', badgeBg: 'bg-amber-800', badgeText: 'text-amber-100', rowHighlight: 'border-l-4 border-l-amber-500 bg-amber-950/20', description: 'Duelo ida e volta contra o 3º da 2. Bundesliga' },
      { type: 'RELEGATION_DIRECT', label: 'Rebaixamento para a 2. Bundesliga', shortLabel: 'Rebaixamento Direto', minPos: 17, maxPos: 18, indicatorColor: '#dc2626', badgeBg: 'bg-red-900', badgeText: 'text-red-100', rowHighlight: 'border-l-4 border-l-red-600 bg-red-950/20', description: 'Rebaixamento automático' }
    ]
  },
  // ALEMANHA - 2. Bundesliga
  {
    leagueNamePattern: 'bundesliga 2|2. bundesliga',
    countryPattern: 'alemanha|germany',
    tiebreakerModel: 'GOAL_DIFFERENCE',
    tiebreakerDescription: '1º Saldo de Gols Geral ➔ 2º Gols Pró Geral ➔ 3º Confronto Direto',
    rulesSequence: ['Pontos Ganhos', 'Saldo de Gols Geral', 'Gols Marcados Geral', 'Pontos no Confronto Direto'],
    zones: [
      { type: 'PROMOTION_DIRECT', label: 'Promoção Direta para a Bundesliga 1', shortLabel: 'Acesso Direto', minPos: 1, maxPos: 2, indicatorColor: '#1e3a8a', badgeBg: 'bg-blue-900', badgeText: 'text-blue-100', rowHighlight: 'border-l-4 border-l-blue-600 bg-blue-950/20', description: 'Acesso automático à elite alemã' },
      { type: 'PROMOTION_PLAYOFF', label: 'Play-off de Acesso (Relegation-Playoffs)', shortLabel: 'Playoff Acesso', minPos: 3, maxPos: 3, indicatorColor: '#0284c7', badgeBg: 'bg-sky-800', badgeText: 'text-sky-100', rowHighlight: 'border-l-4 border-l-sky-500 bg-sky-950/15', description: 'Duelo contra o 16º da Bundesliga 1' },
      { type: 'RELEGATION_PLAYOUT', label: 'Play-off de Permanência', shortLabel: 'Play-off Permanência', minPos: 16, maxPos: 16, indicatorColor: '#ea580c', badgeBg: 'bg-amber-800', badgeText: 'text-amber-100', rowHighlight: 'border-l-4 border-l-amber-500 bg-amber-950/20', description: 'Duelo contra o 3º da 3. Liga' },
      { type: 'RELEGATION_DIRECT', label: 'Rebaixamento para a 3. Liga', shortLabel: 'Rebaixamento Direto', minPos: 17, maxPos: 18, indicatorColor: '#dc2626', badgeBg: 'bg-red-900', badgeText: 'text-red-100', rowHighlight: 'border-l-4 border-l-red-600 bg-red-950/20', description: 'Rebaixamento automático' }
    ]
  },
  // ITÁLIA - Serie A
  {
    leagueNamePattern: 'serie a',
    countryPattern: 'itália|italia|italy',
    tiebreakerModel: 'HEAD_TO_HEAD',
    tiebreakerDescription: '1º Confronto Direto (Pts ➔ Saldo) ➔ 2º Saldo de Gols Geral ➔ 3º Gols Marcados Geral (*Play-off para 1º e 18º lugar)',
    rulesSequence: ['Pontos Ganhos', 'Jogo de Desempate (se empatados em 1º pelo Título ou em 18º pelo Rebaixamento)', 'Pontos no Confronto Direto', 'Saldo de Gols no Confronto Direto', 'Saldo de Gols Geral', 'Gols Pró Geral'],
    specialNotes: 'Regulamento FIGC: Caso haja empate em pontos para a 1ª posição (Scudetto) ou na linha de rebaixamento (17º e 18º), é disputado JOGO DE DESEMPATE único com pênaltis.',
    zones: [
      { type: 'CHAMPIONS_DIRECT', label: 'Fase de Liga da UEFA Champions League', shortLabel: 'Champions League', minPos: 1, maxPos: 4, indicatorColor: '#1e3a8a', badgeBg: 'bg-blue-900', badgeText: 'text-blue-100', rowHighlight: 'border-l-4 border-l-blue-600 bg-blue-950/20', description: 'Classificação Direta para Champions League' },
      { type: 'EUROPA_LEAGUE', label: 'Fase de Liga da UEFA Europa League', shortLabel: 'Europa League', minPos: 5, maxPos: 5, indicatorColor: '#0284c7', badgeBg: 'bg-sky-800', badgeText: 'text-sky-100', rowHighlight: 'border-l-4 border-l-sky-500 bg-sky-950/15', description: 'Vaga na Europa League' },
      { type: 'CONFERENCE_LEAGUE', label: 'Play-offs da UEFA Conference League', shortLabel: 'Conference League', minPos: 6, maxPos: 6, indicatorColor: '#059669', badgeBg: 'bg-emerald-800', badgeText: 'text-emerald-100', rowHighlight: 'border-l-4 border-l-emerald-500 bg-emerald-950/15', description: 'Play-off da Conference League' },
      { type: 'RELEGATION_DIRECT', label: 'Rebaixamento para a Serie B', shortLabel: 'Rebaixamento Direto', minPos: 18, maxPos: 20, indicatorColor: '#dc2626', badgeBg: 'bg-red-900', badgeText: 'text-red-100', rowHighlight: 'border-l-4 border-l-red-600 bg-red-950/20', description: 'Rebaixamento para a Serie B (*com play-off se empate no 18º)' }
    ]
  },
  // FRANÇA - Ligue 1
  {
    leagueNamePattern: 'ligue 1|division 1 fra',
    countryPattern: 'frança|france',
    tiebreakerModel: 'GOAL_DIFFERENCE',
    tiebreakerDescription: '1º Saldo de Gols Geral ➔ 2º Confronto Direto ➔ 3º Saldo de Gols Confronto Direto ➔ 4º Gols Pró Geral',
    rulesSequence: ['Pontos Ganhos', 'Saldo de Gols Geral', 'Pontos no Confronto Direto', 'Saldo de Gols no Confronto Direto', 'Gols Pró Geral', 'Gols Pró Fora de Casa'],
    zones: [
      { type: 'CHAMPIONS_DIRECT', label: 'Fase de Liga da UEFA Champions League', shortLabel: 'Champions Direta', minPos: 1, maxPos: 3, indicatorColor: '#1e3a8a', badgeBg: 'bg-blue-900', badgeText: 'text-blue-100', rowHighlight: 'border-l-4 border-l-blue-600 bg-blue-950/20', description: 'Vaga Direta na Fase de Liga' },
      { type: 'CHAMPIONS_QUAL', label: '3ª Pré-Eliminatória da Champions League', shortLabel: 'Pré-Champions', minPos: 4, maxPos: 4, indicatorColor: '#0284c7', badgeBg: 'bg-sky-800', badgeText: 'text-sky-100', rowHighlight: 'border-l-4 border-l-sky-500 bg-sky-950/15', description: 'Fase Qualificatória da Champions' },
      { type: 'EUROPA_LEAGUE', label: 'Fase de Liga da Europa League', shortLabel: 'Europa League', minPos: 5, maxPos: 5, indicatorColor: '#0284c7', badgeBg: 'bg-sky-800', badgeText: 'text-sky-100', rowHighlight: 'border-l-4 border-l-sky-500 bg-sky-950/15', description: 'Vaga na Europa League' },
      { type: 'CONFERENCE_LEAGUE', label: 'Play-offs da Conference League', shortLabel: 'Conference League', minPos: 6, maxPos: 6, indicatorColor: '#059669', badgeBg: 'bg-emerald-800', badgeText: 'text-emerald-100', rowHighlight: 'border-l-4 border-l-emerald-500 bg-emerald-950/15', description: 'Play-off da Conference League' },
      { type: 'RELEGATION_PLAYOUT', label: 'Play-off de Permanência/Rebaixamento (Barrages)', shortLabel: 'Play-out Rebaixamento', minPos: 16, maxPos: 16, indicatorColor: '#ea580c', badgeBg: 'bg-amber-800', badgeText: 'text-amber-100', rowHighlight: 'border-l-4 border-l-amber-500 bg-amber-950/20', description: 'Disputa contra vencedor dos playoffs da Ligue 2' },
      { type: 'RELEGATION_DIRECT', label: 'Rebaixamento para a Ligue 2', shortLabel: 'Rebaixamento Direto', minPos: 17, maxPos: 18, indicatorColor: '#dc2626', badgeBg: 'bg-red-900', badgeText: 'text-red-100', rowHighlight: 'border-l-4 border-l-red-600 bg-red-950/20', description: 'Rebaixamento automático' }
    ]
  },
  // FRANÇA - Ligue 2
  {
    leagueNamePattern: 'ligue 2|division 2 fra',
    countryPattern: 'frança|france',
    tiebreakerModel: 'GOAL_DIFFERENCE',
    tiebreakerDescription: '1º Saldo de Gols Geral ➔ 2º Gols Pró Geral ➔ 3º Confronto Direto',
    rulesSequence: ['Pontos Ganhos', 'Saldo de Gols Geral', 'Gols Pró Geral', 'Pontos no Confronto Direto'],
    zones: [
      { type: 'PROMOTION_DIRECT', label: 'Promoção Direta para a Ligue 1', shortLabel: 'Acesso Direto', minPos: 1, maxPos: 2, indicatorColor: '#1e3a8a', badgeBg: 'bg-blue-900', badgeText: 'text-blue-100', rowHighlight: 'border-l-4 border-l-blue-600 bg-blue-950/20', description: 'Acesso automático à 1ª Divisão' },
      { type: 'PROMOTION_PLAYOFF', label: 'Play-offs de Acesso à Ligue 1', shortLabel: 'Playoffs Acesso', minPos: 3, maxPos: 5, indicatorColor: '#0284c7', badgeBg: 'bg-sky-800', badgeText: 'text-sky-100', rowHighlight: 'border-l-4 border-l-sky-500 bg-sky-950/15', description: 'Torneio mata-mata e repescagem com o 16º da Ligue 1' },
      { type: 'RELEGATION_DIRECT', label: 'Rebaixamento para o Championnat National', shortLabel: 'Rebaixamento', minPos: 17, maxPos: 18, indicatorColor: '#dc2626', badgeBg: 'bg-red-900', badgeText: 'text-red-100', rowHighlight: 'border-l-4 border-l-red-600 bg-red-950/20', description: 'Rebaixamento para a 3ª Divisão' }
    ]
  },
  // HOLANDA - Eredivisie
  {
    leagueNamePattern: 'eredivisie',
    countryPattern: 'holanda|netherlands|países baixos',
    tiebreakerModel: 'GOAL_DIFFERENCE',
    tiebreakerDescription: '1º Saldo de Gols Geral ➔ 2º Gols Marcados Geral ➔ 3º Confronto Direto',
    rulesSequence: ['Pontos Ganhos', 'Saldo de Gols Geral', 'Gols Marcados Geral', 'Pontos no Confronto Direto', 'Gols Marcados Fora no Confronto Direto'],
    zones: [
      { type: 'CHAMPIONS_DIRECT', label: 'Fase de Liga da Champions League', shortLabel: 'Champions Direta', minPos: 1, maxPos: 2, indicatorColor: '#1e3a8a', badgeBg: 'bg-blue-900', badgeText: 'text-blue-100', rowHighlight: 'border-l-4 border-l-blue-600 bg-blue-950/20', description: 'Vaga Direta' },
      { type: 'CHAMPIONS_QUAL', label: '3ª Pré-Eliminatória da Champions League', shortLabel: 'Pré-Champions', minPos: 3, maxPos: 3, indicatorColor: '#0284c7', badgeBg: 'bg-sky-800', badgeText: 'text-sky-100', rowHighlight: 'border-l-4 border-l-sky-500 bg-sky-950/15', description: 'Fase Qualificatória' },
      { type: 'EUROPA_LEAGUE', label: '2ª Pré-Eliminatória da Europa League', shortLabel: 'Europa League', minPos: 4, maxPos: 4, indicatorColor: '#0284c7', badgeBg: 'bg-sky-800', badgeText: 'text-sky-100', rowHighlight: 'border-l-4 border-l-sky-500 bg-sky-950/15', description: 'Qualificatória Europa League' },
      { type: 'CONFERENCE_LEAGUE', label: 'Play-offs Europeus (Conference League)', shortLabel: 'Playoffs Europeus', minPos: 5, maxPos: 8, indicatorColor: '#059669', badgeBg: 'bg-emerald-800', badgeText: 'text-emerald-100', rowHighlight: 'border-l-4 border-l-emerald-500 bg-emerald-950/15', description: 'Mata-mata holandês pela vaga na Conference' },
      { type: 'RELEGATION_PLAYOUT', label: 'Play-offs de Rebaixamento (Nacompetitie)', shortLabel: 'Play-off Rebaixamento', minPos: 16, maxPos: 16, indicatorColor: '#ea580c', badgeBg: 'bg-amber-800', badgeText: 'text-amber-100', rowHighlight: 'border-l-4 border-l-amber-500 bg-amber-950/20', description: 'Repescagem contra times da Eerste Divisie' },
      { type: 'RELEGATION_DIRECT', label: 'Rebaixamento para a Eerste Divisie', shortLabel: 'Rebaixamento Direto', minPos: 17, maxPos: 18, indicatorColor: '#dc2626', badgeBg: 'bg-red-900', badgeText: 'text-red-100', rowHighlight: 'border-l-4 border-l-red-600 bg-red-950/20', description: 'Rebaixamento automático' }
    ]
  },
  // PORTUGAL - Primeira Liga
  {
    leagueNamePattern: 'liga portugal|primeira liga',
    countryPattern: 'portugal',
    tiebreakerModel: 'HEAD_TO_HEAD',
    tiebreakerDescription: '1º Confronto Direto (Pts ➔ Saldo) ➔ 2º Saldo de Gols Geral ➔ 3º Número de Vitórias',
    rulesSequence: ['Pontos Ganhos', 'Pontos no Confronto Direto', 'Saldo de Gols no Confronto Direto', 'Saldo de Gols Geral', 'Número de Vitórias', 'Gols Marcados Geral'],
    zones: [
      { type: 'CHAMPIONS_DIRECT', label: 'Fase de Liga da Champions League', shortLabel: 'Champions Direta', minPos: 1, maxPos: 1, indicatorColor: '#1e3a8a', badgeBg: 'bg-blue-900', badgeText: 'text-blue-100', rowHighlight: 'border-l-4 border-l-blue-600 bg-blue-950/20', description: 'Campeão garante vaga na fase de liga' },
      { type: 'CHAMPIONS_QUAL', label: '3ª Pré-Eliminatória da Champions League', shortLabel: 'Pré-Champions', minPos: 2, maxPos: 2, indicatorColor: '#0284c7', badgeBg: 'bg-sky-800', badgeText: 'text-sky-100', rowHighlight: 'border-l-4 border-l-sky-500 bg-sky-950/15', description: 'Qualificatória da Champions' },
      { type: 'EUROPA_LEAGUE', label: 'Fase de Liga da Europa League', shortLabel: 'Europa League', minPos: 3, maxPos: 3, indicatorColor: '#0284c7', badgeBg: 'bg-sky-800', badgeText: 'text-sky-100', rowHighlight: 'border-l-4 border-l-sky-500 bg-sky-950/15', description: 'Vaga na Europa League' },
      { type: 'CONFERENCE_LEAGUE', label: '2ª Pré-Eliminatória da Conference League', shortLabel: 'Conference League', minPos: 4, maxPos: 5, indicatorColor: '#059669', badgeBg: 'bg-emerald-800', badgeText: 'text-emerald-100', rowHighlight: 'border-l-4 border-l-emerald-500 bg-emerald-950/15', description: 'Qualificatória da Conference League' },
      { type: 'RELEGATION_PLAYOUT', label: 'Play-off de Manutenção/Rebaixamento', shortLabel: 'Play-off Rebaixamento', minPos: 16, maxPos: 16, indicatorColor: '#ea580c', badgeBg: 'bg-amber-800', badgeText: 'text-amber-100', rowHighlight: 'border-l-4 border-l-amber-500 bg-amber-950/20', description: 'Duelo ida e volta contra o 3º da Liga Portugal 2' },
      { type: 'RELEGATION_DIRECT', label: 'Rebaixamento para a Liga Portugal 2', shortLabel: 'Rebaixamento Direto', minPos: 17, maxPos: 18, indicatorColor: '#dc2626', badgeBg: 'bg-red-900', badgeText: 'text-red-100', rowHighlight: 'border-l-4 border-l-red-600 bg-red-950/20', description: 'Rebaixamento automático' }
    ]
  },
  // ESCÓCIA - Scottish Premiership
  {
    leagueNamePattern: 'premiere league esc|premiership|division 1 esc|division 2 esc|division 3 esc',
    countryPattern: 'escócia|scotland',
    tiebreakerModel: 'GOAL_DIFFERENCE',
    tiebreakerDescription: '1º Saldo de Gols Geral ➔ 2º Gols Marcados Geral ➔ 3º Confronto Direto',
    rulesSequence: ['Pontos Ganhos', 'Saldo de Gols Geral', 'Gols Marcados Geral', 'Pontos no Confronto Direto'],
    zones: [
      { type: 'CHAMPIONS_DIRECT', label: 'Campeão Escocês / Vaga Continental', shortLabel: 'Campeão / Europa', minPos: 1, maxPos: 2, indicatorColor: '#1e3a8a', badgeBg: 'bg-blue-900', badgeText: 'text-blue-100', rowHighlight: 'border-l-4 border-l-blue-600 bg-blue-950/20', description: 'Vagas Continentais Europeias' },
      { type: 'CONFERENCE_LEAGUE', label: 'Vagas Conference League / Top 6', shortLabel: 'Top 6 / Europa', minPos: 3, maxPos: 4, indicatorColor: '#059669', badgeBg: 'bg-emerald-800', badgeText: 'text-emerald-100', rowHighlight: 'border-l-4 border-l-emerald-500 bg-emerald-950/15', description: 'Classificação Europeia' },
      { type: 'RELEGATION_PLAYOUT', label: 'Play-off de Permanência', shortLabel: 'Play-off Rebaixamento', minPos: 11, maxPos: 11, indicatorColor: '#ea580c', badgeBg: 'bg-amber-800', badgeText: 'text-amber-100', rowHighlight: 'border-l-4 border-l-amber-500 bg-amber-950/20', description: 'Play-off contra o vencedor da Championship' },
      { type: 'RELEGATION_DIRECT', label: 'Rebaixamento Direto', shortLabel: 'Rebaixamento', minPos: 12, maxPos: 12, indicatorColor: '#dc2626', badgeBg: 'bg-red-900', badgeText: 'text-red-100', rowHighlight: 'border-l-4 border-l-red-600 bg-red-950/20', description: 'Rebaixamento direto de divisão' }
    ]
  },
  // BÉLGICA - Jupiler Pro League (Exemplo de Ligas por Número de Vitórias)
  {
    leagueNamePattern: 'jupiler|pro league|bélgica|belgium',
    countryPattern: 'bélgica|belgium',
    tiebreakerModel: 'WINS_FIRST',
    tiebreakerDescription: '1º Número de Vitórias ➔ 2º Saldo de Gols Geral ➔ 3º Gols Pró Geral ➔ 4º Gols Fora',
    rulesSequence: ['Pontos Ganhos', 'Número de Vitórias', 'Saldo de Gols Geral', 'Gols Pró Geral', 'Gols Marcados Fora de Casa', 'Vitórias Fora de Casa'],
    zones: [
      { type: 'CHAMPIONS_DIRECT', label: 'Play-offs do Título (Champions Playoffs)', shortLabel: 'Champions Playoff', minPos: 1, maxPos: 6, indicatorColor: '#1e3a8a', badgeBg: 'bg-blue-900', badgeText: 'text-blue-100', rowHighlight: 'border-l-4 border-l-blue-600 bg-blue-950/20', description: 'Top 6 disputam o título e vagas europeias' },
      { type: 'CONFERENCE_LEAGUE', label: 'Play-offs da Europa League / Conference', shortLabel: 'Europe Playoff', minPos: 7, maxPos: 12, indicatorColor: '#059669', badgeBg: 'bg-emerald-800', badgeText: 'text-emerald-100', rowHighlight: 'border-l-4 border-l-emerald-500 bg-emerald-950/15', description: 'Playoffs europeus intermediários' },
      { type: 'RELEGATION_DIRECT', label: 'Play-downs de Rebaixamento (Relegation Play-offs)', shortLabel: 'Rebaixamento Play-offs', minPos: 13, maxPos: 16, indicatorColor: '#dc2626', badgeBg: 'bg-red-900', badgeText: 'text-red-100', rowHighlight: 'border-l-4 border-l-red-600 bg-red-950/20', description: 'Quadrangular de rebaixamento' }
    ]
  }
];

// Fallback genérico para ligas não mapeadas explicitamente
export const DEFAULT_REGULATION: CompetitionRegulation = {
  tiebreakerModel: 'GOAL_DIFFERENCE',
  tiebreakerDescription: '1º Saldo de Gols Geral ➔ 2º Gols Marcados Geral ➔ 3º Confronto Direto ➔ 4º Vitórias',
  rulesSequence: ['Pontos Ganhos', 'Saldo de Gols Geral', 'Gols Pró Geral', 'Pontos no Confronto Direto', 'Número de Vitórias', 'Ordem Alfabética'],
  zones: [
    { type: 'CHAMPIONS_DIRECT', label: 'Zona de Título / Vaga Direta', shortLabel: 'Título / Vaga', minPos: 1, maxPos: 1, indicatorColor: '#1e3a8a', badgeBg: 'bg-blue-900', badgeText: 'text-blue-100', rowHighlight: 'border-l-4 border-l-blue-600 bg-blue-950/20', description: 'Líder / Campeão' },
    { type: 'EUROPA_LEAGUE', label: 'Zona de Classificação Continental / Acesso', shortLabel: 'Acesso / Continental', minPos: 2, maxPos: 3, indicatorColor: '#0284c7', badgeBg: 'bg-sky-800', badgeText: 'text-sky-100', rowHighlight: 'border-l-4 border-l-sky-500 bg-sky-950/15', description: 'Vagas de topo' },
    { type: 'RELEGATION_DIRECT', label: 'Zona de Rebaixamento / Descenso', shortLabel: 'Zona Rebaixamento', minPos: 99, maxPos: 99, indicatorColor: '#dc2626', badgeBg: 'bg-red-900', badgeText: 'text-red-100', rowHighlight: 'border-l-4 border-l-red-600 bg-red-950/20', description: 'Descenso' }
  ]
};

// Encontra o regulamento correspondente à liga e país
export function getCompetitionRegulation(league?: League | null, countryName?: string): CompetitionRegulation {
  if (!league) return DEFAULT_REGULATION;

  const lName = (league.name || '').toLowerCase();
  const cName = (countryName || league.countryName || '').toLowerCase();

  for (const reg of COMPETITION_REGULATIONS) {
    let matchLeague = true;
    let matchCountry = true;

    if (reg.leagueNamePattern) {
      const regex = new RegExp(reg.leagueNamePattern, 'i');
      matchLeague = regex.test(lName);
    }

    if (reg.countryPattern) {
      const regex = new RegExp(reg.countryPattern, 'i');
      matchCountry = regex.test(cName);
    }

    if (matchLeague && matchCountry) {
      return reg;
    }
  }

  return DEFAULT_REGULATION;
}

// Representação rica de cada linha da tabela de classificação
export interface DynamicStandingRow {
  position: number;
  teamId: string;
  teamName: string;
  logoUrl?: string;
  countryName: string;
  leagueId: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  pointsPercentage: number;
  recentForm: Array<{
    outcome: 'V' | 'E' | 'D';
    score: string;
    opponent: string;
    isHome: boolean;
    date: string;
  }>;
  homeRecord: { played: number; wins: number; draws: number; losses: number; gf: number; ga: number; gd: number; pts: number; pct: number };
  awayRecord: { played: number; wins: number; draws: number; losses: number; gf: number; ga: number; gd: number; pts: number; pct: number };
  
  // Dados de Desempate
  tiebreakerNote?: string;

  // Expected Points (xP) & xG metrics
  xGoalsFor: number;
  xGoalsAgainst: number;
  xGoalDifference: number;
  xPoints: number;
  xPointsRank: number;
  xPointsDiff: number; // Real Pts - xPts (positivo = overperforming, negativo = underperforming/azarado)
  
  // Volatilidade de Gols da Equipe
  over15Pct: number;
  over25Pct: number;
  over35Pct: number;
  over05HTPct: number;
  over15HTPct: number;
  bttsPct: number;
  cleanSheets: number;
  cleanSheetPct: number;
  failedToScore: number;
  failedToScorePct: number;

  // Mando de Campo do Time
  homeDominanceFactor: number; // Diferença de aproveitamento Casa vs Fora

  // Zona da Tabela
  zone?: CompetitionZoneRule;
}

// Resumo Geral da Liga (Métricas da Competição)
export interface LeagueOverallMetrics {
  totalMatchesFinished: number;
  totalGoals: number;
  avgGoalsPerMatch: number;
  avgGoalsHT: number;
  over15Pct: number;
  over25Pct: number;
  over35Pct: number;
  over05HTPct: number;
  over15HTPct: number;
  bttsPct: number;
  homeWinPct: number;
  drawPct: number;
  awayWinPct: number;
  homeGoalsAvg: number;
  awayGoalsAvg: number;
  homeAdvantageIndex: number; // % Vitórias Casa - % Vitórias Fora
}

// Estatísticas de Árbitros da Liga
export interface RefereeStat {
  name: string;
  matchesCount: number;
  yellowCardsTotal: number;
  yellowCardsAvg: number;
  redCardsTotal: number;
  redCardsAvg: number;
  foulsTotal: number;
  foulsAvg: number;
  homeWins: number;
  draws: number;
  awayWins: number;
  homeWinPct: number;
  drawPct: number;
  awayWinPct: number;
  rigorLevel: 'Alto Rigor' | 'Equilibrado' | 'Brando';
}

// Confronto Selecionado para Destaque & Projeções
export interface MatchContextProjection {
  homeTeam: DynamicStandingRow;
  awayTeam: DynamicStandingRow;
  leader: DynamicStandingRow;
  distanceHomeToLeader: number;
  distanceAwayToLeader: number;
  distanceHomeToTopZone: number;
  distanceAwayToTopZone: number;
  distanceHomeToRelegation: number;
  distanceAwayToRelegation: number;
  
  // Projeções
  homeWinOutcome: {
    homeProjectedPoints: number;
    awayProjectedPoints: number;
  };
  drawOutcome: {
    homeProjectedPoints: number;
    awayProjectedPoints: number;
  };
  awayWinOutcome: {
    homeProjectedPoints: number;
    awayProjectedPoints: number;
  };
}

// Função para calcular confrontos diretos entre um subconjunto de times empatados
function calculateHeadToHeadMatrix(
  tiedTeamIds: string[],
  leagueMatches: Match[]
): Record<string, { points: number; goalDiff: number; goalsFor: number; awayGoalsFor: number; wins: number }> {
  const h2hMap: Record<string, { points: number; goalDiff: number; goalsFor: number; awayGoalsFor: number; wins: number }> = {};
  
  tiedTeamIds.forEach(id => {
    h2hMap[id] = { points: 0, goalDiff: 0, goalsFor: 0, awayGoalsFor: 0, wins: 0 };
  });

  const tiedMatches = leagueMatches.filter(m => 
    m.status === 'FINALIZADO' &&
    tiedTeamIds.includes(m.homeTeamId) &&
    tiedTeamIds.includes(m.awayTeamId)
  );

  tiedMatches.forEach(m => {
    const hScore = m.homeScore ?? 0;
    const aScore = m.awayScore ?? 0;

    const h = h2hMap[m.homeTeamId];
    const a = h2hMap[m.awayTeamId];

    if (h && a) {
      h.goalsFor += hScore;
      h.goalDiff += (hScore - aScore);

      a.goalsFor += aScore;
      a.awayGoalsFor += aScore;
      a.goalDiff += (aScore - hScore);

      if (hScore > aScore) {
        h.points += 3;
        h.wins += 1;
      } else if (hScore === aScore) {
        h.points += 1;
        a.points += 1;
      } else {
        a.points += 3;
        a.wins += 1;
      }
    }
  });

  return h2hMap;
}

// Cálculo Principal da Tabela Dinâmica
export function calculateDynamicStandings(
  dbState: DbState,
  selectedLeagueId: string,
  venueMode: 'ALL' | 'HOME' | 'AWAY' = 'ALL'
): {
  rows: DynamicStandingRow[];
  regulation: CompetitionRegulation;
  leagueMetrics: LeagueOverallMetrics;
  refereeStats: RefereeStat[];
} {
  const { leagues, matches, teams } = dbState;
  const currentLeague = leagues.find(l => l.id === selectedLeagueId);
  const regulation = getCompetitionRegulation(currentLeague);

  // Filtrar jogos da liga finalizados
  const leagueFinishedMatches = matches.filter(m => {
    if (m.status !== 'FINALIZADO') return false;
    if (selectedLeagueId !== 'ALL' && m.leagueId !== selectedLeagueId) return false;
    return true;
  });

  // Mapeamento de Times
  const teamRowsMap: Record<string, DynamicStandingRow> = {};

  // Times vinculados à liga selecionada
  teams.forEach(t => {
    if (selectedLeagueId === 'ALL' || t.leagueId === selectedLeagueId || (t.leagueIds && t.leagueIds.includes(selectedLeagueId))) {
      teamRowsMap[t.id] = {
        position: 0,
        teamId: t.id,
        teamName: t.name,
        logoUrl: t.logoUrl,
        countryName: t.countryName,
        leagueId: t.leagueId || selectedLeagueId,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        pointsPercentage: 0,
        recentForm: [],
        homeRecord: { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0, pts: 0, pct: 0 },
        awayRecord: { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0, pts: 0, pct: 0 },
        xGoalsFor: 0,
        xGoalsAgainst: 0,
        xGoalDifference: 0,
        xPoints: 0,
        xPointsRank: 0,
        xPointsDiff: 0,
        over15Pct: 0,
        over25Pct: 0,
        over35Pct: 0,
        over05HTPct: 0,
        over15HTPct: 0,
        bttsPct: 0,
        cleanSheets: 0,
        cleanSheetPct: 0,
        failedToScore: 0,
        failedToScorePct: 0,
        homeDominanceFactor: 0,
      };
    }
  });

  // Ordenar cronologicamente para calcular a forma recente com fidelidade
  const sortedMatches = [...leagueFinishedMatches].sort(
    (a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()
  );

  const teamFormHistory: Record<string, Array<{ outcome: 'V' | 'E' | 'D'; score: string; opponent: string; isHome: boolean; date: string }>> = {};
  const teamMatchesList: Record<string, Match[]> = {};

  sortedMatches.forEach(m => {
    const hScore = m.homeScore ?? 0;
    const aScore = m.awayScore ?? 0;
    const htHome = m.stats?.halftimeHomeScore ?? 0;
    const htAway = m.stats?.halftimeAwayScore ?? 0;

    // Criar se não existir
    if (!teamRowsMap[m.homeTeamId]) {
      teamRowsMap[m.homeTeamId] = {
        position: 0,
        teamId: m.homeTeamId,
        teamName: m.homeTeamName,
        logoUrl: m.homeTeamLogoUrl,
        countryName: m.countryName,
        leagueId: m.leagueId,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        pointsPercentage: 0,
        recentForm: [],
        homeRecord: { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0, pts: 0, pct: 0 },
        awayRecord: { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0, pts: 0, pct: 0 },
        xGoalsFor: 0,
        xGoalsAgainst: 0,
        xGoalDifference: 0,
        xPoints: 0,
        xPointsRank: 0,
        xPointsDiff: 0,
        over15Pct: 0,
        over25Pct: 0,
        over35Pct: 0,
        over05HTPct: 0,
        over15HTPct: 0,
        bttsPct: 0,
        cleanSheets: 0,
        cleanSheetPct: 0,
        failedToScore: 0,
        failedToScorePct: 0,
        homeDominanceFactor: 0,
      };
    }

    if (!teamRowsMap[m.awayTeamId]) {
      teamRowsMap[m.awayTeamId] = {
        position: 0,
        teamId: m.awayTeamId,
        teamName: m.awayTeamName,
        logoUrl: m.awayTeamLogoUrl,
        countryName: m.countryName,
        leagueId: m.leagueId,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        pointsPercentage: 0,
        recentForm: [],
        homeRecord: { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0, pts: 0, pct: 0 },
        awayRecord: { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0, pts: 0, pct: 0 },
        xGoalsFor: 0,
        xGoalsAgainst: 0,
        xGoalDifference: 0,
        xPoints: 0,
        xPointsRank: 0,
        xPointsDiff: 0,
        over15Pct: 0,
        over25Pct: 0,
        over35Pct: 0,
        over05HTPct: 0,
        over15HTPct: 0,
        bttsPct: 0,
        cleanSheets: 0,
        cleanSheetPct: 0,
        failedToScore: 0,
        failedToScorePct: 0,
        homeDominanceFactor: 0,
      };
    }

    if (!teamFormHistory[m.homeTeamId]) teamFormHistory[m.homeTeamId] = [];
    if (!teamFormHistory[m.awayTeamId]) teamFormHistory[m.awayTeamId] = [];
    if (!teamMatchesList[m.homeTeamId]) teamMatchesList[m.homeTeamId] = [];
    if (!teamMatchesList[m.awayTeamId]) teamMatchesList[m.awayTeamId] = [];

    teamMatchesList[m.homeTeamId].push(m);
    teamMatchesList[m.awayTeamId].push(m);

    const hRow = teamRowsMap[m.homeTeamId];
    const aRow = teamRowsMap[m.awayTeamId];

    // Atualização Geral do Registro em Casa
    hRow.homeRecord.played += 1;
    hRow.homeRecord.gf += hScore;
    hRow.homeRecord.ga += aScore;
    if (hScore > aScore) {
      hRow.homeRecord.wins += 1;
      hRow.homeRecord.pts += 3;
    } else if (hScore === aScore) {
      hRow.homeRecord.draws += 1;
      hRow.homeRecord.pts += 1;
    } else {
      hRow.homeRecord.losses += 1;
    }

    // Atualização Geral do Registro Fora
    aRow.awayRecord.played += 1;
    aRow.awayRecord.gf += aScore;
    aRow.awayRecord.ga += hScore;
    if (aScore > hScore) {
      aRow.awayRecord.wins += 1;
      aRow.awayRecord.pts += 3;
    } else if (aScore === hScore) {
      aRow.awayRecord.draws += 1;
      aRow.awayRecord.pts += 1;
    } else {
      aRow.awayRecord.losses += 1;
    }

    // xG tracking se disponível ou estimativa inteligente baseada em chutes a gol
    const hXg = m.stats?.xgHomeFT ?? (m.stats?.shotsOnTargetHomeFT ? m.stats.shotsOnTargetHomeFT * 0.32 : hScore * 0.9 + 0.1);
    const aXg = m.stats?.xgAwayFT ?? (m.stats?.shotsOnTargetAwayFT ? m.stats.shotsOnTargetAwayFT * 0.32 : aScore * 0.9 + 0.1);

    hRow.xGoalsFor += hXg;
    hRow.xGoalsAgainst += aXg;
    aRow.xGoalsFor += aXg;
    aRow.xGoalsAgainst += hXg;

    // xPoints calculation: Poisson prob approximation
    const diff = hXg - aXg;
    let probHW = 1 / (1 + Math.exp(-1.4 * diff));
    let probAW = 1 / (1 + Math.exp(1.4 * diff));
    let probD = Math.max(0.18, 1 - (probHW + probAW) * 0.6);
    const totalProb = probHW + probD + probAW;
    probHW /= totalProb;
    probD /= totalProb;
    probAW /= totalProb;

    const xPtHome = probHW * 3 + probD * 1;
    const xPtAway = probAW * 3 + probD * 1;

    hRow.xPoints += xPtHome;
    aRow.xPoints += xPtAway;

    // Forma e Vistas de Tabela
    const homeOutcome: 'V' | 'E' | 'D' = hScore > aScore ? 'V' : hScore === aScore ? 'E' : 'D';
    const awayOutcome: 'V' | 'E' | 'D' = aScore > hScore ? 'V' : aScore === hScore ? 'E' : 'D';

    teamFormHistory[m.homeTeamId].push({
      outcome: homeOutcome,
      score: `${hScore} - ${aScore}`,
      opponent: m.awayTeamName,
      isHome: true,
      date: m.matchDate,
    });

    teamFormHistory[m.awayTeamId].push({
      outcome: awayOutcome,
      score: `${aScore} - ${hScore}`,
      opponent: m.homeTeamName,
      isHome: false,
      date: m.matchDate,
    });

    // Se venueMode for ALL ou HOME -> soma no mandante
    if (venueMode === 'ALL' || venueMode === 'HOME') {
      hRow.played += 1;
      hRow.goalsFor += hScore;
      hRow.goalsAgainst += aScore;
      if (homeOutcome === 'V') {
        hRow.wins += 1;
        hRow.points += 3;
      } else if (homeOutcome === 'E') {
        hRow.draws += 1;
        hRow.points += 1;
      } else {
        hRow.losses += 1;
      }
    }

    // Se venueMode for ALL ou AWAY -> soma no visitante
    if (venueMode === 'ALL' || venueMode === 'AWAY') {
      aRow.played += 1;
      aRow.goalsFor += aScore;
      aRow.goalsAgainst += hScore;
      if (awayOutcome === 'V') {
        aRow.wins += 1;
        aRow.points += 3;
      } else if (awayOutcome === 'E') {
        aRow.draws += 1;
        aRow.points += 1;
      } else {
        aRow.losses += 1;
      }
    }
  });

  // Finalizar cálculos adicionais por time
  const rowsList: DynamicStandingRow[] = [];

  Object.values(teamRowsMap).forEach(row => {
    if (row.played === 0 && selectedLeagueId === 'ALL') return;

    row.goalDifference = row.goalsFor - row.goalsAgainst;
    const maxPossible = row.played * 3;
    row.pointsPercentage = maxPossible > 0 ? (row.points / maxPossible) * 100 : 0;
    
    // Aproveitamento em casa e fora
    row.homeRecord.gd = row.homeRecord.gf - row.homeRecord.ga;
    row.homeRecord.pct = row.homeRecord.played > 0 ? (row.homeRecord.pts / (row.homeRecord.played * 3)) * 100 : 0;
    
    row.awayRecord.gd = row.awayRecord.gf - row.awayRecord.ga;
    row.awayRecord.pct = row.awayRecord.played > 0 ? (row.awayRecord.pts / (row.awayRecord.played * 3)) * 100 : 0;

    row.homeDominanceFactor = row.homeRecord.pct - row.awayRecord.pct;

    // Forma Recente (últimos 5 jogos no contexto escolhido)
    const history = teamFormHistory[row.teamId] || [];
    const filteredHistory = venueMode === 'ALL'
      ? history
      : venueMode === 'HOME'
      ? history.filter(h => h.isHome)
      : history.filter(h => !h.isHome);

    row.recentForm = filteredHistory.slice(-5);

    // Métricas de Volatilidade de Gols da equipe
    const teamGames = (teamMatchesList[row.teamId] || []).filter(m => {
      if (venueMode === 'HOME') return m.homeTeamId === row.teamId;
      if (venueMode === 'AWAY') return m.awayTeamId === row.teamId;
      return true;
    });

    const totalGames = teamGames.length;
    if (totalGames > 0) {
      let over15 = 0;
      let over25 = 0;
      let over35 = 0;
      let over05HT = 0;
      let over15HT = 0;
      let btts = 0;
      let cs = 0;
      let fts = 0;

      teamGames.forEach(m => {
        const isH = m.homeTeamId === row.teamId;
        const myScore = isH ? (m.homeScore ?? 0) : (m.awayScore ?? 0);
        const oppScore = isH ? (m.awayScore ?? 0) : (m.homeScore ?? 0);
        const totalFT = myScore + oppScore;

        const myHT = isH ? (m.stats?.halftimeHomeScore ?? 0) : (m.stats?.halftimeAwayScore ?? 0);
        const oppHT = isH ? (m.stats?.halftimeAwayScore ?? 0) : (m.stats?.halftimeHomeScore ?? 0);
        const totalHT = myHT + oppHT;

        if (totalFT > 1.5) over15++;
        if (totalFT > 2.5) over25++;
        if (totalFT > 3.5) over35++;
        if (totalHT > 0.5) over05HT++;
        if (totalHT > 1.5) over15HT++;
        if (myScore > 0 && oppScore > 0) btts++;
        if (oppScore === 0) cs++;
        if (myScore === 0) fts++;
      });

      row.over15Pct = (over15 / totalGames) * 100;
      row.over25Pct = (over25 / totalGames) * 100;
      row.over35Pct = (over35 / totalGames) * 100;
      row.over05HTPct = (over05HT / totalGames) * 100;
      row.over15HTPct = (over15HT / totalGames) * 100;
      row.bttsPct = (btts / totalGames) * 100;
      row.cleanSheets = cs;
      row.cleanSheetPct = (cs / totalGames) * 100;
      row.failedToScore = fts;
      row.failedToScorePct = (fts / totalGames) * 100;
    }

    row.xGoalDifference = row.xGoalsFor - row.xGoalsAgainst;
    row.xPointsDiff = row.points - row.xPoints;

    rowsList.push(row);
  });

  // Identificar grupos empatados em pontos para calcular confronto direto se o regulamento exigir
  const pointsGroups: Record<number, string[]> = {};
  rowsList.forEach(r => {
    if (!pointsGroups[r.points]) pointsGroups[r.points] = [];
    pointsGroups[r.points].push(r.teamId);
  });

  const h2hMatrices: Record<number, Record<string, { points: number; goalDiff: number; goalsFor: number; awayGoalsFor: number; wins: number }>> = {};
  Object.entries(pointsGroups).forEach(([ptsStr, teamIds]) => {
    if (teamIds.length > 1) {
      h2hMatrices[Number(ptsStr)] = calculateHeadToHeadMatrix(teamIds, leagueFinishedMatches);
    }
  });

  // ORDENAÇÃO SEGUNDO O MOTOR REGULAMENTAR (AUTOMATION ENGINE)
  rowsList.sort((a, b) => {
    // 1º PONTOS GANHOS (Sempre 1º critério em qualquer liga de pontos corridos)
    if (b.points !== a.points) {
      return b.points - a.points;
    }

    const tiedPts = a.points;
    const h2h = h2hMatrices[tiedPts];
    const h2hA = h2h ? h2h[a.teamId] : null;
    const h2hB = h2h ? h2h[b.teamId] : null;

    // RAMIFICAÇÃO PELO MODELO REGULAMENTAR:
    
    // MODELO B: Ligas por Confronto Direto (La Liga, Serie A, Liga Portugal, Süper Lig)
    if (regulation.tiebreakerModel === 'HEAD_TO_HEAD' && h2hA && h2hB) {
      // 2º Pontos no Confronto Direto entre os empatados
      if (h2hB.points !== h2hA.points) {
        return h2hB.points - h2hA.points;
      }
      // 3º Saldo de Gols no Confronto Direto
      if (h2hB.goalDiff !== h2hA.goalDiff) {
        return h2hB.goalDiff - h2hA.goalDiff;
      }
      // 4º Saldo de Gols Geral
      if (b.goalDifference !== a.goalDifference) {
        return b.goalDifference - a.goalDifference;
      }
      // 5º Gols Marcados Geral
      if (b.goalsFor !== a.goalsFor) {
        return b.goalsFor - a.goalsFor;
      }
      // 6º Número de Vitórias
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }
    }

    // MODELO C: Ligas por Número de Vitórias (Jupiler Pro League BEL, Brasileirão)
    if (regulation.tiebreakerModel === 'WINS_FIRST') {
      // 2º Número de Vitórias
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }
      // 3º Saldo de Gols Geral
      if (b.goalDifference !== a.goalDifference) {
        return b.goalDifference - a.goalDifference;
      }
      // 4º Gols Marcados Geral
      if (b.goalsFor !== a.goalsFor) {
        return b.goalsFor - a.goalsFor;
      }
      // 5º Confronto Direto
      if (h2hA && h2hB && h2hB.points !== h2hA.points) {
        return h2hB.points - h2hA.points;
      }
    }

    // MODELO A: Ligas por Saldo de Gols Geral (Premier League, Bundesliga, Championship, Ligue 1, Eredivisie, Escócia)
    // 2º Saldo de Gols Geral
    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }
    // 3º Gols Marcados Geral (Gols Pró)
    if (b.goalsFor !== a.goalsFor) {
      return b.goalsFor - a.goalsFor;
    }
    // 4º Confronto Direto (Pontos -> Saldo -> Gols Fora)
    if (h2hA && h2hB) {
      if (h2hB.points !== h2hA.points) return h2hB.points - h2hA.points;
      if (h2hB.goalDiff !== h2hA.goalDiff) return h2hB.goalDiff - h2hA.goalDiff;
      if (h2hB.awayGoalsFor !== h2hA.awayGoalsFor) return h2hB.awayGoalsFor - h2hA.awayGoalsFor;
    }
    // 5º Número de Vitórias
    if (b.wins !== a.wins) {
      return b.wins - a.wins;
    }
    // 6º Ordem Alfabética
    return a.teamName.localeCompare(b.teamName, 'pt-BR', { sensitivity: 'base' });
  });

  // Atribuir Posição Oficial e Zonas da Competição
  const totalTeams = rowsList.length;
  rowsList.forEach((row, index) => {
    const pos = index + 1;
    row.position = pos;

    // Encontrar zona aplicável
    for (const zone of regulation.zones) {
      const min = zone.minPos;
      // Tratar rebaixamento dinâmico se a liga tiver menos ou mais times
      let max = zone.maxPos;
      let effectiveMin = min;

      if (zone.type === 'RELEGATION_DIRECT' || zone.type === 'RELEGATION_PLAYOUT') {
        // Se minPos for relativo ao fim (ex: 18 a 20 quando há 20 times)
        const diffFromEndMin = 20 - min; // ex 20-18 = 2 times antes do fim
        const diffFromEndMax = 20 - max; // ex 20-20 = 0
        if (totalTeams > 6 && min > 6) {
          effectiveMin = Math.max(1, totalTeams - diffFromEndMin);
          max = Math.max(effectiveMin, totalTeams - diffFromEndMax);
        }
      }

      if (pos >= effectiveMin && pos <= max) {
        row.zone = zone;
        break;
      }
    }
  });

  // Ranking na Tabela Esperada de Pontos (xP Table)
  const sortedByXP = [...rowsList].sort((a, b) => b.xPoints - a.xPoints);
  sortedByXP.forEach((row, idx) => {
    const matching = rowsList.find(r => r.teamId === row.teamId);
    if (matching) {
      matching.xPointsRank = idx + 1;
    }
  });

  // MÉTRICAS GLOBAIS DA LIGA (Volatilidade & Tendência)
  let totalGoals = 0;
  let totalHTGoals = 0;
  let o15 = 0;
  let o25 = 0;
  let o35 = 0;
  let o05HT = 0;
  let o15HT = 0;
  let bttsCount = 0;
  let hwCount = 0;
  let dCount = 0;
  let awCount = 0;
  let hGoals = 0;
  let aGoals = 0;

  leagueFinishedMatches.forEach(m => {
    const h = m.homeScore ?? 0;
    const a = m.awayScore ?? 0;
    const tot = h + a;
    const htH = m.stats?.halftimeHomeScore ?? 0;
    const htA = m.stats?.halftimeAwayScore ?? 0;
    const htTot = htH + htA;

    totalGoals += tot;
    totalHTGoals += htTot;
    hGoals += h;
    aGoals += a;

    if (tot > 1.5) o15++;
    if (tot > 2.5) o25++;
    if (tot > 3.5) o35++;
    if (htTot > 0.5) o05HT++;
    if (htTot > 1.5) o15HT++;
    if (h > 0 && a > 0) bttsCount++;

    if (h > a) hwCount++;
    else if (h === a) dCount++;
    else awCount++;
  });

  const n = leagueFinishedMatches.length;
  const leagueMetrics: LeagueOverallMetrics = {
    totalMatchesFinished: n,
    totalGoals,
    avgGoalsPerMatch: n > 0 ? totalGoals / n : 0,
    avgGoalsHT: n > 0 ? totalHTGoals / n : 0,
    over15Pct: n > 0 ? (o15 / n) * 100 : 0,
    over25Pct: n > 0 ? (o25 / n) * 100 : 0,
    over35Pct: n > 0 ? (o35 / n) * 100 : 0,
    over05HTPct: n > 0 ? (o05HT / n) * 100 : 0,
    over15HTPct: n > 0 ? (o15HT / n) * 100 : 0,
    bttsPct: n > 0 ? (bttsCount / n) * 100 : 0,
    homeWinPct: n > 0 ? (hwCount / n) * 100 : 0,
    drawPct: n > 0 ? (dCount / n) * 100 : 0,
    awayWinPct: n > 0 ? (awCount / n) * 100 : 0,
    homeGoalsAvg: n > 0 ? hGoals / n : 0,
    awayGoalsAvg: n > 0 ? aGoals / n : 0,
    homeAdvantageIndex: n > 0 ? ((hwCount - awCount) / n) * 100 : 0,
  };

  // ESTATÍSTICAS DE ÁRBITROS DA LIGA
  const refereeMap: Record<string, { matches: number; yellows: number; reds: number; fouls: number; hw: number; d: number; aw: number }> = {};

  leagueFinishedMatches.forEach(m => {
    const refName = m.referee?.trim();
    if (!refName) return;

    if (!refereeMap[refName]) {
      refereeMap[refName] = { matches: 0, yellows: 0, reds: 0, fouls: 0, hw: 0, d: 0, aw: 0 };
    }

    const r = refereeMap[refName];
    r.matches += 1;
    
    const yHome = m.stats?.yellowCardsHomeFT ?? 0;
    const yAway = m.stats?.yellowCardsAwayFT ?? 0;
    const rHome = m.stats?.redCardsHomeFT ?? 0;
    const rAway = m.stats?.redCardsAwayFT ?? 0;
    const fHome = m.stats?.foulsHomeFT ?? 0;
    const fAway = m.stats?.foulsAwayFT ?? 0;

    r.yellows += (yHome + yAway);
    r.reds += (rHome + rAway);
    r.fouls += (fHome + fAway);

    const hScore = m.homeScore ?? 0;
    const aScore = m.awayScore ?? 0;
    if (hScore > aScore) r.hw++;
    else if (hScore === aScore) r.d++;
    else r.aw++;
  });

  const refereeStats: RefereeStat[] = Object.entries(refereeMap)
    .map(([name, data]) => {
      const yellowAvg = data.matches > 0 ? data.yellows / data.matches : 0;
      const redAvg = data.matches > 0 ? data.reds / data.matches : 0;
      const foulsAvg = data.matches > 0 ? data.fouls / data.matches : 0;
      const cardPts = yellowAvg * 1 + redAvg * 3;

      let rigor: 'Alto Rigor' | 'Equilibrado' | 'Brando' = 'Equilibrado';
      if (cardPts > 5 || foulsAvg > 26) rigor = 'Alto Rigor';
      else if (cardPts < 3.2 && foulsAvg < 20) rigor = 'Brando';

      return {
        name,
        matchesCount: data.matches,
        yellowCardsTotal: data.yellows,
        yellowCardsAvg: yellowAvg,
        redCardsTotal: data.reds,
        redCardsAvg: redAvg,
        foulsTotal: data.fouls,
        foulsAvg,
        homeWins: data.hw,
        draws: data.d,
        awayWins: data.aw,
        homeWinPct: data.matches > 0 ? (data.hw / data.matches) * 100 : 0,
        drawPct: data.matches > 0 ? (data.d / data.matches) * 100 : 0,
        awayWinPct: data.matches > 0 ? (data.aw / data.matches) * 100 : 0,
        rigorLevel: rigor,
      };
    })
    .sort((a, b) => b.matchesCount - a.matchesCount);

  return {
    rows: rowsList,
    regulation,
    leagueMetrics,
    refereeStats,
  };
}

// Calcula Projeção e Distância para Objetivos ao comparar Mandante vs Visitante
export function calculateMatchContextProjection(
  rows: DynamicStandingRow[],
  homeTeamId: string,
  awayTeamId: string,
  regulation: CompetitionRegulation
): MatchContextProjection | null {
  const homeRow = rows.find(r => r.teamId === homeTeamId);
  const awayRow = rows.find(r => r.teamId === awayTeamId);
  if (!homeRow || !awayRow || rows.length === 0) return null;

  const leader = rows[0];

  // Encontrar linha de corte de vaga continental/acesso
  const topZoneRule = regulation.zones.find(z => z.type === 'CHAMPIONS_DIRECT' || z.type === 'PROMOTION_DIRECT');
  const topZoneMaxPos = topZoneRule ? topZoneRule.maxPos : 4;
  const topZoneCutRow = rows[Math.min(rows.length - 1, topZoneMaxPos - 1)] || leader;

  // Encontrar linha de rebaixamento
  const relRule = regulation.zones.find(z => z.type === 'RELEGATION_DIRECT');
  const relMinPos = relRule ? Math.min(rows.length, relRule.minPos) : rows.length - 2;
  const relCutRow = rows[Math.max(0, relMinPos - 1)] || rows[rows.length - 1];

  return {
    homeTeam: homeRow,
    awayTeam: awayRow,
    leader,
    distanceHomeToLeader: leader.points - homeRow.points,
    distanceAwayToLeader: leader.points - awayRow.points,
    distanceHomeToTopZone: homeRow.position <= topZoneMaxPos ? 0 : topZoneCutRow.points - homeRow.points,
    distanceAwayToTopZone: awayRow.position <= topZoneMaxPos ? 0 : topZoneCutRow.points - awayRow.points,
    distanceHomeToRelegation: homeRow.points - relCutRow.points,
    distanceAwayToRelegation: awayRow.points - relCutRow.points,
    homeWinOutcome: {
      homeProjectedPoints: homeRow.points + 3,
      awayProjectedPoints: awayRow.points,
    },
    drawOutcome: {
      homeProjectedPoints: homeRow.points + 1,
      awayProjectedPoints: awayRow.points + 1,
    },
    awayWinOutcome: {
      homeProjectedPoints: homeRow.points,
      awayProjectedPoints: awayRow.points + 3,
    }
  };
}
