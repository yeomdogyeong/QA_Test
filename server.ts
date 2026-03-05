import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('security_system.db');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT,
    name TEXT,
    email TEXT,
    phone TEXT,
    failed_attempts INTEGER DEFAULT 0,
    locked_until DATETIME
  );

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    username TEXT,
    action TEXT,
    ip_address TEXT
  );
`);

// Seed Data
const seedUsers = [
  { username: 'admin', password: 'Admin123!', role: 'Admin', name: '관리자', email: 'admin@example.com', phone: '010-1234-5678' },
  { username: 'user1', password: 'User123!', role: 'User', name: '일반사용자', email: 'user1@example.com', phone: '010-9876-5432' },
  { username: 'audit', password: 'Audit123!', role: 'Auditor', name: '감사자', email: 'audit@example.com', phone: '010-5555-4444' }
];

const insertUser = db.prepare('INSERT OR IGNORE INTO users (username, password, role, name, email, phone) VALUES (?, ?, ?, ?, ?, ?)');
seedUsers.forEach(u => insertUser.run(u.username, u.password, u.role, u.name, u.email, u.phone));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper to log actions
  const logAction = (username: string, action: string, ip: string) => {
    db.prepare('INSERT INTO logs (username, action, ip_address) VALUES (?, ?, ?)').run(username, action, ip);
  };

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: '인증이 필요합니다.' });
    
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(token); // Simple token = username for testing
    if (!user) return res.status(401).json({ error: '유효하지 않은 세션입니다.' });
    
    req.user = user;
    next();
  };

  // API Routes
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const ip = req.ip || 'unknown';

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;

    if (!user) {
      logAction(username || 'unknown', '로그인 실패 (존재하지 않는 사용자)', ip);
      return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
    }

    // Check if locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(403).json({ error: '계정이 잠겼습니다. 나중에 다시 시도하세요.' });
    }

    if (user.password !== password) {
      const newAttempts = user.failed_attempts + 1;
      let lockedUntil = null;
      if (newAttempts >= 5) {
        lockedUntil = new Date(Date.now() + 30 * 60000).toISOString(); // 30 min lock
      }
      db.prepare('UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?').run(newAttempts, lockedUntil, user.id);
      
      logAction(username, `로그인 실패 (시도 횟수: ${newAttempts})`, ip);
      return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
    }

    // Success
    db.prepare('UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?').run(user.id);
    logAction(username, '로그인 성공', ip);

    res.json({
      token: user.username,
      user: {
        username: user.username,
        role: user.role,
        name: user.name
      }
    });
  });

  app.get('/api/me', authenticate, (req: any, res) => {
    const user = req.user;
    logAction(user.username, '개인 정보 조회', req.ip || 'unknown');
    
    // Mask phone if not admin
    let phone = user.phone;
    if (user.role !== 'Admin') {
      const parts = phone.split('-');
      if (parts.length === 3) {
        phone = `${parts[0]}-****-${parts[2]}`;
      }
    }

    res.json({
      username: user.username,
      role: user.role,
      name: user.name,
      email: user.email,
      phone: phone
    });
  });

  app.get('/api/users', authenticate, (req: any, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: '권한이 없습니다.' });
    const users = db.prepare('SELECT id, username, role, name, email, phone FROM users').all();
    res.json(users);
  });

  app.post('/api/users', authenticate, (req: any, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: '권한이 없습니다.' });
    const { username, password, role, name, email, phone } = req.body;
    
    try {
      db.prepare('INSERT INTO users (username, password, role, name, email, phone) VALUES (?, ?, ?, ?, ?, ?)')
        .run(username, password, role, name, email, phone);
      logAction(req.user.username, `사용자 생성: ${username}`, req.ip || 'unknown');
      res.status(201).json({ message: '사용자가 생성되었습니다.' });
    } catch (e) {
      res.status(400).json({ error: '이미 존재하는 아이디입니다.' });
    }
  });

  app.delete('/api/users/:id', authenticate, (req: any, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: '권한이 없습니다.' });
    const { id } = req.params;
    const target = db.prepare('SELECT username FROM users WHERE id = ?').get(id) as any;
    if (target) {
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
      logAction(req.user.username, `사용자 삭제: ${target.username}`, req.ip || 'unknown');
      res.json({ message: '사용자가 삭제되었습니다.' });
    } else {
      res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }
  });

  app.get('/api/logs', authenticate, (req: any, res) => {
    if (req.user.role !== 'Admin' && req.user.role !== 'Auditor') {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }
    const logs = db.prepare('SELECT * FROM logs ORDER BY timestamp DESC').all();
    res.json(logs);
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
