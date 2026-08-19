/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { DbState, Match, NewEntityCreatedNotification, Country, League, Team } from './types';
import { fetchDatabaseState, saveDatabaseState, clearDatabase } from './services/dbService';

import { Navbar } from './components/Navbar';
import { EmptyState } from './components/EmptyState';
import { MatchList } from './components/MatchList';
import { MatchFormModal } from './components/MatchFormModal';
import { EntityFormModal } from './components/EntityFormModal';
import { EditEntityModal } from './components/EditEntityModal';
import { BulkTeamImportModal } from './components/BulkTeamImportModal';
import { BulkMatchImportModal } from './components/BulkMatchImportModal';
import { BulkMatchUpdateModal } from './components/BulkMatchUpdateModal';
import { CountryManager } from './components/CountryManager';
import { LeagueManager } from './components/LeagueManager';
import { TeamManager } from './components/TeamManager';
import { StatsDashboard } from './components/StatsDashboard';
import { DailyMatchesView } from './components/DailyMatchesView';
import { PendingLogosManager } from './components/PendingLogosManager';
import { BackupModal } from './components/BackupModal';
import { ResetDatabaseModal } from './components/ResetDatabaseModal';
import { MatchStatsModal } from './components/MatchStatsModal';
import { QuickScoreModal } from './components/QuickScoreModal';
import { PressureChartImportModal } from './components/PressureChartImportModal';
import { CsvImportSyncModal } from './components/CsvImportSyncModal';
import { SyncModal } from './components/SyncModal';
import { ToastNotification } from './components/ToastNotification';
import { MatchOdds, MatchStats, MatchStatus, MatchPressureData } from './types';
import { findOrCreateCountry, findOrCreateLeague, findOrCreateTeam, getNextUniqueId } from './utils/idGenerator';
import { ParsedMatchRow, ParsedMatchUpdateRow } from './utils/excelHelper';

export default function App() {
  const [dbState, setDbState] = useState<DbState>({
    countries: [],
    leagues: [],
    teams: [],
    matches: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'matches' | 'schedule' | 'countries' | 'leagues' | 'teams' | 'stats' | 'pending_logos'>('matches');

  // Modals state
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [statsMatch, setStatsMatch] = useState<Match | null>(null);

  const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);
  const [entityModalType, setEntityModalType] = useState<'country' | 'league' | 'team'>('country');

  // Edit Entity modal state
  const [isEditEntityModalOpen, setIsEditEntityModalOpen] = useState(false);
  const [editEntityType, setEditEntityType] = useState<'country' | 'league' | 'team' | null>(null);
  const [editEntityData, setEditEntityData] = useState<Country | League | Team | null>(null);

  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isBulkTeamModalOpen, setIsBulkTeamModalOpen] = useState(false);
  const [isBulkMatchModalOpen, setIsBulkMatchModalOpen] = useState(false);
  const [isBulkMatchUpdateModalOpen, setIsBulkMatchUpdateModalOpen] = useState(false);
  const [isCsvImportModalOpen, setIsCsvImportModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isPressureModalOpen, setIsPressureModalOpen] = useState(false);
  const [pressureSelectedMatchId, setPressureSelectedMatchId] = useState<string | null>(null);

  // Quick Score & Odds Modal state
  const [isQuickScoreModalOpen, setIsQuickScoreModalOpen] = useState(false);
  const [quickScoreMatch, setQuickScoreMatch] = useState<Match | null>(null);

  // Toast notifications for newly created IDs
  const [notifications, setNotifications] = useState<NewEntityCreatedNotification[]>([]);

  const handleCsvSyncComplete = async (newState: DbState, message: string) => {
    setDbState(newState);
    await saveDatabaseState(newState);
    setNotifications(prev => [
      ...prev,
      {
        id: `sync-${Date.now()}`,
        type: 'match',
        entityId: 'CSV-SYNC',
        name: message,
        timestamp: Date.now(),
      },
    ]);
  };

  // Load database on mount
  useEffect(() => {
    async function initDb() {
      setIsLoading(true);
      const data = await fetchDatabaseState();
      setDbState(data);
      setIsLoading(false);
    }
    initDb();
  }, []);

  // Save handler for Match modal
  const handleSaveMatch = async (
    newState: DbState,
    newNotifications: NewEntityCreatedNotification[]
  ) => {
    setDbState(newState);
    await saveDatabaseState(newState);
    if (newNotifications.length > 0) {
      setNotifications(prev => [...prev, ...newNotifications]);
    }
  };

  // Save handler for Entity modal
  const handleSaveEntity = async (
    newState: DbState,
    newNotifications: NewEntityCreatedNotification[]
  ) => {
    setDbState(newState);
    await saveDatabaseState(newState);
    if (newNotifications.length > 0) {
      setNotifications(prev => [...prev, ...newNotifications]);
    }
  };

  // Delete Match
  const handleDeleteMatch = async (matchId: string) => {
    const updatedMatches = dbState.matches.filter(m => m.id !== matchId);
    const newState = { ...dbState, matches: updatedMatches };
    setDbState(newState);
    await saveDatabaseState(newState);
  };

  // Delete Country
  const handleDeleteCountry = async (countryId: string) => {
    const updatedCountries = dbState.countries.filter(c => c.id !== countryId);
    const updatedLeagues = dbState.leagues.filter(l => l.countryId !== countryId);
    const updatedTeams = dbState.teams.filter(t => t.countryId !== countryId);
    const updatedMatches = dbState.matches.filter(m => m.countryId !== countryId);

    const newState = {
      countries: updatedCountries,
      leagues: updatedLeagues,
      teams: updatedTeams,
      matches: updatedMatches,
    };
    setDbState(newState);
    await saveDatabaseState(newState);
  };

  // Delete League
  const handleDeleteLeague = async (leagueId: string) => {
    const updatedLeagues = dbState.leagues.filter(l => l.id !== leagueId);
    const updatedMatches = dbState.matches.filter(m => m.leagueId !== leagueId);

    const newState = { ...dbState, leagues: updatedLeagues, matches: updatedMatches };
    setDbState(newState);
    await saveDatabaseState(newState);
  };

  // Delete Team
  const handleDeleteTeam = async (teamId: string) => {
    const updatedTeams = dbState.teams.filter(t => t.id !== teamId);
    const updatedMatches = dbState.matches.filter(m => m.homeTeamId !== teamId && m.awayTeamId !== teamId);

    const newState = { ...dbState, teams: updatedTeams, matches: updatedMatches };
    setDbState(newState);
    await saveDatabaseState(newState);
  };

  // Edit Entity Handlers
  const handleOpenEditCountry = (country: Country) => {
    setEditEntityType('country');
    setEditEntityData(country);
    setIsEditEntityModalOpen(true);
  };

  const handleOpenEditLeague = (league: League) => {
    setEditEntityType('league');
    setEditEntityData(league);
    setIsEditEntityModalOpen(true);
  };

  const handleOpenEditTeam = (team: Team) => {
    setEditEntityType('team');
    setEditEntityData(team);
    setIsEditEntityModalOpen(true);
  };

  const handleSaveEditCountry = async (
    countryId: string,
    updated: { name: string; code?: string; flagUrl?: string }
  ) => {
    const updatedCountries = dbState.countries.map(c =>
      c.id === countryId ? { ...c, name: updated.name, code: updated.code, flagUrl: updated.flagUrl } : c
    );
    const updatedLeagues = dbState.leagues.map(l =>
      l.countryId === countryId ? { ...l, countryName: updated.name } : l
    );
    const updatedTeams = dbState.teams.map(t =>
      t.countryId === countryId ? { ...t, countryName: updated.name } : t
    );
    const updatedMatches = dbState.matches.map(m =>
      m.countryId === countryId
        ? { ...m, countryName: updated.name, countryFlagUrl: updated.flagUrl ?? m.countryFlagUrl }
        : m
    );

    const newState = {
      countries: updatedCountries,
      leagues: updatedLeagues,
      teams: updatedTeams,
      matches: updatedMatches,
    };
    setDbState(newState);
    await saveDatabaseState(newState);
  };

  const handleSaveEditLeague = async (
    leagueId: string,
    updated: { name: string; countryId: string; countryName: string; type?: string; logoUrl?: string }
  ) => {
    const updatedLeagues = dbState.leagues.map(l =>
      l.id === leagueId
        ? {
            ...l,
            name: updated.name,
            countryId: updated.countryId,
            countryName: updated.countryName,
            type: updated.type || l.type,
            logoUrl: updated.logoUrl,
          }
        : l
    );
    const updatedMatches = dbState.matches.map(m =>
      m.leagueId === leagueId
        ? {
            ...m,
            leagueName: updated.name,
            countryId: updated.countryId,
            countryName: updated.countryName,
            leagueLogoUrl: updated.logoUrl ?? m.leagueLogoUrl,
          }
        : m
    );

    const newState = { ...dbState, leagues: updatedLeagues, matches: updatedMatches };
    setDbState(newState);
    await saveDatabaseState(newState);
  };

  const handleSaveEditTeam = async (
    teamId: string,
    updated: { name: string; countryId: string; countryName: string; leagueId?: string; leagueName?: string; stadium?: string; logoUrl?: string }
  ) => {
    const updatedTeams = dbState.teams.map(t => {
      if (t.id === teamId) {
        const ids = t.leagueIds ? [...t.leagueIds] : (t.leagueId ? [t.leagueId] : []);
        if (updated.leagueId && !ids.includes(updated.leagueId)) {
          ids.push(updated.leagueId);
        }
        return {
          ...t,
          name: updated.name,
          countryId: updated.countryId,
          countryName: updated.countryName,
          leagueId: updated.leagueId,
          leagueName: updated.leagueName,
          leagueIds: ids,
          stadium: updated.stadium,
          logoUrl: updated.logoUrl,
        };
      }
      return t;
    });
    const updatedMatches = dbState.matches.map(m => {
      let match = { ...m };
      if (m.homeTeamId === teamId) {
        match.homeTeamName = updated.name;
        match.countryId = updated.countryId;
        match.countryName = updated.countryName;
        if (updated.stadium) match.stadium = updated.stadium;
        if (updated.logoUrl !== undefined) match.homeTeamLogoUrl = updated.logoUrl;
      }
      if (m.awayTeamId === teamId) {
        match.awayTeamName = updated.name;
        if (updated.logoUrl !== undefined) match.awayTeamLogoUrl = updated.logoUrl;
      }
      return match;
    });

    const newState = { ...dbState, teams: updatedTeams, matches: updatedMatches };
    setDbState(newState);
    await saveDatabaseState(newState);
  };

  // Update Country Flag
  const handleUpdateCountryFlag = async (countryId: string, flagUrl: string) => {
    const updatedCountries = dbState.countries.map(c => c.id === countryId ? { ...c, flagUrl } : c);
    const updatedMatches = dbState.matches.map(m => m.countryId === countryId ? { ...m, countryFlagUrl: flagUrl } : m);
    const newState = { ...dbState, countries: updatedCountries, matches: updatedMatches };
    setDbState(newState);
    await saveDatabaseState(newState);
  };

  // Update League Logo
  const handleUpdateLeagueLogo = async (leagueId: string, logoUrl: string) => {
    const updatedLeagues = dbState.leagues.map(l => l.id === leagueId ? { ...l, logoUrl } : l);
    const updatedMatches = dbState.matches.map(m => m.leagueId === leagueId ? { ...m, leagueLogoUrl: logoUrl } : m);
    const newState = { ...dbState, leagues: updatedLeagues, matches: updatedMatches };
    setDbState(newState);
    await saveDatabaseState(newState);
  };

  // Update Team Logo
  const handleUpdateTeamLogo = async (teamId: string, logoUrl: string) => {
    const updatedTeams = dbState.teams.map(t => t.id === teamId ? { ...t, logoUrl } : t);
    const updatedMatches = dbState.matches.map(m => {
      let updated = { ...m };
      if (m.homeTeamId === teamId) updated.homeTeamLogoUrl = logoUrl;
      if (m.awayTeamId === teamId) updated.awayTeamLogoUrl = logoUrl;
      return updated;
    });
    const newState = { ...dbState, teams: updatedTeams, matches: updatedMatches };
    setDbState(newState);
    await saveDatabaseState(newState);
  };

  // Update Team League directly
  const handleUpdateTeamLeague = async (teamId: string, leagueId: string) => {
    const league = dbState.leagues.find(l => l.id === leagueId);
    const updatedTeams = dbState.teams.map(t => {
      if (t.id === teamId) {
        if (!leagueId) {
          return {
            ...t,
            leagueId: undefined,
            leagueName: undefined,
            leagueIds: [],
          };
        }
        const ids = t.leagueIds ? [...t.leagueIds] : (t.leagueId ? [t.leagueId] : []);
        if (!ids.includes(leagueId)) {
          ids.push(leagueId);
        }
        return {
          ...t,
          leagueId: leagueId,
          leagueName: league?.name,
          leagueIds: ids,
        };
      }
      return t;
    });
    const newState = { ...dbState, teams: updatedTeams };
    setDbState(newState);
    await saveDatabaseState(newState);
  };

  // Bulk import handler for teams
  const handleBulkImportTeams = async (importData: {
    countryId: string;
    countryName: string;
    leagueId: string;
    leagueName: string;
    season: string;
    teams: { name: string; stadium: string; logoUrl: string }[];
  }) => {
    let currentTeams = [...dbState.teams];
    let createdCount = 0;
    const newNotifs: NewEntityCreatedNotification[] = [];

    for (const teamItem of importData.teams) {
      const res = findOrCreateTeam(
        teamItem.name,
        importData.countryId,
        importData.countryName,
        currentTeams,
        teamItem.stadium,
        teamItem.logoUrl,
        importData.leagueId,
        importData.leagueName
      );

      if (res.isNew) {
        createdCount++;
        currentTeams = res.updatedTeams;
        newNotifs.push({
          type: 'team',
          id: res.team.id,
          name: res.team.name,
        });
      } else {
        // If team already exists, update stadium, logoUrl and add league if provided
        currentTeams = currentTeams.map(t => {
          if (t.id === res.team.id) {
            const ids = t.leagueIds ? [...t.leagueIds] : (t.leagueId ? [t.leagueId] : []);
            if (!ids.includes(importData.leagueId)) {
              ids.push(importData.leagueId);
            }
            return {
              ...t,
              leagueId: t.leagueId || importData.leagueId,
              leagueName: t.leagueName || importData.leagueName,
              leagueIds: ids,
              stadium: teamItem.stadium || t.stadium,
              logoUrl: teamItem.logoUrl || t.logoUrl,
            };
          }
          return t;
        });
      }
    }

    const newState = { ...dbState, teams: currentTeams };
    setDbState(newState);
    await saveDatabaseState(newState);

    if (newNotifs.length > 0) {
      setNotifications(prev => [...prev, ...newNotifs]);
    }
  };

  // Bulk import handler for future matches
  const handleBulkImportMatches = async (rows: ParsedMatchRow[]) => {
    let currentCountries = [...dbState.countries];
    let currentLeagues = [...dbState.leagues];
    let currentTeams = [...dbState.teams];
    let currentMatches = [...dbState.matches];

    const newNotifs: NewEntityCreatedNotification[] = [];

    for (const row of rows) {
      // 1. Country
      const countryRes = findOrCreateCountry(row.countryName, currentCountries);
      currentCountries = countryRes.updatedCountries;
      if (countryRes.isNew) {
        newNotifs.push({
          type: 'country',
          id: countryRes.country.id,
          name: countryRes.country.name,
        });
      }

      // 2. League
      const leagueRes = findOrCreateLeague(
        row.leagueName,
        countryRes.country.id,
        countryRes.country.name,
        currentLeagues
      );
      currentLeagues = leagueRes.updatedLeagues;
      if (leagueRes.isNew) {
        newNotifs.push({
          type: 'league',
          id: leagueRes.league.id,
          name: leagueRes.league.name,
        });
      }

      // 3. Home Team
      const homeTeamRes = findOrCreateTeam(
        row.homeTeamName,
        countryRes.country.id,
        countryRes.country.name,
        currentTeams,
        row.stadium,
        undefined,
        leagueRes.league.id,
        leagueRes.league.name
      );
      currentTeams = homeTeamRes.updatedTeams;
      if (homeTeamRes.isNew) {
        newNotifs.push({
          type: 'team',
          id: homeTeamRes.team.id,
          name: homeTeamRes.team.name,
        });
      }

      // 4. Away Team
      const awayTeamRes = findOrCreateTeam(
        row.awayTeamName,
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
        newNotifs.push({
          type: 'team',
          id: awayTeamRes.team.id,
          name: awayTeamRes.team.name,
        });
      }

      // 5. Create Match
      const matchId = getNextUniqueId('JOGO', currentMatches.map(m => m.id));
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
        matchDate: row.matchDate || new Date().toISOString(),
        round: row.round || 'Rodada 1',
        stadium: row.stadium || homeTeamRes.team.stadium || '',
        referee: row.referee || '',
        status: 'AGENDADO',
        notes: row.notes || '',
        odds: {
          homeFT: row.oddHomeFT ?? null,
          drawFT: row.oddDrawFT ?? null,
          awayFT: row.oddAwayFT ?? null,
          over25FT: row.oddOver25FT ?? null,
          under25FT: row.oddUnder25FT ?? null,
          bttsFT: row.oddBttsFT ?? null,
          homeHT: row.oddHomeHT ?? null,
          drawHT: row.oddDrawHT ?? null,
          awayHT: row.oddAwayHT ?? null,
          over05HT: row.oddOver05HT ?? null,
          under05HT: row.oddUnder05HT ?? null,
          bttsHT: row.oddBttsHT ?? null,
        },
        createdAt: new Date().toISOString(),
      };

      currentMatches.push(newMatch);

      newNotifs.push({
        type: 'match',
        id: matchId,
        name: `${homeTeamRes.team.name} x ${awayTeamRes.team.name}`,
      });
    }

    const newState: DbState = {
      countries: currentCountries,
      leagues: currentLeagues,
      teams: currentTeams,
      matches: currentMatches,
    };

    setDbState(newState);
    await saveDatabaseState(newState);

    if (newNotifs.length > 0) {
      setNotifications(prev => [...prev, ...newNotifs]);
    }
  };

  // Bulk Update Matches (Complete Missing Data)
  const handleBulkUpdateMatches = async (rows: ParsedMatchUpdateRow[]) => {
    let currentCountries = [...dbState.countries];
    let currentLeagues = [...dbState.leagues];
    let currentTeams = [...dbState.teams];
    let currentMatches = [...dbState.matches];
    const newNotifs: NewEntityCreatedNotification[] = [];

    for (const row of rows) {
      if (!row.isValid) continue;

      // Check if this row matches an existing match (by matchedMatch or matchId)
      const existingMatchIndex = currentMatches.findIndex(
        m => (row.matchId && m.id === row.matchId) || (row.matchedMatch && m.id === row.matchedMatch.id)
      );

      if (existingMatchIndex !== -1) {
        const existing = currentMatches[existingMatchIndex];
        const existingStats = existing.stats || {};
        const existingOdds = existing.odds || {
          homeFT: null,
          drawFT: null,
          awayFT: null,
          over25FT: null,
          under25FT: null,
          bttsFT: null,
          homeHT: null,
          drawHT: null,
          awayHT: null,
          over05HT: null,
          under05HT: null,
          bttsHT: null,
        };

        // Determine new scores
        const homeScore = row.homeScore !== null ? row.homeScore : existing.homeScore;
        const awayScore = row.awayScore !== null ? row.awayScore : existing.awayScore;

        // Determine status
        let newStatus = existing.status;
        if (row.status) {
          newStatus = row.status;
        } else if (homeScore !== null && awayScore !== null) {
          newStatus = 'FINALIZADO';
        }

        // Updated Stats merge
        const updatedStats: MatchStats = {
          ...existingStats,
          halftimeHomeScore: row.halftimeHomeScore !== null ? row.halftimeHomeScore : existingStats.halftimeHomeScore,
          halftimeAwayScore: row.halftimeAwayScore !== null ? row.halftimeAwayScore : existingStats.halftimeAwayScore,
          goalMinutesHome: row.goalMinutesHome !== undefined ? row.goalMinutesHome : existingStats.goalMinutesHome,
          goalMinutesAway: row.goalMinutesAway !== undefined ? row.goalMinutesAway : existingStats.goalMinutesAway,
          firstGoalMinuteMatch: row.firstGoalMinuteMatch !== null ? row.firstGoalMinuteMatch : existingStats.firstGoalMinuteMatch,
          firstGoalMinuteHome: row.firstGoalMinuteHome !== null ? row.firstGoalMinuteHome : existingStats.firstGoalMinuteHome,
          firstGoalMinuteAway: row.firstGoalMinuteAway !== null ? row.firstGoalMinuteAway : existingStats.firstGoalMinuteAway,
          cornersHomeFT: row.cornersHomeFT !== null ? row.cornersHomeFT : (existingStats.cornersHomeFT ?? existingStats.cornersHome),
          cornersAwayFT: row.cornersAwayFT !== null ? row.cornersAwayFT : (existingStats.cornersAwayFT ?? existingStats.cornersAway),
          cornersHomeHT: row.cornersHomeHT !== null ? row.cornersHomeHT : existingStats.cornersHomeHT,
          cornersAwayHT: row.cornersAwayHT !== null ? row.cornersAwayHT : existingStats.cornersAwayHT,
          possessionHomeFT: row.possessionHomeFT !== null ? row.possessionHomeFT : (existingStats.possessionHomeFT ?? existingStats.possessionHome),
          possessionAwayFT: row.possessionAwayFT !== null ? row.possessionAwayFT : (existingStats.possessionAwayFT ?? existingStats.possessionAway),
          possessionHomeHT: row.possessionHomeHT !== null ? row.possessionHomeHT : existingStats.possessionHomeHT,
          possessionAwayHT: row.possessionAwayHT !== null ? row.possessionAwayHT : existingStats.possessionAwayHT,
          yellowCardsHomeFT: row.yellowCardsHomeFT !== null ? row.yellowCardsHomeFT : (existingStats.yellowCardsHomeFT ?? existingStats.yellowCardsHome),
          yellowCardsAwayFT: row.yellowCardsAwayFT !== null ? row.yellowCardsAwayFT : (existingStats.yellowCardsAwayFT ?? existingStats.yellowCardsAway),
          yellowCardsHomeHT: row.yellowCardsHomeHT !== null ? row.yellowCardsHomeHT : existingStats.yellowCardsHomeHT,
          yellowCardsAwayHT: row.yellowCardsAwayHT !== null ? row.yellowCardsAwayHT : existingStats.yellowCardsAwayHT,
          redCardsHomeFT: row.redCardsHomeFT !== null ? row.redCardsHomeFT : (existingStats.redCardsHomeFT ?? existingStats.redCardsHome),
          redCardsAwayFT: row.redCardsAwayFT !== null ? row.redCardsAwayFT : (existingStats.redCardsAwayFT ?? existingStats.redCardsAway),
          redCardsHomeHT: row.redCardsHomeHT !== null ? row.redCardsHomeHT : existingStats.redCardsHomeHT,
          redCardsAwayHT: row.redCardsAwayHT !== null ? row.redCardsAwayHT : existingStats.redCardsAwayHT,
          shotsHomeFT: row.shotsHomeFT !== null ? row.shotsHomeFT : (existingStats.shotsHomeFT ?? existingStats.shotsHome),
          shotsAwayFT: row.shotsAwayFT !== null ? row.shotsAwayFT : (existingStats.shotsAwayFT ?? existingStats.shotsAway),
          shotsHomeHT: row.shotsHomeHT !== null ? row.shotsHomeHT : existingStats.shotsHomeHT,
          shotsAwayHT: row.shotsAwayHT !== null ? row.shotsAwayHT : existingStats.shotsAwayHT,
          shotsOnTargetHomeFT: row.shotsOnTargetHomeFT !== null ? row.shotsOnTargetHomeFT : (existingStats.shotsOnTargetHomeFT ?? existingStats.shotsOnTargetHome),
          shotsOnTargetAwayFT: row.shotsOnTargetAwayFT !== null ? row.shotsOnTargetAwayFT : (existingStats.shotsOnTargetAwayFT ?? existingStats.shotsOnTargetAway),
          shotsOnTargetHomeHT: row.shotsOnTargetHomeHT !== null ? row.shotsOnTargetHomeHT : existingStats.shotsOnTargetHomeHT,
          shotsOnTargetAwayHT: row.shotsOnTargetAwayHT !== null ? row.shotsOnTargetAwayHT : existingStats.shotsOnTargetAwayHT,
        };

        // Auto-calculate firstGoalMinuteMatch if missing but team minutes available
        if (updatedStats.firstGoalMinuteMatch == null) {
          const homeM = updatedStats.firstGoalMinuteHome;
          const awayM = updatedStats.firstGoalMinuteAway;
          if (homeM != null && awayM != null) {
            updatedStats.firstGoalMinuteMatch = Math.min(homeM, awayM);
          } else if (homeM != null) {
            updatedStats.firstGoalMinuteMatch = homeM;
          } else if (awayM != null) {
            updatedStats.firstGoalMinuteMatch = awayM;
          }
        }

        // Updated Odds merge
        const updatedOdds: MatchOdds = {
          homeFT: row.oddHomeFT !== null ? row.oddHomeFT : existingOdds.homeFT,
          drawFT: row.oddDrawFT !== null ? row.oddDrawFT : existingOdds.drawFT,
          awayFT: row.oddAwayFT !== null ? row.oddAwayFT : existingOdds.awayFT,
          over25FT: row.oddOver25FT !== null ? row.oddOver25FT : existingOdds.over25FT,
          under25FT: row.oddUnder25FT !== null ? row.oddUnder25FT : existingOdds.under25FT,
          bttsFT: row.oddBttsFT !== null ? row.oddBttsFT : existingOdds.bttsFT,
          homeHT: row.oddHomeHT !== null ? row.oddHomeHT : existingOdds.homeHT,
          drawHT: row.oddDrawHT !== null ? row.oddDrawHT : existingOdds.drawHT,
          awayHT: row.oddAwayHT !== null ? row.oddAwayHT : existingOdds.awayHT,
          over05HT: row.oddOver05HT !== null ? row.oddOver05HT : existingOdds.over05HT,
          under05HT: row.oddUnder05HT !== null ? row.oddUnder05HT : existingOdds.under05HT,
          bttsHT: row.oddBttsHT !== null ? row.oddBttsHT : existingOdds.bttsHT,
        };

        const updatedMatch: Match = {
          ...existing,
          matchDate: row.matchDate || existing.matchDate,
          round: row.round || existing.round,
          stadium: row.stadium || existing.stadium,
          referee: row.referee || existing.referee,
          notes: row.notes !== undefined && row.notes !== '' ? row.notes : existing.notes,
          homeScore,
          awayScore,
          status: newStatus,
          stats: updatedStats,
          odds: updatedOdds,
        };

        currentMatches[existingMatchIndex] = updatedMatch;
      } else {
        // New match creation flow (if row is completely new)
        const countryRes = findOrCreateCountry(row.countryName || 'Outro', currentCountries);
        currentCountries = countryRes.updatedCountries;

        const leagueRes = findOrCreateLeague(
          row.leagueName || 'Liga',
          countryRes.country.id,
          countryRes.country.name,
          currentLeagues
        );
        currentLeagues = leagueRes.updatedLeagues;

        const homeTeamRes = findOrCreateTeam(
          row.homeTeamName,
          countryRes.country.id,
          countryRes.country.name,
          currentTeams,
          row.stadium,
          undefined,
          leagueRes.league.id,
          leagueRes.league.name
        );
        currentTeams = homeTeamRes.updatedTeams;

        const awayTeamRes = findOrCreateTeam(
          row.awayTeamName,
          countryRes.country.id,
          countryRes.country.name,
          currentTeams,
          undefined,
          undefined,
          leagueRes.league.id,
          leagueRes.league.name
        );
        currentTeams = awayTeamRes.updatedTeams;

        const matchId = row.matchId || getNextUniqueId('JOGO', currentMatches.map(m => m.id));
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
          homeScore: row.homeScore,
          awayScore: row.awayScore,
          matchDate: row.matchDate || new Date().toISOString(),
          round: row.round || 'Rodada 1',
          stadium: row.stadium || homeTeamRes.team.stadium || '',
          referee: row.referee || '',
          status: row.status || (row.homeScore !== null && row.awayScore !== null ? 'FINALIZADO' : 'AGENDADO'),
          notes: row.notes || '',
          odds: {
            homeFT: row.oddHomeFT ?? null,
            drawFT: row.oddDrawFT ?? null,
            awayFT: row.oddAwayFT ?? null,
            over25FT: row.oddOver25FT ?? null,
            under25FT: row.oddUnder25FT ?? null,
            bttsFT: row.oddBttsFT ?? null,
            homeHT: row.oddHomeHT ?? null,
            drawHT: row.oddDrawHT ?? null,
            awayHT: row.oddAwayHT ?? null,
            over05HT: row.oddOver05HT ?? null,
            under05HT: row.oddUnder05HT ?? null,
            bttsHT: row.oddBttsHT ?? null,
          },
          stats: {
            halftimeHomeScore: row.halftimeHomeScore ?? null,
            halftimeAwayScore: row.halftimeAwayScore ?? null,
            goalMinutesHome: row.goalMinutesHome,
            goalMinutesAway: row.goalMinutesAway,
            firstGoalMinuteMatch: row.firstGoalMinuteMatch ?? null,
            firstGoalMinuteHome: row.firstGoalMinuteHome ?? null,
            firstGoalMinuteAway: row.firstGoalMinuteAway ?? null,
            cornersHomeFT: row.cornersHomeFT ?? null,
            cornersAwayFT: row.cornersAwayFT ?? null,
            cornersHomeHT: row.cornersHomeHT ?? null,
            cornersAwayHT: row.cornersAwayHT ?? null,
            possessionHomeFT: row.possessionHomeFT ?? null,
            possessionAwayFT: row.possessionAwayFT ?? null,
            possessionHomeHT: row.possessionHomeHT ?? null,
            possessionAwayHT: row.possessionAwayHT ?? null,
            yellowCardsHomeFT: row.yellowCardsHomeFT ?? null,
            yellowCardsAwayFT: row.yellowCardsAwayFT ?? null,
            yellowCardsHomeHT: row.yellowCardsHomeHT ?? null,
            yellowCardsAwayHT: row.yellowCardsAwayHT ?? null,
            redCardsHomeFT: row.redCardsHomeFT ?? null,
            redCardsAwayFT: row.redCardsAwayFT ?? null,
            redCardsHomeHT: row.redCardsHomeHT ?? null,
            redCardsAwayHT: row.redCardsAwayHT ?? null,
            shotsHomeFT: row.shotsHomeFT ?? null,
            shotsAwayFT: row.shotsAwayFT ?? null,
            shotsHomeHT: row.shotsHomeHT ?? null,
            shotsAwayHT: row.shotsAwayHT ?? null,
            shotsOnTargetHomeFT: row.shotsOnTargetHomeFT ?? null,
            shotsOnTargetAwayFT: row.shotsOnTargetAwayFT ?? null,
            shotsOnTargetHomeHT: row.shotsOnTargetHomeHT ?? null,
            shotsOnTargetAwayHT: row.shotsOnTargetAwayHT ?? null,
          },
          createdAt: new Date().toISOString(),
        };

        currentMatches.push(newMatch);
        newNotifs.push({
          type: 'match',
          id: matchId,
          name: `${homeTeamRes.team.name} x ${awayTeamRes.team.name}`,
        });
      }
    }

    const newState: DbState = {
      countries: currentCountries,
      leagues: currentLeagues,
      teams: currentTeams,
      matches: currentMatches,
    };

    setDbState(newState);
    await saveDatabaseState(newState);

    if (newNotifs.length > 0) {
      setNotifications(prev => [...prev, ...newNotifs]);
    }
  };

  // Import Database
  const handleImportDb = async (importedState: DbState) => {
    setDbState(importedState);
    await saveDatabaseState(importedState);
  };

  // Clear Database with security confirmation
  const handleClearDb = async () => {
    const emptyState = await clearDatabase();
    setDbState(emptyState);
  };

  const handleConfirmResetDatabase = async () => {
    const emptyState = await clearDatabase();
    setDbState(emptyState);
  };

  const handleDismissNotification = (index: number) => {
    setNotifications(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleOpenNewMatchModal = () => {
    setEditingMatch(null);
    setIsMatchModalOpen(true);
  };

  const handleEditMatch = (match: Match) => {
    setEditingMatch(match);
    setIsMatchModalOpen(true);
  };

  const handleOpenStatsModal = (match: Match) => {
    setStatsMatch(match);
    setIsStatsModalOpen(true);
  };

  const handleSaveStats = async (
    matchId: string,
    homeScore: number | null,
    awayScore: number | null,
    status: MatchStatus,
    stats: MatchStats,
    pressureData?: MatchPressureData | null
  ) => {
    const updatedMatches = dbState.matches.map(m => {
      if (m.id === matchId) {
        return {
          ...m,
          homeScore,
          awayScore,
          status,
          stats,
          ...(pressureData !== undefined ? { pressureData: pressureData || undefined } : {}),
        };
      }
      return m;
    });
    const newState = { ...dbState, matches: updatedMatches };
    setDbState(newState);
    await saveDatabaseState(newState);
  };

  const handleOpenQuickScore = (match: Match) => {
    setQuickScoreMatch(match);
    setIsQuickScoreModalOpen(true);
  };

  const handleSaveQuickScore = async (
    matchId: string,
    homeScore: number | null,
    awayScore: number | null,
    status: MatchStatus,
    odds: MatchOdds,
    htHomeScore?: number | null,
    htAwayScore?: number | null
  ) => {
    const updatedMatches = dbState.matches.map(m => {
      if (m.id === matchId) {
        const existingStats = m.stats || {};
        const updatedStats: MatchStats = {
          ...existingStats,
          halftimeHomeScore: htHomeScore !== undefined ? htHomeScore : existingStats.halftimeHomeScore,
          halftimeAwayScore: htAwayScore !== undefined ? htAwayScore : existingStats.halftimeAwayScore,
        };

        return {
          ...m,
          homeScore,
          awayScore,
          status,
          odds,
          stats: updatedStats,
        };
      }
      return m;
    });
    const newState = { ...dbState, matches: updatedMatches };
    setDbState(newState);
    await saveDatabaseState(newState);
  };

  const handleOpenPressureChartModal = (matchId?: string | null) => {
    setPressureSelectedMatchId(matchId || null);
    setIsPressureModalOpen(true);
  };

  const handleSavePressureData = async (
    matchId: string,
    pressureData: MatchPressureData,
    autoFillGoalStats: boolean = true
  ) => {
    const updatedMatches = dbState.matches.map(m => {
      if (m.id === matchId) {
        const existingStats = m.stats || {};
        const stats: MatchStats = { ...existingStats };

        if (autoFillGoalStats && pressureData.events && pressureData.events.length > 0) {
          const homeGoals = pressureData.events.filter(e => e.type === 'goal' && e.team === 'home');
          const awayGoals = pressureData.events.filter(e => e.type === 'goal' && e.team === 'away');

          if (homeGoals.length > 0 && !stats.goalMinutesHome) {
            stats.goalMinutesHome = homeGoals.map(g => `${g.minute}'`).join(', ');
            stats.firstGoalMinuteHome = homeGoals[0].minute;
          }
          if (awayGoals.length > 0 && !stats.goalMinutesAway) {
            stats.goalMinutesAway = awayGoals.map(g => `${g.minute}'`).join(', ');
            stats.firstGoalMinuteAway = awayGoals[0].minute;
          }

          const allGoals = [...pressureData.events.filter(e => e.type === 'goal')].sort((a, b) => a.minute - b.minute);
          if (allGoals.length > 0 && !stats.firstGoalMinuteMatch) {
            stats.firstGoalMinuteMatch = allGoals[0].minute;
          }
        }

        return {
          ...m,
          pressureData,
          stats,
        };
      }
      return m;
    });

    const newState = { ...dbState, matches: updatedMatches };
    setDbState(newState);
    await saveDatabaseState(newState);
  };

  const handleOpenEntityModal = (type: 'country' | 'league' | 'team' = 'country') => {
    setEntityModalType(type);
    setIsEntityModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-slate-500">Carregando Banco de Dados de Futebol...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white pb-16">
      {/* Navbar */}
      <Navbar
        dbState={dbState}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenMatchModal={handleOpenNewMatchModal}
        onOpenEntityModal={handleOpenEntityModal}
        onOpenBulkImportModal={() => setIsBulkTeamModalOpen(true)}
        onOpenBulkMatchImportModal={() => setIsBulkMatchModalOpen(true)}
        onOpenBulkMatchUpdateModal={() => setIsBulkMatchUpdateModalOpen(true)}
        onOpenCsvImportModal={() => setIsCsvImportModalOpen(true)}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenResetModal={() => setIsResetModalOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Main Content by Tab */}
        {activeTab === 'matches' && (
          <>
            {dbState.matches.length === 0 ? (
              <EmptyState
                onOpenMatchModal={handleOpenNewMatchModal}
                onOpenEntityModal={() => handleOpenEntityModal('country')}
                onOpenCsvImportModal={() => setIsCsvImportModalOpen(true)}
              />
            ) : (
              <MatchList
                dbState={dbState}
                onEditMatch={handleEditMatch}
                onDeleteMatch={handleDeleteMatch}
                onOpenMatchModal={handleOpenNewMatchModal}
                onOpenStatsModal={handleOpenStatsModal}
                onOpenQuickScore={handleOpenQuickScore}
                onOpenBulkMatchImportModal={() => setIsBulkMatchModalOpen(true)}
                onOpenBulkMatchUpdateModal={() => setIsBulkMatchUpdateModalOpen(true)}
                onOpenPressureChartModal={handleOpenPressureChartModal}
              />
            )}
          </>
        )}

        {activeTab === 'schedule' && (
          <DailyMatchesView
            dbState={dbState}
            onEditMatch={handleEditMatch}
            onDeleteMatch={handleDeleteMatch}
            onOpenMatchModal={handleOpenNewMatchModal}
            onOpenStatsModal={handleOpenStatsModal}
            onOpenQuickScore={handleOpenQuickScore}
            onOpenBulkMatchImportModal={() => setIsBulkMatchModalOpen(true)}
            onOpenBulkMatchUpdateModal={() => setIsBulkMatchUpdateModalOpen(true)}
            onOpenPressureChartModal={handleOpenPressureChartModal}
          />
        )}

        {activeTab === 'countries' && (
          <CountryManager
            dbState={dbState}
            onOpenEntityModal={handleOpenEntityModal}
            onDeleteCountry={handleDeleteCountry}
            onUpdateCountryFlag={handleUpdateCountryFlag}
            onEditCountry={handleOpenEditCountry}
          />
        )}

        {activeTab === 'leagues' && (
          <LeagueManager
            dbState={dbState}
            onOpenEntityModal={handleOpenEntityModal}
            onDeleteLeague={handleDeleteLeague}
            onUpdateLeagueLogo={handleUpdateLeagueLogo}
            onEditLeague={handleOpenEditLeague}
          />
        )}

        {activeTab === 'teams' && (
          <TeamManager
            dbState={dbState}
            onOpenEntityModal={handleOpenEntityModal}
            onOpenBulkImportModal={() => setIsBulkTeamModalOpen(true)}
            onDeleteTeam={handleDeleteTeam}
            onUpdateTeamLogo={handleUpdateTeamLogo}
            onUpdateTeamLeague={handleUpdateTeamLeague}
            onEditTeam={handleOpenEditTeam}
          />
        )}

        {activeTab === 'stats' && (
          <StatsDashboard dbState={dbState} />
        )}

        {activeTab === 'pending_logos' && (
          <PendingLogosManager
            dbState={dbState}
            onUpdateTeamLogo={handleUpdateTeamLogo}
            onUpdateLeagueLogo={handleUpdateLeagueLogo}
            onUpdateCountryFlag={handleUpdateCountryFlag}
          />
        )}
      </main>

      {/* Modals */}
      <MatchStatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        match={statsMatch}
        onSaveStats={handleSaveStats}
        onOpenPressureChartModal={handleOpenPressureChartModal}
      />

      <PressureChartImportModal
        isOpen={isPressureModalOpen}
        onClose={() => {
          setIsPressureModalOpen(false);
          setPressureSelectedMatchId(null);
        }}
        matches={dbState.matches}
        selectedMatchId={pressureSelectedMatchId}
        onSavePressureData={handleSavePressureData}
      />

      <QuickScoreModal
        isOpen={isQuickScoreModalOpen}
        onClose={() => {
          setIsQuickScoreModalOpen(false);
          setQuickScoreMatch(null);
        }}
        match={quickScoreMatch}
        allMatches={dbState.matches}
        onSave={handleSaveQuickScore}
        onSelectMatch={match => setQuickScoreMatch(match)}
      />

      <MatchFormModal
        isOpen={isMatchModalOpen}
        onClose={() => setIsMatchModalOpen(false)}
        dbState={dbState}
        onSaveMatch={handleSaveMatch}
        editingMatch={editingMatch}
      />

      <EntityFormModal
        isOpen={isEntityModalOpen}
        onClose={() => setIsEntityModalOpen(false)}
        dbState={dbState}
        onSave={handleSaveEntity}
        initialType={entityModalType}
      />

      <EditEntityModal
        isOpen={isEditEntityModalOpen}
        onClose={() => setIsEditEntityModalOpen(false)}
        entityType={editEntityType}
        entityData={editEntityData}
        dbState={dbState}
        onSaveCountry={handleSaveEditCountry}
        onSaveLeague={handleSaveEditLeague}
        onSaveTeam={handleSaveEditTeam}
      />

      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        dbState={dbState}
        onImportDb={handleImportDb}
        onClearDb={handleClearDb}
        onOpenResetModal={() => setIsResetModalOpen(true)}
      />

      <ResetDatabaseModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        dbState={dbState}
        onConfirmReset={handleConfirmResetDatabase}
      />

      <BulkTeamImportModal
        isOpen={isBulkTeamModalOpen}
        onClose={() => setIsBulkTeamModalOpen(false)}
        dbState={dbState}
        onBulkImportTeams={handleBulkImportTeams}
        onOpenEntityModal={handleOpenEntityModal}
      />

      <BulkMatchImportModal
        isOpen={isBulkMatchModalOpen}
        onClose={() => setIsBulkMatchModalOpen(false)}
        dbState={dbState}
        onBulkImportMatches={handleBulkImportMatches}
      />

      <BulkMatchUpdateModal
        isOpen={isBulkMatchUpdateModalOpen}
        onClose={() => setIsBulkMatchUpdateModalOpen(false)}
        dbState={dbState}
        onBulkUpdateMatches={handleBulkUpdateMatches}
      />

      <CsvImportSyncModal
        isOpen={isCsvImportModalOpen}
        onClose={() => setIsCsvImportModalOpen(false)}
        dbState={dbState}
        onImportSuccess={handleCsvSyncComplete}
      />

      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        dbState={dbState}
        onSyncComplete={handleCsvSyncComplete}
      />

      {/* Unique ID Toast Notifications */}
      <ToastNotification
        notifications={notifications}
        onDismiss={handleDismissNotification}
      />
    </div>
  );
}
