import React, { useState, useEffect } from 'react';
import { X, Sparkles, Plus, Calendar, Trophy, Globe, Shield, MapPin, Hash, Check, TrendingUp, DollarSign, Clock, Zap, Table, FileText } from 'lucide-react';
import { DbState, Match, MatchStatus, MatchOdds, NewEntityCreatedNotification, Team } from '../types';
import { findOrCreateCountry, findOrCreateLeague, findOrCreateTeam, getNextUniqueId } from '../utils/idGenerator';
import { MultiMatchQuickEntry } from './MultiMatchQuickEntry';

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
  // Mode selection: 'multi' (multiple matches fast entry) vs 'single' (full detailed match form)
  const [entryMode, setEntryMode] = useState<'multi' | 'single'>('multi');

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
  const [referee, setReferee] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Odds FT (1X2 & Over/Under 2.5)
  const [oddHomeFT, setOddHomeFT] = useState<string>('');
  const [oddDrawFT, setOddDrawFT] = useState<string>('');
  const [oddAwayFT, setOddAwayFT] = useState<string>('');
  const [oddOver25FT, setOddOver25FT] = useState<string>('');
  const [oddUnder25FT, setOddUnder25FT] = useState<string>('');

  // Handicap Asiático FT
  const [asianHandicapHomeLine, setAsianHandicapHomeLine] = useState<string>('');
  const [asianHandicapHomeOdd, setAsianHandicapHomeOdd] = useState<string>('');
  const [asianHandicapAwayLine, setAsianHandicapAwayLine] = useState<string>('');
  const [asianHandicapAwayOdd, setAsianHandicapAwayOdd] = useState<string>('');

  // Intercontinental tournament mode & country filters for teams
  const [isContinental, setIsContinental] = useState<boolean>(false);
  const [homeCountryFilterId, setHomeCountryFilterId] = useState<string>('');
  const [awayCountryFilterId, setAwayCountryFilterId] = useState<string>('');
  const [showAllCountryTeams, setShowAllCountryTeams] = useState<boolean>(false);

  const [errorMsg, setErrorMsg] = useState<string>('');

  // Populate form if editing or when opening
  useEffect(() => {
    if (editingMatch) {
      setEntryMode('single');
      setSelectedCountryId(editingMatch.countryId);
      setSelectedLeagueId(editingMatch.leagueId);
      setSelectedHomeTeamId(editingMatch.homeTeamId);
      setSelectedAwayTeamId(editingMatch.awayTeamId);

      setIsContinental(editingMatch.isContinental || false);
      const hTeam = dbState.teams.find(t => t.id === editingMatch.homeTeamId);
      setHomeCountryFilterId(hTeam ? hTeam.countryId : '');
      const aTeam = dbState.teams.find(t => t.id === editingMatch.awayTeamId);
      setAwayCountryFilterId(aTeam ? aTeam.countryId : '');
      setShowAllCountryTeams(false);

      setMatchDate(editingMatch.matchDate.substring(0, 16));
      setHomeScore(editingMatch.homeScore !== null ? String(editingMatch.homeScore) : '');
      setAwayScore(editingMatch.awayScore !== null ? String(editingMatch.awayScore) : '');
      setStatus(editingMatch.status);
      setReferee(editingMatch.referee || '');
      setNotes(editingMatch.notes || '');

      const o = editingMatch.odds || {};
      setOddHomeFT(o.homeFT != null ? String(o.homeFT) : '');
      setOddDrawFT(o.drawFT != null ? String(o.drawFT) : '');
      setOddAwayFT(o.awayFT != null ? String(o.awayFT) : '');
      setOddOver25FT(o.over25FT != null ? String(o.over25FT) : '');
      setOddUnder25FT(o.under25FT != null ? String(o.under25FT) : '');

      setAsianHandicapHomeLine(o.asianHandicapHomeLine != null ? String(o.asianHandicapHomeLine) : '');
      setAsianHandicapHomeOdd(o.asianHandicapHomeOdd != null ? String(o.asianHandicapHomeOdd) : '');
      setAsianHandicapAwayLine(o.asianHandicapAwayLine != null ? String(o.asianHandicapAwayLine) : '');
      setAsianHandicapAwayOdd(o.asianHandicapAwayOdd != null ? String(o.asianHandicapAwayOdd) : '');
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
      setIsContinental(false);
      setHomeCountryFilterId('');
      setAwayCountryFilterId('');
      setShowAllCountryTeams(false);
      setHomeScore('');
      setAwayScore('');
      setStatus('FINALIZADO');
      setReferee('');
      setNotes('');

      setOddHomeFT('');
      setOddDrawFT('');
      setOddAwayFT('');
      setOddOver25FT('');
      setOddUnder25FT('');

      setAsianHandicapHomeLine('');
      setAsianHandicapHomeOdd('');
      setAsianHandicapAwayLine('');
      setAsianHandicapAwayOdd('');
    }
    setErrorMsg('');
  }, [editingMatch, isOpen, dbState.teams]);

  if (!isOpen) return null;

  // Filtered lists for dropdowns
  const countries = dbState.countries;
  const filteredLeagues = selectedCountryId && selectedCountryId !== 'NEW'
    ? dbState.leagues.filter(l => l.countryId === selectedCountryId)
    : dbState.leagues;

  const selectedLeagueObj = dbState.leagues.find(l => l.id === selectedLeagueId);
  const selectedCountryObj = countries.find(c => c.id === selectedCountryId);

  // Helper to test if a team belongs to a league
  const isTeamInSelectedLeague = (team: Team, leagueId: string) => {
    if (!leagueId || leagueId === 'NEW') return true;
    if (team.leagueId === leagueId) return true;
    if (team.leagueIds && team.leagueIds.includes(leagueId)) return true;
    return dbState.matches.some(
      m => m.leagueId === leagueId && (m.homeTeamId === team.id || m.awayTeamId === team.id)
    );
  };

  // Function to filter teams per side (Home or Away)
  const getFilteredTeamsForSide = (countryFilterId: string) => {
    if (isContinental) {
      if (countryFilterId && countryFilterId !== '') {
        return dbState.teams.filter(t => t.countryId === countryFilterId);
      }
      return dbState.teams;
    }

    if (selectedLeagueId && selectedLeagueId !== 'NEW' && !showAllCountryTeams) {
      return dbState.teams.filter(t => isTeamInSelectedLeague(t, selectedLeagueId));
    }

    if (selectedCountryId && selectedCountryId !== 'NEW') {
      return dbState.teams.filter(t => t.countryId === selectedCountryId);
    }

    return dbState.teams;
  };

  const filteredHomeTeams = getFilteredTeamsForSide(homeCountryFilterId);
  const filteredAwayTeams = getFilteredTeamsForSide(awayCountryFilterId);

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
      setErrorMsg('O Time Mandante e o Time Visitante não podem ser a mesma equipe.');
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
    let homeCountryIdToUse = countryRes.country.id;
    let homeCountryNameToUse = countryRes.country.name;
    if (isContinental && homeCountryFilterId) {
      const hC = countries.find(c => c.id === homeCountryFilterId);
      if (hC) {
        homeCountryIdToUse = hC.id;
        homeCountryNameToUse = hC.name;
      }
    }

    let currentTeams = [...dbState.teams];
    const homeTeamRes = findOrCreateTeam(
      finalHomeTeamName,
      homeCountryIdToUse,
      homeCountryNameToUse,
      currentTeams,
      undefined,
      undefined,
      leagueRes.league.id,
      leagueRes.league.name
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
    let awayCountryIdToUse = countryRes.country.id;
    let awayCountryNameToUse = countryRes.country.name;
    if (isContinental && awayCountryFilterId) {
      const aC = countries.find(c => c.id === awayCountryFilterId);
      if (aC) {
        awayCountryIdToUse = aC.id;
        awayCountryNameToUse = aC.name;
      }
    }

    const awayTeamRes = findOrCreateTeam(
      finalAwayTeamName,
      awayCountryIdToUse,
      awayCountryNameToUse,
      currentTeams,
      undefined,
      undefined,
      leagueRes.league.id,
      leagueRes.league.name
    );
    currentTeams = awayTeamRes.updatedTeams;
    if (awayTeamRes.isNew) {
      notifications.push({
        type: 'team',
        id: awayTeamRes.team.id,
        name: awayTeamRes.team.name,
      });
    }

    const parseNumOrNull = (val: string): number | null => {
      if (val === '' || val === null || val === undefined) return null;
      const n = parseFloat(val.replace(',', '.'));
      return isNaN(n) ? null : n;
    };

    const matchOdds: MatchOdds = {
      homeFT: parseNumOrNull(oddHomeFT),
      drawFT: parseNumOrNull(oddDrawFT),
      awayFT: parseNumOrNull(oddAwayFT),
      over25FT: parseNumOrNull(oddOver25FT),
      under25FT: parseNumOrNull(oddUnder25FT),
      asianHandicapHomeLine: parseNumOrNull(asianHandicapHomeLine),
      asianHandicapHomeOdd: parseNumOrNull(asianHandicapHomeOdd),
      asianHandicapAwayLine: parseNumOrNull(asianHandicapAwayLine),
      asianHandicapAwayOdd: parseNumOrNull(asianHandicapAwayOdd),
    };

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
            referee,
            status,
            notes,
            odds: matchOdds,
            isContinental,
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
        referee,
        status,
        notes,
        odds: matchOdds,
        isContinental,
        createdAt: new Date().toISOString(),
      };

      currentMatches.unshift(newMatch);

      notifications.push({
        type: 'match',
        id: newMatch.id,
        name: `${newMatch.homeTeamName} vs ${newMatch.awayTeamName}`,
      });
    }

    onSaveMatch(
      {
        countries: currentCountries,
        leagues: currentLeagues,
        teams: currentTeams,
        matches: currentMatches,
      },
      notifications
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-linear-to-r from-blue-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {editingMatch ? `Editar Partida [${editingMatch.id}]` : 'Cadastrar Partidas no Banco de Dados'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {editingMatch
                  ? `${editingMatch.homeTeamName} vs ${editingMatch.awayTeamName}`
                  : 'Cadastro simplificado com criação automática de IDs'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!editingMatch && (
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setEntryMode('multi')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    entryMode === 'multi'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  Grade Rápida
                </button>
                <button
                  type="button"
                  onClick={() => setEntryMode('single')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    entryMode === 'single'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Formulário Completo
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Multi-Match Entry View */}
        {entryMode === 'multi' && !editingMatch ? (
          <div className="p-4 sm:p-5 overflow-y-auto max-h-[calc(92vh-100px)]">
            <MultiMatchQuickEntry
              dbState={dbState}
              onClose={onClose}
              onSaveMatches={onSaveMatch}
              onSaveAllMatches={onSaveMatch}
            />
          </div>
        ) : (
          /* Single Match Detailed Form */
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[calc(92vh-100px)]">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                {errorMsg}
              </div>
            )}

            {/* Section 1: País & Liga */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
                <Globe className="w-3.5 h-3.5" />
                <span>1. País & Competição / Liga</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Country */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2 shadow-xs">
                  <label className="block text-xs font-bold text-slate-800">
                    País da Competição
                  </label>
                  <select
                    value={selectedCountryId}
                    onChange={(e) => {
                      setSelectedCountryId(e.target.value);
                      setSelectedLeagueId('NEW');
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
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
                        placeholder="Ex: Brasil, Inglaterra, Espanha..."
                        value={newCountryName}
                        onChange={(e) => setNewCountryName(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-lg px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 shadow-xs"
                        required
                      />
                      <span className="text-[11px] text-blue-600 flex items-center gap-1 mt-1 font-mono font-bold">
                        <Sparkles className="w-3 h-3" /> ID Único será gerado (ex: PAIS-001)
                      </span>
                    </div>
                  )}
                </div>

                {/* League */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2 shadow-xs">
                  <label className="block text-xs font-bold text-slate-800">
                    Liga / Campeonato
                  </label>
                  <select
                    value={selectedLeagueId}
                    onChange={(e) => setSelectedLeagueId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
                  >
                    <option value="NEW">+ Cadastrar Nova Liga</option>
                    {filteredLeagues.map(l => (
                      <option key={l.id} value={l.id}>
                        [{l.id}] {l.name} {l.countryName ? `(${l.countryName})` : ''}
                      </option>
                    ))}
                  </select>

                  {selectedLeagueId === 'NEW' && (
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Ex: Brasileirão Série A, Premier League..."
                        value={newLeagueName}
                        onChange={(e) => setNewLeagueName(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-lg px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 shadow-xs"
                        required
                      />
                      <span className="text-[11px] text-blue-600 flex items-center gap-1 mt-1 font-mono font-bold">
                        <Sparkles className="w-3 h-3" /> ID Único será gerado (ex: LIGA-001)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Equipes Mandante & Visitante */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
                  <Shield className="w-3.5 h-3.5" />
                  <span>2. Times da Partida</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsContinental(!isContinental)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                      isContinental
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Globe className="w-3 h-3" />
                    {isContinental ? 'Modo Torneio Continental' : 'Torneio Nacional'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Home Team */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-blue-700">
                      🏠 Time Mandante (Casa)
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {filteredHomeTeams.length} opções
                    </span>
                  </div>

                  {isContinental && (
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <Globe className="w-3 h-3 text-blue-600" />
                        País do Mandante:
                      </label>
                      <select
                        value={homeCountryFilterId}
                        onChange={(e) => setHomeCountryFilterId(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Todos os Países ({countries.length}) --</option>
                        {countries.map(c => (
                          <option key={c.id} value={c.id}>
                            [{c.id}] {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Equipe / Time Mandante:
                    </label>
                    <select
                      value={selectedHomeTeamId}
                      onChange={(e) => setSelectedHomeTeamId(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
                    >
                      <option value="NEW">+ Cadastrar Novo Time</option>
                      {filteredHomeTeams.map(t => (
                        <option key={t.id} value={t.id}>
                          [{t.id}] {t.name} {t.leagueName ? `(${t.leagueName})` : `(${t.countryName})`}
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
                          className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-lg px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 shadow-xs"
                          required
                        />
                        <span className="text-[11px] text-blue-600 flex items-center gap-1 mt-1 font-mono font-bold">
                          <Sparkles className="w-3 h-3" /> ID Único será gerado (ex: TIME-001)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Away Team */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-blue-700">
                      ✈️ Time Visitante (Fora)
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {filteredAwayTeams.length} opções
                    </span>
                  </div>

                  {isContinental && (
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <Globe className="w-3 h-3 text-blue-600" />
                        País do Visitante:
                      </label>
                      <select
                        value={awayCountryFilterId}
                        onChange={(e) => setAwayCountryFilterId(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Todos os Países ({countries.length}) --</option>
                        {countries.map(c => (
                          <option key={c.id} value={c.id}>
                            [{c.id}] {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Equipe / Time Visitante:
                    </label>
                    <select
                      value={selectedAwayTeamId}
                      onChange={(e) => setSelectedAwayTeamId(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
                    >
                      <option value="NEW">+ Cadastrar Novo Time</option>
                      {filteredAwayTeams.map(t => (
                        <option key={t.id} value={t.id}>
                          [{t.id}] {t.name} {t.leagueName ? `(${t.leagueName})` : `(${t.countryName})`}
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
                          className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-lg px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 shadow-xs"
                          required
                        />
                        <span className="text-[11px] text-blue-600 flex items-center gap-1 mt-1 font-mono font-bold">
                          <Sparkles className="w-3 h-3" /> ID Único será gerado (ex: TIME-002)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Placar & Data */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>3. Placar, Data & Árbitro</span>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-700 font-medium">Status:</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as MatchStatus)}
                    className="bg-white border border-slate-300 text-xs text-slate-900 rounded-lg px-2 py-1 focus:border-blue-500 font-semibold shadow-xs"
                  >
                    <option value="FINALIZADO">Finalizado</option>
                    <option value="AGENDADO">Agendado</option>
                    <option value="EM_ANDAMENTO">Em Andamento</option>
                    <option value="ADIADO">Adiado</option>
                  </select>
                </div>
              </div>

              {/* Scoreboard Input */}
              <div className="flex items-center justify-center gap-4 py-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                <div className="text-center">
                  <span className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                    Gols Mandante
                  </span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={homeScore}
                    onChange={(e) => setHomeScore(e.target.value)}
                    className="w-16 h-12 text-center text-xl font-black bg-blue-50/50 border border-blue-200 rounded-xl text-blue-950 focus:outline-none focus:border-blue-500 font-mono shadow-inner"
                  />
                </div>

                <div className="text-xl font-bold text-slate-400 mt-4">X</div>

                <div className="text-center">
                  <span className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                    Gols Visitante
                  </span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={awayScore}
                    onChange={(e) => setAwayScore(e.target.value)}
                    className="w-16 h-12 text-center text-xl font-black bg-blue-50/50 border border-blue-200 rounded-xl text-blue-950 focus:outline-none focus:border-blue-500 font-mono shadow-inner"
                  />
                </div>
              </div>

              {/* Date & Referee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" /> Data e Hora
                  </label>
                  <input
                    type="datetime-local"
                    value={matchDate}
                    onChange={(e) => setMatchDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-blue-500 shadow-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    👨‍⚖️ Árbitro da Partida
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Wilton Pereira Sampaio"
                    value={referee}
                    onChange={(e) => setReferee(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-blue-500 shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Observações (opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Observações táticas..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 shadow-xs"
                />
              </div>
            </div>

            {/* Section 4: Odds & Cotações da Partida */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>4. Odds & Cotações das Apostas</span>
              </div>

              {/* Sub-card A: FT Odds (1X2 e Over/Under 2.5) */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                  <span>A. Mercado 1X2 e Gols (FT)</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1 truncate" title="Odd Mandante FT">Mandante FT</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="ex: 1.85"
                      value={oddHomeFT}
                      onChange={(e) => setOddHomeFT(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1 truncate" title="Odd Empate FT">Empate FT</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="ex: 3.40"
                      value={oddDrawFT}
                      onChange={(e) => setOddDrawFT(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1 truncate" title="Odd Visitante FT">Visitante FT</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="ex: 4.20"
                      value={oddAwayFT}
                      onChange={(e) => setOddAwayFT(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1 truncate" title="Over 2,5 FT">Over 2,5 FT</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="ex: 1.95"
                      value={oddOver25FT}
                      onChange={(e) => setOddOver25FT(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1 truncate" title="Under 2,5 FT">Under 2,5 FT</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="ex: 1.80"
                      value={oddUnder25FT}
                      onChange={(e) => setOddUnder25FT(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Sub-card B: Handicap Asiático FT */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                  <span>B. Handicap Asiático (FT)</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1 truncate" title="Linha Mandante FT">Linha HA Mandante</label>
                    <input
                      type="number"
                      step="0.25"
                      placeholder="ex: -0.50"
                      value={asianHandicapHomeLine}
                      onChange={(e) => setAsianHandicapHomeLine(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1 truncate" title="Odd Mandante FT">Odd HA Mandante</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="ex: 1.90"
                      value={asianHandicapHomeOdd}
                      onChange={(e) => setAsianHandicapHomeOdd(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1 truncate" title="Linha Visitante FT">Linha HA Visitante</label>
                    <input
                      type="number"
                      step="0.25"
                      placeholder="ex: +0.50"
                      value={asianHandicapAwayLine}
                      onChange={(e) => setAsianHandicapAwayLine(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1 truncate" title="Odd Visitante FT">Odd HA Visitante</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="ex: 1.95"
                      value={asianHandicapAwayOdd}
                      onChange={(e) => setAsianHandicapAwayOdd(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Footer */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-sm font-semibold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition-all border border-blue-500 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                {editingMatch ? 'Salvar Alterações' : 'Cadastrar Jogo no Banco'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
