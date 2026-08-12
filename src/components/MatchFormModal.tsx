import React, { useState, useEffect } from 'react';
import { X, Sparkles, Plus, Calendar, Trophy, Globe, Shield, MapPin, Hash, Check, TrendingUp, DollarSign, Clock, Zap } from 'lucide-react';
import { DbState, Match, MatchStatus, MatchOdds, NewEntityCreatedNotification } from '../types';
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
  }, [editingMatch, isOpen]);

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

  const filteredTeams = dbState.teams.filter(t => {
    if (selectedCountryId && selectedCountryId !== 'NEW') {
      if (t.countryId !== selectedCountryId) {
        const playedInCountry = dbState.matches.some(
          m => m.countryId === selectedCountryId && (m.homeTeamId === t.id || m.awayTeamId === t.id)
        );
        if (!playedInCountry) return false;
      }
    }
    if (selectedLeagueId && selectedLeagueId !== 'NEW') {
      const league = dbState.leagues.find(l => l.id === selectedLeagueId);
      if (league) {
        const sameCountry = t.countryId === league.countryId;
        const playedInLeague = dbState.matches.some(
          m => m.leagueId === selectedLeagueId && (m.homeTeamId === t.id || m.awayTeamId === t.id)
        );
        if (!sameCountry && !playedInLeague) return false;
      }
    }
    return true;
  });

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
      <div className="relative w-full max-w-2xl bg-[#0f1325] border border-[#2C3EC4]/30 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0b0e1b] border-b border-[#2C3EC4]/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#2C3EC4]/20 text-[#2C3EC4] rounded-lg border border-[#2C3EC4]/30">
              <Trophy className="w-5 h-5 text-[#2C3EC4]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {editingMatch ? 'Editar Jogo' : 'Cadastrar Novo Jogo de Futebol'}
              </h2>
              <p className="text-xs text-gray-300">
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
          <div className="bg-[#0b0e1b] p-4 rounded-xl border border-white/10 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#2C3EC4] uppercase tracking-wider">
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
                  className="w-full bg-[#12162a] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-[#2C3EC4]"
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
                      className="w-full bg-[#181d36] border border-white/10 focus:border-[#2C3EC4] rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-400"
                      required
                    />
                    <span className="text-[11px] text-[#2C3EC4] flex items-center gap-1 mt-1 font-mono font-bold">
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
                  className="w-full bg-[#12162a] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-[#2C3EC4]"
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
                      className="w-full bg-[#181d36] border border-white/10 focus:border-[#2C3EC4] rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-400"
                      required
                    />
                    <span className="text-[11px] text-[#2C3EC4] flex items-center gap-1 mt-1 font-mono font-bold">
                      <Sparkles className="w-3 h-3" /> ID Único será gerado (ex: LIGA-001)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Teams (Mandante x Visitante) */}
          <div className="bg-[#0b0e1b] p-4 rounded-xl border border-white/10 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#2C3EC4] uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5" />
              <span>2. Times Confrontantes</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Home Team */}
              <div className="bg-[#12162a] p-3 rounded-lg border border-white/10">
                <label className="block text-xs font-bold text-[#2C3EC4] mb-1">
                  🏠 Time Mandante (Casa)
                </label>
                <select
                  value={selectedHomeTeamId}
                  onChange={(e) => setSelectedHomeTeamId(e.target.value)}
                  className="w-full bg-[#181d36] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-[#2C3EC4]"
                >
                  <option value="NEW">+ Cadastrar Novo Time</option>
                  {filteredTeams.map(t => (
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
                      className="w-full bg-[#0b0e1b] border border-white/10 focus:border-[#2C3EC4] rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-400"
                      required
                    />
                    <span className="text-[11px] text-[#2C3EC4] flex items-center gap-1 mt-1 font-mono font-bold">
                      <Sparkles className="w-3 h-3" /> ID Único será gerado (ex: TIME-001)
                    </span>
                  </div>
                )}
              </div>

              {/* Away Team */}
              <div className="bg-[#12162a] p-3 rounded-lg border border-white/10">
                <label className="block text-xs font-bold text-[#2C3EC4] mb-1">
                  ✈️ Time Visitante (Fora)
                </label>
                <select
                  value={selectedAwayTeamId}
                  onChange={(e) => setSelectedAwayTeamId(e.target.value)}
                  className="w-full bg-[#181d36] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-[#2C3EC4]"
                >
                  <option value="NEW">+ Cadastrar Novo Time</option>
                  {filteredTeams.map(t => (
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
                      className="w-full bg-[#0b0e1b] border border-white/10 focus:border-[#2C3EC4] rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-400"
                      required
                    />
                    <span className="text-[11px] text-[#2C3EC4] flex items-center gap-1 mt-1 font-mono font-bold">
                      <Sparkles className="w-3 h-3" /> ID Único será gerado (ex: TIME-002)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Placar & Status & Detalhes */}
          <div className="bg-[#0b0e1b] p-4 rounded-xl border border-white/10 space-y-4">
            {/* Quick Match Type Selector Banner */}
            <div className="flex items-center gap-2 p-1 bg-[#12162a] rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setStatus('AGENDADO');
                  setHomeScore('');
                  setAwayScore('');
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  status === 'AGENDADO'
                    ? 'bg-[#2C3EC4] text-white shadow-md'
                    : 'text-gray-300 hover:text-white'
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
                    ? 'bg-[#2C3EC4] text-white shadow-md'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                Jogo Já Realizado (Finalizado)
              </button>
            </div>

            {status === 'AGENDADO' && (
              <div className="p-3 bg-[#2C3EC4]/15 border border-[#2C3EC4]/30 rounded-xl text-blue-200 text-xs flex items-start gap-2">
                <Calendar className="w-4 h-4 text-[#2C3EC4] shrink-0 mt-0.5" />
                <span>
                  <strong>Jogo Agendado:</strong> O placar ficará em aberto. Assim que a partida for realizada, você poderá lançar o resultado e todas as estatísticas detalhadas com apenas um clique!
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 text-xs font-bold text-[#2C3EC4] uppercase tracking-wider">
                <Trophy className="w-3.5 h-3.5" />
                <span>3. Placar, Data & Status</span>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-300 font-medium">Status:</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as MatchStatus)}
                  className="bg-[#12162a] border border-white/10 text-xs text-white rounded-lg px-2 py-1 focus:border-[#2C3EC4] font-semibold"
                >
                  <option value="FINALIZADO">Finalizado</option>
                  <option value="AGENDADO">Agendado</option>
                  <option value="EM_ANDAMENTO">Em Andamento</option>
                  <option value="ADIADO">Adiado</option>
                </select>
              </div>
            </div>

            {/* Scoreboard Input */}
            <div className="flex items-center justify-center gap-4 py-2 bg-[#12162a] rounded-xl border border-white/10">
              <div className="text-center">
                <span className="text-[11px] font-bold text-gray-300 uppercase block mb-1">
                  Gols Mandante
                </span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={homeScore}
                  onChange={(e) => setHomeScore(e.target.value)}
                  className="w-16 h-12 text-center text-xl font-black bg-[#0b0e1b] border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#2C3EC4] font-mono shadow-inner"
                />
              </div>

              <div className="text-xl font-bold text-gray-400 mt-4">X</div>

              <div className="text-center">
                <span className="text-[11px] font-bold text-gray-300 uppercase block mb-1">
                  Gols Visitante
                </span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={awayScore}
                  onChange={(e) => setAwayScore(e.target.value)}
                  className="w-16 h-12 text-center text-xl font-black bg-[#0b0e1b] border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#2C3EC4] font-mono shadow-inner"
                />
              </div>
            </div>

            {/* Date, Round, Stadium, Referee */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-medium text-gray-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#2C3EC4]" /> Data e Hora
                </label>
                <input
                  type="datetime-local"
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  className="w-full bg-[#12162a] border border-white/10 rounded-lg px-2.5 py-1.5 text-gray-100 focus:outline-none focus:border-[#2C3EC4]"
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
                  className="w-full bg-[#12162a] border border-white/10 rounded-lg px-2.5 py-1.5 text-gray-100 focus:outline-none focus:border-[#2C3EC4]"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-300 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#2C3EC4]" /> Estádio
                </label>
                <input
                  type="text"
                  placeholder="Ex: Maracanã"
                  value={stadium}
                  onChange={(e) => setStadium(e.target.value)}
                  className="w-full bg-[#12162a] border border-white/10 rounded-lg px-2.5 py-1.5 text-gray-100 focus:outline-none focus:border-[#2C3EC4]"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-300 mb-1">
                  👨‍⚖️ Árbitro da Partida
                </label>
                <input
                  type="text"
                  placeholder="Ex: Wilton Pereira Sampaio"
                  value={referee}
                  onChange={(e) => setReferee(e.target.value)}
                  className="w-full bg-[#12162a] border border-white/10 rounded-lg px-2.5 py-1.5 text-gray-100 focus:outline-none focus:border-[#2C3EC4]"
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
                className="w-full bg-[#12162a] border border-white/10 rounded-lg p-2.5 text-xs text-gray-100 focus:outline-none focus:border-[#2C3EC4]"
              />
            </div>
          </div>

          {/* Section 4: Odds & Cotações da Partida */}
          <div className="bg-[#0b0e1b] p-4 rounded-xl border border-white/10 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#2C3EC4] uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>4. Odds & Cotações das Apostas</span>
            </div>

            {/* Sub-card A: FT Odds (Tempo Total) */}
            <div className="bg-[#12162a] p-3.5 rounded-xl border border-white/10 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-200">
                <DollarSign className="w-3.5 h-3.5 text-[#2C3EC4]" />
                <span>A. Mercado FT (Tempo Total - 90 min)</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] text-gray-300 mb-1 truncate" title="Odd Mandante FT">Mandante FT</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="ex: 1.85"
                    value={oddHomeFT}
                    onChange={(e) => setOddHomeFT(e.target.value)}
                    className="w-full bg-[#0b0e1b] border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-[#2C3EC4]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-gray-300 mb-1 truncate" title="Odd Empate FT">Empate FT</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="ex: 3.40"
                    value={oddDrawFT}
                    onChange={(e) => setOddDrawFT(e.target.value)}
                    className="w-full bg-[#0b0e1b] border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-[#2C3EC4]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-gray-300 mb-1 truncate" title="Odd Visitante FT">Visitante FT</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="ex: 4.20"
                    value={oddAwayFT}
                    onChange={(e) => setOddAwayFT(e.target.value)}
                    className="w-full bg-[#0b0e1b] border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-[#2C3EC4]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-gray-300 mb-1 truncate" title="Over 2,5 FT">Over 2,5 FT</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="ex: 1.95"
                    value={oddOver25FT}
                    onChange={(e) => setOddOver25FT(e.target.value)}
                    className="w-full bg-[#0b0e1b] border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-[#2C3EC4]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-gray-300 mb-1 truncate" title="Under 2,5 FT">Under 2,5 FT</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="ex: 1.80"
                    value={oddUnder25FT}
                    onChange={(e) => setOddUnder25FT(e.target.value)}
                    className="w-full bg-[#0b0e1b] border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-[#2C3EC4]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-gray-300 mb-1 truncate" title="Ambos Marcam FT">Ambos Marcam</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="ex: 1.75"
                    value={oddBttsFT}
                    onChange={(e) => setOddBttsFT(e.target.value)}
                    className="w-full bg-[#0b0e1b] border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-[#2C3EC4]"
                  />
                </div>
              </div>
            </div>

            {/* Sub-card B: HT Odds (1º Tempo / Intervalo) */}
            <div className="bg-[#12162a] p-3.5 rounded-xl border border-white/10 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-200">
                <Clock className="w-3.5 h-3.5 text-[#2C3EC4]" />
                <span>B. Mercado HT (Intervalo / 1º Tempo)</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] text-gray-300 mb-1 truncate" title="Odd Mandante HT">Mandante HT</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="ex: 2.40"
                    value={oddHomeHT}
                    onChange={(e) => setOddHomeHT(e.target.value)}
                    className="w-full bg-[#0b0e1b] border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-[#2C3EC4]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-gray-300 mb-1 truncate" title="Odd Empate HT">Empate HT</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="ex: 2.10"
                    value={oddDrawHT}
                    onChange={(e) => setOddDrawHT(e.target.value)}
                    className="w-full bg-[#0b0e1b] border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-[#2C3EC4]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-gray-300 mb-1 truncate" title="Odd Visitante HT">Visitante HT</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="ex: 4.80"
                    value={oddAwayHT}
                    onChange={(e) => setOddAwayHT(e.target.value)}
                    className="w-full bg-[#0b0e1b] border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-[#2C3EC4]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-gray-300 mb-1 truncate" title="Over 0,5 HT">Over 0,5 HT</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="ex: 1.40"
                    value={oddOver05HT}
                    onChange={(e) => setOddOver05HT(e.target.value)}
                    className="w-full bg-[#0b0e1b] border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-[#2C3EC4]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-gray-300 mb-1 truncate" title="Under 0,5 HT">Under 0,5 HT</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="ex: 2.75"
                    value={oddUnder05HT}
                    onChange={(e) => setOddUnder05HT(e.target.value)}
                    className="w-full bg-[#0b0e1b] border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-[#2C3EC4]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-gray-300 mb-1 truncate" title="Ambos Marcam HT">Ambos Marcam HT</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="ex: 4.50"
                    value={oddBttsHT}
                    onChange={(e) => setOddBttsHT(e.target.value)}
                    className="w-full bg-[#0b0e1b] border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-[#2C3EC4]"
                  />
                </div>
              </div>
            </div>

            {/* Sub-card C: Momento dos Gols & Odds */}
            <div className="bg-[#12162a] p-3.5 rounded-xl border border-white/10 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-200">
                <Zap className="w-3.5 h-3.5 text-[#2C3EC4]" />
                <span>C. Momento dos Gols & Odds Específicas</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1º Gol Mandante */}
                <div className="bg-[#0b0e1b] p-2.5 rounded-lg border border-white/10 space-y-2">
                  <span className="text-[11px] font-bold text-[#2C3EC4] block">
                    ⚽ Momento 1º Gol Mandante
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-300 mb-0.5">Minuto</label>
                      <input
                        type="number"
                        placeholder="ex: 24"
                        value={firstGoalHomeMin}
                        onChange={(e) => setFirstGoalHomeMin(e.target.value)}
                        className="w-full bg-[#12162a] border border-white/10 rounded px-2 py-1 text-white text-xs font-mono focus:border-[#2C3EC4]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-300 mb-0.5">Odd</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="ex: 1.90"
                        value={firstGoalHomeOdd}
                        onChange={(e) => setFirstGoalHomeOdd(e.target.value)}
                        className="w-full bg-[#12162a] border border-white/10 rounded px-2 py-1 text-white text-xs font-mono focus:border-[#2C3EC4]"
                      />
                    </div>
                  </div>
                </div>

                {/* 1º Gol Visitante */}
                <div className="bg-[#0b0e1b] p-2.5 rounded-lg border border-white/10 space-y-2">
                  <span className="text-[11px] font-bold text-[#2C3EC4] block">
                    ⚽ Momento 1º Gol Visitante
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-300 mb-0.5">Minuto</label>
                      <input
                        type="number"
                        placeholder="ex: 68"
                        value={firstGoalAwayMin}
                        onChange={(e) => setFirstGoalAwayMin(e.target.value)}
                        className="w-full bg-[#12162a] border border-white/10 rounded px-2 py-1 text-white text-xs font-mono focus:border-[#2C3EC4]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-300 mb-0.5">Odd</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="ex: 2.75"
                        value={firstGoalAwayOdd}
                        onChange={(e) => setFirstGoalAwayOdd(e.target.value)}
                        className="w-full bg-[#12162a] border border-white/10 rounded px-2 py-1 text-white text-xs font-mono focus:border-[#2C3EC4]"
                      />
                    </div>
                  </div>
                </div>

                {/* Gol no Início da Partida */}
                <div className="bg-[#0b0e1b] p-2.5 rounded-lg border border-white/10 space-y-2">
                  <span className="text-[11px] font-bold text-[#2C3EC4] block">
                    ⚡ Gol no Início da Partida
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-300 mb-0.5">Minuto</label>
                      <input
                        type="number"
                        placeholder="ex: 15"
                        value={earlyGameGoalMin}
                        onChange={(e) => setEarlyGameGoalMin(e.target.value)}
                        className="w-full bg-[#12162a] border border-white/10 rounded px-2 py-1 text-white text-xs font-mono focus:border-[#2C3EC4]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-300 mb-0.5">Odd</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="ex: 3.10"
                        value={earlyGameGoalOdd}
                        onChange={(e) => setEarlyGameGoalOdd(e.target.value)}
                        className="w-full bg-[#12162a] border border-white/10 rounded px-2 py-1 text-white text-xs font-mono focus:border-[#2C3EC4]"
                      />
                    </div>
                  </div>
                </div>
              </div>
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
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#2C3EC4] hover:bg-[#2231A8] text-white font-bold text-sm rounded-xl shadow-lg shadow-[#2C3EC4]/30 transition-all hover:scale-[1.02] active:scale-[0.98] border border-white/10"
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
