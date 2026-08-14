import React, { useState } from 'react';
import { X, Database, Download, Upload, RotateCcw, Copy, Check, AlertTriangle } from 'lucide-react';
import { DbState } from '../types';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbState: DbState;
  onImportDb: (state: DbState) => void;
  onClearDb: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  dbState,
  onImportDb,
  onClearDb,
}) => {
  const [jsonText, setJsonText] = useState('');
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleExportDownload = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dbState, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `futlfm_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(dbState, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    try {
      const parsed = JSON.parse(jsonText);
      if (
        !parsed ||
        !Array.isArray(parsed.countries) ||
        !Array.isArray(parsed.leagues) ||
        !Array.isArray(parsed.teams) ||
        !Array.isArray(parsed.matches)
      ) {
        throw new Error('O JSON fornecido não contém as chaves válidas (countries, leagues, teams, matches).');
      }

      onImportDb(parsed);
      setStatusMsg({ type: 'success', text: 'Banco de dados importado com sucesso!' });
      setJsonText('');
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Erro ao processar código JSON.' });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        setJsonText(text);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0e0e0e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#080808] border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Gerenciar Banco de Dados & Backup</h2>
              <p className="text-xs text-gray-400">Exportação, Importação JSON e Limpeza</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {statusMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-medium ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}
            >
              {statusMsg.text}
            </div>
          )}

          {/* Section 1: Database Status & Download */}
          <div className="bg-[#080808] p-4 rounded-xl border border-white/10 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
                  1. Exportar Dados do Banco
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Baixe um arquivo JSON com todos os {dbState.matches.length} jogos, {dbState.teams.length} times, {dbState.leagues.length} ligas e {dbState.countries.length} países.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopyJson}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-xs font-semibold rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                  {copied ? 'Copiado!' : 'Copiar JSON'}
                </button>

                <button
                  onClick={handleExportDownload}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-lg shadow-lg shadow-emerald-500/10 transition-all hover:scale-[1.02]"
                >
                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                  Baixar .JSON
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Import */}
          <form onSubmit={handleImportSubmit} className="bg-[#080808] p-4 rounded-xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
                2. Importar Banco de Dados
              </h4>

              <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-xs font-medium rounded-lg cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                Carregar Arquivo .JSON
                <input type="file" accept=".json" onChange={handleFileChange} className="hidden" />
              </label>
            </div>

            <textarea
              rows={4}
              placeholder="Cole o código JSON do seu backup aqui..."
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-2.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-emerald-500 placeholder-gray-500"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!jsonText.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black disabled:opacity-50 disabled:hover:bg-emerald-500 font-bold text-xs rounded-lg transition-all"
              >
                <Upload className="w-3.5 h-3.5 stroke-[2.5]" /> Importar Backup
              </button>
            </div>
          </form>

          {/* Section 3: Reset / Clear Database */}
          <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-500/10 text-red-400 rounded-lg shrink-0 mt-0.5 border border-red-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider">
                  Zerar Banco de Dados
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Apaga todos os jogos, times, ligas e países cadastrados e restaura o estado inicial limpo (0 itens).
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (confirm('ATENÇÃO: Tem certeza absoluta que deseja ZERAR todo o banco de dados? Esta ação não pode ser desfeita.')) {
                  onClearDb();
                  onClose();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 text-xs font-bold rounded-lg shrink-0 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Zerar Banco
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
