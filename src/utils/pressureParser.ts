import { MatchPressureData, PressureInterval, PressureTimelinePoint, PressureEvent } from '../types';

/**
 * Helper to determine team from text context or codes.
 */
function detectTeam(
  text: string,
  homeTeamName: string,
  awayTeamName: string,
  homeCode?: string,
  awayCode?: string,
  defaultTeam: 'home' | 'away' = 'home'
): 'home' | 'away' {
  const clean = (s: string) =>
    s ? s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() : '';

  const target = clean(text);
  const hCode = clean(homeCode || homeTeamName.substring(0, 3));
  const aCode = clean(awayCode || awayTeamName.substring(0, 3));
  const hName = clean(homeTeamName);
  const aName = clean(awayTeamName);

  // Exact code checks
  if (hCode && target.includes(hCode)) return 'home';
  if (aCode && target.includes(aCode)) return 'away';
  if (hName && target.includes(hName)) return 'home';
  if (aName && target.includes(aName)) return 'away';

  // Check word tokens in team names (e.g., "Hertha", "Heidenheim", "Greuther", "Nürnberg")
  const hTokens = hName.split(/[\s\-_]+/).filter((t) => t.length >= 3);
  const aTokens = aName.split(/[\s\-_]+/).filter((t) => t.length >= 3);

  for (const t of hTokens) {
    if (target.includes(t)) return 'home';
  }
  for (const t of aTokens) {
    if (target.includes(t)) return 'away';
  }

  if (target.includes('mandante') || target.includes('casa') || target.includes('home')) {
    return 'home';
  }
  if (target.includes('visitante') || target.includes('fora') || target.includes('away')) {
    return 'away';
  }

  return defaultTeam;
}

/**
 * Helper to determine minute from text or fallback to interval midpoint.
 */
function parseMinuteFromSnippet(text: string, fallback: number): number {
  if (!text) return fallback;
  // Match patterns like (~45'+), (45+2'), (~4'), 45', ~45'
  const parensMatch = text.match(/\((?:~|\s)*(\d+)(?:\s*\+\s*(\d+))?[^)]*\)/);
  if (parensMatch) {
    const base = parseInt(parensMatch[1], 10);
    const extra = parensMatch[2] ? parseInt(parensMatch[2], 10) : 0;
    const total = base + extra;
    if (total >= 1 && total <= 135) return total;
  }
  const minMatch = text.match(/(?:~|\s|^)(\d+)(?:\s*\+\s*(\d+))?'/);
  if (minMatch) {
    const base = parseInt(minMatch[1], 10);
    const extra = minMatch[2] ? parseInt(minMatch[2], 10) : 0;
    const total = base + extra;
    if (total >= 1 && total <= 135) return total;
  }
  const genericNumber = text.match(/\d+/);
  if (genericNumber) {
    const n = parseInt(genericNumber[0], 10);
    if (n >= 1 && n <= 135) return n;
  }
  return fallback;
}

/**
 * Extracts all items matching sub-events (corners, cards, goals) with their minute and team.
 */
function extractSubEvents(
  rawText: string,
  startMin: number,
  endMin: number,
  homeTeamName: string,
  awayTeamName: string,
  homeCode?: string,
  awayCode?: string
): PressureEvent[] {
  if (!rawText || rawText === '-' || rawText === '–') return [];

  const foundEvents: PressureEvent[] = [];
  const defaultMin = Math.round((startMin + endMin) / 2);

  // 1. Match Goals
  // e.g.: ⚽ GOL do Hertha Berlin (~4') or GOL do Heidenheim (~45'+) nos acréscimos
  const goalRegex = /(?:⚽\s*|(?:\b|^)(?:gol(?:\s+do|\s+da|\s+de)?|goal)\s+)([^🚩🟨🟥⚽;\n\r]+)/gi;
  let match: RegExpExecArray | null;

  while ((match = goalRegex.exec(rawText)) !== null) {
    const snippet = match[0];
    const details = match[1] || '';
    if (/anulado|var|impedimento|irregular/i.test(snippet)) {
      continue;
    }
    const minute = parseMinuteFromSnippet(details, defaultMin);
    const cleanTeamSnippet = details
      .replace(/\(.*?\)/g, '')
      .replace(/nos acr[eé]scimos|acr[eé]scimos|contra|p[eê]nalti|de cabe[cç]a/gi, '')
      .trim();

    const team = detectTeam(cleanTeamSnippet || details, homeTeamName, awayTeamName, homeCode, awayCode, 'home');
    foundEvents.push({
      minute,
      type: 'goal',
      team,
      description: snippet.trim(),
    });
  }

  // 2. Match Red Cards
  // e.g.: 🟥 Cartão Vermelho Hertha (~88') or Cartão Vermelho Hertha
  const redRegex = /(?:🟥\s*|(?:\b|^)(?:cart[aã]o\s+vermelho|vermelho|red\s+card|expuls[aã]o)\s*)([^🚩🟨🟥⚽;\n\r]+)/gi;
  while ((match = redRegex.exec(rawText)) !== null) {
    const snippet = match[0];
    const details = match[1] || '';
    const minute = parseMinuteFromSnippet(details, defaultMin);
    const cleanTeamSnippet = details
      .replace(/\(.*?\)/g, '')
      .replace(/nos acr[eé]scimos|acr[eé]scimos/gi, '')
      .trim();

    const team = detectTeam(cleanTeamSnippet || details, homeTeamName, awayTeamName, homeCode, awayCode, 'away');
    foundEvents.push({
      minute,
      type: 'red_card',
      cardType: 'red',
      team,
      description: snippet.trim(),
    });
  }

  // 3. Match Yellow Cards
  // e.g.: 🟨 Cartão Amarelo Heidenheim (~36') or Cartão Amarelo Heidenheim
  const yellowRegex = /(?:🟨\s*|(?:\b|^)(?:cart[aã]o\s+amarelo|amarelo|yellow\s+card)\s*)([^🚩🟨🟥⚽;\n\r]+)/gi;
  while ((match = yellowRegex.exec(rawText)) !== null) {
    const snippet = match[0];
    const details = match[1] || '';
    const minute = parseMinuteFromSnippet(details, defaultMin);
    const cleanTeamSnippet = details
      .replace(/\(.*?\)/g, '')
      .replace(/nos acr[eé]scimos|acr[eé]scimos/gi, '')
      .trim();

    const team = detectTeam(cleanTeamSnippet || details, homeTeamName, awayTeamName, homeCode, awayCode, 'away');
    foundEvents.push({
      minute,
      type: 'card',
      cardType: 'yellow',
      team,
      description: snippet.trim(),
    });
  }

  // 4. Match Corners
  // e.g.: 🚩 Escanteio Hertha (~9') or Escanteio Heidenheim (~59')
  const cornerRegex = /(?:🚩\s*|(?:\b|^)(?:escanteio|canto|corner)\s*)([^🚩🟨🟥⚽;\n\r]+)/gi;
  while ((match = cornerRegex.exec(rawText)) !== null) {
    const snippet = match[0];
    const details = match[1] || '';
    const minute = parseMinuteFromSnippet(details, defaultMin);
    const cleanTeamSnippet = details
      .replace(/\(.*?\)/g, '')
      .replace(/nos acr[eé]scimos|acr[eé]scimos/gi, '')
      .trim();

    const team = detectTeam(cleanTeamSnippet || details, homeTeamName, awayTeamName, homeCode, awayCode, 'home');
    foundEvents.push({
      minute,
      type: 'corner',
      team,
      description: snippet.trim(),
    });
  }

  return foundEvents;
}

/**
 * Parses raw CSV / TSV / Semicolon-delimited text containing 5-minute pressure data,
 * supporting both the 6-column format and the 7-column format with Escanteios & Cartões + Gols & Destaques.
 */
export function parsePressureCsvText(
  text: string,
  homeTeamName: string = 'Mandante',
  awayTeamName: string = 'Visitante'
): MatchPressureData {
  if (!text || !text.trim()) {
    throw new Error('O texto com os dados de pressão está vazio.');
  }

  const rawLines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (rawLines.length === 0) {
    throw new Error('Nenhuma linha de dados encontrada.');
  }

  const intervals: PressureInterval[] = [];
  const events: PressureEvent[] = [];
  const timeline: PressureTimelinePoint[] = [];

  let totalHomePressure = 0;
  let totalAwayPressure = 0;
  let homePeakCount = 0;
  let awayPeakCount = 0;

  // Extracted codes from header or names
  let homeCode = homeTeamName.substring(0, 3).toUpperCase();
  let awayCode = awayTeamName.substring(0, 3).toUpperCase();

  // Try to detect codes / team names from first header line if available
  const headerLine = rawLines.find(l => {
    const low = l.toLowerCase();
    return low.includes('pressão') || low.includes('pressao') || low.includes('intervalo');
  });

  if (headerLine) {
    const codeMatches = Array.from(headerLine.matchAll(/press[aã]o\s+([A-Za-zÀ-ÿ0-9_\-\s]+?)(?:\s*\(|\s*,|\s*;|\s*\t|$)/gi));
    if (codeMatches && codeMatches.length >= 2) {
      const c1 = codeMatches[0][1].trim().toUpperCase();
      const c2 = codeMatches[1][1].trim().toUpperCase();
      if (c1) homeCode = c1;
      if (c2) awayCode = c2;
    }
  }

  for (let lineIndex = 0; lineIndex < rawLines.length; lineIndex++) {
    const line = rawLines[lineIndex];

    // Check if header line
    const lowerLine = line.toLowerCase();
    if (
      lowerLine.includes('intervalo') ||
      lowerLine.includes('pressao') ||
      lowerLine.includes('pressão') ||
      lowerLine.includes('indice') ||
      lowerLine.includes('índice') ||
      lowerLine.includes('dominância') ||
      lowerLine.includes('dominancia') ||
      lowerLine.includes('time dominante')
    ) {
      continue;
    }

    // Split by comma, tab, semicolon handling potential quotes
    let parts: string[] = [];
    if (line.includes('\t')) {
      parts = line.split('\t');
    } else if (line.includes(';') && !line.includes(',')) {
      parts = line.split(';');
    } else {
      parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    }

    parts = parts.map(p => p.trim().replace(/^["']|["']$/g, ''));
    if (parts.length < 3) continue;

    const intervalStr = parts[0] || `Bloco ${intervals.length + 1}`;
    const homeVal = parseFloat(parts[1]?.replace(/[^\d.-]/g, '') || '0') || 0;
    const awayVal = parseFloat(parts[2]?.replace(/[^\d.-]/g, '') || '0') || 0;

    let netIndex = 0;
    if (parts.length >= 4 && parts[3] !== '') {
      netIndex = parseFloat(parts[3].replace(/[^\d.+-]/g, '') || String(homeVal - awayVal));
      if (isNaN(netIndex)) netIndex = homeVal - awayVal;
    } else {
      netIndex = homeVal - awayVal;
    }

    const dominantTeamStr = parts[4] || (netIndex > 0 ? homeCode : netIndex < 0 ? awayCode : 'Equilibrado');

    // Check columns 5 and 6
    // If 7 columns: col 5 is "Escanteios & Cartões", col 6 is "Gols & Destaques"
    // If 6 columns: col 5 is "Evento / Contexto Destacado"
    let cornersAndCards = '';
    let goalsAndHighlights = '';
    let combinedContext = '';

    if (parts.length >= 7) {
      cornersAndCards = parts[5] || '';
      goalsAndHighlights = parts.slice(6).join(', ') || parts[6] || '';
      combinedContext = [cornersAndCards !== '-' ? cornersAndCards : '', goalsAndHighlights].filter(Boolean).join(' • ');
    } else if (parts.length === 6) {
      combinedContext = parts[5] || '';
      // Check if parts[5] has corners/cards vs goals
      if (/🚩|escanteio|🟨|amarelo|🟥|vermelho/i.test(parts[5])) {
        cornersAndCards = parts[5];
      }
      if (/⚽|gol|anulado/i.test(parts[5]) || !cornersAndCards) {
        goalsAndHighlights = parts[5];
      }
    }

    // Standardize dominant team
    let dominantTeam: 'home' | 'away' | 'balanced' | string = dominantTeamStr;
    const domLower = dominantTeamStr.toLowerCase();
    if (domLower.includes('equilibrado') || domLower.includes('empate') || domLower === '0' || netIndex === 0) {
      dominantTeam = 'balanced';
    } else if (domLower.includes('home') || domLower.includes('mandante') || domLower.includes(homeCode.toLowerCase()) || netIndex > 0) {
      dominantTeam = 'home';
    } else if (domLower.includes('away') || domLower.includes('visitante') || domLower.includes(awayCode.toLowerCase()) || netIndex < 0) {
      dominantTeam = 'away';
    }

    if (homeVal >= 70) homePeakCount++;
    if (awayVal >= 70) awayPeakCount++;

    totalHomePressure += homeVal;
    totalAwayPressure += awayVal;

    intervals.push({
      interval: intervalStr,
      homePressure: homeVal,
      awayPressure: awayVal,
      netIndex,
      dominantTeam: dominantTeamStr || (dominantTeam === 'home' ? homeCode : dominantTeam === 'away' ? awayCode : 'Equilibrado'),
      contextHighlight: combinedContext.trim() || undefined,
      cornersAndCards: cornersAndCards && cornersAndCards !== '-' ? cornersAndCards.trim() : undefined,
      goalsAndHighlights: goalsAndHighlights && goalsAndHighlights !== '-' ? goalsAndHighlights.trim() : undefined,
      homeAttackingVolume: homeVal,
      awayAttackingVolume: awayVal,
    });

    // Parse start and end minutes from interval (e.g., "01' - 05'", "45'+ (HT)", "86' - 90'+")
    const minuteMatches = intervalStr.match(/\d+/g);
    let startMin = 1;
    let endMin = 5;
    if (minuteMatches && minuteMatches.length >= 2) {
      startMin = parseInt(minuteMatches[0], 10);
      endMin = parseInt(minuteMatches[1], 10);
    } else if (minuteMatches && minuteMatches.length === 1) {
      startMin = parseInt(minuteMatches[0], 10);
      endMin = startMin + 4;
    } else {
      startMin = intervals.length * 5 - 4;
      endMin = intervals.length * 5;
    }

    // Extract sub-events (Corners, Yellow/Red cards, Goals)
    let lineEvents: PressureEvent[] = [];
    if (parts.length >= 7) {
      const extractedCornersCards = extractSubEvents(cornersAndCards, startMin, endMin, homeTeamName, awayTeamName, homeCode, awayCode);
      const extractedGoals = extractSubEvents(goalsAndHighlights, startMin, endMin, homeTeamName, awayTeamName, homeCode, awayCode);
      lineEvents = [...extractedCornersCards, ...extractedGoals];
    } else {
      lineEvents = extractSubEvents(combinedContext, startMin, endMin, homeTeamName, awayTeamName, homeCode, awayCode);
    }

    events.push(...lineEvents);

    // Build timeline points for each minute in the interval
    for (let m = startMin; m <= endMin; m++) {
      let eventType: PressureTimelinePoint['event'] = 'none';
      const eventAtMin = lineEvents.find(e => e.minute === m);
      if (eventAtMin) {
        if (eventAtMin.type === 'goal') {
          eventType = eventAtMin.team === 'home' ? 'goal_home' : 'goal_away';
        } else if (eventAtMin.type === 'red_card') {
          eventType = eventAtMin.team === 'home' ? 'red_home' : 'red_away';
        } else if (eventAtMin.type === 'card' && eventAtMin.cardType === 'yellow') {
          eventType = eventAtMin.team === 'home' ? 'yellow_home' : 'yellow_away';
        } else if (eventAtMin.type === 'corner') {
          eventType = eventAtMin.team === 'home' ? 'corner_home' : 'corner_away';
        }
      }

      timeline.push({
        minute: m,
        value: netIndex,
        team: netIndex > 0 ? 'home' : netIndex < 0 ? 'away' : 'neutral',
        isPeak: Math.abs(netIndex) >= 60 || homeVal >= 75 || awayVal >= 75,
        event: eventType,
        eventDescription: combinedContext || undefined,
      });
    }
  }

  if (intervals.length === 0) {
    throw new Error('Nenhum intervalo válido pôde ser extraído do texto informado.');
  }

  // Calculate overall dominance percentages
  const grandTotal = totalHomePressure + totalAwayPressure;
  let homeDominancePct = 50;
  let awayDominancePct = 50;
  if (grandTotal > 0) {
    homeDominancePct = Math.round((totalHomePressure / grandTotal) * 100);
    awayDominancePct = 100 - homeDominancePct;
  }

  // Calculate summary for Corners and Cards
  const cornerEvents = events.filter(e => e.type === 'corner');
  const yellowEvents = events.filter(e => e.type === 'card' && e.cardType === 'yellow');
  const redEvents = events.filter(e => e.type === 'red_card');

  const cornersHomeFT = cornerEvents.filter(e => e.team === 'home').length;
  const cornersAwayFT = cornerEvents.filter(e => e.team === 'away').length;
  const cornersHomeHT = cornerEvents.filter(e => e.team === 'home' && e.minute <= 45).length;
  const cornersAwayHT = cornerEvents.filter(e => e.team === 'away' && e.minute <= 45).length;

  const yellowHomeFT = yellowEvents.filter(e => e.team === 'home').length;
  const yellowAwayFT = yellowEvents.filter(e => e.team === 'away').length;
  const yellowHomeHT = yellowEvents.filter(e => e.team === 'home' && e.minute <= 45).length;
  const yellowAwayHT = yellowEvents.filter(e => e.team === 'away' && e.minute <= 45).length;

  const redHomeFT = redEvents.filter(e => e.team === 'home').length;
  const redAwayFT = redEvents.filter(e => e.team === 'away').length;

  // Calculate summary for Goals
  const goalEvents = events.filter(e => e.type === 'goal').sort((a, b) => a.minute - b.minute);
  const homeGoalEvents = goalEvents.filter(e => e.team === 'home');
  const awayGoalEvents = goalEvents.filter(e => e.team === 'away');

  const goalsHomeFT = homeGoalEvents.length;
  const goalsAwayFT = awayGoalEvents.length;
  const goalsHomeHT = homeGoalEvents.filter(e => e.minute <= 45).length;
  const goalsAwayHT = awayGoalEvents.filter(e => e.minute <= 45).length;

  const goalMinutesHome = homeGoalEvents.map(g => `${g.minute}'`);
  const goalMinutesAway = awayGoalEvents.map(g => `${g.minute}'`);

  const firstGoalMinHome = homeGoalEvents.length > 0 ? homeGoalEvents[0].minute : null;
  const firstGoalMinAway = awayGoalEvents.length > 0 ? awayGoalEvents[0].minute : null;
  const firstGoalMinMatch = goalEvents.length > 0 ? goalEvents[0].minute : null;

  const result: MatchPressureData = {
    timeline,
    homeDominancePct,
    awayDominancePct,
    homePeakCount,
    awayPeakCount,
    intervals,
    events,
    cornersSummary: {
      homeFT: cornersHomeFT,
      awayFT: cornersAwayFT,
      homeHT: cornersHomeHT,
      awayHT: cornersAwayHT,
      total: cornersHomeFT + cornersAwayFT,
    },
    cardsSummary: {
      yellowHomeFT,
      yellowAwayFT,
      yellowHomeHT,
      yellowAwayHT,
      redHomeFT,
      redAwayFT,
      total: yellowHomeFT + yellowAwayFT + redHomeFT + redAwayFT,
    },
    goalsSummary: {
      homeFT: goalsHomeFT,
      awayFT: goalsAwayFT,
      homeHT: goalsHomeHT,
      awayHT: goalsAwayHT,
      goalMinutesHome,
      goalMinutesAway,
      firstGoalMinHome,
      firstGoalMinAway,
      firstGoalMinMatch,
    },
    extractedTeams: {
      homeCode,
      awayCode,
      homeName: homeTeamName,
      awayName: awayTeamName,
    },
    totalMinutes: timeline.length > 0 ? timeline[timeline.length - 1].minute : 90,
    tacticalSummary: `Análise de ${intervals.length} blocos com Índice Líquido: ${homeTeamName} (${homeDominancePct}%) vs ${awayTeamName} (${awayDominancePct}%). Escanteios: ${cornersHomeFT}x${cornersAwayFT} | Cartões: ${yellowHomeFT + redHomeFT}x${yellowAwayFT + redAwayFT}.`,
    rawCsvText: text,
    importedAt: new Date().toISOString(),
  };

  return result;
}
