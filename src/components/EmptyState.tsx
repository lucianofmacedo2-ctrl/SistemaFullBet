import React from 'react';
import { Plus, Trophy, Globe, Shield, Sparkles, Database, UploadCloud } from 'lucide-react';

interface EmptyStateProps {
  onOpenMatchModal: () => void;
  onOpenEntityModal: () => void;
  onOpenCsvImportModal?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onOpenMatchModal,
  onOpenEntityModal,
  onOpenCsvImportModal,
}) => {
  return (
    <div className="max-w-4xl mx-auto my-8 px-4">
      <div className="bg-[#0f1325] border border-[#2C3EC4]/30 rounded-2xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden">
        {/* Background glow accents */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-[#2C3EC4]/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-[#2C3EC4]/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-2xl mx-auto">
          {/* Icon Badge */}
          <div className="w-20 h-20 bg-[#2C3EC4]/15 border border-[#2C3EC4]/40 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl text-white">
            <Trophy className="w-10 h-10 stroke-[1.5] text-[#2C3EC4]" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Banco de Dados Inicializado (Vazio)
          </h2>

          <p className="mt-3 text-gray-300 text-sm sm:text-base leading-relaxed font-medium">
            Nenhum jogo cadastrado ainda. Conforme solicitado, o sistema não contém jogos de exemplo.
            Você é quem vai cadastrar todos os dados do seu campeonato!
          </p>

          {/* Automatic ID Feature Highlight Box */}
          <div className="my-8 p-5 rounded-xl bg-[#0b0e1b] border border-[#2C3EC4]/40 text-left shadow-lg">
            <div className="flex items-center gap-2 text-[#2C3EC4] font-bold text-sm mb-2">
              <Sparkles className="w-4 h-4 text-white bg-[#2C3EC4] p-0.5 rounded" />
              <span className="text-white">Geração Automática de IDs Únicos</span>
            </div>
            <p className="text-xs text-gray-300 leading-normal font-medium">
              Na primeira vez que você cadastrar a <strong className="text-white">Liga</strong>, o <strong className="text-white">País</strong>, o <strong className="text-white">Time Mandante</strong> e o <strong className="text-white">Time Visitante</strong>, o sistema criará automaticamente um <span className="text-[#2C3EC4] font-mono font-bold">ID Único</span> exclusivo para cada um deles (ex: <code className="text-white bg-[#2C3EC4] px-1.5 py-0.5 rounded border border-white/20">PAIS-001</code>, <code className="text-white bg-[#2C3EC4] px-1.5 py-0.5 rounded border border-white/20">LIGA-001</code>, <code className="text-white bg-[#2C3EC4] px-1.5 py-0.5 rounded border border-white/20">TIME-001</code>).
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {onOpenCsvImportModal && (
              <button
                onClick={onOpenCsvImportModal}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] border border-white/10 cursor-pointer"
              >
                <UploadCloud className="w-5 h-5 stroke-[2.5]" />
                Subir jogos_consolidados.csv
              </button>
            )}

            <button
              onClick={onOpenMatchModal}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#2C3EC4] hover:bg-[#2231A8] text-white font-bold text-sm rounded-xl shadow-lg shadow-[#2C3EC4]/30 transition-all hover:scale-[1.02] active:scale-[0.98] border border-white/10 cursor-pointer"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              Cadastrar Primeiro Jogo
            </button>

            <button
              onClick={onOpenEntityModal}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-sm rounded-xl transition-all cursor-pointer"
            >
              <Globe className="w-4 h-4 text-[#2C3EC4]" />
              Cadastrar Entidade
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
