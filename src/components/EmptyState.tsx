import React from 'react';
import { Plus, Trophy, Globe, Shield, Sparkles, Database } from 'lucide-react';

interface EmptyStateProps {
  onOpenMatchModal: () => void;
  onOpenEntityModal: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onOpenMatchModal, onOpenEntityModal }) => {
  return (
    <div className="max-w-4xl mx-auto my-8 px-4">
      <div className="bg-[#0e0e0e] border border-white/10 rounded-2xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden">
        {/* Background glow accents */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-2xl mx-auto">
          {/* Icon Badge */}
          <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner text-emerald-400">
            <Trophy className="w-10 h-10 stroke-[1.5]" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Banco de Dados Inicializado (Vazio)
          </h2>

          <p className="mt-3 text-gray-300 text-sm sm:text-base leading-relaxed">
            Nenhum jogo cadastrado ainda. Conforme solicitado, o sistema não contém jogos de exemplo.
            Você é quem vai cadastrar todos os dados do seu campeonato!
          </p>

          {/* Automatic ID Feature Highlight Box */}
          <div className="my-8 p-5 rounded-xl bg-[#080808] border border-emerald-500/30 text-left">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Geração Automática de IDs Únicos</span>
            </div>
            <p className="text-xs text-gray-400 leading-normal">
              Na primeira vez que você cadastrar a <strong className="text-gray-200">Liga</strong>, o <strong className="text-gray-200">País</strong>, o <strong className="text-gray-200">Time Mandante</strong> e o <strong className="text-gray-200">Time Visitante</strong>, o sistema criará automaticamente um <span className="text-emerald-400 font-mono font-bold">ID Único</span> exclusivo para cada um deles (ex: <code className="text-emerald-300 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/30">PAIS-001</code>, <code className="text-emerald-300 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/30">LIGA-001</code>, <code className="text-emerald-300 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/30">TIME-001</code>).
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onOpenMatchModal}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              Cadastrar Primeiro Jogo
            </button>

            <button
              onClick={onOpenEntityModal}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 font-semibold text-sm rounded-xl transition-all"
            >
              <Globe className="w-4 h-4 text-emerald-400" />
              Cadastrar País / Liga / Time
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
