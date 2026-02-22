import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'downloads.db');
const db = new Database(dbPath);

// Initialize table for download history
// We include security considerations in our application logic (RLS-like scoping)
db.exec(`
  CREATE TABLE IF NOT EXISTS downloads (
    id TEXT PRIMARY KEY,
    title TEXT,
    url TEXT,
    platform TEXT,
    format TEXT,
    quality TEXT,
    thumbnail TEXT,
    channel TEXT,
    status TEXT,
    progress INTEGER,
    size TEXT,
    date TEXT
  )
`);

export default db;
