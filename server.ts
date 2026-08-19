import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { syncOnlineFootballData, processMatchRows, importCustomCsvText } from './server/syncEngine';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'football_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface DbData {
  countries: any[];
  leagues: any[];
  teams: any[];
  matches: any[];
}

// Lazy Gemini AI initialization
function getGeminiAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not set. Gemini features will require the API key in settings.');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Initialize empty DB if not present
function loadDb(): DbData {
  if (!fs.existsSync(DB_FILE)) {
    const initialData: DbData = {
      countries: [],
      leagues: [],
      teams: [],
      matches: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading db file:', err);
    return { countries: [], leagues: [], teams: [], matches: [] };
  }
}

function saveDb(data: DbData) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing db file:', err);
  }
}

// API Routes
app.get('/api/db', (req, res) => {
  const db = loadDb();
  res.json(db);
});

app.post('/api/sync/run', async (req, res) => {
  try {
    const currentDb = loadDb();
    const { updatedDb, result } = await syncOnlineFootballData(currentDb);
    saveDb(updatedDb);
    res.json({ success: true, result, db: updatedDb });
  } catch (err: any) {
    console.error('Error running online sync:', err);
    res.status(500).json({ success: false, error: err.message || String(err) });
  }
});

app.post('/api/sync/import-csv', (req, res) => {
  try {
    const { csvText } = req.body;
    if (!csvText || typeof csvText !== 'string' || !csvText.trim()) {
      return res.status(400).json({ success: false, error: 'Nenhum conteúdo CSV foi enviado.' });
    }
    const currentDb = loadDb();
    const { updatedDb, result } = importCustomCsvText(csvText, currentDb);
    saveDb(updatedDb);
    res.json({ success: true, result, db: updatedDb });
  } catch (err: any) {
    console.error('Error importing custom CSV:', err);
    res.status(500).json({ success: false, error: err.message || String(err) });
  }
});

app.get('/api/sync/status', (req, res) => {
  const db = loadDb();
  res.json({
    countries: db.countries.length,
    leagues: db.leagues.length,
    teams: db.teams.length,
    matches: db.matches.length,
  });
});

app.post('/api/db/save', (req, res) => {
  const { countries, leagues, teams, matches } = req.body;
  const newData: DbData = {
    countries: Array.isArray(countries) ? countries : [],
    leagues: Array.isArray(leagues) ? leagues : [],
    teams: Array.isArray(teams) ? teams : [],
    matches: Array.isArray(matches) ? matches : [],
  };
  saveDb(newData);
  res.json({ success: true, data: newData });
});

app.post('/api/db/clear', (req, res) => {
  const emptyData: DbData = {
    countries: [],
    leagues: [],
    teams: [],
    matches: [],
  };
  saveDb(emptyData);
  res.json({ success: true, data: emptyData });
});

// Gemini Vision Endpoint for Football Match Pressure Chart (Termômetro da Partida / Momentum Chart)
app.post('/api/ai/parse-pressure-chart', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/png', homeTeamHint, awayTeamHint } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Nenhuma imagem foi fornecida (imageBase64 obrigatório).' });
    }

    const ai = getGeminiAI();
    if (!ai) {
      return res.status(500).json({
        error: 'Chave GEMINI_API_KEY não configurada no servidor. Configure a chave de API nas configurações.',
      });
    }

    // Clean base64 string if it contains data URI header
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

    const promptText = `
Você é um especialista em análise de dados esportivos e visão computacional de futebol.
Analise com extrema precisão esta imagem que contém um "Gráfico de Pressão" / "Termômetro da Partida" (Match Momentum / Pressure Chart) de futebol.

ESTRUTURA DO GRÁFICO NA IMAGEM:
1. Eixo Horizontal: Representa o tempo de jogo do minuto 1 ao 90+ (com marcações 15', 30', 45' (HT/Intervalo), 60', 75', 90'+).
2. Eixo Vertical / Barras de Pressão:
   - Barras PARA CIMA (geralmente escuras/pretas): Intensidade de ataque e pressão ofensiva do Time MANDANTE (indicado no canto superior esquerdo, ex: FUR). Valores de +1 a +100.
   - Barras PARA BAIXO (geralmente cinzas/claras): Intensidade de ataque e pressão ofensiva do Time VISITANTE (indicado no canto inferior esquerdo, ex: NUR). Valores de -1 a -100 (ou em módulo de intensidade para o visitante).
3. Linhas Tracejadas Horizontais (Superior e Inferior): Indicam o limiar de "Pressão Crítica / Ataque Perigoso Alto" (quando a barra atinge ou ultrapassa a linha tracejada, isPeak = true).
4. Ícones de Bola de Futebol (⚽) com hastes verticais: Indicam o minuto exato e o time que marcou cada GOL:
   - Se a haste/bola está na parte superior (ou apontando para o mandante), foi Gol do Mandante.
   - Se a haste/bola está na parte inferior (ou apontando para o visitante), foi Gol do Visitante.

DADOS ADICIONAIS FORNECIDOS PELO USUÁRIO (se houver):
Mandante sugerido: "${homeTeamHint || ''}"
Visitante sugerido: "${awayTeamHint || ''}"

SUA TAREFA:
Extraia meticulosamente:
1. 'extractedTeams': os códigos/nomes dos times identificados no gráfico (ex: FUR para mandante no topo, NUR para visitante embaixo).
2. 'timeline': um array ordenado de pontos de pressão ao longo de todos os minutos (aproximadamente de 2 em 2 minutos ou minuto a minuto, cobrindo de 1 a ~95 min).
   - minute: número inteiro do minuto.
   - value: número de -100 a +100 (positivo para pressão do mandante, negativo para pressão do visitante, 0 para neutro).
   - team: 'home' | 'away' | 'neutral'.
   - isPeak: true se a barra toca ou ultrapassa a linha pontilhada de perigo crítico.
   - event: 'goal_home' | 'goal_away' | 'none' (caso coincida com o marcador de gol de futebol).
   - eventDescription: texto breve se houver gol (ex: "Gol FUR ~23'", "Gol NUR ~27'").
3. 'events': lista consolidada de todos os gols e eventos detectados com { minute, type: "goal", team: "home"|"away", description }.
4. 'homeDominancePct' e 'awayDominancePct': porcentagem estimada de domínio/pressão total (ex: 55 e 45, somando 100).
5. 'homePeakCount' e 'awayPeakCount': contagem de picos críticos do mandante e visitante.
6. 'intervals': estatísticas divididas em blocos de 15 minutos:
   - "0-15'", "16-30'", "31-45'+", "46-60'", "61-75'", "76-90'+"
   - homeAvg (0 a 100), awayAvg (0 a 100), dominantTeam ('home' | 'away' | 'balanced').
7. 'tacticalSummary': breve síntese tática em português (2 a 3 frases) descrevendo a dinâmica de pressão do jogo e como os gols ocorreram.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            extractedTeams: {
              type: Type.OBJECT,
              properties: {
                homeCode: { type: Type.STRING },
                awayCode: { type: Type.STRING },
                homeName: { type: Type.STRING },
                awayName: { type: Type.STRING },
              },
            },
            homeDominancePct: { type: Type.NUMBER, description: 'Porcentagem de domínio do mandante de 0 a 100' },
            awayDominancePct: { type: Type.NUMBER, description: 'Porcentagem de domínio do visitante de 0 a 100' },
            homePeakCount: { type: Type.INTEGER, description: 'Quantidade de picos de pressão crítica do mandante' },
            awayPeakCount: { type: Type.INTEGER, description: 'Quantidade de picos de pressão crítica do visitante' },
            totalMinutes: { type: Type.INTEGER, description: 'Minuto final da partida (ex: 95)' },
            events: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  minute: { type: Type.INTEGER },
                  type: { type: Type.STRING, enum: ['goal', 'card', 'red_card', 'sub'] },
                  team: { type: Type.STRING, enum: ['home', 'away'] },
                  description: { type: Type.STRING },
                },
                required: ['minute', 'type', 'team'],
              },
            },
            intervals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  interval: { type: Type.STRING },
                  homeAvg: { type: Type.NUMBER },
                  awayAvg: { type: Type.NUMBER },
                  dominantTeam: { type: Type.STRING, enum: ['home', 'away', 'balanced'] },
                  homeAttackingVolume: { type: Type.NUMBER },
                  awayAttackingVolume: { type: Type.NUMBER },
                },
                required: ['interval', 'homeAvg', 'awayAvg', 'dominantTeam'],
              },
            },
            timeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  minute: { type: Type.INTEGER },
                  value: { type: Type.NUMBER, description: 'Valor de -100 a +100' },
                  team: { type: Type.STRING, enum: ['home', 'away', 'neutral'] },
                  isPeak: { type: Type.BOOLEAN },
                  event: { type: Type.STRING, enum: ['goal_home', 'goal_away', 'yellow_home', 'yellow_away', 'red_home', 'red_away', 'none'] },
                  eventDescription: { type: Type.STRING },
                },
                required: ['minute', 'value', 'team'],
              },
            },
            tacticalSummary: { type: Type.STRING },
          },
          required: [
            'extractedTeams',
            'homeDominancePct',
            'awayDominancePct',
            'homePeakCount',
            'awayPeakCount',
            'intervals',
            'timeline',
            'events',
          ],
        },
      },
    });

    const parsedJsonText = response.text;
    if (!parsedJsonText) {
      return res.status(500).json({ error: 'O modelo Gemini não retornou dados para a imagem.' });
    }

    const parsedData = JSON.parse(parsedJsonText);
    res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Error parsing pressure chart with Gemini:', error);
    res.status(500).json({
      error: 'Falha ao processar o gráfico de pressão com a IA: ' + (error?.message || 'Erro desconhecido'),
    });
  }
});

async function startServer() {
  // Vite integration in Dev mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Football DB Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
