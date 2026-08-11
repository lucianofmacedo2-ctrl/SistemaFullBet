import React, { useEffect } from 'react';
import { CheckCircle2, Sparkles, X } from 'lucide-react';
import { NewEntityCreatedNotification } from '../types';

interface ToastProps {
  notifications: NewEntityCreatedNotification[];
  onDismiss: (index: number) => void;
}

export const ToastNotification: React.FC<ToastProps> = ({ notifications, onDismiss }) => {
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        onDismiss(0);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [notifications, onDismiss]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
      {notifications.map((notif, idx) => (
        <div
          key={`${notif.id}-${idx}`}
          className="pointer-events-auto flex items-start gap-3 bg-[#0e0e0e] border border-emerald-500/40 text-gray-100 p-4 rounded-xl shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-3 duration-300"
        >
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0 mt-0.5 border border-emerald-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 tracking-wide uppercase border border-emerald-500/30">
                ID Único Gerado
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                {notif.id}
              </span>
            </div>
            <p className="text-sm font-bold mt-1.5 text-white truncate">
              {notif.type === 'country' && `País: ${notif.name}`}
              {notif.type === 'league' && `Liga: ${notif.name}`}
              {notif.type === 'team' && `Time: ${notif.name}`}
              {notif.type === 'match' && `Partida: ${notif.name}`}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Item cadastrado pela 1ª vez e salvo no banco de dados.
            </p>
          </div>
          <button
            onClick={() => onDismiss(idx)}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
