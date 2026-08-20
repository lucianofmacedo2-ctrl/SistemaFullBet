/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { DbState, Match, NewEntityCreatedNotification, Country, League, Team, AppUser } from './types';
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
import { LoginModal } from './components/LoginModal';
import { UserManagerModal } from './components/UserManagerModal';
import { AccessExpiredOverlay } from './components/AccessExpiredOverlay';
import { ToastNotification } from './components/ToastNotification';
import { MatchOdds, MatchStats, MatchStatus, MatchPressureData } from './types';
import { findOrCreateCountry, findOrCreateLeague, findOrCreateTeam, getNextUniqueId } from './utils/idGenerator';
import { ParsedMatchRow, ParsedMatchUpdateRow } from './utils/excelHelper';
import { sanitizeDbImages, sanitizeImageUrl } from './utils/imageHelper';
import {
  getCurrentAuthUser,
  setCurrentAuthUser,
  ensureDefaultUsers,
  getUserEffectiveStatus,
  DEFAULT_MASTER_USER
} from './services/authService';

export default function App() {
  const [dbState, setDbState] = useState<DbState>({
    countries: [],
    leagues: [],
    teams: [],
    matches: [],
    users: [DEFAULT_MASTER_USER],
  });

  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    return getCurrentAuthUser() || DEFAULT_MASTER_USER;
  });

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'matches' | 'schedule' | 'countries' | 'leagues' | 'teams' | 'stats' | 'pending_logos'>('matches');

  // Auth Modals state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginInitialUsername, setLoginInitialUsername] = useState('');
  const [isConsultaPortalMode, setIsConsultaPortalMode] = useState(false);
  const [isUserManagerModalOpen, setIsUserManagerModalOpen] = useState(false);

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
      const cleanData = sanitizeDbImages(data);
      const guaranteedUsers = ensureDefaultUsers(cleanData.users);
      const finalState = { ...cleanData, users: guaranteedUsers };
      setDbState(finalState);

      // Verify active user validity against latest users
      const savedUser = getCurrentAuthUser();
      let targetUser = savedUser;
      if (typeof window !== 'undefined') {
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const modeParam = urlParams.get('mode') || urlParams.get('portal');
          const userParam = urlParams.get('user');

          if (modeParam === 'consulta' || modeParam === 'viewer') {
            setIsConsultaPortalMode(true);
            // If currently Master or no valid user, force open the Login modal
            if (!savedUser || savedUser.role === 'MASTER') {
              setIsLoginModalOpen(true);
            }
          }

          if (userParam) {
            const foundByUserParam = guaranteedUsers.find(
              u => u.username.toLowerCase() === userParam.toLowerCase() || u.id.toLowerCase() === userParam.toLowerCase()
            );
            if (foundByUserParam) {
              setLoginInitialUsername(foundByUserParam.username);
              // If user param was specified and matches, open login ready for them
              if (!savedUser || savedUser.id !== foundByUserParam.id) {
                setIsLoginModalOpen(true);
              }
            } else {
              setLoginInitialUsername(userParam);
              setIsLoginModalOpen(true);
            }
          }
        } catch {
          // Ignore URL parsing errors
        }
      }

      // Verify active user validity against latest users
      if (targetUser) {
        const found = guaranteedUsers.find(u => u.id === targetUser.id);
        if (found) {
          setCurrentUser(found);
          setCurrentAuthUser(found);
        } else {
          // If saved user is no longer present, fallback to default master
          const master = guaranteedUsers.find(u => u.role === 'MASTER') || DEFAULT_MASTER_USER;
          setCurrentUser(master);
          setCurrentAuthUser(master);
        }
      } else {
        const master = guaranteedUsers.find(u => u.role === 'MASTER') || DEFAULT_MASTER_USER;
        setCurrentUser(master);
        setCurrentAuthUser(master);
      }

      setIsLoading(false);
    }
    initDb();
  }, []);

  const handleLoginSuccess = (user: AppUser) => {
    setCurrentUser(user);
    setCurrentAuthUser(user);
    setIsLoginModalOpen(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentAuthUser(null);
    setIsLoginModalOpen(true);
  };

  const handleSwitchUser = (user: AppUser) => {
    setCurrentUser(user);
    setCurrentAuthUser(user);
    setIsUserManagerModalOpen(false);
  };

  const handleSaveUsers = async (updatedUsers: AppUser[]) => {
    const ensured = ensureDefaultUsers(updatedUsers);
    const newState = { ...dbState, users: ensured };
    setDbState(newState);
    await saveDatabaseState(newState);

    // Keep currentUser up to date if modified in manager
    if (currentUser) {
      const refreshed = ensured.find(u => u.id === currentUser.id);
      if (refreshed) {
        setCurrentUser(refreshed);
        setCurrentAuthUser(refreshed);
      }
    }
  };

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
    const cleanUrl = sanitizeImageUrl(flagUrl);
    const updatedCountries = dbState.countries.map(c => c.id === countryId ? { ...c, flagUrl: cleanUrl } : c);
    const updatedMatches = dbState.matches.map(m => m.countryId === countryId ? { ...m, countryFlagUrl: cleanUrl } : m);
    const newState = { ...dbState, countries: updatedCountries, matches: updatedMatches };
    setDbState(newState);
    await saveDatabaseState(newState);
  };

  // Update League Logo
  const handleUpdateLeagueLogo = async (leagueId: string, logoUrl: string) => {
    const cleanUrl = sanitizeImageUrl(logoUrl);
    const updatedLeagues = dbState.leagues.map(l => l.id === leagueId ? { ...l, logoUrl: cleanUrl } : l);
    const updatedMatches = dbState.matches.map(m => m.leagueId === leagueId ? { ...m, leagueLogoUrl: cleanUrl } : m);
    const newState = { ...dbState, leagues: updatedLeagues, matches: updatedMatches };
    setDbState(newState);
    await saveDatabaseState(newState);
  };

  // Update Team Logo
  const handleUpdateTeamLogo = async (teamId: string, logoUrl: string) => {
    const cleanUrl = sanitizeImageUrl(logoUrl);
    const updatedTeams = dbState.teams.map(t => t.id === teamId ? { ...t, logoUrl: cleanUrl } : t);
    const updatedMatches = dbState.matches.map(m => {
      let updated = { ...m };
      if (m.homeTeamId === teamId) updated.homeTeamLogoUrl = cleanUrl;
      if (m.awayTeamId === teamId) updated.awayTeamLogoUrl = cleanUrl;
      return updated;
    });
    const newState = { ...dbState, teams: updatedTeams, matches: updatedMatches };
    setDbState(newState);
    await saveDatabaseState(newState);
  };

  // Bulk update logos/flags for countries, leagues, and teams in one batch
  const handleBulkUpdateLogos = async (updates: {
    countryUpdates?: Record<string, string>;
    leagueUpdates?: Record<string, string>;
    teamUpdates?: Record<string, string>;
  }) => {
    const { countryUpdates = {}, leagueUpdates = {}, teamUpdates = {} } = updates;

    const cleanCountryUpdates: Record<string, string | undefined> = {};
    Object.entries(countryUpdates).forEach(([k, v]) => {
      cleanCountryUpdates[k] = sanitizeImageUrl(v);
    });

    const cleanLeagueUpdates: Record<string, string | undefined> = {};
    Object.entries(leagueUpdates).forEach(([k, v]) => {
      cleanLeagueUpdates[k] = sanitizeImageUrl(v);
    });

    const cleanTeamUpdates: Record<string, string | undefined> = {};
    Object.entries(teamUpdates).forEach(([k, v]) => {
      cleanTeamUpdates[k] = sanitizeImageUrl(v);
    });

    const updatedCountries = dbState.countries.map(c => {
      if (cleanCountryUpdates[c.id] !== undefined) {
        return { ...c, flagUrl: cleanCountryUpdates[c.id] };
      }
      return c;
    });

    const updatedLeagues = dbState.leagues.map(l => {
      if (cleanLeagueUpdates[l.id] !== undefined) {
        return { ...l, logoUrl: cleanLeagueUpdates[l.id] };
      }
      return l;
    });

    const updatedTeams = dbState.teams.map(t => {
      if (cleanTeamUpdates[t.id] !== undefined) {
        return { ...t, logoUrl: cleanTeamUpdates[t.id] };
      }
      return t;
    });

    const updatedMatches = dbState.matches.map(m => {
      let match = { ...m };
      if (m.countryId && cleanCountryUpdates[m.countryId] !== undefined) {
        match.countryFlagUrl = cleanCountryUpdates[m.countryId];
      }
      if (m.leagueId && cleanLeagueUpdates[m.leagueId] !== undefined) {
        match.leagueLogoUrl = cleanLeagueUpdates[m.leagueId];
      }
      if (m.homeTeamId && cleanTeamUpdates[m.homeTeamId] !== undefined) {
        match.homeTeamLogoUrl = cleanTeamUpdates[m.homeTeamId];
      }
      if (m.awayTeamId && cleanTeamUpdates[m.awayTeamId] !== undefined) {
        match.awayTeamLogoUrl = cleanTeamUpdates[m.awayTeamId];
      }
      return match;
    });

    const newState = {
      countries: updatedCountries,
      leagues: updatedLeagues,
      teams: updatedTeams,
      matches: updatedMatches,
    };
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
        undefined,
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
        referee: row.referee || '',
        status: 'AGENDADO',
        notes: row.notes || '',
        odds: {
          homeFT: row.oddHomeFT ?? null,
          drawFT: row.oddDrawFT ?? null,
          awayFT: row.oddAwayFT ?? null,
          over25FT: row.oddOver25FT ?? null,
          under25FT: row.oddUnder25FT ?? null,
          asianHandicapHomeLine: row.asianHandicapHomeLine ?? null,
          asianHandicapHomeOdd: row.asianHandicapHomeOdd ?? null,
          asianHandicapAwayLine: row.asianHandicapAwayLine ?? null,
          asianHandicapAwayOdd: row.asianHandicapAwayOdd ?? null,
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
          asianHandicapHomeLine: null,
          asianHandicapHomeOdd: null,
          asianHandicapAwayLine: null,
          asianHandicapAwayOdd: null,
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
          xgHomeFT: row.xgHomeFT !== null && row.xgHomeFT !== undefined ? row.xgHomeFT : existingStats.xgHomeFT,
          xgAwayFT: row.xgAwayFT !== null && row.xgAwayFT !== undefined ? row.xgAwayFT : existingStats.xgAwayFT,
          shotsHomeFT: row.shotsHomeFT !== null && row.shotsHomeFT !== undefined ? row.shotsHomeFT : existingStats.shotsHomeFT,
          shotsAwayFT: row.shotsAwayFT !== null && row.shotsAwayFT !== undefined ? row.shotsAwayFT : existingStats.shotsAwayFT,
          shotsOnTargetHomeFT: row.shotsOnTargetHomeFT !== null && row.shotsOnTargetHomeFT !== undefined ? row.shotsOnTargetHomeFT : existingStats.shotsOnTargetHomeFT,
          shotsOnTargetAwayFT: row.shotsOnTargetAwayFT !== null && row.shotsOnTargetAwayFT !== undefined ? row.shotsOnTargetAwayFT : existingStats.shotsOnTargetAwayFT,
          foulsHomeFT: row.foulsHomeFT !== null && row.foulsHomeFT !== undefined ? row.foulsHomeFT : existingStats.foulsHomeFT,
          foulsAwayFT: row.foulsAwayFT !== null && row.foulsAwayFT !== undefined ? row.foulsAwayFT : existingStats.foulsAwayFT,
          cornersHomeFT: row.cornersHomeFT !== null && row.cornersHomeFT !== undefined ? row.cornersHomeFT : existingStats.cornersHomeFT,
          cornersAwayFT: row.cornersAwayFT !== null && row.cornersAwayFT !== undefined ? row.cornersAwayFT : existingStats.cornersAwayFT,
          yellowCardsHomeFT: row.yellowCardsHomeFT !== null && row.yellowCardsHomeFT !== undefined ? row.yellowCardsHomeFT : existingStats.yellowCardsHomeFT,
          yellowCardsAwayFT: row.yellowCardsAwayFT !== null && row.yellowCardsAwayFT !== undefined ? row.yellowCardsAwayFT : existingStats.yellowCardsAwayFT,
          redCardsHomeFT: row.redCardsHomeFT !== null && row.redCardsHomeFT !== undefined ? row.redCardsHomeFT : existingStats.redCardsHomeFT,
          redCardsAwayFT: row.redCardsAwayFT !== null && row.redCardsAwayFT !== undefined ? row.redCardsAwayFT : existingStats.redCardsAwayFT,
        };

        // Updated Odds merge
        const updatedOdds: MatchOdds = {
          homeFT: row.oddHomeFT !== null ? row.oddHomeFT : existingOdds.homeFT,
          drawFT: row.oddDrawFT !== null ? row.oddDrawFT : existingOdds.drawFT,
          awayFT: row.oddAwayFT !== null ? row.oddAwayFT : existingOdds.awayFT,
          over25FT: row.oddOver25FT !== null ? row.oddOver25FT : existingOdds.over25FT,
          under25FT: row.oddUnder25FT !== null ? row.oddUnder25FT : existingOdds.under25FT,
          asianHandicapHomeLine: row.asianHandicapHomeLine !== null ? row.asianHandicapHomeLine : existingOdds.asianHandicapHomeLine,
          asianHandicapHomeOdd: row.asianHandicapHomeOdd !== null ? row.asianHandicapHomeOdd : existingOdds.asianHandicapHomeOdd,
          asianHandicapAwayLine: row.asianHandicapAwayLine !== null ? row.asianHandicapAwayLine : existingOdds.asianHandicapAwayLine,
          asianHandicapAwayOdd: row.asianHandicapAwayOdd !== null ? row.asianHandicapAwayOdd : existingOdds.asianHandicapAwayOdd,
        };

        const updatedMatch: Match = {
          ...existing,
          matchDate: row.matchDate || existing.matchDate,
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
          undefined,
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
          referee: row.referee || '',
          status: row.status || (row.homeScore !== null && row.awayScore !== null ? 'FINALIZADO' : 'AGENDADO'),
          notes: row.notes || '',
          odds: {
            homeFT: row.oddHomeFT ?? null,
            drawFT: row.oddDrawFT ?? null,
            awayFT: row.oddAwayFT ?? null,
            over25FT: row.oddOver25FT ?? null,
            under25FT: row.oddUnder25FT ?? null,
            asianHandicapHomeLine: row.asianHandicapHomeLine ?? null,
            asianHandicapHomeOdd: row.asianHandicapHomeOdd ?? null,
            asianHandicapAwayLine: row.asianHandicapAwayLine ?? null,
            asianHandicapAwayOdd: row.asianHandicapAwayOdd ?? null,
          },
          stats: {
            halftimeHomeScore: row.halftimeHomeScore ?? null,
            halftimeAwayScore: row.halftimeAwayScore ?? null,
            xgHomeFT: row.xgHomeFT ?? null,
            xgAwayFT: row.xgAwayFT ?? null,
            shotsHomeFT: row.shotsHomeFT ?? null,
            shotsAwayFT: row.shotsAwayFT ?? null,
            shotsOnTargetHomeFT: row.shotsOnTargetHomeFT ?? null,
            shotsOnTargetAwayFT: row.shotsOnTargetAwayFT ?? null,
            foulsHomeFT: row.foulsHomeFT ?? null,
            foulsAwayFT: row.foulsAwayFT ?? null,
            cornersHomeFT: row.cornersHomeFT ?? null,
            cornersAwayFT: row.cornersAwayFT ?? null,
            yellowCardsHomeFT: row.yellowCardsHomeFT ?? null,
            yellowCardsAwayFT: row.yellowCardsAwayFT ?? null,
            redCardsHomeFT: row.redCardsHomeFT ?? null,
            redCardsAwayFT: row.redCardsAwayFT ?? null,
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
    _autoFillGoalStats: boolean = true
  ) => {
    const updatedMatches = dbState.matches.map(m => {
      if (m.id === matchId) {
        return {
          ...m,
          pressureData,
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

  const isMaster = currentUser?.role === 'MASTER';
  const effectiveUserStatus = currentUser ? getUserEffectiveStatus(currentUser) : null;
  const isAccessBlockedOrExpired = currentUser ? !effectiveUserStatus?.canAccess : false;

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
        currentUser={currentUser}
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
        onOpenUserManagerModal={() => setIsUserManagerModalOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {isAccessBlockedOrExpired && currentUser ? (
          <AccessExpiredOverlay
            currentUser={currentUser}
            onLogout={handleLogout}
            onOpenLoginModal={() => setIsLoginModalOpen(true)}
          />
        ) : (
          <>
            {/* Main Content by Tab */}
            {activeTab === 'matches' && (
              <>
                {dbState.matches.length === 0 ? (
                  <EmptyState
                    onOpenMatchModal={handleOpenNewMatchModal}
                    onOpenEntityModal={() => handleOpenEntityModal('country')}
                    onOpenCsvImportModal={() => setIsCsvImportModalOpen(true)}
                    isMaster={isMaster}
                  />
                ) : (
                  <MatchList
                    dbState={dbState}
                    isMaster={isMaster}
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
                isMaster={isMaster}
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
                isMaster={isMaster}
                onOpenEntityModal={handleOpenEntityModal}
                onDeleteCountry={handleDeleteCountry}
                onUpdateCountryFlag={handleUpdateCountryFlag}
                onEditCountry={handleOpenEditCountry}
              />
            )}

            {activeTab === 'leagues' && (
              <LeagueManager
                dbState={dbState}
                isMaster={isMaster}
                onOpenEntityModal={handleOpenEntityModal}
                onDeleteLeague={handleDeleteLeague}
                onUpdateLeagueLogo={handleUpdateLeagueLogo}
                onEditLeague={handleOpenEditLeague}
              />
            )}

            {activeTab === 'teams' && (
              <TeamManager
                dbState={dbState}
                isMaster={isMaster}
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
                onBulkUpdateLogos={handleBulkUpdateLogos}
              />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <MatchStatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        match={statsMatch}
        isMaster={isMaster}
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
        isMaster={isMaster}
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

      {/* User Management Modal (Master Only) */}
      <UserManagerModal
        isOpen={isUserManagerModalOpen}
        onClose={() => setIsUserManagerModalOpen(false)}
        users={dbState.users || [DEFAULT_MASTER_USER]}
        currentAuthUser={currentUser}
        onSaveUsers={handleSaveUsers}
        onSwitchUser={handleSwitchUser}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen || !currentUser}
        onClose={() => setIsLoginModalOpen(false)}
        users={dbState.users || [DEFAULT_MASTER_USER]}
        onLoginSuccess={handleLoginSuccess}
        allowClose={!!currentUser && !!effectiveUserStatus?.canAccess}
        initialUsername={loginInitialUsername}
        isConsultaPortal={isConsultaPortalMode || currentUser?.role === 'CONSULTOR'}
      />

      {/* Unique ID Toast Notifications */}
      <ToastNotification
        notifications={notifications}
        onDismiss={handleDismissNotification}
      />
    </div>
  );
}
