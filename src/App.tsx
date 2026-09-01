/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { DbState, Match, NewEntityCreatedNotification, Country, League, Team, AppUser, Referee } from './types';
import {
  fetchDatabaseState,
  saveDatabaseState,
  clearDatabase,
  saveUsersList,
  getInstantCachedDatabaseState,
} from './services/dbService';

import { Navbar } from './components/Navbar';
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
import { RefereeStatsModule } from './components/RefereeStatsModule';
import { AnalysisDashboard } from './components/analysis/AnalysisDashboard';
import { LeagueStandings } from './components/LeagueStandings';
import { OpportunitiesHubModal } from './components/opportunities/OpportunitiesHubModal';
import { HtGoalsScannerModal } from './components/HtGoalsScannerModal';
import { BankrollTrackerModal } from './components/bankroll/BankrollTrackerModal';
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
import { TeamsReportModal } from './components/TeamsReportModal';
import { DbSanitizerModal } from './components/DbSanitizerModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { TechDocsModal } from './components/TechDocsModal';
import { MatchOdds, MatchStats, MatchStatus, MatchPressureData } from './types';
import { findOrCreateCountry, findOrCreateLeague, findOrCreateTeam, getNextUniqueId } from './utils/idGenerator';
import { ParsedMatchRow, ParsedMatchUpdateRow } from './utils/excelHelper';
import { normalizeRefereeName } from './utils/refereeAnalytics';
import { sanitizeDbImages, sanitizeImageUrl } from './utils/imageHelper';
import {
  getCurrentAuthUser,
  setCurrentAuthUser,
  ensureDefaultUsers,
  getUserEffectiveStatus,
  DEFAULT_MASTER_USER,
  DEFAULT_CONSULTA_USER,
  decodeUserFromToken,
  touchUserActivity,
} from './services/authService';
import {
  subscribeToFirestoreSync,
  fetchDbFromFirestore,
} from './services/firebaseDbService';
import {
  startActiveSessionKeepalive,
  clearActiveSession,
  getOrCreateClientSessionId,
  ActiveSessionRecord,
} from './services/sessionService';

export default function App() {
  const [dbState, setDbState] = useState<DbState>(() => {
    return getInstantCachedDatabaseState();
  });

  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const saved = getCurrentAuthUser();
    if (saved) return saved;
    const initialUsers = getInstantCachedDatabaseState().users;
    const master = initialUsers.find(u => u.role === 'MASTER') || DEFAULT_MASTER_USER;
    return master;
  });

  // Zero-blocking startup: The app has cached data immediately, so isLoading is false
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'matches' | 'schedule' | 'standings' | 'countries' | 'leagues' | 'teams' | 'stats' | 'analysis' | 'pending_logos' | 'referees'>('schedule');
  const [analysisTargetMatchId, setAnalysisTargetMatchId] = useState<string | null>(null);
  const [refereeTargetName, setRefereeTargetName] = useState<string | undefined>(undefined);

  // Auth Modals state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginInitialUsername, setLoginInitialUsername] = useState('');
  const [isConsultaPortalMode, setIsConsultaPortalMode] = useState(false);
  const [isUserManagerModalOpen, setIsUserManagerModalOpen] = useState(false);
  const [userManagerInitialTab, setUserManagerInitialTab] = useState<'USERS' | 'SESSIONS'>('USERS');

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
  const [isTeamsReportModalOpen, setIsTeamsReportModalOpen] = useState(false);
  const [isSanitizerModalOpen, setIsSanitizerModalOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [isTechDocsOpen, setIsTechDocsOpen] = useState(false);

  // Opportunities Hub & Bankroll Tracker Modals
  const [isOpportunitiesHubOpen, setIsOpportunitiesHubOpen] = useState(false);
  const [isHtGoalsScannerOpen, setIsHtGoalsScannerOpen] = useState(false);
  const [isBankrollTrackerOpen, setIsBankrollTrackerOpen] = useState(false);
  const [bankrollPrefillBet, setBankrollPrefillBet] = useState<{
    matchDescription: string;
    market: string;
    odd: number;
    evPct?: number;
  } | null>(null);

  const handleOpenBankrollWithPrefill = (prefill: {
    matchDescription: string;
    market: string;
    odd: number;
    evPct?: number;
  }) => {
    setBankrollPrefillBet(prefill);
    setIsBankrollTrackerOpen(true);
  };

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

  const handleApplyCleanedDb = async (cleanedDb: DbState) => {
    setDbState(cleanedDb);
    await saveDatabaseState(cleanedDb);
    setNotifications(prev => [
      ...prev,
      {
        id: `clean-${Date.now()}`,
        type: 'team',
        entityId: 'AUTO-CLEAN',
        name: 'Banco de Dados Sanitizado com Sucesso (Ligas e Duplicidades Corrigidas)',
        timestamp: Date.now(),
      },
    ]);
  };

  // Load database on mount (Instant Local Load + Background Cloud Sync)
  useEffect(() => {
    // 1. Instant check for URL params and active session on mount (0ms)
    const initialDb = getInstantCachedDatabaseState();
    const guaranteedUsers = ensureDefaultUsers(initialDb.users);
    const savedUser = getCurrentAuthUser();
    let targetUser = savedUser;
    let shouldOpenLogin = false;

    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const modeParam = urlParams.get('mode') || urlParams.get('portal');
        const userParam = urlParams.get('user') || urlParams.get('u');
        const accParam = urlParams.get('acc');

        // If a direct account token was provided in the URL, import/update it seamlessly
        if (accParam) {
          const importedUser = decodeUserFromToken(accParam);
          if (importedUser) {
            const existingIdx = guaranteedUsers.findIndex(
              u => u.username.toLowerCase() === importedUser.username.toLowerCase() || u.id === importedUser.id
            );
            if (existingIdx >= 0) {
              guaranteedUsers[existingIdx] = importedUser;
            } else {
              guaranteedUsers.push(importedUser);
            }
            initialDb.users = guaranteedUsers;
            saveDatabaseState(initialDb);
            saveUsersList(guaranteedUsers);
            
            // Automatically authenticate as the imported user
            targetUser = importedUser;
            setCurrentUser(importedUser);
            setCurrentAuthUser(importedUser);
            shouldOpenLogin = false;
          }
        }

        if (modeParam === 'consulta' || modeParam === 'viewer') {
          setIsConsultaPortalMode(true);
          if (!savedUser) {
            shouldOpenLogin = true;
          }
        }

        if (userParam) {
          const cleanUserParam = userParam.trim().toLowerCase();
          const foundByUserParam = guaranteedUsers.find(
            u => u.username.toLowerCase() === cleanUserParam || u.id.toLowerCase() === cleanUserParam
          );
          if (foundByUserParam) {
            setLoginInitialUsername(foundByUserParam.username);
            if (!savedUser || savedUser.id !== foundByUserParam.id) {
              shouldOpenLogin = true;
            }
          } else if (!savedUser) {
            setLoginInitialUsername(userParam.trim());
            shouldOpenLogin = true;
          }
        }

        // Clean URL query params to prevent re-triggering on subsequent page refreshes (F5)
        if (accParam || userParam || modeParam) {
          const cleanPath = window.location.pathname;
          window.history.replaceState({}, document.title, cleanPath);
        }
      } catch {
        // Ignore URL parsing errors
      }
    }

    if (shouldOpenLogin) {
      setIsLoginModalOpen(true);
    }

    if (targetUser) {
      const found = guaranteedUsers.find(
        u => u.id === targetUser.id || u.username.toLowerCase() === targetUser.username.toLowerCase()
      );
      if (found) {
        setCurrentUser(found);
        setCurrentAuthUser(found);
      } else {
        const master = guaranteedUsers.find(u => u.role === 'MASTER') || DEFAULT_MASTER_USER;
        setCurrentUser(master);
        setCurrentAuthUser(master);
      }
    } else {
      const master = guaranteedUsers.find(u => u.role === 'MASTER') || DEFAULT_MASTER_USER;
      setCurrentUser(master);
      setCurrentAuthUser(master);
    }

    // 2. Background Cloud Sync (Non-blocking: pulls latest cloud / deploy changes asynchronously)
    async function syncCloudInBackground() {
      try {
        const data = await fetchDatabaseState();
        if (data && (data.matches?.length > 0 || data.countries?.length > 0)) {
          const cleanData = sanitizeDbImages(data);
          const freshUsers = ensureDefaultUsers(cleanData.users);

          setDbState({
            countries: cleanData.countries || [],
            leagues: cleanData.leagues || [],
            teams: cleanData.teams || [],
            matches: cleanData.matches || [],
            users: freshUsers,
          });

          // Update current user if permissions or expiry changed in cloud
          const currentAuth = getCurrentAuthUser();
          if (currentAuth) {
            const updatedProfile = freshUsers.find(
              u => u.id === currentAuth.id || u.username.toLowerCase() === currentAuth.username.toLowerCase()
            );
            if (updatedProfile) {
              setCurrentUser(updatedProfile);
              setCurrentAuthUser(updatedProfile);
            }
          }
        }
      } catch (err) {
        console.warn('Background sync note (local cached state is active):', err);
      }
    }

    syncCloudInBackground();

    // 1. Subscribe to real-time bi-directional Firestore cloud synchronization
    const unsubscribe = subscribeToFirestoreSync(
      (cloudDb) => {
        if (!cloudDb) return;
        setDbState(prev => {
          // If local already has matches from local user sync, do not blindly overwrite matches
          const keepLocal = (prev.matches?.length || 0) > 0;
          return {
            countries: keepLocal && prev.countries?.length ? prev.countries : (cloudDb.countries || []),
            leagues: keepLocal && prev.leagues?.length ? prev.leagues : (cloudDb.leagues || []),
            teams: keepLocal && prev.teams?.length ? prev.teams : (cloudDb.teams || []),
            matches: keepLocal ? prev.matches : (cloudDb.matches || []),
            users: ensureDefaultUsers(cloudDb.users?.length > 0 ? cloudDb.users : prev.users),
          };
        });
      },
      (err) => {
        console.warn('Realtime cloud sync notification:', err.message);
      }
    );

    // 2. Activity tracker to maintain sliding 8-hour session window
    const handleUserInteraction = () => {
      touchUserActivity();
    };

    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);
    window.addEventListener('touchstart', handleUserInteraction);

    return () => {
      unsubscribe();
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  // Multi-Device Active Session Keepalive & Presence Management
  useEffect(() => {
    if (!currentUser) return;

    const clientSessionId = getOrCreateClientSessionId();
    // Start active session keepalive and listen for remote disconnect from Master
    const cleanupKeepalive = startActiveSessionKeepalive(
      currentUser,
      clientSessionId,
      () => {
        // Disconnected remotely by Master
        handleLogout();
        setNotifications(prev => [
          ...prev,
          {
            id: `session-disconnected-${Date.now()}`,
            type: 'team',
            entityId: 'AUTH',
            name: 'Sua sessão foi encerrada remotamente pelo Administrador Master.',
            timestamp: Date.now(),
          },
        ]);
      }
    );

    return () => {
      cleanupKeepalive();
    };
  }, [currentUser?.id, currentUser?.username, currentUser?.role]);

  const handleLoginSuccess = async (user: AppUser) => {
    setCurrentUser(user);
    setCurrentAuthUser(user);
    setIsLoginModalOpen(false);
  };

  const handleLogout = () => {
    if (currentUser) {
      clearActiveSession(currentUser);
    }
    setCurrentUser(null);
    setCurrentAuthUser(null);
    setIsLoginModalOpen(true);
  };

  const handleSwitchUser = (user: AppUser) => {
    setCurrentUser(user);
    setCurrentAuthUser(user);
    setIsUserManagerModalOpen(false);
  };

  const handleSaveUsers = async (updatedUsers: AppUser[], isExplicitReplacement: boolean = false) => {
    const ensured = ensureDefaultUsers(updatedUsers);
    const newState = { ...dbState, users: ensured };
    setDbState(newState);
    await saveDatabaseState(newState);
    await saveUsersList(ensured, isExplicitReplacement);

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

  // Update Referee Photo
  const handleUpdateRefereePhoto = async (refereeName: string, photoUrl: string) => {
    const trimmedName = refereeName.trim();
    if (!trimmedName) return;
    const norm = normalizeRefereeName(trimmedName);
    const cleanUrl = sanitizeImageUrl(photoUrl);

    // 1. Update in all matches where referee matches
    const updatedMatches = dbState.matches.map(m => {
      if (normalizeRefereeName(m.referee) === norm) {
        return {
          ...m,
          refereePhotoUrl: cleanUrl || undefined,
        };
      }
      return m;
    });

    // 2. Update or insert into referees list
    let updatedReferees = [...(dbState.referees || [])];
    const existingIdx = updatedReferees.findIndex(r => normalizeRefereeName(r.name) === norm);
    if (existingIdx >= 0) {
      updatedReferees[existingIdx] = {
        ...updatedReferees[existingIdx],
        photoUrl: cleanUrl || undefined,
        updatedAt: new Date().toISOString(),
      };
    } else {
      updatedReferees.push({
        id: `REF-${Date.now()}`,
        name: trimmedName,
        photoUrl: cleanUrl || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    const newState: DbState = {
      ...dbState,
      matches: updatedMatches,
      referees: updatedReferees,
    };

    setDbState(newState);
    await saveDatabaseState(newState);

    setNotifications(prev => [
      ...prev,
      {
        id: `ref-photo-${Date.now()}`,
        type: 'match',
        entityId: trimmedName,
        name: `Foto do árbitro "${trimmedName}" ${cleanUrl ? 'atualizada com sucesso!' : 'removida.'}`,
        timestamp: Date.now(),
      },
    ]);
  };

  // Bulk update logos/flags for countries, leagues, teams, and referees in one batch
  const handleBulkUpdateLogos = async (updates: {
    countryUpdates?: Record<string, string>;
    leagueUpdates?: Record<string, string>;
    teamUpdates?: Record<string, string>;
    refereeUpdates?: Record<string, string>;
  }) => {
    const { countryUpdates = {}, leagueUpdates = {}, teamUpdates = {}, refereeUpdates = {} } = updates;

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

    const cleanRefereeUpdates: Record<string, string | undefined> = {};
    Object.entries(refereeUpdates).forEach(([k, v]) => {
      cleanRefereeUpdates[normalizeRefereeName(k)] = sanitizeImageUrl(v);
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

    let updatedReferees = [...(dbState.referees || [])];
    Object.entries(cleanRefereeUpdates).forEach(([normRefName, url]) => {
      const idx = updatedReferees.findIndex(r => normalizeRefereeName(r.name) === normRefName);
      if (idx >= 0) {
        updatedReferees[idx] = {
          ...updatedReferees[idx],
          photoUrl: url || undefined,
          updatedAt: new Date().toISOString(),
        };
      } else {
        updatedReferees.push({
          id: `REF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: normRefName,
          photoUrl: url || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
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
      if (m.referee) {
        const norm = normalizeRefereeName(m.referee);
        if (cleanRefereeUpdates[norm] !== undefined) {
          match.refereePhotoUrl = cleanRefereeUpdates[norm] || undefined;
        }
      }
      return match;
    });

    const newState: DbState = {
      countries: updatedCountries,
      leagues: updatedLeagues,
      teams: updatedTeams,
      matches: updatedMatches,
      referees: updatedReferees,
      users: dbState.users,
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

      // 5. Create Match or Update if already exists
      const rowDateYmd = row.matchDate ? row.matchDate.slice(0, 10) : '';
      const existingMatchIdx = currentMatches.findIndex(m => {
        const hMatch = m.homeTeamId === homeTeamRes.team.id || m.homeTeamName.toLowerCase().trim() === row.homeTeamName.toLowerCase().trim();
        const aMatch = m.awayTeamId === awayTeamRes.team.id || m.awayTeamName.toLowerCase().trim() === row.awayTeamName.toLowerCase().trim();
        const mDateYmd = m.matchDate ? m.matchDate.slice(0, 10) : '';
        const dMatch = rowDateYmd && mDateYmd ? mDateYmd === rowDateYmd : false;
        return hMatch && aMatch && dMatch;
      });

      if (existingMatchIdx !== -1) {
        const existing = currentMatches[existingMatchIdx];
        const existingOdds = existing.odds || {};
        currentMatches[existingMatchIdx] = {
          ...existing,
          referee: row.referee || existing.referee,
          stadium: row.stadium || existing.stadium,
          stadiumCapacity: row.stadiumCapacity ?? existing.stadiumCapacity,
          odds: {
            ...existingOdds,
            homeFT: row.oddHomeFT !== null && row.oddHomeFT !== undefined ? row.oddHomeFT : existingOdds.homeFT,
            drawFT: row.oddDrawFT !== null && row.oddDrawFT !== undefined ? row.oddDrawFT : existingOdds.drawFT,
            awayFT: row.oddAwayFT !== null && row.oddAwayFT !== undefined ? row.oddAwayFT : existingOdds.awayFT,
            over25FT: row.oddOver25FT !== null && row.oddOver25FT !== undefined ? row.oddOver25FT : existingOdds.over25FT,
            under25FT: row.oddUnder25FT !== null && row.oddUnder25FT !== undefined ? row.oddUnder25FT : existingOdds.under25FT,
            asianHandicapHomeLine: row.asianHandicapHomeLine ?? existingOdds.asianHandicapHomeLine,
            asianHandicapHomeOdd: row.asianHandicapHomeOdd ?? existingOdds.asianHandicapHomeOdd,
            asianHandicapAwayLine: row.asianHandicapAwayLine ?? existingOdds.asianHandicapAwayLine,
            asianHandicapAwayOdd: row.asianHandicapAwayOdd ?? existingOdds.asianHandicapAwayOdd,
          },
        };
      } else {
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
          stadium: row.stadium || '',
          stadiumCapacity: row.stadiumCapacity ?? null,
          attendance: null,
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

  // Bulk Update Matches (Complete Missing Data / Finalized Matches Auto-Merge)
  const handleBulkUpdateMatches = async (rows: ParsedMatchUpdateRow[]) => {
    let currentCountries = [...dbState.countries];
    let currentLeagues = [...dbState.leagues];
    let currentTeams = [...dbState.teams];
    let currentMatches = [...dbState.matches];
    const newNotifs: NewEntityCreatedNotification[] = [];

    for (const row of rows) {
      if (!row.isValid) continue;

      // Check if this row matches an existing match (by matchedMatch, matchId, or by team names + date)
      const existingMatchIndex = currentMatches.findIndex(m => {
        if (row.matchId && m.id === row.matchId) return true;
        if (row.matchedMatch && m.id === row.matchedMatch.id) return true;
        const normH = m.homeTeamName.toLowerCase().trim();
        const normA = m.awayTeamName.toLowerCase().trim();
        const rowH = row.homeTeamName.toLowerCase().trim();
        const rowA = row.awayTeamName.toLowerCase().trim();
        const isSameTeams = normH === rowH && normA === rowA;
        if (!isSameTeams) return false;

        const mDate = m.matchDate.slice(0, 10);
        const rDate = row.matchDate.slice(0, 10);
        if (mDate === rDate) return true;
        if (m.status === 'AGENDADO') return true;
        return false;
      });

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
        const homeScore = row.homeScore !== null && row.homeScore !== undefined ? row.homeScore : existing.homeScore;
        const awayScore = row.awayScore !== null && row.awayScore !== undefined ? row.awayScore : existing.awayScore;

        // Determine status
        let newStatus = existing.status;
        if (row.status) {
          newStatus = row.status;
        } else if (homeScore !== null && awayScore !== null) {
          newStatus = 'FINALIZADO';
        }

        // Updated Stats merge with all sectoral fields
        const updatedStats: MatchStats = {
          ...existingStats,
          halftimeHomeScore: row.halftimeHomeScore !== null && row.halftimeHomeScore !== undefined ? row.halftimeHomeScore : existingStats.halftimeHomeScore,
          halftimeAwayScore: row.halftimeAwayScore !== null && row.halftimeAwayScore !== undefined ? row.halftimeAwayScore : existingStats.halftimeAwayScore,
          possessionHomeFT: row.possessionHomeFT !== null && row.possessionHomeFT !== undefined ? row.possessionHomeFT : existingStats.possessionHomeFT,
          possessionAwayFT: row.possessionAwayFT !== null && row.possessionAwayFT !== undefined ? row.possessionAwayFT : existingStats.possessionAwayFT,
          yellowCardsHomeFT: row.yellowCardsHomeFT !== null && row.yellowCardsHomeFT !== undefined ? row.yellowCardsHomeFT : existingStats.yellowCardsHomeFT,
          yellowCardsAwayFT: row.yellowCardsAwayFT !== null && row.yellowCardsAwayFT !== undefined ? row.yellowCardsAwayFT : existingStats.yellowCardsAwayFT,
          redCardsHomeFT: row.redCardsHomeFT !== null && row.redCardsHomeFT !== undefined ? row.redCardsHomeFT : existingStats.redCardsHomeFT,
          redCardsAwayFT: row.redCardsAwayFT !== null && row.redCardsAwayFT !== undefined ? row.redCardsAwayFT : existingStats.redCardsAwayFT,

          xgHomeFT: row.xgHomeFT !== null && row.xgHomeFT !== undefined ? row.xgHomeFT : existingStats.xgHomeFT,
          xgAwayFT: row.xgAwayFT !== null && row.xgAwayFT !== undefined ? row.xgAwayFT : existingStats.xgAwayFT,
          xgotHomeFT: row.xgotHomeFT !== null && row.xgotHomeFT !== undefined ? row.xgotHomeFT : existingStats.xgotHomeFT,
          xgotAwayFT: row.xgotAwayFT !== null && row.xgotAwayFT !== undefined ? row.xgotAwayFT : existingStats.xgotAwayFT,
          shotsHomeFT: row.shotsHomeFT !== null && row.shotsHomeFT !== undefined ? row.shotsHomeFT : existingStats.shotsHomeFT,
          shotsAwayFT: row.shotsAwayFT !== null && row.shotsAwayFT !== undefined ? row.shotsAwayFT : existingStats.shotsAwayFT,
          shotsOnTargetHomeFT: row.shotsOnTargetHomeFT !== null && row.shotsOnTargetHomeFT !== undefined ? row.shotsOnTargetHomeFT : existingStats.shotsOnTargetHomeFT,
          shotsOnTargetAwayFT: row.shotsOnTargetAwayFT !== null && row.shotsOnTargetAwayFT !== undefined ? row.shotsOnTargetAwayFT : existingStats.shotsOnTargetAwayFT,
          shotsOffTargetHomeFT: row.shotsOffTargetHomeFT !== null && row.shotsOffTargetHomeFT !== undefined ? row.shotsOffTargetHomeFT : existingStats.shotsOffTargetHomeFT,
          shotsOffTargetAwayFT: row.shotsOffTargetAwayFT !== null && row.shotsOffTargetAwayFT !== undefined ? row.shotsOffTargetAwayFT : existingStats.shotsOffTargetAwayFT,
          shotsBlockedHomeFT: row.shotsBlockedHomeFT !== null && row.shotsBlockedHomeFT !== undefined ? row.shotsBlockedHomeFT : existingStats.shotsBlockedHomeFT,
          shotsBlockedAwayFT: row.shotsBlockedAwayFT !== null && row.shotsBlockedAwayFT !== undefined ? row.shotsBlockedAwayFT : existingStats.shotsBlockedAwayFT,
          shotsInsideBoxHomeFT: row.shotsInsideBoxHomeFT !== null && row.shotsInsideBoxHomeFT !== undefined ? row.shotsInsideBoxHomeFT : existingStats.shotsInsideBoxHomeFT,
          shotsInsideBoxAwayFT: row.shotsInsideBoxAwayFT !== null && row.shotsInsideBoxAwayFT !== undefined ? row.shotsInsideBoxAwayFT : existingStats.shotsInsideBoxAwayFT,
          shotsOutsideBoxHomeFT: row.shotsOutsideBoxHomeFT !== null && row.shotsOutsideBoxHomeFT !== undefined ? row.shotsOutsideBoxHomeFT : existingStats.shotsOutsideBoxHomeFT,
          shotsOutsideBoxAwayFT: row.shotsOutsideBoxAwayFT !== null && row.shotsOutsideBoxAwayFT !== undefined ? row.shotsOutsideBoxAwayFT : existingStats.shotsOutsideBoxAwayFT,
          shotsWoodworkHomeFT: row.shotsWoodworkHomeFT !== null && row.shotsWoodworkHomeFT !== undefined ? row.shotsWoodworkHomeFT : existingStats.shotsWoodworkHomeFT,
          shotsWoodworkAwayFT: row.shotsWoodworkAwayFT !== null && row.shotsWoodworkAwayFT !== undefined ? row.shotsWoodworkAwayFT : existingStats.shotsWoodworkAwayFT,

          bigChancesHomeFT: row.bigChancesHomeFT !== null && row.bigChancesHomeFT !== undefined ? row.bigChancesHomeFT : existingStats.bigChancesHomeFT,
          bigChancesAwayFT: row.bigChancesAwayFT !== null && row.bigChancesAwayFT !== undefined ? row.bigChancesAwayFT : existingStats.bigChancesAwayFT,
          cornersHomeFT: row.cornersHomeFT !== null && row.cornersHomeFT !== undefined ? row.cornersHomeFT : existingStats.cornersHomeFT,
          cornersAwayFT: row.cornersAwayFT !== null && row.cornersAwayFT !== undefined ? row.cornersAwayFT : existingStats.cornersAwayFT,
          touchesOppBoxHomeFT: row.touchesOppBoxHomeFT !== null && row.touchesOppBoxHomeFT !== undefined ? row.touchesOppBoxHomeFT : existingStats.touchesOppBoxHomeFT,
          touchesOppBoxAwayFT: row.touchesOppBoxAwayFT !== null && row.touchesOppBoxAwayFT !== undefined ? row.touchesOppBoxAwayFT : existingStats.touchesOppBoxAwayFT,
          throughBallsHomeFT: row.throughBallsHomeFT !== null && row.throughBallsHomeFT !== undefined ? row.throughBallsHomeFT : existingStats.throughBallsHomeFT,
          throughBallsAwayFT: row.throughBallsAwayFT !== null && row.throughBallsAwayFT !== undefined ? row.throughBallsAwayFT : existingStats.throughBallsAwayFT,
          offsidesHomeFT: row.offsidesHomeFT !== null && row.offsidesHomeFT !== undefined ? row.offsidesHomeFT : existingStats.offsidesHomeFT,
          offsidesAwayFT: row.offsidesAwayFT !== null && row.offsidesAwayFT !== undefined ? row.offsidesAwayFT : existingStats.offsidesAwayFT,
          foulsDrawnHomeFT: row.foulsDrawnHomeFT !== null && row.foulsDrawnHomeFT !== undefined ? row.foulsDrawnHomeFT : existingStats.foulsDrawnHomeFT,
          foulsDrawnAwayFT: row.foulsDrawnAwayFT !== null && row.foulsDrawnAwayFT !== undefined ? row.foulsDrawnAwayFT : existingStats.foulsDrawnAwayFT,

          passesAccurateHomeFT: row.passesAccurateHomeFT !== null && row.passesAccurateHomeFT !== undefined ? row.passesAccurateHomeFT : existingStats.passesAccurateHomeFT,
          passesTotalHomeFT: row.passesTotalHomeFT !== null && row.passesTotalHomeFT !== undefined ? row.passesTotalHomeFT : existingStats.passesTotalHomeFT,
          passesPctHomeFT: row.passesPctHomeFT !== null && row.passesPctHomeFT !== undefined ? row.passesPctHomeFT : existingStats.passesPctHomeFT,
          passesAccurateAwayFT: row.passesAccurateAwayFT !== null && row.passesAccurateAwayFT !== undefined ? row.passesAccurateAwayFT : existingStats.passesAccurateAwayFT,
          passesTotalAwayFT: row.passesTotalAwayFT !== null && row.passesTotalAwayFT !== undefined ? row.passesTotalAwayFT : existingStats.passesTotalAwayFT,
          passesPctAwayFT: row.passesPctAwayFT !== null && row.passesPctAwayFT !== undefined ? row.passesPctAwayFT : existingStats.passesPctAwayFT,
          longPassesAccurateHomeFT: row.longPassesAccurateHomeFT !== null && row.longPassesAccurateHomeFT !== undefined ? row.longPassesAccurateHomeFT : existingStats.longPassesAccurateHomeFT,
          longPassesTotalHomeFT: row.longPassesTotalHomeFT !== null && row.longPassesTotalHomeFT !== undefined ? row.longPassesTotalHomeFT : existingStats.longPassesTotalHomeFT,
          longPassesPctHomeFT: row.longPassesPctHomeFT !== null && row.longPassesPctHomeFT !== undefined ? row.longPassesPctHomeFT : existingStats.longPassesPctHomeFT,
          longPassesAccurateAwayFT: row.longPassesAccurateAwayFT !== null && row.longPassesAccurateAwayFT !== undefined ? row.longPassesAccurateAwayFT : existingStats.longPassesAccurateAwayFT,
          longPassesTotalAwayFT: row.longPassesTotalAwayFT !== null && row.longPassesTotalAwayFT !== undefined ? row.longPassesTotalAwayFT : existingStats.longPassesTotalAwayFT,
          longPassesPctAwayFT: row.longPassesPctAwayFT !== null && row.longPassesPctAwayFT !== undefined ? row.longPassesPctAwayFT : existingStats.longPassesPctAwayFT,
          finalThirdPassesAccurateHomeFT: row.finalThirdPassesAccurateHomeFT !== null && row.finalThirdPassesAccurateHomeFT !== undefined ? row.finalThirdPassesAccurateHomeFT : existingStats.finalThirdPassesAccurateHomeFT,
          finalThirdPassesTotalHomeFT: row.finalThirdPassesTotalHomeFT !== null && row.finalThirdPassesTotalHomeFT !== undefined ? row.finalThirdPassesTotalHomeFT : existingStats.finalThirdPassesTotalHomeFT,
          finalThirdPassesPctHomeFT: row.finalThirdPassesPctHomeFT !== null && row.finalThirdPassesPctHomeFT !== undefined ? row.finalThirdPassesPctHomeFT : existingStats.finalThirdPassesPctHomeFT,
          finalThirdPassesAccurateAwayFT: row.finalThirdPassesAccurateAwayFT !== null && row.finalThirdPassesAccurateAwayFT !== undefined ? row.finalThirdPassesAccurateAwayFT : existingStats.finalThirdPassesAccurateAwayFT,
          finalThirdPassesTotalAwayFT: row.finalThirdPassesTotalAwayFT !== null && row.finalThirdPassesTotalAwayFT !== undefined ? row.finalThirdPassesTotalAwayFT : existingStats.finalThirdPassesTotalAwayFT,
          finalThirdPassesPctAwayFT: row.finalThirdPassesPctAwayFT !== null && row.finalThirdPassesPctAwayFT !== undefined ? row.finalThirdPassesPctAwayFT : existingStats.finalThirdPassesPctAwayFT,
          crossesAccurateHomeFT: row.crossesAccurateHomeFT !== null && row.crossesAccurateHomeFT !== undefined ? row.crossesAccurateHomeFT : existingStats.crossesAccurateHomeFT,
          crossesTotalHomeFT: row.crossesTotalHomeFT !== null && row.crossesTotalHomeFT !== undefined ? row.crossesTotalHomeFT : existingStats.crossesTotalHomeFT,
          crossesPctHomeFT: row.crossesPctHomeFT !== null && row.crossesPctHomeFT !== undefined ? row.crossesPctHomeFT : existingStats.crossesPctHomeFT,
          crossesAccurateAwayFT: row.crossesAccurateAwayFT !== null && row.crossesAccurateAwayFT !== undefined ? row.crossesAccurateAwayFT : existingStats.crossesAccurateAwayFT,
          crossesTotalAwayFT: row.crossesTotalAwayFT !== null && row.crossesTotalAwayFT !== undefined ? row.crossesTotalAwayFT : existingStats.crossesTotalAwayFT,
          crossesPctAwayFT: row.crossesPctAwayFT !== null && row.crossesPctAwayFT !== undefined ? row.crossesPctAwayFT : existingStats.crossesPctAwayFT,
          xaHomeFT: row.xaHomeFT !== null && row.xaHomeFT !== undefined ? row.xaHomeFT : existingStats.xaHomeFT,
          xaAwayFT: row.xaAwayFT !== null && row.xaAwayFT !== undefined ? row.xaAwayFT : existingStats.xaAwayFT,
          throwInsHomeFT: row.throwInsHomeFT !== null && row.throwInsHomeFT !== undefined ? row.throwInsHomeFT : existingStats.throwInsHomeFT,
          throwInsAwayFT: row.throwInsAwayFT !== null && row.throwInsAwayFT !== undefined ? row.throwInsAwayFT : existingStats.throwInsAwayFT,

          foulsHomeFT: row.foulsHomeFT !== null && row.foulsHomeFT !== undefined ? row.foulsHomeFT : existingStats.foulsHomeFT,
          foulsAwayFT: row.foulsAwayFT !== null && row.foulsAwayFT !== undefined ? row.foulsAwayFT : existingStats.foulsAwayFT,
          tacklesAccurateHomeFT: row.tacklesAccurateHomeFT !== null && row.tacklesAccurateHomeFT !== undefined ? row.tacklesAccurateHomeFT : existingStats.tacklesAccurateHomeFT,
          tacklesTotalHomeFT: row.tacklesTotalHomeFT !== null && row.tacklesTotalHomeFT !== undefined ? row.tacklesTotalHomeFT : existingStats.tacklesTotalHomeFT,
          tacklesPctHomeFT: row.tacklesPctHomeFT !== null && row.tacklesPctHomeFT !== undefined ? row.tacklesPctHomeFT : existingStats.tacklesPctHomeFT,
          tacklesAccurateAwayFT: row.tacklesAccurateAwayFT !== null && row.tacklesAccurateAwayFT !== undefined ? row.tacklesAccurateAwayFT : existingStats.tacklesAccurateAwayFT,
          tacklesTotalAwayFT: row.tacklesTotalAwayFT !== null && row.tacklesTotalAwayFT !== undefined ? row.tacklesTotalAwayFT : existingStats.tacklesTotalAwayFT,
          tacklesPctAwayFT: row.tacklesPctAwayFT !== null && row.tacklesPctAwayFT !== undefined ? row.tacklesPctAwayFT : existingStats.tacklesPctAwayFT,
          duelsWonHomeFT: row.duelsWonHomeFT !== null && row.duelsWonHomeFT !== undefined ? row.duelsWonHomeFT : existingStats.duelsWonHomeFT,
          duelsWonAwayFT: row.duelsWonAwayFT !== null && row.duelsWonAwayFT !== undefined ? row.duelsWonAwayFT : existingStats.duelsWonAwayFT,
          clearancesHomeFT: row.clearancesHomeFT !== null && row.clearancesHomeFT !== undefined ? row.clearancesHomeFT : existingStats.clearancesHomeFT,
          clearancesAwayFT: row.clearancesAwayFT !== null && row.clearancesAwayFT !== undefined ? row.clearancesAwayFT : existingStats.clearancesAwayFT,
          interceptionsHomeFT: row.interceptionsHomeFT !== null && row.interceptionsHomeFT !== undefined ? row.interceptionsHomeFT : existingStats.interceptionsHomeFT,
          interceptionsAwayFT: row.interceptionsAwayFT !== null && row.interceptionsAwayFT !== undefined ? row.interceptionsAwayFT : existingStats.interceptionsAwayFT,
          errorsLeadToShotHomeFT: row.errorsLeadToShotHomeFT !== null && row.errorsLeadToShotHomeFT !== undefined ? row.errorsLeadToShotHomeFT : existingStats.errorsLeadToShotHomeFT,
          errorsLeadToShotAwayFT: row.errorsLeadToShotAwayFT !== null && row.errorsLeadToShotAwayFT !== undefined ? row.errorsLeadToShotAwayFT : existingStats.errorsLeadToShotAwayFT,
          errorsLeadToGoalHomeFT: row.errorsLeadToGoalHomeFT !== null && row.errorsLeadToGoalHomeFT !== undefined ? row.errorsLeadToGoalHomeFT : existingStats.errorsLeadToGoalHomeFT,
          errorsLeadToGoalAwayFT: row.errorsLeadToGoalAwayFT !== null && row.errorsLeadToGoalAwayFT !== undefined ? row.errorsLeadToGoalAwayFT : existingStats.errorsLeadToGoalAwayFT,
          goalkeeperDefActionHomeFT: row.goalkeeperDefActionHomeFT !== null && row.goalkeeperDefActionHomeFT !== undefined ? row.goalkeeperDefActionHomeFT : existingStats.goalkeeperDefActionHomeFT,
          goalkeeperDefActionAwayFT: row.goalkeeperDefActionAwayFT !== null && row.goalkeeperDefActionAwayFT !== undefined ? row.goalkeeperDefActionAwayFT : existingStats.goalkeeperDefActionAwayFT,

          savesHomeFT: row.savesHomeFT !== null && row.savesHomeFT !== undefined ? row.savesHomeFT : existingStats.savesHomeFT,
          savesAwayFT: row.savesAwayFT !== null && row.savesAwayFT !== undefined ? row.savesAwayFT : existingStats.savesAwayFT,
          xgotFacedHomeFT: row.xgotFacedHomeFT !== null && row.xgotFacedHomeFT !== undefined ? row.xgotFacedHomeFT : existingStats.xgotFacedHomeFT,
          xgotFacedAwayFT: row.xgotFacedAwayFT !== null && row.xgotFacedAwayFT !== undefined ? row.xgotFacedAwayFT : existingStats.xgotFacedAwayFT,
          goalsPreventedHomeFT: row.goalsPreventedHomeFT !== null && row.goalsPreventedHomeFT !== undefined ? row.goalsPreventedHomeFT : existingStats.goalsPreventedHomeFT,
          goalsPreventedAwayFT: row.goalsPreventedAwayFT !== null && row.goalsPreventedAwayFT !== undefined ? row.goalsPreventedAwayFT : existingStats.goalsPreventedAwayFT,
          goalKicksHomeFT: row.goalKicksHomeFT !== null && row.goalKicksHomeFT !== undefined ? row.goalKicksHomeFT : existingStats.goalKicksHomeFT,
          goalKicksAwayFT: row.goalKicksAwayFT !== null && row.goalKicksAwayFT !== undefined ? row.goalKicksAwayFT : existingStats.goalKicksAwayFT,

          goalMinutesHomeFT: row.goalMinutesHomeFT !== null && row.goalMinutesHomeFT !== undefined ? row.goalMinutesHomeFT : existingStats.goalMinutesHomeFT,
          goalMinutesAwayFT: row.goalMinutesAwayFT !== null && row.goalMinutesAwayFT !== undefined ? row.goalMinutesAwayFT : existingStats.goalMinutesAwayFT,

          stadium: row.stadium || existingStats.stadium || existing.stadium || '',
          stadiumCapacity: row.stadiumCapacity ?? existingStats.stadiumCapacity ?? existing.stadiumCapacity ?? null,
          attendance: row.attendance ?? existingStats.attendance ?? existing.attendance ?? null,
        };

        // Updated Odds merge
        const updatedOdds: MatchOdds = {
          homeFT: row.oddHomeFT !== null && row.oddHomeFT !== undefined ? row.oddHomeFT : existingOdds.homeFT,
          drawFT: row.oddDrawFT !== null && row.oddDrawFT !== undefined ? row.oddDrawFT : existingOdds.drawFT,
          awayFT: row.oddAwayFT !== null && row.oddAwayFT !== undefined ? row.oddAwayFT : existingOdds.awayFT,
          over25FT: row.oddOver25FT !== null && row.oddOver25FT !== undefined ? row.oddOver25FT : existingOdds.over25FT,
          under25FT: row.oddUnder25FT !== null && row.oddUnder25FT !== undefined ? row.oddUnder25FT : existingOdds.under25FT,
          asianHandicapHomeLine: row.asianHandicapHomeLine ?? existingOdds.asianHandicapHomeLine,
          asianHandicapHomeOdd: row.asianHandicapHomeOdd ?? existingOdds.asianHandicapHomeOdd,
          asianHandicapAwayLine: row.asianHandicapAwayLine ?? existingOdds.asianHandicapAwayLine,
          asianHandicapAwayOdd: row.asianHandicapAwayOdd ?? existingOdds.asianHandicapAwayOdd,
        };

        const updatedMatch: Match = {
          ...existing,
          matchDate: row.matchDate || existing.matchDate,
          referee: row.referee || existing.referee,
          stadium: row.stadium || existing.stadium || '',
          stadiumCapacity: row.stadiumCapacity ?? existing.stadiumCapacity ?? null,
          attendance: row.attendance ?? existing.attendance ?? null,
          notes: row.notes !== undefined && row.notes !== '' ? row.notes : existing.notes,
          homeScore,
          awayScore,
          status: newStatus,
          stats: updatedStats,
          odds: updatedOdds,
        };

        currentMatches[existingMatchIndex] = updatedMatch;
        newNotifs.push({
          type: 'match',
          id: existing.id,
          name: `${existing.homeTeamName} ${homeScore ?? 0} x ${awayScore ?? 0} ${existing.awayTeamName} (Atualizado)`,
        });
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
          stadium: row.stadium || '',
          stadiumCapacity: row.stadiumCapacity ?? null,
          attendance: row.attendance ?? null,
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
            possessionHomeFT: row.possessionHomeFT ?? null,
            possessionAwayFT: row.possessionAwayFT ?? null,
            yellowCardsHomeFT: row.yellowCardsHomeFT ?? null,
            yellowCardsAwayFT: row.yellowCardsAwayFT ?? null,
            redCardsHomeFT: row.redCardsHomeFT ?? null,
            redCardsAwayFT: row.redCardsAwayFT ?? null,

            xgHomeFT: row.xgHomeFT ?? null,
            xgAwayFT: row.xgAwayFT ?? null,
            xgotHomeFT: row.xgotHomeFT ?? null,
            xgotAwayFT: row.xgotAwayFT ?? null,
            shotsHomeFT: row.shotsHomeFT ?? null,
            shotsAwayFT: row.shotsAwayFT ?? null,
            shotsOnTargetHomeFT: row.shotsOnTargetHomeFT ?? null,
            shotsOnTargetAwayFT: row.shotsOnTargetAwayFT ?? null,
            shotsOffTargetHomeFT: row.shotsOffTargetHomeFT ?? null,
            shotsOffTargetAwayFT: row.shotsOffTargetAwayFT ?? null,
            shotsBlockedHomeFT: row.shotsBlockedHomeFT ?? null,
            shotsBlockedAwayFT: row.shotsBlockedAwayFT ?? null,
            shotsInsideBoxHomeFT: row.shotsInsideBoxHomeFT ?? null,
            shotsInsideBoxAwayFT: row.shotsInsideBoxAwayFT ?? null,
            shotsOutsideBoxHomeFT: row.shotsOutsideBoxHomeFT ?? null,
            shotsOutsideBoxAwayFT: row.shotsOutsideBoxAwayFT ?? null,
            shotsWoodworkHomeFT: row.shotsWoodworkHomeFT ?? null,
            shotsWoodworkAwayFT: row.shotsWoodworkAwayFT ?? null,

            bigChancesHomeFT: row.bigChancesHomeFT ?? null,
            bigChancesAwayFT: row.bigChancesAwayFT ?? null,
            cornersHomeFT: row.cornersHomeFT ?? null,
            cornersAwayFT: row.cornersAwayFT ?? null,
            touchesOppBoxHomeFT: row.touchesOppBoxHomeFT ?? null,
            touchesOppBoxAwayFT: row.touchesOppBoxAwayFT ?? null,
            throughBallsHomeFT: row.throughBallsHomeFT ?? null,
            throughBallsAwayFT: row.throughBallsAwayFT ?? null,
            offsidesHomeFT: row.offsidesHomeFT ?? null,
            offsidesAwayFT: row.offsidesAwayFT ?? null,
            foulsDrawnHomeFT: row.foulsDrawnHomeFT ?? null,
            foulsDrawnAwayFT: row.foulsDrawnAwayFT ?? null,

            passesAccurateHomeFT: row.passesAccurateHomeFT ?? null,
            passesTotalHomeFT: row.passesTotalHomeFT ?? null,
            passesPctHomeFT: row.passesPctHomeFT ?? null,
            passesAccurateAwayFT: row.passesAccurateAwayFT ?? null,
            passesTotalAwayFT: row.passesTotalAwayFT ?? null,
            passesPctAwayFT: row.passesPctAwayFT ?? null,
            longPassesAccurateHomeFT: row.longPassesAccurateHomeFT ?? null,
            longPassesTotalHomeFT: row.longPassesTotalHomeFT ?? null,
            longPassesPctHomeFT: row.longPassesPctHomeFT ?? null,
            longPassesAccurateAwayFT: row.longPassesAccurateAwayFT ?? null,
            longPassesTotalAwayFT: row.longPassesTotalAwayFT ?? null,
            longPassesPctAwayFT: row.longPassesPctAwayFT ?? null,
            finalThirdPassesAccurateHomeFT: row.finalThirdPassesAccurateHomeFT ?? null,
            finalThirdPassesTotalHomeFT: row.finalThirdPassesTotalHomeFT ?? null,
            finalThirdPassesPctHomeFT: row.finalThirdPassesPctHomeFT ?? null,
            finalThirdPassesAccurateAwayFT: row.finalThirdPassesAccurateAwayFT ?? null,
            finalThirdPassesTotalAwayFT: row.finalThirdPassesTotalAwayFT ?? null,
            finalThirdPassesPctAwayFT: row.finalThirdPassesPctAwayFT ?? null,
            crossesAccurateHomeFT: row.crossesAccurateHomeFT ?? null,
            crossesTotalHomeFT: row.crossesTotalHomeFT ?? null,
            crossesPctHomeFT: row.crossesPctHomeFT ?? null,
            crossesAccurateAwayFT: row.crossesAccurateAwayFT ?? null,
            crossesTotalAwayFT: row.crossesTotalAwayFT ?? null,
            crossesPctAwayFT: row.crossesPctAwayFT ?? null,
            xaHomeFT: row.xaHomeFT ?? null,
            xaAwayFT: row.xaAwayFT ?? null,
            throwInsHomeFT: row.throwInsHomeFT ?? null,
            throwInsAwayFT: row.throwInsAwayFT ?? null,

            foulsHomeFT: row.foulsHomeFT ?? null,
            foulsAwayFT: row.foulsAwayFT ?? null,
            tacklesAccurateHomeFT: row.tacklesAccurateHomeFT ?? null,
            tacklesTotalHomeFT: row.tacklesTotalHomeFT ?? null,
            tacklesPctHomeFT: row.tacklesPctHomeFT ?? null,
            tacklesAccurateAwayFT: row.tacklesAccurateAwayFT ?? null,
            tacklesTotalAwayFT: row.tacklesTotalAwayFT ?? null,
            tacklesPctAwayFT: row.tacklesPctAwayFT ?? null,
            duelsWonHomeFT: row.duelsWonHomeFT ?? null,
            duelsWonAwayFT: row.duelsWonAwayFT ?? null,
            clearancesHomeFT: row.clearancesHomeFT ?? null,
            clearancesAwayFT: row.clearancesAwayFT ?? null,
            interceptionsHomeFT: row.interceptionsHomeFT ?? null,
            interceptionsAwayFT: row.interceptionsAwayFT ?? null,
            errorsLeadToShotHomeFT: row.errorsLeadToShotHomeFT ?? null,
            errorsLeadToShotAwayFT: row.errorsLeadToShotAwayFT ?? null,
            errorsLeadToGoalHomeFT: row.errorsLeadToGoalHomeFT ?? null,
            errorsLeadToGoalAwayFT: row.errorsLeadToGoalAwayFT ?? null,
            goalkeeperDefActionHomeFT: row.goalkeeperDefActionHomeFT ?? null,
            goalkeeperDefActionAwayFT: row.goalkeeperDefActionAwayFT ?? null,

            savesHomeFT: row.savesHomeFT ?? null,
            savesAwayFT: row.savesAwayFT ?? null,
            xgotFacedHomeFT: row.xgotFacedHomeFT ?? null,
            xgotFacedAwayFT: row.xgotFacedAwayFT ?? null,
            goalsPreventedHomeFT: row.goalsPreventedHomeFT ?? null,
            goalsPreventedAwayFT: row.goalsPreventedAwayFT ?? null,
            goalKicksHomeFT: row.goalKicksHomeFT ?? null,
            goalKicksAwayFT: row.goalKicksAwayFT ?? null,

            goalMinutesHomeFT: row.goalMinutesHomeFT ?? null,
            goalMinutesAwayFT: row.goalMinutesAwayFT ?? null,

            stadium: row.stadium || '',
            stadiumCapacity: row.stadiumCapacity ?? null,
            attendance: row.attendance ?? null,
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
        onOpenSanitizerModal={() => setIsSanitizerModalOpen(true)}
        onOpenUserManagerModal={(tab = 'USERS') => {
          setUserManagerInitialTab(tab);
          setIsUserManagerModalOpen(true);
        }}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onOpenOpportunitiesHub={() => setIsOpportunitiesHubOpen(true)}
        onOpenBankrollTracker={() => setIsBankrollTrackerOpen(true)}
        onOpenHtGoalsScanner={() => setIsHtGoalsScannerOpen(true)}
        onOpenTeamsReportModal={() => setIsTeamsReportModalOpen(true)}
        onOpenCloudModal={() => setIsCloudModalOpen(true)}
        onOpenTechDocs={() => setIsTechDocsOpen(true)}
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
                onAnalyzeMatch={(match) => {
                  setAnalysisTargetMatchId(match.id);
                  setActiveTab('analysis');
                }}
                onNavigateToAnalysis={() => setActiveTab('analysis')}
              />
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
                onAnalyzeMatch={(match) => {
                  setAnalysisTargetMatchId(match.id);
                  setActiveTab('analysis');
                }}
                onNavigateToAnalysis={() => setActiveTab('analysis')}
                onOpenCloudModal={() => setIsCloudModalOpen(true)}
                onOpenHtGoalsScanner={() => setIsHtGoalsScannerOpen(true)}
                onNavigateToAllMatches={() => setActiveTab('matches')}
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
                onNavigateToStandings={() => setActiveTab('standings')}
                onOpenSanitizerModal={() => setIsSanitizerModalOpen(true)}
              />
            )}

            {activeTab === 'teams' && (
              <TeamManager
                dbState={dbState}
                isMaster={isMaster}
                onOpenEntityModal={handleOpenEntityModal}
                onOpenBulkImportModal={() => setIsBulkTeamModalOpen(true)}
                onOpenSanitizerModal={() => setIsSanitizerModalOpen(true)}
                onDeleteTeam={handleDeleteTeam}
                onUpdateTeamLogo={handleUpdateTeamLogo}
                onUpdateTeamLeague={handleUpdateTeamLeague}
                onEditTeam={handleOpenEditTeam}
              />
            )}

            {activeTab === 'stats' && (
              <StatsDashboard
                dbState={dbState}
                onNavigateToAnalysis={() => setActiveTab('analysis')}
              />
            )}

            {activeTab === 'standings' && (
              <LeagueStandings
                dbState={dbState}
                onSelectMatchAnalysis={(match) => {
                  setAnalysisTargetMatchId(match.id);
                  setActiveTab('analysis');
                }}
              />
            )}

            {activeTab === 'analysis' && (
              <AnalysisDashboard
                dbState={dbState}
                initialMatchId={analysisTargetMatchId}
                onRegisterBetToBankroll={handleOpenBankrollWithPrefill}
                onOpenOpportunitiesHub={() => setIsOpportunitiesHubOpen(true)}
                onOpenBankrollTracker={() => setIsBankrollTrackerOpen(true)}
              />
            )}

            {activeTab === 'pending_logos' && (
              <PendingLogosManager
                dbState={dbState}
                onUpdateTeamLogo={handleUpdateTeamLogo}
                onUpdateLeagueLogo={handleUpdateLeagueLogo}
                onUpdateCountryFlag={handleUpdateCountryFlag}
                onUpdateRefereePhoto={handleUpdateRefereePhoto}
                onBulkUpdateLogos={handleBulkUpdateLogos}
              />
            )}

            {activeTab === 'referees' && (
              <RefereeStatsModule
                dbState={dbState}
                initialRefereeName={refereeTargetName}
                onOpenMatchStats={handleOpenStatsModal}
                onUpdateRefereePhoto={handleUpdateRefereePhoto}
                onSelectMatchAnalysis={(match) => {
                  setAnalysisTargetMatchId(match.id);
                  setActiveTab('analysis');
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Modals - Rendered on-demand to guarantee instantaneous 60fps performance */}
      {isStatsModalOpen && (
        <MatchStatsModal
          isOpen={isStatsModalOpen}
          onClose={() => setIsStatsModalOpen(false)}
          match={statsMatch}
          isMaster={isMaster}
          onSaveStats={handleSaveStats}
          onOpenPressureChartModal={handleOpenPressureChartModal}
        />
      )}

      {isPressureModalOpen && (
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
      )}

      {isQuickScoreModalOpen && (
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
      )}

      {isMatchModalOpen && (
        <MatchFormModal
          isOpen={isMatchModalOpen}
          onClose={() => setIsMatchModalOpen(false)}
          dbState={dbState}
          onSaveMatch={handleSaveMatch}
          editingMatch={editingMatch}
        />
      )}

      {isEntityModalOpen && (
        <EntityFormModal
          isOpen={isEntityModalOpen}
          onClose={() => setIsEntityModalOpen(false)}
          dbState={dbState}
          onSave={handleSaveEntity}
          initialType={entityModalType}
        />
      )}

      {isEditEntityModalOpen && (
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
      )}

      {isBackupModalOpen && (
        <BackupModal
          isOpen={isBackupModalOpen}
          onClose={() => setIsBackupModalOpen(false)}
          dbState={dbState}
          onImportDb={handleImportDb}
          onClearDb={handleClearDb}
          onOpenResetModal={() => setIsResetModalOpen(true)}
        />
      )}

      {isResetModalOpen && (
        <ResetDatabaseModal
          isOpen={isResetModalOpen}
          onClose={() => setIsResetModalOpen(false)}
          dbState={dbState}
          onConfirmReset={handleConfirmResetDatabase}
        />
      )}

      {isBulkTeamModalOpen && (
        <BulkTeamImportModal
          isOpen={isBulkTeamModalOpen}
          onClose={() => setIsBulkTeamModalOpen(false)}
          dbState={dbState}
          onBulkImportTeams={handleBulkImportTeams}
          onOpenEntityModal={handleOpenEntityModal}
        />
      )}

      {isBulkMatchModalOpen && (
        <BulkMatchImportModal
          isOpen={isBulkMatchModalOpen}
          onClose={() => setIsBulkMatchModalOpen(false)}
          dbState={dbState}
          onBulkImportMatches={handleBulkImportMatches}
        />
      )}

      {isBulkMatchUpdateModalOpen && (
        <BulkMatchUpdateModal
          isOpen={isBulkMatchUpdateModalOpen}
          onClose={() => setIsBulkMatchUpdateModalOpen(false)}
          dbState={dbState}
          onBulkUpdateMatches={handleBulkUpdateMatches}
        />
      )}

      {isCsvImportModalOpen && (
        <CsvImportSyncModal
          isOpen={isCsvImportModalOpen}
          onClose={() => setIsCsvImportModalOpen(false)}
          dbState={dbState}
          onImportSuccess={handleCsvSyncComplete}
        />
      )}

      {isSyncModalOpen && (
        <SyncModal
          isOpen={isSyncModalOpen}
          onClose={() => setIsSyncModalOpen(false)}
          dbState={dbState}
          onSyncComplete={handleCsvSyncComplete}
        />
      )}

      {/* User Management Modal (Master Only) */}
      {isUserManagerModalOpen && (
        <UserManagerModal
          isOpen={isUserManagerModalOpen}
          onClose={() => setIsUserManagerModalOpen(false)}
          users={ensureDefaultUsers(dbState.users)}
          currentAuthUser={currentUser}
          onSaveUsers={handleSaveUsers}
          onSwitchUser={handleSwitchUser}
          initialTab={userManagerInitialTab}
        />
      )}

      {/* Login Modal */}
      {isLoginModalOpen && (
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          users={ensureDefaultUsers(dbState.users)}
          onLoginSuccess={handleLoginSuccess}
          allowClose={!!currentUser && !!effectiveUserStatus?.canAccess}
          initialUsername={loginInitialUsername}
          isConsultaPortal={isConsultaPortalMode || currentUser?.role === 'CONSULTOR'}
        />
      )}

      {/* Opportunities Hub & Value Scanner Modal */}
      {isOpportunitiesHubOpen && (
        <OpportunitiesHubModal
          isOpen={isOpportunitiesHubOpen}
          onClose={() => setIsOpportunitiesHubOpen(false)}
          dbState={dbState}
          onSelectMatchAnalysis={(matchId) => {
            setAnalysisTargetMatchId(matchId);
            setActiveTab('analysis');
            setIsOpportunitiesHubOpen(false);
          }}
          onRegisterBetToBankroll={handleOpenBankrollWithPrefill}
        />
      )}

      {/* Radar de Gols 1º Tempo (Over 1.5 HT) Modal */}
      {isHtGoalsScannerOpen && (
        <HtGoalsScannerModal
          isOpen={isHtGoalsScannerOpen}
          onClose={() => setIsHtGoalsScannerOpen(false)}
          dbState={dbState}
          onSelectMatchForAnalysis={(matchId) => {
            setAnalysisTargetMatchId(matchId);
            setActiveTab('analysis');
            setIsHtGoalsScannerOpen(false);
          }}
        />
      )}

      {/* Bankroll Management & Tracker Modal */}
      {isBankrollTrackerOpen && (
        <BankrollTrackerModal
          isOpen={isBankrollTrackerOpen}
          onClose={() => {
            setIsBankrollTrackerOpen(false);
            setBankrollPrefillBet(null);
          }}
          prefillBet={bankrollPrefillBet}
        />
      )}

      {/* Relatório de Times Cadastrados Modal */}
      {isTeamsReportModalOpen && (
        <TeamsReportModal
          isOpen={isTeamsReportModalOpen}
          onClose={() => setIsTeamsReportModalOpen(false)}
          dbState={dbState}
        />
      )}

      {/* Diagnóstico & Correção Automática de Times e Ligas */}
      {isSanitizerModalOpen && (
        <DbSanitizerModal
          isOpen={isSanitizerModalOpen}
          onClose={() => setIsSanitizerModalOpen(false)}
          dbState={dbState}
          onApplyCleanedDb={handleApplyCleanedDb}
        />
      )}

      {/* Central de Controle da Nuvem Firestore (Ao Vivo) */}
      {isCloudModalOpen && (
        <CloudSyncModal
          isOpen={isCloudModalOpen}
          onClose={() => setIsCloudModalOpen(false)}
          dbState={dbState}
          onApplyCloudDb={async (cloudDb) => {
            setDbState(cloudDb);
            setNotifications(prev => [
              ...prev,
              {
                id: `cloud-sync-${Date.now()}`,
                type: 'team',
                entityId: 'FIRESTORE',
                name: 'Banco de Dados Sincronizado com a Nuvem Firestore!',
                timestamp: Date.now(),
              },
            ]);
          }}
        />
      )}

      {/* Unique ID Toast Notifications */}
      <ToastNotification
        notifications={notifications}
        onDismiss={handleDismissNotification}
      />

      {/* Documentação Técnica Oficial (Salvar em PDF) */}
      {isTechDocsOpen && (
        <TechDocsModal
          isOpen={isTechDocsOpen}
          onClose={() => setIsTechDocsOpen(false)}
        />
      )}
    </div>
  );
}
