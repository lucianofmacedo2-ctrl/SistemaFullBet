import React, { useState, useEffect } from 'react';
import { X, Sparkles, Plus, Calendar, Trophy, Globe, Shield, MapPin, Hash, Check, TrendingUp, DollarSign, Clock, Zap } from 'lucide-react';
import { DbState, Match, MatchStatus, MatchOdds, NewEntityCreatedNotification, Team } from '../types';
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
  const [referee, setReferee] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Odds FT (Full Time)
  const [oddHomeFT, setOddHomeFT] = useState<string>('');
  const [oddDrawFT, setOddDrawFT] = useState<string>('');
  const [oddAwayFT, setOddAwayFT] = useState<string>('');
  const [oddOver25FT, setOddOver25FT] = useState<string>('');
  const [oddUnder25FT, setOddUnder25FT] = useState<string>('');
  const [oddBttsFT, setOddBttsFT] = useState<string>('');

  // Odds HT (Half Time)
  const [oddHomeHT, setOddHomeHT] = useState<string>('');
  const [oddDrawHT, setOddDrawHT] = useState<string>('');
  const [oddAwayHT, setOddAwayHT] = useState<string>('');
  const [oddOver05HT, setOddOver05HT] = useState<string>('');
  const [oddUnder05HT, setOddUnder05HT] = useState<string>('');
  const [oddBttsHT, setOddBttsHT] = useState<string>('');

  // Momento dos Gols e Odds
  const [firstGoalHomeMin, setFirstGoalHomeMin] = useState<string>('');
  const [firstGoalHomeOdd, setFirstGoalHomeOdd] = useState<string>('');

  const [firstGoalAwayMin, setFirstGoalAwayMin] = useState<string>('');
  const [firstGoalAwayOdd, setFirstGoalAwayOdd] = useState<string>('');

  const [earlyGameGoalMin, setEarlyGameGoalMin] = useState<string>('');
  const [earlyGameGoalOdd, setEarlyGameGoalOdd] = useState<string>('');

  // Intercontinental tournament mode & country filters for teams
  const [isContinental, setIsContinental] = useState<boolean>(false);
  const [homeCountryFilterId, setHomeCountryFilterId] = useState<string>('');
  const [awayCountryFilterId, setAwayCountryFilterId] = useState<string>('');
  const [showAllCountryTeams, setShowAllCountryTeams] = useState<boolean>(false);

  const [errorMsg, setErrorMsg] = useState<string>('');

  // Populate form if editing or when opening
  useEffect(() => {
    if (editingMatch) {
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
      setRound(editingMatch.round || '');
      setStadium(editingMatch.stadium || '');
      setReferee(editingMatch.referee || '');
      setNotes(editingMatch.notes || '');

      const o = editingMatch.odds || {};
      setOddHomeFT(o.homeFT != null ? String(o.homeFT) : '');
      setOddDrawFT(o.drawFT != null ? String(o.drawFT) : '');
      setOddAwayFT(o.awayFT != null ? String(o.awayFT) : '');
      setOddOver25FT(o.over25FT != null ? String(o.over25FT) : '');
      setOddUnder25FT(o.under25FT != null ? String(o.under25FT) : '');
      setOddBttsFT(o.bttsFT != null ? String(o.bttsFT) : '');

      setOddHomeHT(o.homeHT != null ? String(o.homeHT) : '');
      setOddDrawHT(o.drawHT != null ? String(o.drawHT) : '');
      setOddAwayHT(o.awayHT != null ? String(o.awayHT) : '');
      setOddOver05HT(o.over05HT != null ? String(o.over05HT) : '');
      setOddUnder05HT(o.under05HT != null ? String(o.under05HT) : '');
      setOddBttsHT(o.bttsHT != null ? String(o.bttsHT) : '');

      setFirstGoalHomeMin(o.firstGoalHome?.minute != null ? String(o.firstGoalHome.minute) : '');
      setFirstGoalHomeOdd(o.firstGoalHome?.odd != null ? String(o.firstGoalHome.odd) : '');

      setFirstGoalAwayMin(o.firstGoalAway?.minute != null ? String(o.firstGoalAway.minute) : '');
      setFirstGoalAwayOdd(o.firstGoalAway?.odd != null ? String(o.firstGoalAway.odd) : '');

      setEarlyGameGoalMin(o.earlyGameGoal?.minute != null ? String(o.earlyGameGoal.minute) : '');
      setEarlyGameGoalOdd(o.earlyGameGoal?.odd != null ? String(o.earlyGameGoal.odd) : '');
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
      setRound('Rodada 1');
      setStadium('');
      setReferee('');
      setNotes('');

      setOddHomeFT('');
      setOddDrawFT('');
      setOddAwayFT('');
      setOddOver25FT('');
      setOddUnder25FT('');
      setOddBttsFT('');

      setOddHomeHT('');
      setOddDrawHT('');
      setOddAwayHT('');
      setOddOver05HT('');
      setOddUnder05HT('');
      setOddBttsHT('');

      setFirstGoalHomeMin('');
      setFirstGoalHomeOdd('');

      setFirstGoalAwayMin('');
      setFirstGoalAwayOdd('');

      setEarlyGameGoalMin('');
      setEarlyGameGoalOdd('');
    }
    setErrorMsg('');
  }, [editingMatch, isOpen, dbState.teams]);

  // Auto-fill stadium when home team is selected
  React.useEffect(() => {
    if (selectedHomeTeamId && selectedHomeTeamId !== 'NEW') {
      const team = dbState.teams.find(t => t.id === selectedHomeTeamId);
      if (team && team.stadium) {
        setStadium(team.stadium);
      } else {
        const lastMatch = dbState.matches.find(m => m.homeTeamId === selectedHomeTeamId && m.stadium);
        if (lastMatch && lastMatch.stadium) {
          setStadium(lastMatch.stadium);
        }
      }
    }
  }, [selectedHomeTeamId, dbState.teams, dbState.matches]);

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

    // If specific league is selected and toggle is not active
    if (selectedLeagueId && selectedLeagueId !== 'NEW' && !showAllCountryTeams) {
      return dbState.teams.filter(t => isTeamInSelectedLeague(t, selectedLeagueId));
    }

    // If country is selected (or showAllCountryTeams is true)
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
      stadium,
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
      bttsFT: parseNumOrNull(oddBttsFT),

      homeHT: parseNumOrNull(oddHomeHT),
      drawHT: parseNumOrNull(oddDrawHT),
      awayHT: parseNumOrNull(oddAwayHT),
      over05HT: parseNumOrNull(oddOver05HT),
      under05HT: parseNumOrNull(oddUnder05HT),
      bttsHT: parseNumOrNull(oddBttsHT),

      firstGoalHome: {
        minute: parseNumOrNull(firstGoalHomeMin),
        odd: parseNumOrNull(firstGoalHomeOdd),
      },
      firstGoalAway: {
        minute: parseNumOrNull(firstGoalAwayMin),
        odd: parseNumOrNull(firstGoalAwayOdd),
      },
      earlyGameGoal: {
        minute: parseNumOrNull(earlyGameGoalMin),
        odd: parseNumOrNull(earlyGameGoalOdd),
      },
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
            round,
            stadium,
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
        round,
        stadium,
        referee,
        status,
        notes,
        odds: matchOdds,
        isContinental,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg border border-blue-200">
              <Trophy className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {editingMatch ? 'Editar Jogo' : 'Cadastrar Novo Jogo de Futebol'}
              </h2>
              <p className="text-xs text-slate-500">
                Ligas, Países e Times novos recebem IDs Únicos na 1ª vez.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">
              {errorMsg}
            </div>
          )}

          {/* Section 1: País & Liga */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
                <Globe className="w-3.5 h-3.5" />
                <span>1. Localização & Competição</span>
              </div>

              {/* Option: Torneio Intercontinental */}
              <label className="flex items-center gap-2 cursor-pointer bg-white hover:bg-blue-50/50 px-3 py-1.5 rounded-lg border border-blue-300 text-xs text-slate-800 transition-colors shadow-xs">
                <input
                  type="checkbox"
                  checked={isContinental}
                  onChange={(e) => setIsContinental(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 border-slate-300 cursor-pointer"
                />
                <span className="font-semibold text-blue-900 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  Torneio Intercontinental
                </span>
              </label>
            </div>

            {isContinental && (
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-center gap-2 font-medium">
                <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  <strong>Torneio Intercontinental Ativo:</strong> Escolha o País do Mandante e do Visitante de forma independente na Seção 2 abaixo.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Country Field */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  País Sede / Organizador
                </label>
                <select
                  value={selectedCountryId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedCountryId(val);
                    if (val !== 'NEW') {
                      const cLeagues = dbState.leagues.filter(l => l.countryId === val);
                      if (cLeagues.length > 0) {
                        setSelectedLeagueId(cLeagues[0].id);
                      } else {
                        setSelectedLeagueId('NEW');
                      }
                    } else {
                      setSelectedLeagueId('NEW');
                    }
                    setSelectedHomeTeamId('NEW');
                    setSelectedAwayTeamId('NEW');
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
                      placeholder="Ex: Brasil, Espanha, Europa, Internacional..."
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

              {/* League Field */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Liga / Campeonato</span>
                  {selectedCountryId !== 'NEW' && (
                    <span className="text-[10px] text-blue-600 font-normal">
                      {filteredLeagues.length} liga(s) neste país
                    </span>
                  )}
                </label>
                <select
                  value={selectedLeagueId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedLeagueId(val);
                    if (val !== 'NEW') {
                      const hTeam = dbState.teams.find(t => t.id === selectedHomeTeamId);
                      if (hTeam && !isTeamInSelectedLeague(hTeam, val)) {
                        setSelectedHomeTeamId('NEW');
                      }
                      const aTeam = dbState.teams.find(t => t.id === selectedAwayTeamId);
                      if (aTeam && !isTeamInSelectedLeague(aTeam, val)) {
                        setSelectedAwayTeamId('NEW');
                      }
                    }
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
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
                      placeholder="Ex: Champions League, Libertadores, Brasileirão Série A..."
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

          {/* Section 2: Teams (Mandante x Visitante) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5" />
                <span>2. Times Confrontantes</span>
              </div>
              
              <div className="flex items-center gap-2">
                {selectedLeagueId && selectedLeagueId !== 'NEW' && !isContinental && (
                  <button
                    type="button"
                    onClick={() => setShowAllCountryTeams(!showAllCountryTeams)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all ${
                      showAllCountryTeams
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    {showAllCountryTeams
                      ? '🔄 Mostrando todos do País (Clique p/ filtrar só a Liga)'
                      : `🔍 Filtrando só times de "${selectedLeagueObj?.name || 'Liga'}"`}
                  </button>
                )}

                {isContinental && (
                  <span className="text-[10px] bg-blue-100 text-blue-800 border border-blue-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <Globe className="w-3 h-3 text-blue-600" /> Seleção por País Ativa
                  </span>
                )}
              </div>
            </div>

            {/* Info notice about active league filter */}
            {selectedLeagueId && selectedLeagueId !== 'NEW' && !isContinental && (
              <div className="px-3 py-2 bg-blue-50/70 border border-blue-200/80 rounded-lg text-xs text-blue-900 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-medium">
                  <Trophy className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  {showAllCountryTeams ? (
                    <span>Exibindo todos os <strong>{filteredHomeTeams.length}</strong> times de {selectedCountryObj?.name || 'país'}</span>
                  ) : (
                    <span>Exibindo apenas os <strong>{filteredHomeTeams.length}</strong> times da liga: <strong>{selectedLeagueObj?.name}</strong></span>
                  )}
                </span>
                {filteredHomeTeams.length === 0 && !showAllCountryTeams && (
                  <span className="text-[11px] text-amber-700 font-semibold">
                    (0 times encontrados - cadastre abaixo ou mostre todos do país)
                  </span>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                {/* Country Filter for Home Team if Continental */}
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

                {/* Country Filter for Away Team if Continental */}
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

          {/* Section 3: Placar & Status & Detalhes */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            {/* Quick Match Type Selector Banner */}
            <div className="flex items-center gap-2 p-1 bg-white rounded-xl border border-slate-200 shadow-xs">
              <button
                type="button"
                onClick={() => {
                  setStatus('AGENDADO');
                  setHomeScore('');
                  setAwayScore('');
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  status === 'AGENDADO'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
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
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                Jogo Já Realizado (Finalizado)
              </button>
            </div>

            {status === 'AGENDADO' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-start gap-2 font-medium">
                <Calendar className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Jogo Agendado:</strong> O placar ficará em aberto. Assim que a partida for realizada, você poderá lançar o resultado e todas as estatísticas detalhadas com apenas um clique!
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
                <Trophy className="w-3.5 h-3.5" />
                <span>3. Placar, Data & Status</span>
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

            {/* Date, Round, Stadium, Referee */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
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
                  Rodada / Fase
                </label>
                <input
                  type="text"
                  placeholder="Ex: Rodada 1, Final..."
                  value={round}
                  onChange={(e) => setRound(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-blue-500 shadow-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" /> Estádio
                </label>
                <input
                  type="text"
                  placeholder="Ex: Maracanã"
                  value={stadium}
                  onChange={(e) => setStadium(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-blue-500 shadow-xs"
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
                placeholder="Ex: Árbitro, público, tempo extra, expulsões..."
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

            {/* Sub-card A: FT Odds (Tempo Total) */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                <span>A. Mercado FT (Tempo Total - 90 min)</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
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

                <div>
                  <label className="block text-[11px] text-slate-600 mb-1 truncate" title="Ambos Marcam FT">Ambos Marcam</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="ex: 1.75"
                    value={oddBttsFT}
                    onChange={(e) => setOddBttsFT(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Sub-card B: HT Odds (1º Tempo / Intervalo) */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>B. Mercado HT (Intervalo / 1º Tempo)</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1 truncate" title="Odd Mandante HT">Mandante HT</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="ex: 2.40"
                    value={oddHomeHT}
                    onChange={(e) => setOddHomeHT(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 mb-1 truncate" title="Odd Empate HT">Empate HT</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="ex: 2.10"
                    value={oddDrawHT}
                    onChange={(e) => setOddDrawHT(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 mb-1 truncate" title="Odd Visitante HT">Visitante HT</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="ex: 4.80"
                    value={oddAwayHT}
                    onChange={(e) => setOddAwayHT(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 mb-1 truncate" title="Over 0,5 HT">Over 0,5 HT</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="ex: 1.40"
                    value={oddOver05HT}
                    onChange={(e) => setOddOver05HT(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 mb-1 truncate" title="Under 0,5 HT">Under 0,5 HT</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="ex: 2.75"
                    value={oddUnder05HT}
                    onChange={(e) => setOddUnder05HT(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 mb-1 truncate" title="Ambos Marcam HT">Ambos Marcam HT</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="ex: 4.50"
                    value={oddBttsHT}
                    onChange={(e) => setOddBttsHT(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Sub-card C: Momento dos Gols & Odds */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Zap className="w-3.5 h-3.5 text-blue-600" />
                <span>C. Momento dos Gols & Odds Específicas</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1º Gol Mandante */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-blue-700 block">
                    ⚽ Momento 1º Gol Mandante
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-600 mb-0.5">Minuto</label>
                      <input
                        type="number"
                        placeholder="ex: 24"
                        value={firstGoalHomeMin}
                        onChange={(e) => setFirstGoalHomeMin(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 text-xs font-mono focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-600 mb-0.5">Odd</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="ex: 1.90"
                        value={firstGoalHomeOdd}
                        onChange={(e) => setFirstGoalHomeOdd(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 text-xs font-mono focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 1º Gol Visitante */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-blue-700 block">
                    ⚽ Momento 1º Gol Visitante
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-600 mb-0.5">Minuto</label>
                      <input
                        type="number"
                        placeholder="ex: 68"
                        value={firstGoalAwayMin}
                        onChange={(e) => setFirstGoalAwayMin(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 text-xs font-mono focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-600 mb-0.5">Odd</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="ex: 2.75"
                        value={firstGoalAwayOdd}
                        onChange={(e) => setFirstGoalAwayOdd(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 text-xs font-mono focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Gol no Início da Partida */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-blue-700 block">
                    ⚡ Gol no Início da Partida
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-600 mb-0.5">Minuto</label>
                      <input
                        type="number"
                        placeholder="ex: 15"
                        value={earlyGameGoalMin}
                        onChange={(e) => setEarlyGameGoalMin(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 text-xs font-mono focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-600 mb-0.5">Odd</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="ex: 3.10"
                        value={earlyGameGoalOdd}
                        onChange={(e) => setEarlyGameGoalOdd(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 text-xs font-mono focus:border-blue-500"
                      />
                    </div>
                  </div>
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
      </div>
    </div>
  );
};
