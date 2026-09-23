import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
export function openDatabase(path) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,password TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'member',created INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS payments(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),plan TEXT NOT NULL,amount INTEGER NOT NULL,reference TEXT UNIQUE NOT NULL,phone TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',created INTEGER NOT NULL,reviewed INTEGER,reviewer TEXT,reason TEXT);
    CREATE UNIQUE INDEX IF NOT EXISTS one_pending_payment ON payments(user_id) WHERE status='pending';
    CREATE TABLE IF NOT EXISTS grants(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),payment_id TEXT UNIQUE NOT NULL REFERENCES payments(id),plan TEXT NOT NULL,starts INTEGER NOT NULL,ends INTEGER NOT NULL,revoked INTEGER);
    CREATE TABLE IF NOT EXISTS images(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),day TEXT NOT NULL,request_key TEXT NOT NULL,prompt TEXT NOT NULL,created INTEGER NOT NULL,UNIQUE(user_id,request_key));
    CREATE INDEX IF NOT EXISTS daily_image_usage ON images(user_id,day);
    CREATE TABLE IF NOT EXISTS progress(user_id TEXT NOT NULL REFERENCES users(id),lesson_id TEXT NOT NULL,completed INTEGER NOT NULL DEFAULT 0,favorite INTEGER NOT NULL DEFAULT 0,draft TEXT NOT NULL DEFAULT '',PRIMARY KEY(user_id,lesson_id));
    CREATE TABLE IF NOT EXISTS video_tickets(hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),lesson_id TEXT NOT NULL,expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS audit(id TEXT PRIMARY KEY,actor TEXT NOT NULL,action TEXT NOT NULL,payment_id TEXT NOT NULL,created INTEGER NOT NULL,detail TEXT NOT NULL);
  `);
  return db;
}
export function atomic(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try { const result = fn(); db.exec('COMMIT'); return result; }
  catch (error) { db.exec('ROLLBACK'); throw error; }
}
