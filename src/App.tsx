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
import { CountryManager } from './components/CountryManager';
import { LeagueManager } from './components/LeagueManager';
import { TeamManager } from './components/TeamManager';
import { StatsDashboard } from './components/StatsDashboard';
import { BackupModal } from './components/BackupModal';
import { MatchStatsModal } from './components/MatchStatsModal';
import { ToastNotification } from './components/ToastNotification';
import { MatchStats, MatchStatus } from './types';

export default function App() {
  const [dbState, setDbState] = useState<DbState>({
    countries: [],
    leagues: [],
    teams: [],
    matches: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'matches' | 'countries' | 'leagues' | 'teams' | 'stats'>('matches');

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

  // Toast notifications for newly created IDs
  const [notifications, setNotifications] = useState<NewEntityCreatedNotification[]>([]);

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
    updated: { name: string; countryId: string; countryName: string; stadium?: string; logoUrl?: string }
  ) => {
    const updatedTeams = dbState.teams.map(t =>
      t.id === teamId
        ? {
            ...t,
            name: updated.name,
            countryId: updated.countryId,
            countryName: updated.countryName,
            stadium: updated.stadium,
            logoUrl: updated.logoUrl,
          }
        : t
    );
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

  // Import Database
  const handleImportDb = async (importedState: DbState) => {
    setDbState(importedState);
    await saveDatabaseState(importedState);
  };

  // Clear Database
  const handleClearDb = async () => {
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
    stats: MatchStats
  ) => {
    const updatedMatches = dbState.matches.map(m => {
      if (m.id === matchId) {
        return {
          ...m,
          homeScore,
          awayScore,
          status,
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
      <div className="min-h-screen bg-[#0a0a0a] text-gray-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-gray-400">Carregando Banco de Dados de Futebol...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-sans selection:bg-emerald-500 selection:text-black pb-16">
      {/* Navbar */}
      <Navbar
        dbState={dbState}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenMatchModal={handleOpenNewMatchModal}
        onOpenEntityModal={handleOpenEntityModal}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
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
              />
            ) : (
              <MatchList
                dbState={dbState}
                onEditMatch={handleEditMatch}
                onDeleteMatch={handleDeleteMatch}
                onOpenMatchModal={handleOpenNewMatchModal}
                onOpenStatsModal={handleOpenStatsModal}
              />
            )}
          </>
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
            onDeleteTeam={handleDeleteTeam}
            onUpdateTeamLogo={handleUpdateTeamLogo}
            onEditTeam={handleOpenEditTeam}
          />
        )}

        {activeTab === 'stats' && (
          <StatsDashboard dbState={dbState} />
        )}
      </main>

      {/* Modals */}
      <MatchStatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        match={statsMatch}
        onSaveStats={handleSaveStats}
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
      />

      {/* Unique ID Toast Notifications */}
      <ToastNotification
        notifications={notifications}
        onDismiss={handleDismissNotification}
      />
    </div>
  );
}
