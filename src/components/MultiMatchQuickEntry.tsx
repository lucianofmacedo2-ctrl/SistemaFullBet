import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  Calendar,
  Clock,
  Globe,
  Trophy,
  Shield,
  Hash,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Zap,
  ArrowRight,
  Layers
} from 'lucide-react';
import { DbState, Match, NewEntityCreatedNotification, Team } from '../types';
import { findOrCreateCountry, findOrCreateLeague, findOrCreateTeam, getNextUniqueId } from '../utils/idGenerator';

export interface MultiMatchRow {
  rowId: string;
  countryId: string; // Country ID or 'NEW'
  newCountryName: string;
  leagueId: string; // League ID or 'NEW'
  newLeagueName: string;
  homeTeamId: string; // Team ID or 'NEW'
  newHomeTeamName: string;
  awayTeamId: string; // Team ID or 'NEW'
  newAwayTeamName: string;
  date: string; // 'YYYY-MM-DD'
  time: string; // 'HH:mm'
  round: string; // 'Rodada 1'
}

interface MultiMatchQuickEntryProps {
  dbState: DbState;
  onSaveMatches?: (
    updatedDbState: DbState,
    notifications: NewEntityCreatedNotification[]
  ) => void;
  onSaveAllMatches?: (
    updatedDbState: DbState,
    notifications: NewEntityCreatedNotification[]
  ) => void;
  onClose: () => void;
}

export const MultiMatchQuickEntry: React.FC<MultiMatchQuickEntryProps> = ({
  dbState,
  onSaveMatches,
  onSaveAllMatches,
  onClose,
}) => {
  const saveCallback = onSaveMatches || onSaveAllMatches;
  // Today's date string YYYY-MM-DD
  const getTodayDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to create an empty row
  const createEmptyRow = (
    inheritedCountryId = '',
    inheritedLeagueId = '',
    inheritedDate = getTodayDateStr(),
    inheritedTime = '16:00',
    inheritedRound = 'Rodada 1'
  ): MultiMatchRow => {
    // If we have countries, pick first country if not passed
    let cId = inheritedCountryId;
    if (!cId && dbState.countries.length > 0) {
      cId = dbState.countries[0].id;
    } else if (!cId) {
      cId = 'NEW';
    }

    let lId = inheritedLeagueId;
    if (!lId && cId !== 'NEW') {
      const cLeagues = dbState.leagues.filter(l => l.countryId === cId);
      if (cLeagues.length > 0) {
        lId = cLeagues[0].id;
      } else {
        lId = 'NEW';
      }
    } else if (!lId) {
      lId = 'NEW';
    }

    return {
      rowId: `row_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      countryId: cId,
      newCountryName: '',
      leagueId: lId,
      newLeagueName: '',
      homeTeamId: 'NEW',
      newHomeTeamName: '',
      awayTeamId: 'NEW',
      newAwayTeamName: '',
      date: inheritedDate,
      time: inheritedTime,
      round: inheritedRound,
    };
  };

  // Initial state with 3 rows
  const [rows, setRows] = useState<MultiMatchRow[]>(() => [
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow(),
  ]);

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Global Quick Batch values
  const [batchCountryId, setBatchCountryId] = useState<string>(
    dbState.countries.length > 0 ? dbState.countries[0].id : ''
  );
  const [batchLeagueId, setBatchLeagueId] = useState<string>(() => {
    if (dbState.countries.length > 0) {
      const cLeagues = dbState.leagues.filter(l => l.countryId === dbState.countries[0].id);
      return cLeagues.length > 0 ? cLeagues[0].id : '';
    }
    return '';
  });
  const [batchDate, setBatchDate] = useState<string>(getTodayDateStr());
  const [batchTime, setBatchTime] = useState<string>('16:00');
  const [batchRound, setBatchRound] = useState<string>('Rodada 1');

  // Available leagues for batch selection
  const batchCountryLeagues = batchCountryId
    ? dbState.leagues.filter(l => l.countryId === batchCountryId)
    : dbState.leagues;

  // Add 1 row
  const handleAddRow = () => {
    const lastRow = rows[rows.length - 1];
    const newRow = createEmptyRow(
      lastRow?.countryId,
      lastRow?.leagueId,
      lastRow?.date || getTodayDateStr(),
      lastRow?.time || '16:00',
      lastRow?.round || 'Rodada 1'
    );
    setRows(prev => [...prev, newRow]);
  };

  // Add 5 rows
  const handleAdd5Rows = () => {
    const lastRow = rows[rows.length - 1];
    const newRows: MultiMatchRow[] = [];
    for (let i = 0; i < 5; i++) {
      newRows.push(
        createEmptyRow(
          lastRow?.countryId,
          lastRow?.leagueId,
          lastRow?.date || getTodayDateStr(),
          lastRow?.time || '16:00',
          lastRow?.round || 'Rodada 1'
        )
      );
    }
    setRows(prev => [...prev, ...newRows]);
  };

  // Duplicate specific row
  const handleDuplicateRow = (index: number) => {
    const target = rows[index];
    const clonedRow: MultiMatchRow = {
      ...target,
      rowId: `row_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      homeTeamId: 'NEW',
      newHomeTeamName: '',
      awayTeamId: 'NEW',
      newAwayTeamName: '',
    };
    const nextRows = [...rows];
    nextRows.splice(index + 1, 0, clonedRow);
    setRows(nextRows);
  };

  // Remove row
  const handleRemoveRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  // Update field of a row
  const handleUpdateRow = (index: number, field: keyof MultiMatchRow, value: string) => {
    setRows(prev => {
      const next = [...prev];
      const row = { ...next[index], [field]: value };

      // If country changed, auto-update league if current league doesn't belong to new country
      if (field === 'countryId') {
        if (value !== 'NEW') {
          const cLeagues = dbState.leagues.filter(l => l.countryId === value);
          if (cLeagues.length > 0) {
            row.leagueId = cLeagues[0].id;
          } else {
            row.leagueId = 'NEW';
          }
        } else {
          row.leagueId = 'NEW';
        }
        row.homeTeamId = 'NEW';
        row.awayTeamId = 'NEW';
      }

      // If league changed, reset team selections to 'NEW' if they were selected
      if (field === 'leagueId') {
        row.homeTeamId = 'NEW';
        row.awayTeamId = 'NEW';
      }

      next[index] = row;
      return next;
    });
  };

  // Batch apply actions
  const applyBatchCountryLeague = () => {
    if (!batchCountryId) return;
    setRows(prev =>
      prev.map(r => ({
        ...r,
        countryId: batchCountryId,
        leagueId: batchLeagueId || 'NEW',
        homeTeamId: 'NEW',
        awayTeamId: 'NEW',
      }))
    );
  };

  const applyBatchDate = () => {
    if (!batchDate) return;
    setRows(prev =>
      prev.map(r => ({
        ...r,
        date: batchDate,
      }))
    );
  };

  const applyBatchTime = () => {
    if (!batchTime) return;
    setRows(prev =>
      prev.map(r => ({
        ...r,
        time: batchTime,
      }))
    );
  };

  const applyBatchRound = () => {
    if (!batchRound) return;
    setRows(prev =>
      prev.map(r => ({
        ...r,
        round: batchRound,
      }))
    );
  };

  // Helper to get teams available for a row
  const getTeamsForRow = (row: MultiMatchRow): Team[] => {
    if (row.leagueId && row.leagueId !== 'NEW') {
      const leagueTeams = dbState.teams.filter(t => {
        if (t.leagueId === row.leagueId) return true;
        if (t.leagueIds && t.leagueIds.includes(row.leagueId)) return true;
        if (
          dbState.matches.some(
            m => m.leagueId === row.leagueId && (m.homeTeamId === t.id || m.awayTeamId === t.id)
          )
        ) {
          return true;
        }
        return false;
      });

      // If there are teams linked to this league, return exclusively them
      if (leagueTeams.length > 0) {
        return leagueTeams;
      }

      // If no teams are linked to this league yet, filter by country
      if (row.countryId && row.countryId !== 'NEW') {
        return dbState.teams.filter(t => t.countryId === row.countryId);
      }
      return dbState.teams;
    }

    if (row.countryId && row.countryId !== 'NEW') {
      return dbState.teams.filter(t => t.countryId === row.countryId);
    }
    return dbState.teams;
  };

  // Count valid non-empty rows
  const getFilledRowsCount = () => {
    return rows.filter(r => {
      const hasHome = r.homeTeamId !== 'NEW' || r.newHomeTeamName.trim().length > 0;
      const hasAway = r.awayTeamId !== 'NEW' || r.newAwayTeamName.trim().length > 0;
      return hasHome || hasAway;
    }).length;
  };

  // Submit and save all matches
  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const filledRows = rows.filter(r => {
      const hasHome = r.homeTeamId !== 'NEW' || r.newHomeTeamName.trim().length > 0;
      const hasAway = r.awayTeamId !== 'NEW' || r.newAwayTeamName.trim().length > 0;
      return hasHome || hasAway;
    });

    if (filledRows.length === 0) {
      setErrorMsg('Preencha ao menos uma linha com Time Mandante e Visitante para cadastrar.');
      return;
    }

    // Validation for each filled row
    for (let i = 0; i < filledRows.length; i++) {
      const r = filledRows[i];
      const rowNum = i + 1;

      // Country name
      let cName = '';
      if (r.countryId === 'NEW') {
        cName = r.newCountryName.trim();
        if (!cName) {
          setErrorMsg(`Linha #${rowNum}: Informe o nome do País ou selecione um país existente.`);
          return;
        }
      } else {
        const cObj = dbState.countries.find(c => c.id === r.countryId);
        cName = cObj ? cObj.name : '';
      }

      // League name
      let lName = '';
      if (r.leagueId === 'NEW') {
        lName = r.newLeagueName.trim();
        if (!lName) {
          setErrorMsg(`Linha #${rowNum}: Informe o nome da Liga ou selecione uma liga existente.`);
          return;
        }
      } else {
        const lObj = dbState.leagues.find(l => l.id === r.leagueId);
        lName = lObj ? lObj.name : '';
      }

      // Home team name
      let hName = '';
      if (r.homeTeamId === 'NEW') {
        hName = r.newHomeTeamName.trim();
        if (!hName) {
          setErrorMsg(`Linha #${rowNum}: Informe o Time Mandante.`);
          return;
        }
      } else {
        const hObj = dbState.teams.find(t => t.id === r.homeTeamId);
        hName = hObj ? hObj.name : '';
      }

      // Away team name
      let aName = '';
      if (r.awayTeamId === 'NEW') {
        aName = r.newAwayTeamName.trim();
        if (!aName) {
          setErrorMsg(`Linha #${rowNum}: Informe o Time Visitante.`);
          return;
        }
      } else {
        const aObj = dbState.teams.find(t => t.id === r.awayTeamId);
        aName = aObj ? aObj.name : '';
      }

      if (hName.toLowerCase() === aName.toLowerCase()) {
        setErrorMsg(`Linha #${rowNum}: O Time Mandante e Visitante não podem ser iguais (${hName}).`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      let currentCountries = [...dbState.countries];
      let currentLeagues = [...dbState.leagues];
      let currentTeams = [...dbState.teams];
      let currentMatches = [...dbState.matches];
      const notifications: NewEntityCreatedNotification[] = [];

      for (const r of filledRows) {
        // 1. Process Country
        let cName = '';
        if (r.countryId === 'NEW') {
          cName = r.newCountryName.trim();
        } else {
          const cObj = currentCountries.find(c => c.id === r.countryId);
          cName = cObj ? cObj.name : r.newCountryName.trim();
        }

        const countryRes = findOrCreateCountry(cName, currentCountries);
        currentCountries = countryRes.updatedCountries;
        if (countryRes.isNew) {
          notifications.push({
            type: 'country',
            id: countryRes.country.id,
            name: countryRes.country.name,
          });
        }

        // 2. Process League
        let lName = '';
        if (r.leagueId === 'NEW') {
          lName = r.newLeagueName.trim();
        } else {
          const lObj = currentLeagues.find(l => l.id === r.leagueId);
          lName = lObj ? lObj.name : r.newLeagueName.trim();
        }

        const leagueRes = findOrCreateLeague(
          lName,
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
        let hName = '';
        if (r.homeTeamId === 'NEW') {
          hName = r.newHomeTeamName.trim();
        } else {
          const hObj = currentTeams.find(t => t.id === r.homeTeamId);
          hName = hObj ? hObj.name : r.newHomeTeamName.trim();
        }

        const homeTeamRes = findOrCreateTeam(
          hName,
          countryRes.country.id,
          countryRes.country.name,
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
        let aName = '';
        if (r.awayTeamId === 'NEW') {
          aName = r.newAwayTeamName.trim();
        } else {
          const aObj = currentTeams.find(t => t.id === r.awayTeamId);
          aName = aObj ? aObj.name : r.newAwayTeamName.trim();
        }

        const awayTeamRes = findOrCreateTeam(
          aName,
          countryRes.country.id,
          countryRes.country.name,
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

        // 5. Create Match
        const matchId = getNextUniqueId('JOGO', currentMatches.map(m => m.id));
        const matchDateIso = `${r.date || getTodayDateStr()}T${r.time || '16:00'}:00`;

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
          homeScore: null,
          awayScore: null,
          matchDate: matchDateIso,
          referee: '',
          status: 'AGENDADO',
          notes: '',
          createdAt: new Date().toISOString(),
          odds: {
            homeFT: null,
            drawFT: null,
            awayFT: null,
            over25FT: null,
            under25FT: null,
            asianHandicapHomeLine: null,
            asianHandicapHomeOdd: null,
            asianHandicapAwayLine: null,
            asianHandicapAwayOdd: null,
          },
        };

        currentMatches = [newMatch, ...currentMatches];
      }

      const updatedState: DbState = {
        countries: currentCountries,
        leagues: currentLeagues,
        teams: currentTeams,
        matches: currentMatches,
      };

      if (typeof saveCallback === 'function') {
        saveCallback(updatedState, notifications);
      }
      if (typeof onClose === 'function') {
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao processar o cadastro em lote.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filledCount = getFilledRowsCount();

  return (
    <form onSubmit={handleSaveAll} className="space-y-4">
      {/* Top Helper / Batch Tools Ribbon */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50/40 to-slate-50 border border-blue-200 rounded-xl p-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
            <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
            <span>Ferramentas de Preenchimento Rápido (Aplicar em Lote nas Linhas)</span>
          </div>
          <span className="text-[11px] text-blue-700 font-medium">
            Preencha e replique facilmente para uma rodada inteira!
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          {/* Quick Country & League */}
          <div className="bg-white p-2 rounded-lg border border-blue-200 shadow-2xs space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-700">
              1. Definir País & Liga em Todas
            </label>
            <div className="space-y-1">
              <select
                value={batchCountryId}
                onChange={(e) => {
                  const val = e.target.value;
                  setBatchCountryId(val);
                  const cL = dbState.leagues.filter(l => l.countryId === val);
                  setBatchLeagueId(cL.length > 0 ? cL[0].id : '');
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              >
                {dbState.countries.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={batchLeagueId}
                onChange={(e) => setBatchLeagueId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              >
                {batchCountryLeagues.map(l => (
                  <option key={l.id} value={l.id}>
                    🏆 {l.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={applyBatchCountryLeague}
              className="w-full text-[10px] font-bold py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded transition-colors"
            >
              ⚡ Replicar País/Liga em Todas
            </button>
          </div>

          {/* Quick Date */}
          <div className="bg-white p-2 rounded-lg border border-blue-200 shadow-2xs space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-700">
              2. Definir mesma Data em Todas
            </label>
            <input
              type="date"
              value={batchDate}
              onChange={(e) => setBatchDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onClick={applyBatchDate}
              className="w-full text-[10px] font-bold py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded transition-colors"
            >
              ⚡ Replicar Data em Todas
            </button>
          </div>

          {/* Quick Time */}
          <div className="bg-white p-2 rounded-lg border border-blue-200 shadow-2xs space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-700">
              3. Definir mesma Hora em Todas
            </label>
            <input
              type="time"
              value={batchTime}
              onChange={(e) => setBatchTime(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onClick={applyBatchTime}
              className="w-full text-[10px] font-bold py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded transition-colors"
            >
              ⚡ Replicar Hora em Todas
            </button>
          </div>

          {/* Quick Round */}
          <div className="bg-white p-2 rounded-lg border border-blue-200 shadow-2xs space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-700">
              4. Definir mesma Rodada em Todas
            </label>
            <input
              type="text"
              placeholder="Ex: Rodada 1"
              value={batchRound}
              onChange={(e) => setBatchRound(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onClick={applyBatchRound}
              className="w-full text-[10px] font-bold py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded transition-colors"
            >
              ⚡ Replicar Rodada em Todas
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Rows Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[920px]">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                <th className="py-2.5 px-2 text-center w-8">#</th>
                <th className="py-2.5 px-3 min-w-[140px]">País</th>
                <th className="py-2.5 px-3 min-w-[150px]">Liga</th>
                <th className="py-2.5 px-3 min-w-[170px]">🏠 Mandante (Casa)</th>
                <th className="py-2.5 px-3 min-w-[170px]">✈️ Visitante (Fora)</th>
                <th className="py-2.5 px-2 min-w-[110px]">Data</th>
                <th className="py-2.5 px-2 min-w-[80px]">Hora</th>
                <th className="py-2.5 px-2 min-w-[95px]">Rodada</th>
                <th className="py-2.5 px-2 text-center w-16">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, idx) => {
                const countryLeagues = row.countryId && row.countryId !== 'NEW'
                  ? dbState.leagues.filter(l => l.countryId === row.countryId)
                  : dbState.leagues;

                const availableTeams = getTeamsForRow(row);

                return (
                  <tr key={row.rowId} className="hover:bg-blue-50/30 transition-colors">
                    {/* Index */}
                    <td className="py-2 px-2 text-center font-bold text-slate-400">
                      {idx + 1}
                    </td>

                    {/* País */}
                    <td className="py-2 px-2.5 align-top">
                      <div className="space-y-1">
                        <select
                          value={row.countryId}
                          onChange={(e) => handleUpdateRow(idx, 'countryId', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                        >
                          <option value="NEW">+ Novo País...</option>
                          {dbState.countries.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        {row.countryId === 'NEW' && (
                          <input
                            type="text"
                            placeholder="Nome do Novo País..."
                            value={row.newCountryName}
                            onChange={(e) => handleUpdateRow(idx, 'newCountryName', e.target.value)}
                            className="w-full bg-blue-50/50 border border-blue-300 rounded px-2 py-1 text-xs text-blue-900 placeholder-blue-400 focus:outline-none focus:border-blue-500"
                          />
                        )}
                      </div>
                    </td>

                    {/* Liga */}
                    <td className="py-2 px-2.5 align-top">
                      <div className="space-y-1">
                        <select
                          value={row.leagueId}
                          onChange={(e) => handleUpdateRow(idx, 'leagueId', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                        >
                          <option value="NEW">+ Nova Liga...</option>
                          {countryLeagues.map(l => (
                            <option key={l.id} value={l.id}>
                              🏆 {l.name}
                            </option>
                          ))}
                        </select>
                        {row.leagueId === 'NEW' && (
                          <input
                            type="text"
                            placeholder="Nome da Nova Liga..."
                            value={row.newLeagueName}
                            onChange={(e) => handleUpdateRow(idx, 'newLeagueName', e.target.value)}
                            className="w-full bg-blue-50/50 border border-blue-300 rounded px-2 py-1 text-xs text-blue-900 placeholder-blue-400 focus:outline-none focus:border-blue-500"
                          />
                        )}
                      </div>
                    </td>

                    {/* Mandante */}
                    <td className="py-2 px-2.5 align-top">
                      <div className="space-y-1">
                        <select
                          value={row.homeTeamId}
                          onChange={(e) => handleUpdateRow(idx, 'homeTeamId', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-semibold text-blue-950"
                        >
                          <option value="NEW">+ Cadastrar Novo Time...</option>
                          {availableTeams.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                        {row.homeTeamId === 'NEW' && (
                          <input
                            type="text"
                            placeholder="Nome do Time Mandante..."
                            value={row.newHomeTeamName}
                            onChange={(e) => handleUpdateRow(idx, 'newHomeTeamName', e.target.value)}
                            className="w-full bg-blue-50/50 border border-blue-300 rounded px-2 py-1 text-xs text-blue-900 placeholder-blue-400 focus:outline-none focus:border-blue-500 font-bold"
                          />
                        )}
                      </div>
                    </td>

                    {/* Visitante */}
                    <td className="py-2 px-2.5 align-top">
                      <div className="space-y-1">
                        <select
                          value={row.awayTeamId}
                          onChange={(e) => handleUpdateRow(idx, 'awayTeamId', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-semibold text-blue-950"
                        >
                          <option value="NEW">+ Cadastrar Novo Time...</option>
                          {availableTeams.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                        {row.awayTeamId === 'NEW' && (
                          <input
                            type="text"
                            placeholder="Nome do Time Visitante..."
                            value={row.newAwayTeamName}
                            onChange={(e) => handleUpdateRow(idx, 'newAwayTeamName', e.target.value)}
                            className="w-full bg-blue-50/50 border border-blue-300 rounded px-2 py-1 text-xs text-blue-900 placeholder-blue-400 focus:outline-none focus:border-blue-500 font-bold"
                          />
                        )}
                      </div>
                    </td>

                    {/* Data */}
                    <td className="py-2 px-1.5 align-top">
                      <input
                        type="date"
                        value={row.date}
                        onChange={(e) => handleUpdateRow(idx, 'date', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </td>

                    {/* Hora */}
                    <td className="py-2 px-1.5 align-top">
                      <input
                        type="time"
                        value={row.time}
                        onChange={(e) => handleUpdateRow(idx, 'time', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono text-center"
                      />
                    </td>

                    {/* Rodada */}
                    <td className="py-2 px-1.5 align-top">
                      <input
                        type="text"
                        placeholder="Rodada 1"
                        value={row.round}
                        onChange={(e) => handleUpdateRow(idx, 'round', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </td>

                    {/* Ações por Linha */}
                    <td className="py-2 px-1 text-center align-top">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicateRow(idx)}
                          title="Duplicar linha (copia País, Liga, Data, Hora e Rodada)"
                          className="p-1 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={rows.length <= 1}
                          onClick={() => handleRemoveRow(idx)}
                          title="Remover linha"
                          className={`p-1 rounded transition-colors ${
                            rows.length <= 1
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'hover:bg-red-100 text-red-500'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Row control actions */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAddRow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600 stroke-[3]" />
              <span>+ 1 Linha de Jogo</span>
            </button>

            <button
              type="button"
              onClick={handleAdd5Rows}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>+ 5 Linhas</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Total de linhas: <strong className="text-slate-900">{rows.length}</strong> | Prontos para cadastrar:{' '}
            <strong className="text-emerald-600 font-bold">{filledCount}</strong>
          </div>
        </div>
      </div>

      {/* Tip for filling remaining details later */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold text-amber-950">Dica para os outros dados:</strong>
          <p className="mt-0.5 text-amber-900">
            Após cadastrar esses jogos em lote, você pode lançar placares, odds (FT/HT) e estatísticas rapidamente a qualquer momento direto na tabela de jogos com 1 clique no botão de odds/placar!
          </p>
        </div>
      </div>

      {/* Footer Submit Button */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold rounded-xl transition-colors"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={isSubmitting || filledCount === 0}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition-all border border-blue-500 cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4 stroke-[3]" />
          <span>Cadastrar {filledCount} Jogo(s) no Banco</span>
        </button>
      </div>
    </form>
  );
};
