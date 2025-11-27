import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Users, Calendar, Edit } from 'lucide-react';

const PlayerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [playerProfile, setPlayerProfile] = useState<any>(null);
  const [team, setTeam] = useState<any>(null);
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPlayerData();
    }
  }, [user]);

  const loadPlayerData = async () => {
    try {
      // Get all players and find the one linked to current user
      const players = await apiService.getPlayers();
      const userPlayer = players.find((player: any) => player.user_id === user?.id);
      
      if (userPlayer) {
        setPlayerProfile(userPlayer);
        
        if (userPlayer.team_id) {
          // Get team information
          const teamData = await apiService.getTeam(userPlayer.team_id);
          setTeam(teamData);
          
          // Get upcoming matches for player's team
          const matches = await apiService.getMatches({ teamId: userPlayer.team_id, status: 'scheduled' });
          setUpcomingMatches(matches.slice(0, 5)); // Show next 5 matches
        }
      }
    } catch (error) {
      console.error('Failed to load player data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!playerProfile) {
    return (
      <div className="text-center py-12">
        <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Player Profile Not Found</h2>
        <p className="text-gray-600">You haven't been registered as a player yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600">Your player information and upcoming matches</p>
        </div>
        <Button>
          <Edit className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      {/* Player Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Player Information</CardTitle>
          <CardDescription>Your current player profile</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-xl">
                  {playerProfile.name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Name</p>
                <p className="text-lg font-semibold text-gray-900">{playerProfile.name}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600">Position</p>
              <div className="mt-2">
                <Badge variant="secondary" className="text-sm">
                  {playerProfile.position}
                </Badge>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600">Age</p>
              <p className="text-lg font-semibold text-gray-900">{playerProfile.age}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600">Team</p>
              <p className="text-lg font-semibold text-gray-900">
                {team?.name || 'Not assigned'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Information */}
      {team && (
        <Card>
          <CardHeader>
            <CardTitle>Team Information</CardTitle>
            <CardDescription>Details about your current team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Team Name</p>
                  <p className="text-lg font-semibold text-gray-900">{team.name}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <User className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Coach</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {team.coach?.name || 'Not assigned'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Team Players</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {team.players?.length || 0} players
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Matches */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Matches</CardTitle>
          <CardDescription>Your team's scheduled games</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingMatches.length > 0 ? (
            <div className="space-y-3">
              {upcomingMatches.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <Calendar className="h-8 w-8 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {match.team1?.name} vs {match.team2?.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(match.date).toLocaleDateString()} • {match.venue}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{match.status}</Badge>
                    <Badge 
                      variant={
                        match.team1?.id === team?.id || match.team2?.id === team?.id 
                          ? "default" 
                          : "secondary"
                      }
                    >
                      {match.team1?.id === team?.id || match.team2?.id === team?.id 
                        ? "Your Team" 
                        : "Other"
                      }
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No upcoming matches scheduled</p>
              <p className="text-sm text-gray-500">Check back later for your team's fixtures</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayerDashboard;