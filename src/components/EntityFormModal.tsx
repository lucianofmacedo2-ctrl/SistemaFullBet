import React, { useState, useEffect } from 'react';
import { X, Sparkles, Globe, Trophy, Shield, Check, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon } from 'lucide-react';
import { DbState, NewEntityCreatedNotification } from '../types';
import { findOrCreateCountry, findOrCreateLeague, findOrCreateTeam, getNextUniqueId } from '../utils/idGenerator';

interface EntityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbState: DbState;
  onSave: (
    updatedDbState: DbState,
    notifications: NewEntityCreatedNotification[]
  ) => void;
  initialType?: 'country' | 'league' | 'team';
}

export const EntityFormModal: React.FC<EntityFormModalProps> = ({
  isOpen,
  onClose,
  dbState,
  onSave,
  initialType = 'country',
}) => {
  const [entityType, setEntityType] = useState<'country' | 'league' | 'team'>(initialType);

  const [name, setName] = useState<string>('');
  const [countryId, setCountryId] = useState<string>('');
  const [extraInfo, setExtraInfo] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageStatus, setImageStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [imageDims, setImageDims] = useState<{ width: number; height: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!imageUrl.trim()) {
      setImageStatus('idle');
      setImageDims(null);
    } else {
      setImageStatus('loading');
      setImageDims(null);
    }
  }, [imageUrl]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg('Por favor, informe o nome.');
      return;
    }

    const trimmedImageUrl = imageUrl.trim() || undefined;

    const notifications: NewEntityCreatedNotification[] = [];

    if (entityType === 'country') {
      const res = findOrCreateCountry(trimmedName, dbState.countries, extraInfo, trimmedImageUrl);
      if (!res.isNew) {
        setErrorMsg('Este país já está cadastrado no banco de dados!');
        return;
      }
      notifications.push({
        type: 'country',
        id: res.country.id,
        name: res.country.name,
      });

      onSave(
        { ...dbState, countries: res.updatedCountries },
        notifications
      );
    } else if (entityType === 'league') {
      if (!countryId) {
        setErrorMsg('Selecione um País para vincular esta Liga.');
        return;
      }
      const selectedCountry = dbState.countries.find(c => c.id === countryId);
      if (!selectedCountry) {
        setErrorMsg('País selecionado inválido.');
        return;
      }

      const res = findOrCreateLeague(
        trimmedName,
        selectedCountry.id,
        selectedCountry.name,
        dbState.leagues,
        extraInfo || 'Pontos Corridos',
        trimmedImageUrl
      );

      if (!res.isNew) {
        setErrorMsg('Esta liga já está cadastrada para este país.');
        return;
      }

      notifications.push({
        type: 'league',
        id: res.league.id,
        name: res.league.name,
      });

      onSave(
        { ...dbState, leagues: res.updatedLeagues },
        notifications
      );
    } else if (entityType === 'team') {
      if (!countryId) {
        setErrorMsg('Selecione um País para vincular este Time.');
        return;
      }
      const selectedCountry = dbState.countries.find(c => c.id === countryId);
      if (!selectedCountry) {
        setErrorMsg('País selecionado inválido.');
        return;
      }

      const res = findOrCreateTeam(
        trimmedName,
        selectedCountry.id,
        selectedCountry.name,
        dbState.teams,
        extraInfo,
        trimmedImageUrl
      );

      if (!res.isNew) {
        setErrorMsg('Este time já está cadastrado.');
        return;
      }

      notifications.push({
        type: 'team',
        id: res.team.id,
        name: res.team.name,
      });

      onSave(
        { ...dbState, teams: res.updatedTeams },
        notifications
      );
    }

    setName('');
    setExtraInfo('');
    setImageUrl('');
    onClose();
  };

  // Preview next ID
  let nextIdPreview = '';
  if (entityType === 'country') {
    nextIdPreview = getNextUniqueId('PAIS', dbState.countries.map(c => c.id));
  } else if (entityType === 'league') {
    nextIdPreview = getNextUniqueId('LIGA', dbState.leagues.map(l => l.id));
  } else {
    nextIdPreview = getNextUniqueId('TIME', dbState.teams.map(t => t.id));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-[#0e0e0e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#080808] border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Cadastrar Entidade</h2>
              <p className="text-xs text-gray-400">Geração automática de ID Único</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium">
              {errorMsg}
            </div>
          )}

          {/* Type Switcher */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
              Tipo de Entidade
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-[#060606] rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setEntityType('country')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  entityType === 'country'
                    ? 'bg-emerald-500 text-black shadow-md'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                País
              </button>

              <button
                type="button"
                onClick={() => setEntityType('league')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  entityType === 'league'
                    ? 'bg-emerald-500 text-black shadow-md'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                Liga
              </button>

              <button
                type="button"
                onClick={() => setEntityType('team')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  entityType === 'team'
                    ? 'bg-emerald-500 text-black shadow-md'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Time
              </button>
            </div>
          </div>

          {/* ID Preview Box */}
          <div className="p-3 bg-[#060606] rounded-xl border border-emerald-500/30 flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Próximo ID Único a ser gerado:</span>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-500/40">
              {nextIdPreview}
            </span>
          </div>

          {/* Country selector if League or Team */}
          {(entityType === 'league' || entityType === 'team') && (
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                País Vinculado
              </label>
              {dbState.countries.length === 0 ? (
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-xs">
                  Nenhum país cadastrado. Cadastre um país primeiro ou digite o país diretamente ao cadastrar um jogo!
                </div>
              ) : (
                <select
                  value={countryId}
                  onChange={(e) => setCountryId(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-emerald-500"
                  required
                >
                  <option value="">-- Selecione o País --</option>
                  {dbState.countries.map(c => (
                    <option key={c.id} value={c.id}>
                      [{c.id}] {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Name Input */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Nome do {entityType === 'country' ? 'País' : entityType === 'league' ? 'Liga' : 'Time'}
            </label>
            <input
              type="text"
              placeholder={
                entityType === 'country'
                  ? 'Ex: Brasil, Itália...'
                  : entityType === 'league'
                  ? 'Ex: Brasileirão, Serie A TIM...'
                  : 'Ex: Flamengo, Juventus...'
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          {/* Extra input (Code/Type/Stadium) */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              {entityType === 'country'
                ? 'Código ISO / Sigla (Opcional)'
                : entityType === 'league'
                ? 'Tipo de Competição'
                : 'Estádio (Opcional)'}
            </label>
            <input
              type="text"
              placeholder={
                entityType === 'country'
                  ? 'Ex: BRA, ESP'
                  : entityType === 'league'
                  ? 'Ex: Pontos Corridos, Mata-Mata'
                  : 'Ex: Allianz Parque'
              }
              value={extraInfo}
              onChange={(e) => setExtraInfo(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Logo / Flag Image Link Input + Live Preview */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-200">
              {entityType === 'country'
                ? 'Link / URL da Bandeira (Opcional)'
                : entityType === 'league'
                ? 'Link / URL do Logo da Liga (Opcional)'
                : 'Link / URL do Escudo / Logo do Time (Opcional)'}
            </label>
            
            <input
              type="url"
              placeholder={
                entityType === 'country'
                  ? 'https://flagcdn.com/w80/br.png'
                  : entityType === 'league'
                  ? 'https://exemplo.com/logo-liga.png'
                  : 'https://exemplo.com/escudo-time.png'
              }
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 font-mono"
            />

            {/* Live Image Preview Box */}
            <div className="p-3 bg-[#080808] border border-white/10 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-gray-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                  Pré-visualização do Escudo / Logo:
                </span>

                {/* Status Badges */}
                {imageStatus === 'idle' && (
                  <span className="text-gray-500 text-[10px]">Aguardando link...</span>
                )}
                {imageStatus === 'loading' && (
                  <span className="text-blue-400 text-[10px] flex items-center gap-1 font-mono">
                    <Loader2 className="w-3 h-3 animate-spin" /> Carregando...
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
                {/* Visual Image Preview Box with checkerboard contrast background */}
                <div className="w-16 h-16 rounded-xl bg-[radial-gradient(#222_1px,transparent_1px)] [background-size:8px_8px] bg-[#121212] border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-inner relative group">
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

                  {/* Fallback Icon when empty or error */}
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

                {/* Status Explanation Text */}
                <div className="space-y-1 text-xs">
                  {imageStatus === 'idle' && (
                    <p className="text-gray-400 text-[11px] leading-relaxed">
                      Cole qualquer link direto de imagem (<code className="text-emerald-400 font-mono">.png, .jpg, .svg</code>) para verificar se o escudo aparece corretamente.
                    </p>
                  )}
                  {imageStatus === 'loading' && (
                    <p className="text-blue-300 text-[11px]">
                      Testando o carregamento da imagem e conexões...
                    </p>
                  )}
                  {imageStatus === 'success' && (
                    <div>
                      <p className="text-emerald-300 font-semibold text-xs">
                        ✓ Imagem carregada perfeitamente!
                      </p>
                      <p className="text-gray-400 text-[11px]">
                        Este escudo será exibido no cadastro e nos placares.
                      </p>
                    </div>
                  )}
                  {imageStatus === 'error' && (
                    <div>
                      <p className="text-red-300 font-semibold text-xs">
                        ✕ Não foi possível carregar o link
                      </p>
                      <p className="text-gray-400 text-[11px]">
                        Verifique se a URL termina com extensão de imagem ou permite acesso externo (CORS).
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-sm font-semibold rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/10 transition-all"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              Salvar Entidade
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
