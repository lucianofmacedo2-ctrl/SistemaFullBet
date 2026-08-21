import React, { useState } from 'react';
import {
  User,
  Key,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight
} from 'lucide-react';
import { AppUser } from '../types';
import { getUserEffectiveStatus } from '../services/authService';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  users: AppUser[];
  onLoginSuccess: (user: AppUser) => void;
  allowClose?: boolean;
  initialUsername?: string;
  isConsultaPortal?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  users = [],
  onLoginSuccess,
  allowClose = false,
  initialUsername = '',
  isConsultaPortal = false,
}) => {
  const [username, setUsername] = useState(initialUsername || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync initialUsername if it changes
  React.useEffect(() => {
    if (initialUsername) {
      setUsername(initialUsername);
    }
  }, [initialUsername]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanUsername) {
      setErrorMessage('Por favor, informe seu usuário ou e-mail de acesso.');
      setLoading(false);
      return;
    }

    // 1. Try finding in current local users array
    let matchedUser = users.find(
      u =>
        u.username.trim().toLowerCase() === cleanUsername ||
        (u.id && u.id.trim().toLowerCase() === cleanUsername) ||
        (u.name && u.name.trim().toLowerCase() === cleanUsername)
    );

    // 2. If not found locally, fetch latest users live from server (cross-device sync for mobile)
    if (!matchedUser) {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: cleanUsername, password: cleanPassword }),
        });
        const result = await response.json();
        if (response.ok && result.success && result.user) {
          matchedUser = result.user;
        } else if (result.error) {
          setErrorMessage(result.error);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Live login endpoint check failed, checking users list', err);
      }
    }

    if (!matchedUser) {
      setErrorMessage('Usuário não encontrado. Verifique se digitou o login corretamente.');
      setLoading(false);
      return;
    }

    // Verify password
    if (matchedUser.password && matchedUser.password.trim() !== cleanPassword) {
      setErrorMessage('Senha incorreta. Verifique maiúsculas e minúsculas.');
      setLoading(false);
      return;
    }

    // Check account status
    const eff = getUserEffectiveStatus(matchedUser);
    if (eff.status === 'BLOCKED') {
      setErrorMessage('Esta conta está bloqueada pelo administrador. Entre em contato com o suporte.');
      setLoading(false);
      return;
    }

    if (eff.status === 'EXPIRED') {
      setErrorMessage('O período de acesso desta conta expirou. Solicite a renovação ao administrador.');
      setLoading(false);
      return;
    }

    // Login successful
    setLoading(false);
    onLoginSuccess(matchedUser);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Visual */}
        <div className={`p-6 text-white text-center relative overflow-hidden ${
          isConsultaPortal 
            ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950'
            : 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900'
        }`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="w-14 h-14 rounded-2xl bg-blue-600 border border-blue-400 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30 mb-3">
            ⚽
          </div>
          <h2 className="text-xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <span>FUT<span className="text-blue-400">LFM2</span></span>
            {isConsultaPortal && (
              <span className="px-2 py-0.5 rounded-full bg-blue-400/20 text-blue-200 text-[10px] font-bold border border-blue-300/30">
                Portal de Consulta
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-300 mt-1 font-medium">
            {isConsultaPortal
              ? 'Área exclusiva para Consulta & Análise de Jogos'
              : 'Acesso ao Sistema & Análise Esportiva'}
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Usuário / Login
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                autoFocus
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="username"
                placeholder="Informe seu usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9.5 pr-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Senha de Acesso
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="current-password"
                placeholder="Informe sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9.5 pr-10 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white font-medium font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
          >
            <span>{loading ? 'Verificando...' : 'Entrar no Sistema'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {allowClose && onClose && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold py-1 hover:underline cursor-pointer"
              >
                Continuar sem alterar
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
