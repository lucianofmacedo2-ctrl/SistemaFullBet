import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Sparkles,
  TrendingUp,
  FileImage,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  Sliders,
  Trophy,
  ArrowRight,
  Flame,
  Clock,
  Save,
  ClipboardPaste,
} from 'lucide-react';
import { Match, MatchPressureData } from '../types';
import { PressureChartViewer } from './PressureChartViewer';

interface PressureChartImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: Match[];
  selectedMatchId?: string | null;
  onSavePressureData: (matchId: string, pressureData: MatchPressureData, autoFillGoalStats?: boolean) => void;
}

export const PressureChartImportModal: React.FC<PressureChartImportModalProps> = ({
  isOpen,
  onClose,
  matches,
  selectedMatchId: initialSelectedMatchId,
  onSavePressureData,
}) => {
  const [selectedMatchId, setSelectedMatchId] = useState<string>(initialSelectedMatchId || '');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/png');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analyzedData, setAnalyzedData] = useState<MatchPressureData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [autoFillGoals, setAutoFillGoals] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'upload' | 'result'>('upload');
  const [dragOver, setDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync selected match if prop changes
  useEffect(() => {
    if (initialSelectedMatchId) {
      setSelectedMatchId(initialSelectedMatchId);
      const m = matches.find((m) => m.id === initialSelectedMatchId);
      if (m?.pressureData) {
        setAnalyzedData(m.pressureData);
        setActiveTab('result');
      }
    }
  }, [initialSelectedMatchId, matches]);

  // Support paste from clipboard (Ctrl+V)
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  const currentMatch = matches.find((m) => m.id === selectedMatchId) || null;

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP).');
      return;
    }

    setErrorMessage(null);
    setImageMimeType(file.type);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!imagePreview) {
      setErrorMessage('Faça o upload ou cole um print do gráfico antes de iniciar a análise.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/ai/parse-pressure-chart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: imagePreview,
          mimeType: imageMimeType,
          homeTeamHint: currentMatch?.homeTeamName,
          awayTeamHint: currentMatch?.awayTeamName,
        }),
      });

      const resJson = await response.json();

      if (!response.ok || !resJson.success) {
        throw new Error(resJson.error || 'Falha ao processar o gráfico de pressão.');
      }

      const result: MatchPressureData = {
        ...resJson.data,
        sourceImageUrl: imagePreview,
        importedAt: new Date().toISOString(),
      };

      setAnalyzedData(result);
      setActiveTab('result');

      // If no match was explicitly selected, attempt to find a match by team name/code
      if (!selectedMatchId && result.extractedTeams) {
        const hCode = (result.extractedTeams.homeCode || '').toLowerCase();
        const aCode = (result.extractedTeams.awayCode || '').toLowerCase();

        const matchCandidate = matches.find((m) => {
          const hName = m.homeTeamName.toLowerCase();
          const aName = m.awayTeamName.toLowerCase();
          return (
            (hCode && (hName.includes(hCode) || hCode.includes(hName))) ||
            (aCode && (aName.includes(aCode) || aCode.includes(aName)))
          );
        });

        if (matchCandidate) {
          setSelectedMatchId(matchCandidate.id);
        }
      }
    } catch (err: any) {
      console.error('Error analyzing image:', err);
      setErrorMessage(err.message || 'Erro ao comunicar com a IA para analisar o gráfico.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    if (!analyzedData) return;

    if (!selectedMatchId) {
      setErrorMessage('Por favor, selecione em qual partida deseja vincular os dados deste gráfico.');
      return;
    }

    onSavePressureData(selectedMatchId, analyzedData, autoFillGoals);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-400/30">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Importar Gráfico de Pressão (Termômetro da Partida)
                </h2>
                <span className="px-2 py-0.5 bg-blue-500/30 text-blue-300 border border-blue-400/30 text-[10px] font-bold rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> IA Vision
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Transforme prints e capturas do gráfico de momentum em dados estruturados minuto a minuto
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 shrink-0">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'upload'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            1. Enviar Imagem / Print
          </button>

          <button
            onClick={() => setActiveTab('result')}
            disabled={!analyzedData}
            className={`pb-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'result'
                ? 'border-blue-600 text-blue-600'
                : !analyzedData
                ? 'border-transparent text-slate-300 cursor-not-allowed'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            2. Dados & Gráfico Reconstruído
            {analyzedData && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Atenção:</span> {errorMessage}
              </div>
            </div>
          )}

          {/* Match Selection Bar */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Selecione a Partida para Vincular os Dados:
              </label>
              <select
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm"
              >
                <option value="">-- Selecione uma partida cadastrada --</option>
                {matches.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id} • {m.homeTeamName} {m.homeScore !== null ? m.homeScore : ''} x{' '}
                    {m.awayScore !== null ? m.awayScore : ''} {m.awayTeamName} ({m.leagueName} -{' '}
                    {new Date(m.matchDate).toLocaleDateString('pt-BR')})
                  </option>
                ))}
              </select>
            </div>

            {currentMatch && (
              <div className="px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-900 shrink-0">
                <span className="font-bold block">Partida Selecionada:</span>
                <span className="font-mono text-slate-700">
                  {currentMatch.homeTeamName} vs {currentMatch.awayTeamName}
                </span>
              </div>
            )}
          </div>

          {/* TAB 1: UPLOAD / PASTE */}
          {activeTab === 'upload' && (
            <div className="space-y-5">
              {/* Drag and drop upload box */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
                    : imagePreview
                    ? 'border-slate-300 bg-slate-50/50 hover:bg-slate-50'
                    : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50/20'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {imagePreview ? (
                  <div className="space-y-4">
                    <div className="relative inline-block max-w-full rounded-xl overflow-hidden shadow-md border border-slate-200">
                      <img
                        src={imagePreview}
                        alt="Gráfico de Pressão Preview"
                        className="max-h-64 object-contain mx-auto bg-slate-900"
                      />
                      <div className="absolute top-2 right-2 px-2.5 py-1 bg-slate-900/80 text-white rounded-md text-[10px] font-bold backdrop-blur-sm">
                        Imagem Carregada
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-3 text-xs text-slate-600">
                      <span className="font-medium">Clique ou solte outra imagem para trocar</span>
                      <span>•</span>
                      <span className="text-blue-600 font-bold flex items-center gap-1">
                        <ClipboardPaste className="w-3.5 h-3.5" />
                        Pressione Ctrl+V para colar novo print
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 py-4">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-100">
                      <FileImage className="w-8 h-8" />
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        Arraste o print do gráfico aqui ou clique para selecionar
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                        Suporta capturas de tela (screenshots) do termômetro da partida, gráfico de momentum e pressão dos 90 minutos.
                      </p>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-mono">
                      <ClipboardPaste className="w-3.5 h-3.5 text-blue-600" />
                      Dica: Tire um print e pressione <strong>Ctrl+V</strong> para colar direto!
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button: Analyze */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <div className="text-xs text-slate-500">
                  A IA Vision analisa minuto a minuto, picos críticos, gols marcados e domínio de cada tempo.
                </div>

                <button
                  type="button"
                  disabled={!imagePreview || isAnalyzing}
                  onClick={handleAnalyzeImage}
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all ${
                    !imagePreview || isAnalyzing
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Extraindo Dados do Gráfico com IA...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Processar Gráfico com IA Vision
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: RESULT & RECONSTRUCTED CHART */}
          {activeTab === 'result' && analyzedData && (
            <div className="space-y-6">
              {/* Pressure Chart Viewer */}
              <PressureChartViewer
                pressureData={analyzedData}
                match={currentMatch}
                homeTeamName={currentMatch?.homeTeamName || analyzedData.extractedTeams?.homeCode || 'Mandante'}
                awayTeamName={currentMatch?.awayTeamName || analyzedData.extractedTeams?.awayCode || 'Visitante'}
                onEdit={() => setActiveTab('upload')}
              />

              {/* Goal Autofill Option */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    Sincronização de Gols Detectados
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoFillGoals}
                      onChange={(e) => setAutoFillGoals(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-2 text-xs font-medium text-slate-700">Preencher minutos dos gols nas estatísticas</span>
                  </label>
                </div>

                {analyzedData.events && analyzedData.events.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {analyzedData.events.map((ev, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800"
                      >
                        ⚽ {ev.team === 'home' ? (analyzedData.extractedTeams?.homeCode || 'Mandante') : (analyzedData.extractedTeams?.awayCode || 'Visitante')} - {ev.minute}'
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    Nenhum gol ou marcador de ⚽ foi identificado no gráfico.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl transition-colors"
          >
            Fechar
          </button>

          {analyzedData && (
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              Salvar Dados no Jogo
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
