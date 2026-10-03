const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'attendance.db');
const schemaPath = path.join(__dirname, 'schema.sql');

// Ensure upload directories exist
const uploadDirs = [
  path.join(__dirname, '..', 'uploads'),
  path.join(__dirname, '..', 'uploads', 'photos'),
  path.join(__dirname, '..', 'uploads', 'avatars'),
];

for (const dir of uploadDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Initialize database
const db = new DatabaseSync(dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

// Initialize schema
const schemaSql = fs.readFileSync(schemaPath, 'utf8');
db.exec(schemaSql);

// Helper query wrappers for consistent API
const dbHelper = {
  raw: db,

  /**
   * Run a query that returns multiple rows
   */
  all(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  },

  /**
   * Run a query that returns a single row
   */
  get(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.get(...params);
  },

  /**
   * Run an INSERT/UPDATE/DELETE query
   * Returns { changes: number, lastInsertRowid: number }
   */
  run(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.run(...params);
  },

  /**
   * Execute raw SQL statements
   */
  exec(sql) {
    return db.exec(sql);
  }
};

module.exports = dbHelper;
