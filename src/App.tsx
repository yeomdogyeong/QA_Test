import React, { useState, useEffect, useCallback } from 'react';
import { 
  Shield, 
  User, 
  Users, 
  FileText, 
  LogOut, 
  Lock, 
  AlertCircle,
  Plus,
  Trash2,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Types
type Role = 'Admin' | 'User' | 'Auditor';

interface UserData {
  id: number;
  username: string;
  password?: string;
  role: Role;
  name: string;
  email: string;
  phone: string;
  failed_attempts?: number;
  locked_until?: string | null;
}

interface LogEntry {
  id: number;
  timestamp: string;
  username: string;
  action: string;
  ip_address: string;
}

// Initial Mock Data
const INITIAL_USERS: UserData[] = [
  { id: 1, username: 'admin', password: 'Admin123!', role: 'Admin', name: '관리자', email: 'admin@example.com', phone: '010-1234-5678', failed_attempts: 0, locked_until: null },
  { id: 2, username: 'user1', password: 'User123!', role: 'User', name: '일반사용자', email: 'user1@example.com', phone: '010-9876-5432', failed_attempts: 0, locked_until: null },
  { id: 3, username: 'audit', password: 'Audit123!', role: 'Auditor', name: '감사자', email: 'audit@example.com', phone: '010-5555-4444', failed_attempts: 0, locked_until: null }
];

export default function App() {
  // State initialization from LocalStorage
  const [users, setUsers] = useState<UserData[]>(() => {
    const saved = localStorage.getItem('mock_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [logs, setLogs] = useState<LogEntry[]>(() => {
    const saved = localStorage.getItem('mock_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Login states
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [error, setError] = useState('');
  
  // Modal states
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    role: 'User' as Role
  });

  // Session Timeout Logic
  const [lastActivity, setLastActivity] = useState(Date.now());
  const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

  // Persistence
  useEffect(() => {
    localStorage.setItem('mock_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('mock_logs', JSON.stringify(logs));
  }, [logs]);

  const addLog = (username: string, action: string) => {
    const newLog: LogEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      username,
      action,
      ip_address: '127.0.0.1 (Client-Side Mock)'
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const handleLogout = useCallback(() => {
    if (currentUser) addLog(currentUser.username, '로그아웃');
    setIsLoggedIn(false);
    setCurrentUser(null);
    setActiveTab('dashboard');
    setError('');
  }, [currentUser]);

  useEffect(() => {
    if (isLoggedIn) {
      const interval = setInterval(() => {
        if (Date.now() - lastActivity > TIMEOUT_MS) {
          handleLogout();
          alert('세션이 만료되었습니다. 다시 로그인해주세요.');
        }
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, lastActivity, handleLogout]);

  const updateActivity = () => setLastActivity(Date.now());

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Password Policy Check
    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(loginPassword)) {
      setError('비밀번호는 최소 8자 이상이며, 숫자와 특수문자를 포함해야 합니다.');
      return;
    }

    const userIndex = users.findIndex(u => u.username === loginUsername);
    const user = users[userIndex];

    if (!user) {
      addLog(loginUsername || 'unknown', '로그인 실패 (존재하지 않는 사용자)');
      setError('아이디 또는 비밀번호가 올바르지 않습니다.');
      return;
    }

    // Check if locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      setError('계정이 잠겼습니다. 나중에 다시 시도하세요.');
      return;
    }

    if (user.password !== loginPassword) {
      const newAttempts = (user.failed_attempts || 0) + 1;
      let lockedUntil = null;
      if (newAttempts >= 5) {
        lockedUntil = new Date(Date.now() + 30 * 60000).toISOString();
      }
      
      const updatedUsers = [...users];
      updatedUsers[userIndex] = { ...user, failed_attempts: newAttempts, locked_until: lockedUntil };
      setUsers(updatedUsers);
      
      addLog(loginUsername, `로그인 실패 (시도 횟수: ${newAttempts})`);
      setError('아이디 또는 비밀번호가 올바르지 않습니다.');
      return;
    }

    // Success
    const updatedUsers = [...users];
    updatedUsers[userIndex] = { ...user, failed_attempts: 0, locked_until: null };
    setUsers(updatedUsers);
    
    addLog(loginUsername, '로그인 성공');
    setCurrentUser(user);
    setIsLoggedIn(true);
    setLoginUsername('');
    setLoginPassword('');
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (users.some(u => u.username === newUser.username)) {
      alert('이미 존재하는 아이디입니다.');
      return;
    }

    const createdUser: UserData = {
      id: Date.now(),
      ...newUser,
      failed_attempts: 0,
      locked_until: null
    };

    setUsers(prev => [...prev, createdUser]);
    addLog(currentUser?.username || 'system', `사용자 생성: ${newUser.username}`);
    alert('사용자가 생성되었습니다.');
    setIsUserModalOpen(false);
    setNewUser({ username: '', password: '', name: '', email: '', phone: '', role: 'User' });
  };

  const handleDeleteUser = (id: number) => {
    const target = users.find(u => u.id === id);
    if (!target) return;

    if (confirm(`${target.username} 사용자를 삭제하시겠습니까?`)) {
      setUsers(prev => prev.filter(u => u.id !== id));
      addLog(currentUser?.username || 'system', `사용자 삭제: ${target.username}`);
      alert('삭제되었습니다.');
    }
  };

  // Masking logic
  const getMaskedPhone = (phone: string) => {
    if (currentUser?.role === 'Admin') return phone;
    const parts = phone.split('-');
    if (parts.length === 3) {
      return `${parts[0]}-****-${parts[2]}`;
    }
    return phone;
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4" onClick={updateActivity}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-zinc-200"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="bg-zinc-900 p-3 rounded-xl mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">보안 관리 시스템 (Mock)</h1>
            <p className="text-zinc-500 text-sm">QA 자동화 테스트 포트폴리오</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">사용자 아이디</label>
              <input
                id="username-input"
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
                placeholder="아이디를 입력하세요"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">비밀번호</label>
              <input
                id="password-input"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
                placeholder="비밀번호를 입력하세요"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm border border-red-100">
                <AlertCircle className="w-4 h-4" />
                <span id="error-message">{error}</span>
              </div>
            )}

            <button
              id="login-button"
              type="submit"
              className="w-full bg-zinc-900 text-white py-2.5 rounded-lg font-medium hover:bg-zinc-800 transition-colors shadow-lg shadow-zinc-200"
            >
              로그인
            </button>
          </form>

          <div className="mt-8 pt-6 border-top border-zinc-100 text-center">
            <p className="text-xs text-zinc-400">테스트 계정: admin / Admin123!</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex" onMouseMove={updateActivity} onKeyDown={updateActivity}>
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-zinc-200 transition-all duration-300 flex flex-col`}>
        <div className="p-6 flex items-center gap-3 border-b border-zinc-100">
          <Shield className="w-8 h-8 text-zinc-900 flex-shrink-0" />
          {isSidebarOpen && <span className="font-bold text-lg truncate">Security MS</span>}
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem 
            icon={<Shield className="w-5 h-5" />} 
            label="대시보드" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')}
            isOpen={isSidebarOpen}
          />
          <SidebarItem 
            icon={<User className="w-5 h-5" />} 
            label="개인 정보" 
            active={activeTab === 'personal'} 
            onClick={() => setActiveTab('personal')}
            isOpen={isSidebarOpen}
          />
          {(currentUser?.role === 'Admin') && (
            <SidebarItem 
              icon={<Users className="w-5 h-5" />} 
              label="사용자 관리" 
              active={activeTab === 'users'} 
              onClick={() => setActiveTab('users')}
              isOpen={isSidebarOpen}
            />
          )}
          {(currentUser?.role === 'Admin' || currentUser?.role === 'Auditor') && (
            <SidebarItem 
              icon={<FileText className="w-5 h-5" />} 
              label="액세스 로그" 
              active={activeTab === 'logs'} 
              onClick={() => setActiveTab('logs')}
              isOpen={isSidebarOpen}
            />
          )}
        </nav>

        <div className="p-4 border-t border-zinc-100">
          <button
            id="logout-button"
            onClick={handleLogout}
            className="flex items-center gap-3 w-full p-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span className="font-medium">로그아웃</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-8">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-zinc-100 rounded-lg">
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-zinc-900">{currentUser?.name}</p>
              <p className="text-xs text-zinc-500">{currentUser?.role}</p>
            </div>
            <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-zinc-400" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 className="text-2xl font-bold mb-6">시스템 현황</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard title="현재 역할" value={currentUser?.role || ''} icon={<Lock className="w-6 h-6" />} />
                  <StatCard title="접속 사용자" value={currentUser?.username || ''} icon={<User className="w-6 h-6" />} />
                  <StatCard title="상태" value="정상 (Mock Mode)" icon={<Shield className="w-6 h-6 text-emerald-500" />} />
                </div>
              </motion.div>
            )}

            {activeTab === 'personal' && (
              <motion.div key="personal" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 className="text-2xl font-bold mb-6">개인 정보 조회</h2>
                <div className="bg-white rounded-2xl border border-zinc-200 p-8 max-w-2xl shadow-sm">
                  <div className="space-y-6">
                    <InfoRow label="이름" value={currentUser?.name || '-'} id="personal-name" />
                    <InfoRow label="이메일" value={currentUser?.email || '-'} id="personal-email" />
                    <InfoRow label="전화번호" value={getMaskedPhone(currentUser?.phone || '')} id="personal-phone" />
                    <InfoRow label="역할" value={currentUser?.role || '-'} id="personal-role" />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'users' && currentUser?.role === 'Admin' && (
              <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">사용자 관리</h2>
                  <button 
                    id="create-user-button"
                    className="bg-zinc-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-zinc-800 transition-all"
                    onClick={() => setIsUserModalOpen(true)}
                  >
                    <Plus className="w-4 h-4" /> 사용자 추가
                  </button>
                </div>
                <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
                  <table id="user-table" className="w-full text-left">
                    <thead className="bg-zinc-50 border-b border-zinc-200">
                      <tr>
                        <th className="px-6 py-4 text-sm font-semibold text-zinc-600">아이디</th>
                        <th className="px-6 py-4 text-sm font-semibold text-zinc-600">이름</th>
                        <th className="px-6 py-4 text-sm font-semibold text-zinc-600">역할</th>
                        <th className="px-6 py-4 text-sm font-semibold text-zinc-600">이메일</th>
                        <th className="px-6 py-4 text-sm font-semibold text-zinc-600">관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {users.map((u, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium">{u.username}</td>
                          <td className="px-6 py-4 text-sm">{u.name}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                              u.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                              u.role === 'Auditor' ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-700'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-zinc-500">{u.email}</td>
                          <td className="px-6 py-4 text-sm">
                            <button 
                              onClick={() => handleDeleteUser(u.id)}
                              className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'logs' && (currentUser?.role === 'Admin' || currentUser?.role === 'Auditor') && (
              <motion.div key="logs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 className="text-2xl font-bold mb-6">액세스 로그</h2>
                <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
                  <table id="log-table" className="w-full text-left">
                    <thead className="bg-zinc-50 border-b border-zinc-200">
                      <tr>
                        <th className="px-6 py-4 text-sm font-semibold text-zinc-600">타임스탬프</th>
                        <th className="px-6 py-4 text-sm font-semibold text-zinc-600">사용자</th>
                        <th className="px-6 py-4 text-sm font-semibold text-zinc-600">활동</th>
                        <th className="px-6 py-4 text-sm font-semibold text-zinc-600">IP 주소</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-zinc-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-zinc-500">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className="px-6 py-4 text-sm font-medium">{log.username}</td>
                          <td className="px-6 py-4 text-sm">{log.action}</td>
                          <td className="px-6 py-4 text-sm text-zinc-400">{log.ip_address}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* User Creation Modal */}
      <AnimatePresence>
        {isUserModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-zinc-200"
            >
              <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                <h3 className="text-xl font-bold">새 사용자 추가</h3>
                <button onClick={() => setIsUserModalOpen(false)} className="p-2 hover:bg-zinc-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">아이디</label>
                    <input
                      id="new-username"
                      type="text"
                      required
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-zinc-900 outline-none"
                      value={newUser.username}
                      onChange={e => setNewUser({...newUser, username: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">비밀번호</label>
                    <input
                      id="new-password"
                      type="password"
                      required
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-zinc-900 outline-none"
                      value={newUser.password}
                      onChange={e => setNewUser({...newUser, password: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">이름</label>
                  <input
                    id="new-name"
                    type="text"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-zinc-900 outline-none"
                    value={newUser.name}
                    onChange={e => setNewUser({...newUser, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">이메일</label>
                  <input
                    id="new-email"
                    type="email"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-zinc-900 outline-none"
                    value={newUser.email}
                    onChange={e => setNewUser({...newUser, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">전화번호</label>
                  <input
                    id="new-phone"
                    type="text"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-zinc-900 outline-none"
                    value={newUser.phone}
                    onChange={e => setNewUser({...newUser, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">역할</label>
                  <select
                    id="new-role"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-zinc-900 outline-none"
                    value={newUser.role}
                    onChange={e => setNewUser({...newUser, role: e.target.value as Role})}
                  >
                    <option value="User">User</option>
                    <option value="Admin">Admin</option>
                    <option value="Auditor">Auditor</option>
                  </select>
                </div>
                <div className="pt-4">
                  <button
                    id="submit-user-button"
                    type="submit"
                    className="w-full bg-zinc-900 text-white py-2.5 rounded-lg font-bold hover:bg-zinc-800 transition-all"
                  >
                    사용자 생성
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick, isOpen }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${
        active 
          ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-200' 
          : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
      }`}
    >
      {icon}
      {isOpen && <span className="font-medium">{label}</span>}
    </button>
  );
}

function StatCard({ title, value, icon }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-sm text-zinc-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-zinc-900">{value}</p>
      </div>
      <div className="bg-zinc-50 p-3 rounded-xl">
        {icon}
      </div>
    </div>
  );
}

function InfoRow({ label, value, id }: any) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-zinc-100 last:border-0">
      <span className="text-sm font-medium text-zinc-500">{label}</span>
      <span id={id} className="text-lg font-semibold text-zinc-900">{value}</span>
    </div>
  );
}
