import { MatchPressureData, PressureInterval, PressureTimelinePoint, PressureEvent } from '../types';

/**
 * Parses raw CSV / TSV / Semicolon-delimited text containing 5-minute pressure data.
 * Format example:
 * Intervalo,Pressão Mandante,Pressão Visitante,Índice Líquido,Time Dominante,Evento / Contexto Destacado
 * 01' - 05',25,10,+15,FUR,Estudo de jogo / leve iniciativa do FUR
 * 06' - 10',15,15,0,Equilibrado,Jogo truncado no meio-campo
 * ...
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
      lowerLine.includes('time dominante')
    ) {
      continue;
    }

    // Split by comma, tab, semicolon or pipe (handling CSV quotes if any)
    let parts: string[] = [];
    if (line.includes('\t')) {
      parts = line.split('\t');
    } else if (line.includes(';') && !line.includes(',')) {
      parts = line.split(';');
    } else {
      // Split by comma handling potential quotes
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

    let dominantTeamStr = parts[4] || (netIndex > 0 ? homeTeamName : netIndex < 0 ? awayTeamName : 'Equilibrado');
    const contextHighlight = parts.slice(5).join(', ') || parts[5] || '';

    // Standardize dominant team
    let dominantTeam: 'home' | 'away' | 'balanced' | string = dominantTeamStr;
    const domLower = dominantTeamStr.toLowerCase();
    if (domLower.includes('equilibrado') || domLower.includes('empate') || domLower === '0' || netIndex === 0) {
      dominantTeam = 'balanced';
    } else if (domLower.includes('home') || domLower.includes('mandante') || netIndex > 0) {
      dominantTeam = 'home';
    } else if (domLower.includes('away') || domLower.includes('visitante') || netIndex < 0) {
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
      dominantTeam: dominantTeamStr || (dominantTeam === 'home' ? homeTeamName : dominantTeam === 'away' ? awayTeamName : 'Equilibrado'),
      contextHighlight: contextHighlight.trim(),
      homeAvg: homeVal,
      awayAvg: awayVal,
      homeAttackingVolume: homeVal,
      awayAttackingVolume: awayVal,
    });

    // Parse start and end minutes from interval (e.g., "01' - 05'", "45'+", "86' - 90'+")
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

    // Check for events in the context text (e.g. goals, cards)
    if (contextHighlight) {
      const isGoal = /gol|goal|⚽/i.test(contextHighlight) && !/anulado|var|impedimento/i.test(contextHighlight);
      const isRed = /vermelho|red card|expuls/i.test(contextHighlight);
      const isYellow = /amarelo|yellow card/i.test(contextHighlight);

      // Try to find explicit minute like (~27') or (27')
      const explicitMinMatch = contextHighlight.match(/\(?~?(\d+)'?\)?/);
      let eventMin = Math.round((startMin + endMin) / 2);
      if (explicitMinMatch && explicitMinMatch[1]) {
        const parsedMin = parseInt(explicitMinMatch[1], 10);
        if (parsedMin >= 1 && parsedMin <= 120) {
          eventMin = parsedMin;
        }
      }

      if (isGoal) {
        // Check which team scored
        let goalTeam: 'home' | 'away' = netIndex >= 0 ? 'home' : 'away';
        const ctxLower = contextHighlight.toLowerCase();
        if (ctxLower.includes('nur') || ctxLower.includes('visitante') || ctxLower.includes(awayTeamName.toLowerCase())) {
          goalTeam = 'away';
        } else if (ctxLower.includes('fur') || ctxLower.includes('mandante') || ctxLower.includes(homeTeamName.toLowerCase())) {
          goalTeam = 'home';
        }

        events.push({
          minute: eventMin,
          type: 'goal',
          team: goalTeam,
          description: contextHighlight,
        });
      } else if (isRed) {
        const redTeam: 'home' | 'away' = netIndex >= 0 ? 'home' : 'away';
        events.push({
          minute: eventMin,
          type: 'red_card',
          team: redTeam,
          description: contextHighlight,
        });
      }
    }

    // Build timeline points for each minute in the interval
    for (let m = startMin; m <= endMin; m++) {
      let eventType: PressureTimelinePoint['event'] = 'none';
      const eventAtMin = events.find(e => e.minute === m);
      if (eventAtMin) {
        if (eventAtMin.type === 'goal') eventType = eventAtMin.team === 'home' ? 'goal_home' : 'goal_away';
        else if (eventAtMin.type === 'red_card') eventType = eventAtMin.team === 'home' ? 'red_home' : 'red_away';
      }

      timeline.push({
        minute: m,
        value: netIndex,
        team: netIndex > 0 ? 'home' : netIndex < 0 ? 'away' : 'neutral',
        isPeak: Math.abs(netIndex) >= 60 || homeVal >= 75 || awayVal >= 75,
        event: eventType,
        eventDescription: contextHighlight || undefined,
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

  const result: MatchPressureData = {
    timeline,
    homeDominancePct,
    awayDominancePct,
    homePeakCount,
    awayPeakCount,
    intervals,
    events,
    extractedTeams: {
      homeName: homeTeamName,
      awayName: awayTeamName,
    },
    totalMinutes: timeline.length > 0 ? timeline[timeline.length - 1].minute : 90,
    tacticalSummary: `Análise estruturada de ${intervals.length} blocos com Índice Líquido: ${homeTeamName} (${homeDominancePct}%) vs ${awayTeamName} (${awayDominancePct}%).`,
    rawCsvText: text,
    importedAt: new Date().toISOString(),
  };

  return result;
}
