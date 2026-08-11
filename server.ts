import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

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
