import React, { useState, useEffect } from 'react';
import { X, Sparkles, Plus, Calendar, Trophy, Globe, Shield, MapPin, Hash, Check } from 'lucide-react';
import { DbState, Match, MatchStatus, NewEntityCreatedNotification } from '../types';
import { findOrCreateCountry, findOrCreateLeague, findOrCreateTeam, getNextUniqueId } from '../utils/idGenerator';

interface MatchFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbState: DbState;
  onSaveMatch: (
    updatedDbState: DbState,
    notifications: NewEntityCreatedNotification[]
  ) => void;
  editingMatch?: Match | null;
}

export const MatchFormModal: React.FC<MatchFormModalProps> = ({
  isOpen,
  onClose,
  dbState,
  onSaveMatch,
  editingMatch,
}) => {
  // Country selection
  const [selectedCountryId, setSelectedCountryId] = useState<string>('NEW');
  const [newCountryName, setNewCountryName] = useState<string>('');

  // League selection
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('NEW');
  const [newLeagueName, setNewLeagueName] = useState<string>('');

  // Teams selection
  const [selectedHomeTeamId, setSelectedHomeTeamId] = useState<string>('NEW');
  const [newHomeTeamName, setNewHomeTeamName] = useState<string>('');

  const [selectedAwayTeamId, setSelectedAwayTeamId] = useState<string>('NEW');
  const [newAwayTeamName, setNewAwayTeamName] = useState<string>('');

  // Match details
  const [matchDate, setMatchDate] = useState<string>('');
  const [homeScore, setHomeScore] = useState<string>('');
  const [awayScore, setAwayScore] = useState<string>('');
  const [status, setStatus] = useState<MatchStatus>('FINALIZADO');
  const [round, setRound] = useState<string>('Rodada 1');
  const [stadium, setStadium] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [errorMsg, setErrorMsg] = useState<string>('');

  // Populate form if editing or when opening
  useEffect(() => {
    if (editingMatch) {
      setSelectedCountryId(editingMatch.countryId);
      setSelectedLeagueId(editingMatch.leagueId);
      setSelectedHomeTeamId(editingMatch.homeTeamId);
      setSelectedAwayTeamId(editingMatch.awayTeamId);

      setMatchDate(editingMatch.matchDate.substring(0, 16));
      setHomeScore(editingMatch.homeScore !== null ? String(editingMatch.homeScore) : '');
      setAwayScore(editingMatch.awayScore !== null ? String(editingMatch.awayScore) : '');
      setStatus(editingMatch.status);
      setRound(editingMatch.round || '');
      setStadium(editingMatch.stadium || '');
      setNotes(editingMatch.notes || '');
    } else {
      // Default initial date: today now
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setMatchDate(now.toISOString().slice(0, 16));

      setSelectedCountryId('NEW');
      setNewCountryName('');
      setSelectedLeagueId('NEW');
      setNewLeagueName('');
      setSelectedHomeTeamId('NEW');
      setNewHomeTeamName('');
      setSelectedAwayTeamId('NEW');
      setNewAwayTeamName('');
      setHomeScore('');
      setAwayScore('');
      setStatus('FINALIZADO');
      setRound('Rodada 1');
      setStadium('');
      setNotes('');
    }
    setErrorMsg('');
  }, [editingMatch, isOpen]);

  if (!isOpen) return null;

  // Filtered lists for dropdowns
  const countries = dbState.countries;
  const filteredLeagues = selectedCountryId && selectedCountryId !== 'NEW'
    ? dbState.leagues.filter(l => l.countryId === selectedCountryId)
    : dbState.leagues;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Determine final Country Name
    let finalCountryName = '';
    if (selectedCountryId === 'NEW') {
      finalCountryName = newCountryName.trim();
      if (!finalCountryName) {
        setErrorMsg('Por favor, informe o nome do País.');
        return;
      }
    } else {
      const existingCountry = countries.find(c => c.id === selectedCountryId);
      finalCountryName = existingCountry ? existingCountry.name : '';
    }

    // Determine final League Name
    let finalLeagueName = '';
    if (selectedLeagueId === 'NEW') {
      finalLeagueName = newLeagueName.trim();
      if (!finalLeagueName) {
        setErrorMsg('Por favor, informe o nome da Liga.');
        return;
      }
    } else {
      const existingLeague = dbState.leagues.find(l => l.id === selectedLeagueId);
      finalLeagueName = existingLeague ? existingLeague.name : '';
    }

    // Determine final Home Team Name
    let finalHomeTeamName = '';
    if (selectedHomeTeamId === 'NEW') {
      finalHomeTeamName = newHomeTeamName.trim();
      if (!finalHomeTeamName) {
        setErrorMsg('Por favor, informe o Time Mandante.');
        return;
      }
    } else {
      const existingTeam = dbState.teams.find(t => t.id === selectedHomeTeamId);
      finalHomeTeamName = existingTeam ? existingTeam.name : '';
    }

    // Determine final Away Team Name
    let finalAwayTeamName = '';
    if (selectedAwayTeamId === 'NEW') {
      finalAwayTeamName = newAwayTeamName.trim();
      if (!finalAwayTeamName) {
        setErrorMsg('Por favor, informe o Time Visitante.');
        return;
      }
    } else {
      const existingTeam = dbState.teams.find(t => t.id === selectedAwayTeamId);
      finalAwayTeamName = existingTeam ? existingTeam.name : '';
    }

    if (finalHomeTeamName.toLowerCase() === finalAwayTeamName.toLowerCase()) {
      setErrorMsg('O Time Mandante e o Time Visitante não podem ser iguais.');
      return;
    }

    const notifications: NewEntityCreatedNotification[] = [];

    // 1. Process Country
    let currentCountries = [...dbState.countries];
    const countryRes = findOrCreateCountry(finalCountryName, currentCountries);
    currentCountries = countryRes.updatedCountries;
    if (countryRes.isNew) {
      notifications.push({
        type: 'country',
        id: countryRes.country.id,
        name: countryRes.country.name,
      });
    }

    // 2. Process League
    let currentLeagues = [...dbState.leagues];
    const leagueRes = findOrCreateLeague(
      finalLeagueName,
      countryRes.country.id,
      countryRes.country.name,
      currentLeagues
    );
    currentLeagues = leagueRes.updatedLeagues;
    if (leagueRes.isNew) {
      notifications.push({
        type: 'league',
        id: leagueRes.league.id,
        name: leagueRes.league.name,
      });
    }

    // 3. Process Home Team
    let currentTeams = [...dbState.teams];
    const homeTeamRes = findOrCreateTeam(
      finalHomeTeamName,
      countryRes.country.id,
      countryRes.country.name,
      currentTeams,
      stadium
    );
    currentTeams = homeTeamRes.updatedTeams;
    if (homeTeamRes.isNew) {
      notifications.push({
        type: 'team',
        id: homeTeamRes.team.id,
        name: homeTeamRes.team.name,
      });
    }

    // 4. Process Away Team
    const awayTeamRes = findOrCreateTeam(
      finalAwayTeamName,
      countryRes.country.id,
      countryRes.country.name,
      currentTeams
    );
    currentTeams = awayTeamRes.updatedTeams;
    if (awayTeamRes.isNew) {
      notifications.push({
        type: 'team',
        id: awayTeamRes.team.id,
        name: awayTeamRes.team.name,
      });
    }

    // 5. Process Match
    let currentMatches = [...dbState.matches];
    let matchId = '';

    if (editingMatch) {
      matchId = editingMatch.id;
      currentMatches = currentMatches.map(m => {
        if (m.id === editingMatch.id) {
          return {
            ...m,
            countryId: countryRes.country.id,
            countryName: countryRes.country.name,
            countryFlagUrl: countryRes.country.flagUrl,
            leagueId: leagueRes.league.id,
            leagueName: leagueRes.league.name,
            leagueLogoUrl: leagueRes.league.logoUrl,
            homeTeamId: homeTeamRes.team.id,
            homeTeamName: homeTeamRes.team.name,
            homeTeamLogoUrl: homeTeamRes.team.logoUrl,
            awayTeamId: awayTeamRes.team.id,
            awayTeamName: awayTeamRes.team.name,
            awayTeamLogoUrl: awayTeamRes.team.logoUrl,
            homeScore: homeScore !== '' ? parseInt(homeScore, 10) : null,
            awayScore: awayScore !== '' ? parseInt(awayScore, 10) : null,
            matchDate: matchDate || new Date().toISOString(),
            round,
            stadium,
            status,
            notes,
          };
        }
        return m;
      });
    } else {
      matchId = getNextUniqueId('JOGO', currentMatches.map(m => m.id));
      const newMatch: Match = {
        id: matchId,
        countryId: countryRes.country.id,
        countryName: countryRes.country.name,
        countryFlagUrl: countryRes.country.flagUrl,
        leagueId: leagueRes.league.id,
        leagueName: leagueRes.league.name,
        leagueLogoUrl: leagueRes.league.logoUrl,
        homeTeamId: homeTeamRes.team.id,
        homeTeamName: homeTeamRes.team.name,
        homeTeamLogoUrl: homeTeamRes.team.logoUrl,
        awayTeamId: awayTeamRes.team.id,
        awayTeamName: awayTeamRes.team.name,
        awayTeamLogoUrl: awayTeamRes.team.logoUrl,
        homeScore: homeScore !== '' ? parseInt(homeScore, 10) : null,
        awayScore: awayScore !== '' ? parseInt(awayScore, 10) : null,
        matchDate: matchDate || new Date().toISOString(),
        round,
        stadium,
        status,
        notes,
        createdAt: new Date().toISOString(),
      };
      currentMatches.push(newMatch);

      notifications.push({
        type: 'match',
        id: matchId,
        name: `${homeTeamRes.team.name} x ${awayTeamRes.team.name}`,
      });
    }

    const updatedState: DbState = {
      countries: currentCountries,
      leagues: currentLeagues,
      teams: currentTeams,
      matches: currentMatches,
    };

    onSaveMatch(updatedState, notifications);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0e0e0e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#080808] border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {editingMatch ? 'Editar Jogo' : 'Cadastrar Novo Jogo de Futebol'}
              </h2>
              <p className="text-xs text-gray-400">
                Ligas, Países e Times novos recebem IDs Únicos na 1ª vez.
              </p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium">
              {errorMsg}
            </div>
          )}

          {/* Section 1: País & Liga */}
          <div className="bg-[#080808] p-4 rounded-xl border border-white/10 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5" />
              <span>1. Localização & Competição</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Country Field */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  País
                </label>
                <select
                  value={selectedCountryId}
                  onChange={(e) => setSelectedCountryId(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="NEW">+ Cadastrar Novo País</option>
                  {countries.map(c => (
                    <option key={c.id} value={c.id}>
                      [{c.id}] {c.name}
                    </option>
                  ))}
                </select>

                {selectedCountryId === 'NEW' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Ex: Brasil, Espanha, Inglaterra..."
                      value={newCountryName}
                      onChange={(e) => setNewCountryName(e.target.value)}
                      className="w-full bg-[#141414] border border-white/10 focus:border-emerald-500 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500"
                      required
                    />
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-mono">
                      <Sparkles className="w-3 h-3" /> ID Único será gerado (ex: PAIS-001)
                    </span>
                  </div>
                )}
              </div>

              {/* League Field */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Liga / Campeonato
                </label>
                <select
                  value={selectedLeagueId}
                  onChange={(e) => setSelectedLeagueId(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="NEW">+ Cadastrar Nova Liga</option>
                  {filteredLeagues.map(l => (
                    <option key={l.id} value={l.id}>
                      [{l.id}] {l.name}
                    </option>
                  ))}
                </select>

                {selectedLeagueId === 'NEW' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Ex: Brasileirão, La Liga, Premier League..."
                      value={newLeagueName}
                      onChange={(e) => setNewLeagueName(e.target.value)}
                      className="w-full bg-[#141414] border border-white/10 focus:border-emerald-500 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500"
                      required
                    />
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-mono">
                      <Sparkles className="w-3 h-3" /> ID Único será gerado (ex: LIGA-001)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Teams (Mandante x Visitante) */}
          <div className="bg-[#080808] p-4 rounded-xl border border-white/10 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5" />
              <span>2. Times Confrontantes</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Home Team */}
              <div className="bg-[#0e0e0e] p-3 rounded-lg border border-white/10">
                <label className="block text-xs font-bold text-emerald-400 mb-1">
                  🏠 Time Mandante (Casa)
                </label>
                <select
                  value={selectedHomeTeamId}
                  onChange={(e) => setSelectedHomeTeamId(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="NEW">+ Cadastrar Novo Time</option>
                  {dbState.teams.map(t => (
                    <option key={t.id} value={t.id}>
                      [{t.id}] {t.name} ({t.countryName})
                    </option>
                  ))}
                </select>

                {selectedHomeTeamId === 'NEW' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Ex: Flamengo, Real Madrid..."
                      value={newHomeTeamName}
                      onChange={(e) => setNewHomeTeamName(e.target.value)}
                      className="w-full bg-[#141414] border border-white/10 focus:border-emerald-500 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500"
                      required
                    />
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-mono">
                      <Sparkles className="w-3 h-3" /> ID Único será gerado (ex: TIME-001)
                    </span>
                  </div>
                )}
              </div>

              {/* Away Team */}
              <div className="bg-[#0e0e0e] p-3 rounded-lg border border-white/10">
                <label className="block text-xs font-bold text-emerald-400 mb-1">
                  ✈️ Time Visitante (Fora)
                </label>
                <select
                  value={selectedAwayTeamId}
                  onChange={(e) => setSelectedAwayTeamId(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="NEW">+ Cadastrar Novo Time</option>
                  {dbState.teams.map(t => (
                    <option key={t.id} value={t.id}>
                      [{t.id}] {t.name} ({t.countryName})
                    </option>
                  ))}
                </select>

                {selectedAwayTeamId === 'NEW' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Ex: Palmeiras, Barcelona..."
                      value={newAwayTeamName}
                      onChange={(e) => setNewAwayTeamName(e.target.value)}
                      className="w-full bg-[#141414] border border-white/10 focus:border-emerald-500 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500"
                      required
                    />
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-mono">
                      <Sparkles className="w-3 h-3" /> ID Único será gerado (ex: TIME-002)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Placar & Status & Detalhes */}
          <div className="bg-[#080808] p-4 rounded-xl border border-white/10 space-y-4">
            {/* Quick Match Type Selector Banner */}
            <div className="flex items-center gap-2 p-1 bg-[#141414] rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setStatus('AGENDADO');
                  setHomeScore('');
                  setAwayScore('');
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  status === 'AGENDADO'
                    ? 'bg-blue-500 text-black shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Cadastrar Jogo Futuro (Agendado)
              </button>

              <button
                type="button"
                onClick={() => setStatus('FINALIZADO')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  status === 'FINALIZADO'
                    ? 'bg-emerald-500 text-black shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                Jogo Já Realizado (Finalizado)
              </button>
            </div>

            {status === 'AGENDADO' && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 text-xs flex items-start gap-2">
                <Calendar className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Jogo Agendado:</strong> O placar ficará em aberto. Assim que a partida for realizada, você poderá lançar o resultado e todas as estatísticas detalhadas com apenas um clique!
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <Trophy className="w-3.5 h-3.5" />
                <span>3. Placar, Data & Status</span>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400">Status:</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as MatchStatus)}
                  className="bg-[#1a1a1a] border border-white/10 text-xs text-white rounded-lg px-2 py-1 focus:border-emerald-500 font-semibold"
                >
                  <option value="FINALIZADO">Finalizado</option>
                  <option value="AGENDADO">Agendado</option>
                  <option value="EM_ANDAMENTO">Em Andamento</option>
                  <option value="ADIADO">Adiado</option>
                </select>
              </div>
            </div>

            {/* Scoreboard Input */}
            <div className="flex items-center justify-center gap-4 py-2 bg-[#0e0e0e] rounded-xl border border-white/10">
              <div className="text-center">
                <span className="text-[11px] font-semibold text-gray-400 uppercase block mb-1">
                  Gols Mandante
                </span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={homeScore}
                  onChange={(e) => setHomeScore(e.target.value)}
                  className="w-16 h-12 text-center text-xl font-black bg-[#060606] border border-white/10 rounded-xl text-emerald-400 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="text-xl font-bold text-gray-500 mt-4">X</div>

              <div className="text-center">
                <span className="text-[11px] font-semibold text-gray-400 uppercase block mb-1">
                  Gols Visitante
                </span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={awayScore}
                  onChange={(e) => setAwayScore(e.target.value)}
                  className="w-16 h-12 text-center text-xl font-black bg-[#060606] border border-white/10 rounded-xl text-emerald-400 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            {/* Date, Round, Stadium */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-medium text-gray-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" /> Data e Hora
                </label>
                <input
                  type="datetime-local"
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-2.5 py-1.5 text-gray-100 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-gray-300 mb-1">
                  Rodada / Fase
                </label>
                <input
                  type="text"
                  placeholder="Ex: Rodada 1, Final..."
                  value={round}
                  onChange={(e) => setRound(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-2.5 py-1.5 text-gray-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-300 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" /> Estádio
                </label>
                <input
                  type="text"
                  placeholder="Ex: Maracanã"
                  value={stadium}
                  onChange={(e) => setStadium(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-2.5 py-1.5 text-gray-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Observações (opcional)
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Árbitro, público, tempo extra, expulsões..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-2.5 text-xs text-gray-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Submit Footer */}
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
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              {editingMatch ? 'Salvar Alterações' : 'Cadastrar Jogo no Banco'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
