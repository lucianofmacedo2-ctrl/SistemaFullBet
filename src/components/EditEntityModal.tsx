import React, { useState, useEffect } from 'react';
import { X, Globe, Trophy, Shield, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon, Save } from 'lucide-react';
import { DbState, Country, League, Team } from '../types';

interface EditEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'country' | 'league' | 'team' | null;
  entityData: Country | League | Team | null;
  dbState: DbState;
  onSaveCountry: (countryId: string, updated: { name: string; code?: string; flagUrl?: string }) => void;
  onSaveLeague: (leagueId: string, updated: { name: string; countryId: string; countryName: string; type?: string; logoUrl?: string }) => void;
  onSaveTeam: (teamId: string, updated: { name: string; countryId: string; countryName: string; leagueId?: string; leagueName?: string; stadium?: string; logoUrl?: string }) => void;
}

export const EditEntityModal: React.FC<EditEntityModalProps> = ({
  isOpen,
  onClose,
  entityType,
  entityData,
  dbState,
  onSaveCountry,
  onSaveLeague,
  onSaveTeam,
}) => {
  const [name, setName] = useState('');
  const [countryId, setCountryId] = useState('');
  const [leagueId, setLeagueId] = useState('');
  const [extraInfo, setExtraInfo] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const [imageStatus, setImageStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [imageDims, setImageDims] = useState<{ width: number; height: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Pre-fill state when entityData changes or modal opens
  useEffect(() => {
    if (entityData && entityType) {
      setName(entityData.name || '');
      setErrorMsg('');

      if (entityType === 'country') {
        const country = entityData as Country;
        setExtraInfo(country.code || '');
        setImageUrl(country.flagUrl || '');
        setCountryId('');
        setLeagueId('');
      } else if (entityType === 'league') {
        const league = entityData as League;
        setCountryId(league.countryId || '');
        setLeagueId('');
        setExtraInfo(league.type || 'Pontos Corridos');
        setImageUrl(league.logoUrl || '');
      } else if (entityType === 'team') {
        const team = entityData as Team;
        setCountryId(team.countryId || '');
        setLeagueId(team.leagueId || '');
        setExtraInfo('');
        setImageUrl(team.logoUrl || '');
      }
    }
  }, [entityData, entityType, isOpen]);

  // Image status watcher
  useEffect(() => {
    if (!imageUrl.trim()) {
      setImageStatus('idle');
      setImageDims(null);
    } else {
      setImageStatus('loading');
      setImageDims(null);
    }
  }, [imageUrl]);

  if (!isOpen || !entityType || !entityData) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg('Por favor, informe o nome.');
      return;
    }

    const trimmedImageUrl = imageUrl.trim() || undefined;

    if (entityType === 'country') {
      onSaveCountry(entityData.id, {
        name: trimmedName,
        code: extraInfo.trim().toUpperCase() || undefined,
        flagUrl: trimmedImageUrl,
      });
    } else if (entityType === 'league') {
      if (!countryId) {
        setErrorMsg('Selecione um País válido para a liga.');
        return;
      }
      const selectedCountry = dbState.countries.find(c => c.id === countryId);
      onSaveLeague(entityData.id, {
        name: trimmedName,
        countryId,
        countryName: selectedCountry?.name || '',
        type: extraInfo.trim() || 'Pontos Corridos',
        logoUrl: trimmedImageUrl,
      });
    } else if (entityType === 'team') {
      if (!countryId) {
        setErrorMsg('Selecione um País válido para o time.');
        return;
      }
      const selectedCountry = dbState.countries.find(c => c.id === countryId);
      const selectedLeague = dbState.leagues.find(l => l.id === leagueId);
      onSaveTeam(entityData.id, {
        name: trimmedName,
        countryId,
        countryName: selectedCountry?.name || '',
        leagueId: selectedLeague ? selectedLeague.id : undefined,
        leagueName: selectedLeague ? selectedLeague.name : undefined,
        logoUrl: trimmedImageUrl,
      });
    }

    onClose();
  };

  const getModalTitle = () => {
    switch (entityType) {
      case 'country':
        return `Editar País (${entityData.id})`;
      case 'league':
        return `Editar Liga / Campeonato (${entityData.id})`;
      case 'team':
        return `Editar Time de Futebol (${entityData.id})`;
    }
  };

  const getEntityIcon = () => {
    switch (entityType) {
      case 'country':
        return <Globe className="w-5 h-5 text-emerald-400" />;
      case 'league':
        return <Trophy className="w-5 h-5 text-emerald-400" />;
      case 'team':
        return <Shield className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-[#0e0e0e] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#080808]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              {getEntityIcon()}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {getModalTitle()}
              </h3>
              <p className="text-xs text-gray-400">
                Altere as informações cadastradas no banco de dados.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Unique ID Display */}
          <div className="p-2.5 bg-[#080808] border border-white/5 rounded-xl flex items-center justify-between">
            <span className="text-xs text-gray-400">ID Único no Banco:</span>
            <span className="font-mono font-bold text-xs text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded">
              {entityData.id}
            </span>
          </div>

          {/* Name Input */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Nome do {entityType === 'country' ? 'País' : entityType === 'league' ? 'Campeonato / Liga' : 'Time'} *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Country Selection for Leagues & Teams */}
          {(entityType === 'league' || entityType === 'team') && (
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                País Correspondente *
              </label>
              <select
                required
                value={countryId}
                onChange={(e) => setCountryId(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="" disabled>Select Country...</option>
                {dbState.countries.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.id})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* League Selection for Teams */}
          {entityType === 'team' && countryId && (
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Liga / Divisão Principal (Opcional)
              </label>
              <select
                value={leagueId}
                onChange={(e) => setLeagueId(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Sem liga vinculada --</option>
                {dbState.leagues
                  .filter(l => l.countryId === countryId)
                  .map(l => (
                    <option key={l.id} value={l.id}>
                      [{l.id}] {l.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Extra Info Input for Country and League */}
          {(entityType === 'country' || entityType === 'league') && (
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                {entityType === 'country'
                  ? 'Sigla / Código do País (Ex: BRA, ARG)'
                  : 'Tipo de Campeonato (Ex: Pontos Corridos, Copa, Eliminatória)'}
              </label>
              <input
                type="text"
                value={extraInfo}
                onChange={(e) => setExtraInfo(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>
          )}

          {/* Image URL Input + Live Preview */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-200">
              {entityType === 'country'
                ? 'Link / URL da Bandeira'
                : entityType === 'league'
                ? 'Link / URL do Logo da Liga'
                : 'Link / URL do Escudo do Time'}
            </label>

            <input
              type="url"
              placeholder="https://exemplo.com/imagem.png"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 font-mono"
            />

            {/* Live Image Preview Box */}
            <div className="p-3 bg-[#080808] border border-white/10 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-gray-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                  Pré-visualização da Imagem:
                </span>

                {/* Status Badges */}
                {imageStatus === 'idle' && (
                  <span className="text-gray-500 text-[10px]">Sem link preenchido</span>
                )}
                {imageStatus === 'loading' && (
                  <span className="text-blue-400 text-[10px] flex items-center gap-1 font-mono">
                    <Loader2 className="w-3 h-3 animate-spin" /> Testando...
                  </span>
                )}
                {imageStatus === 'success' && (
                  <span className="text-emerald-400 text-[10px] flex items-center gap-1 font-semibold font-mono bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Link OK {imageDims ? `(${imageDims.width}x${imageDims.height}px)` : ''}
                  </span>
                )}
                {imageStatus === 'error' && (
                  <span className="text-red-400 text-[10px] flex items-center gap-1 font-semibold font-mono bg-red-950/60 border border-red-500/30 px-1.5 py-0.5 rounded">
                    <AlertCircle className="w-3 h-3 text-red-400" /> Link Indisponível
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 bg-[#030303] p-3 rounded-lg border border-white/5">
                <div className="w-16 h-16 rounded-xl bg-[radial-gradient(#222_1px,transparent_1px)] [background-size:8px_8px] bg-[#121212] border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-inner relative">
                  {imageUrl.trim() ? (
                    <img
                      src={imageUrl.trim()}
                      alt="Pré-visualização"
                      className={`w-full h-full object-contain p-1 transition-opacity duration-200 ${
                        imageStatus === 'loading' ? 'opacity-30' : imageStatus === 'error' ? 'hidden' : 'opacity-100'
                      }`}
                      onLoad={(e) => {
                        setImageStatus('success');
                        setImageDims({
                          width: e.currentTarget.naturalWidth,
                          height: e.currentTarget.naturalHeight,
                        });
                      }}
                      onError={() => {
                        setImageStatus('error');
                        setImageDims(null);
                      }}
                    />
                  ) : null}

                  {(imageStatus === 'idle' || imageStatus === 'error') && (
                    <div className="text-center p-1">
                      {imageStatus === 'error' ? (
                        <AlertCircle className="w-6 h-6 text-red-400 mx-auto" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-gray-600 mx-auto" />
                      )}
                    </div>
                  )}

                  {imageStatus === 'loading' && (
                    <Loader2 className="w-5 h-5 text-emerald-400 animate-spin absolute" />
                  )}
                </div>

                <div className="space-y-1 text-xs">
                  {imageStatus === 'idle' && (
                    <p className="text-gray-400 text-[11px]">
                      Cole qualquer link direto de imagem (<code className="text-emerald-400 font-mono">.png, .jpg, .svg</code>).
                    </p>
                  )}
                  {imageStatus === 'loading' && (
                    <p className="text-blue-300 text-[11px]">
                      Testando o carregamento da imagem...
                    </p>
                  )}
                  {imageStatus === 'success' && (
                    <p className="text-emerald-300 font-semibold text-xs">
                      ✓ Imagem carregada e pronta para atualização!
                    </p>
                  )}
                  {imageStatus === 'error' && (
                    <p className="text-red-300 font-semibold text-xs">
                      ✕ Não foi possível carregar a imagem. Verifique o link.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" /> Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
