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
          className="pointer-events-auto flex items-start gap-3 bg-[#0f1325] border border-[#2C3EC4]/50 text-white p-4 rounded-xl shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-3 duration-300"
        >
          <div className="p-2 bg-[#2C3EC4]/20 text-[#2C3EC4] rounded-lg shrink-0 mt-0.5 border border-[#2C3EC4]/40">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#2C3EC4]/30 text-white tracking-wide uppercase border border-[#2C3EC4]/50">
                ID Único Gerado
              </span>
              <span className="text-xs font-mono font-bold text-white bg-[#2C3EC4] px-2 py-0.5 rounded border border-white/20">
                {notif.id}
              </span>
            </div>
            <p className="text-sm font-bold mt-1.5 text-white truncate">
              {notif.type === 'country' && `País: ${notif.name}`}
              {notif.type === 'league' && `Liga: ${notif.name}`}
              {notif.type === 'team' && `Time: ${notif.name}`}
              {notif.type === 'match' && `Partida: ${notif.name}`}
            </p>
            <p className="text-xs text-gray-300 mt-0.5">
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
