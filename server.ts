import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { syncOnlineFootballData, processMatchRows, importCustomCsvText } from './server/syncEngine';
import { runServerGitHubSync, getServerSyncStats } from './server/githubSync';
import { sanitizeAndCleanDb } from './src/utils/dbSanitizer';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'football_db.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface DbData {
  countries: any[];
  leagues: any[];
  teams: any[];
  matches: any[];
  users?: any[];
}

const DEFAULT_MASTER_USER = {
  id: 'USER-MASTER-001',
  name: 'Administrador Master',
  username: '31882844890',
  password: 'Otavio@2010',
  role: 'MASTER',
  duration: 'LIFETIME',
  status: 'ACTIVE',
  createdAt: new Date().toISOString(),
  expiresAt: null,
  notes: 'Perfil Master Principal',
};

const DEFAULT_CONSULTA_USER = {
  id: 'USER-CONSULTA-001',
  name: 'User Teste',
  username: 'usuario.teste',
  password: '123456',
  role: 'CONSULTOR',
  duration: '30_DAYS',
  status: 'ACTIVE',
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000).toISOString(),
  notes: 'Perfil de Teste Consulta & Análise',
};

// Helper to load users safely from users.json and fallback to football_db.json
function mergeUsers(existingList: any[], incomingList: any[]): any[] {
  const map = new Map<string, any>();
  for (const u of existingList) {
    if (u && (u.id || u.username)) {
      const key = (u.id || u.username).toLowerCase();
      map.set(key, u);
    }
  }
  for (const u of incomingList) {
    if (u && (u.id || u.username)) {
      const key = (u.id || u.username).toLowerCase();
      const prev = map.get(key) || {};
      map.set(key, { ...prev, ...u });
    }
  }
  const result = Array.from(map.values());
  if (!result.some(u => u.role === 'MASTER')) {
    result.unshift(DEFAULT_MASTER_USER);
  }
  if (!result.some(u => u.username === 'usuario.teste')) {
    result.push(DEFAULT_CONSULTA_USER);
  }
  return result;
}

function loadUsers(): any[] {
  let list: any[] = [];
  if (fs.existsSync(USERS_FILE)) {
    try {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed;
      }
    } catch (err) {
      console.error('Error reading users.json:', err);
    }
  }

  // Fallback to football_db.json
  if (list.length === 0 && fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.users) && parsed.users.length > 0) {
        list = parsed.users;
      }
    } catch {
      // ignore
    }
  }

  if (list.length === 0) {
    list = [DEFAULT_MASTER_USER, DEFAULT_CONSULTA_USER];
  }

  // Ensure both master and default consulta exist
  if (!list.some(u => u.role === 'MASTER')) {
    list.unshift(DEFAULT_MASTER_USER);
  }
  if (!list.some(u => u.username === 'usuario.teste')) {
    list.push(DEFAULT_CONSULTA_USER);
  }

  return list;
}

function saveUsers(users: any[], replaceAll: boolean = false) {
  try {
    let finalUsers: any[];
    if (replaceAll) {
      finalUsers = Array.isArray(users) && users.length > 0 ? users : [DEFAULT_MASTER_USER];
      if (!finalUsers.some(u => u.role === 'MASTER')) finalUsers.unshift(DEFAULT_MASTER_USER);
    } else {
      const existing = loadUsers();
      finalUsers = mergeUsers(existing, users);
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(finalUsers, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing users.json:', err);
  }
}

const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// Multi-device Active Session Model
export interface ActiveSession {
  sessionId: string;
  userId: string;
  username: string;
  name?: string;
  role?: string;
  deviceType?: 'Desktop' | 'Mobile' | 'Tablet' | string;
  deviceModel?: string;
  os?: string;
  browser?: string;
  screenResolution?: string;
  timezone?: string;
  ip?: string;
  loginTime: string;
  updatedAt: string;
  lastHeartbeat: number;
  clientInfo?: string;
  status?: 'ONLINE' | 'IDLE' | 'OFFLINE';
  isRevoked?: boolean;
}

const activeSessions = new Map<string, ActiveSession>();

// Load sessions from disk on startup
function loadSessionsFromDisk() {
  if (fs.existsSync(SESSIONS_FILE)) {
    try {
      const raw = fs.readFileSync(SESSIONS_FILE, 'utf-8');
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        list.forEach((s: ActiveSession) => {
          if (s && s.sessionId) {
            activeSessions.set(s.sessionId, s);
          }
        });
      }
    } catch {
      // non-fatal
    }
  }
}
loadSessionsFromDisk();

function saveSessionsToDisk() {
  try {
    const list = Array.from(activeSessions.values());
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving sessions.json:', err);
  }
}

// Clean old sessions every 10 minutes (keep active within 24h)
setInterval(() => {
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  let changed = false;
  for (const [key, session] of activeSessions.entries()) {
    if (now - session.lastHeartbeat > ONE_DAY) {
      activeSessions.delete(key);
      changed = true;
    }
  }
  if (changed) {
    saveSessionsToDisk();
  }
}, 10 * 60 * 1000);

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
  const users = loadUsers();
  if (!fs.existsSync(DB_FILE)) {
    const initialData: DbData = {
      countries: [],
      leagues: [],
      teams: [],
      matches: [],
      users,
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    parsed.users = users;
    const { cleanedDb, stats } = sanitizeAndCleanDb(parsed as any);
    if (stats.foreignLeaguesRemoved > 0 || stats.teamsCleaned > 0 || stats.duplicatesRemoved > 0) {
      saveDb(cleanedDb);
    }
    return cleanedDb;
  } catch (err) {
    console.error('Error reading db file:', err);
    return { countries: [], leagues: [], teams: [], matches: [], users };
  }
}

function saveDb(data: DbData) {
  try {
    if (Array.isArray(data.users)) {
      saveUsers(data.users);
    }
    const { cleanedDb } = sanitizeAndCleanDb(data as any);
    const dataToSave = {
      ...cleanedDb,
      users: loadUsers(),
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing db file:', err);
  }
}

// API Routes
app.get('/api/db', (req, res) => {
  const db = loadDb();
  res.json(db);
});

// Dedicated Users API
app.get('/api/users', (req, res) => {
  const users = loadUsers();
  res.json(users);
});

app.post('/api/users', (req, res) => {
  const { users, replaceAll } = req.body;
  if (!Array.isArray(users)) {
    return res.status(400).json({ error: 'Array de usuários esperado.' });
  }
  saveUsers(users, Boolean(replaceAll));
  res.json({ success: true, users: loadUsers() });
});

// Explicit user delete route so deletions aren't accidentally re-merged
app.post('/api/users/delete', (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'userId obrigatório' });
  }
  const current = loadUsers();
  const filtered = current.filter(u => u.id !== userId && u.username.toLowerCase() !== String(userId).toLowerCase());
  saveUsers(filtered, true);
  res.json({ success: true, users: loadUsers() });
});

// Multi-Device Active Session Endpoints
app.post('/api/sessions/register', (req, res) => {
  const {
    userId,
    username,
    name,
    role,
    sessionId,
    deviceType,
    deviceModel,
    os,
    browser,
    screenResolution,
    timezone,
    clientInfo,
  } = req.body;

  if (!userId || !sessionId) {
    return res.status(400).json({ error: 'Dados de sessão incompletos (userId e sessionId obrigatórios).' });
  }

  // Derive client IP from request headers or socket
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress || '';

  const users = loadUsers();
  const matchedUser = users.find(u => u.id === userId || u.username.toLowerCase() === String(username || '').toLowerCase());

  const existing = activeSessions.get(sessionId);
  const record: ActiveSession = {
    sessionId,
    userId,
    username: username || matchedUser?.username || '',
    name: name || matchedUser?.name || '',
    role: role || matchedUser?.role || 'CONSULTOR',
    deviceType: deviceType || existing?.deviceType || 'Desktop',
    deviceModel: deviceModel || existing?.deviceModel || '',
    os: os || existing?.os || 'Desconhecido',
    browser: browser || existing?.browser || 'Navegador Web',
    screenResolution: screenResolution || existing?.screenResolution || '',
    timezone: timezone || existing?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    ip: ip || existing?.ip || '',
    loginTime: existing?.loginTime || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastHeartbeat: Date.now(),
    clientInfo: clientInfo || existing?.clientInfo || '',
    status: 'ONLINE',
    isRevoked: false,
  };

  activeSessions.set(sessionId, record);
  saveSessionsToDisk();

  res.json({ success: true, record });
});

// Periodic heartbeat from device
app.post('/api/sessions/heartbeat', (req, res) => {
  const { sessionId, userId } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId obrigatório' });
  }

  const record = activeSessions.get(sessionId);
  if (record) {
    if (record.isRevoked) {
      return res.json({ success: false, isRevoked: true });
    }
    record.lastHeartbeat = Date.now();
    record.updatedAt = new Date().toISOString();
    record.status = 'ONLINE';
    activeSessions.set(sessionId, record);
  } else if (userId) {
    // If not found in memory (e.g. server restart), register lightweight placeholder
    const record: ActiveSession = {
      sessionId,
      userId,
      username: '',
      loginTime: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastHeartbeat: Date.now(),
      status: 'ONLINE',
    };
    activeSessions.set(sessionId, record);
  }

  res.json({ success: true });
});

// Check if a specific session is valid or was revoked by Master
app.get('/api/sessions/status/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const record = activeSessions.get(sessionId);

  if (!record) {
    return res.json({ isValid: true, isRevoked: false });
  }

  if (record.isRevoked) {
    return res.json({ isValid: false, isRevoked: true, reason: 'Sessão encerrada pelo administrador.' });
  }

  return res.json({ isValid: true, isRevoked: false, record });
});

// MASTER PANEL: List all active sessions across all profiles in real-time
app.get('/api/sessions/all', (req, res) => {
  const now = Date.now();
  const users = loadUsers();
  const usersMap = new Map<string, any>(users.map(u => [u.id, u]));
  const usernameMap = new Map<string, any>(users.map(u => [u.username.toLowerCase(), u]));

  const rawSessions = Array.from(activeSessions.values());
  const enrichedSessions = rawSessions
    .filter(s => !s.isRevoked)
    .map(s => {
      const u = usersMap.get(s.userId) || usernameMap.get(s.username.toLowerCase());
      const timeSinceHeartbeat = now - (s.lastHeartbeat || 0);

      let status: 'ONLINE' | 'IDLE' | 'OFFLINE' = 'ONLINE';
      if (timeSinceHeartbeat > 5 * 60 * 1000) {
        status = 'OFFLINE';
      } else if (timeSinceHeartbeat > 90 * 1000) {
        status = 'IDLE';
      }

      return {
        ...s,
        name: s.name || u?.name || 'Usuário',
        username: s.username || u?.username || '',
        role: s.role || u?.role || 'CONSULTOR',
        status,
        timeSinceHeartbeatMs: timeSinceHeartbeat,
      };
    })
    .sort((a, b) => b.lastHeartbeat - a.lastHeartbeat);

  // Group by user to calculate simultaneous devices count
  const userDeviceCount: Record<string, number> = {};
  enrichedSessions.forEach(s => {
    if (s.status !== 'OFFLINE') {
      const key = s.username || s.userId;
      userDeviceCount[key] = (userDeviceCount[key] || 0) + 1;
    }
  });

  const finalSessions = enrichedSessions.map(s => ({
    ...s,
    simultaneousCountForUser: userDeviceCount[s.username || s.userId] || 1,
  }));

  const onlineCount = finalSessions.filter(s => s.status === 'ONLINE').length;
  const idleCount = finalSessions.filter(s => s.status === 'IDLE').length;
  const uniqueUsersOnline = new Set(finalSessions.filter(s => s.status !== 'OFFLINE').map(s => s.username || s.userId)).size;

  res.json({
    success: true,
    totalSessions: finalSessions.length,
    onlineCount,
    idleCount,
    uniqueUsersOnline,
    sessions: finalSessions,
  });
});

// MASTER ACTION: Remotely disconnect a session or all sessions of a user
app.post('/api/sessions/disconnect', (req, res) => {
  const { sessionId, userId, username } = req.body;

  if (sessionId) {
    const record = activeSessions.get(sessionId);
    if (record) {
      record.isRevoked = true;
      activeSessions.delete(sessionId);
    }
    saveSessionsToDisk();
    return res.json({ success: true, message: 'Sessão desconectada com sucesso.' });
  }

  if (userId || username) {
    let count = 0;
    for (const [key, session] of activeSessions.entries()) {
      if (
        (userId && session.userId === userId) ||
        (username && session.username.toLowerCase() === String(username).toLowerCase())
      ) {
        session.isRevoked = true;
        activeSessions.delete(key);
        count++;
      }
    }
    saveSessionsToDisk();
    return res.json({ success: true, count, message: `${count} sessão(ões) desconectada(s) com sucesso.` });
  }

  return res.status(400).json({ error: 'sessionId ou userId obrigatório para desconexão.' });
});

// Explicit user logout from current device
app.post('/api/sessions/clear', (req, res) => {
  const { sessionId, userId } = req.body;
  if (sessionId) {
    activeSessions.delete(sessionId);
  } else if (userId) {
    for (const [key, session] of activeSessions.entries()) {
      if (session.userId === userId) {
        activeSessions.delete(key);
      }
    }
  }
  saveSessionsToDisk();
  res.json({ success: true });
});

// Dedicated Auth Login verification API
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const cleanUsername = String(username || '').trim().toLowerCase();
  const cleanPassword = String(password || '').trim();

  const users = loadUsers();
  const matched = users.find(u => 
    String(u.username || '').trim().toLowerCase() === cleanUsername ||
    String(u.id || '').trim().toLowerCase() === cleanUsername ||
    String(u.name || '').trim().toLowerCase() === cleanUsername
  );

  if (!matched) {
    return res.status(404).json({ success: false, error: 'Usuário não encontrado. Verifique o login digitado.' });
  }

  if (matched.password && String(matched.password).trim() !== cleanPassword) {
    return res.status(401).json({ success: false, error: 'Senha incorreta. Tente novamente.' });
  }

  if (matched.status === 'BLOCKED') {
    return res.status(403).json({ success: false, error: 'Esta conta está bloqueada pelo administrador.' });
  }

  res.json({ success: true, user: matched });
});

app.post('/api/sync/github', async (req, res) => {
  try {
    const currentDb = loadDb();
    const { updatedDb, stats } = await runServerGitHubSync(currentDb);
    saveDb(updatedDb);
    res.json({ success: true, stats, db: updatedDb });
  } catch (err: any) {
    console.error('Error running GitHub auto-sync:', err);
    res.status(500).json({ success: false, error: err.message || String(err) });
  }
});

app.get('/api/sync/github-status', (req, res) => {
  res.json({ success: true, stats: getServerSyncStats() });
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
  const { countries, leagues, teams, matches, users } = req.body;
  const newData: DbData = {
    countries: Array.isArray(countries) ? countries : [],
    leagues: Array.isArray(leagues) ? leagues : [],
    teams: Array.isArray(teams) ? teams : [],
    matches: Array.isArray(matches) ? matches : [],
    users: Array.isArray(users) ? users : [],
  };
  saveDb(newData);
  res.json({ success: true, data: newData });
});

app.post('/api/db/clear', (req, res) => {
  const currentDb = loadDb();
  // Preserve master users when clearing matches/data or clear all if needed
  const emptyData: DbData = {
    countries: [],
    leagues: [],
    teams: [],
    matches: [],
    users: currentDb.users || [],
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

    // Automatic GitHub synchronization on server startup (non-blocking)
    setTimeout(async () => {
      try {
        const db = loadDb();
        await runServerGitHubSync(db);
      } catch (err: any) {
        console.warn('[GitHub Auto-Sync] Startup sync warning:', err?.message);
      }
    }, 1500);

    // Continuous automatic synchronization every 10 minutes
    setInterval(async () => {
      try {
        const db = loadDb();
        await runServerGitHubSync(db);
      } catch (err: any) {
        console.warn('[GitHub Auto-Sync] Periodic sync warning:', err?.message);
      }
    }, 10 * 60 * 1000);
  });
}

startServer();
