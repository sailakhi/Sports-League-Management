import React, { useState, useEffect } from 'react';
import { apiService } from '../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StandingsPage: React.FC = () => {
  const [leagues, setLeagues] = useState<any[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeagues();
  }, []);

  useEffect(() => {
    if (selectedLeague) {
      loadStandings();
    }
  }, [selectedLeague]);

  const loadLeagues = async () => {
    try {
      const leaguesData = await apiService.getLeagues();
      setLeagues(leaguesData);
      if (leaguesData.length > 0) {
        setSelectedLeague(leaguesData[0].id);
      }
    } catch (error) {
      console.error('Failed to load leagues:', error);
    }
  };

  const loadStandings = async () => {
    if (!selectedLeague) return;
    
    setLoading(true);
    try {
      const standingsData = await apiService.getStandings(selectedLeague);
      setStandings(standingsData);
    } catch (error) {
      console.error('Failed to load standings:', error);
      setStandings([]);
    } finally {
      setLoading(false);
    }
  };

  const getPositionIcon = (position: number, previousPosition?: number) => {
    if (!previousPosition || previousPosition === position) {
      return <Minus className="h-4 w-4 text-gray-400" />;
    } else if (previousPosition > position) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
  };

  const getPositionColor = (position: number) => {
    if (position === 1) return 'text-yellow-600 bg-yellow-50';
    if (position === 2) return 'text-gray-600 bg-gray-50';
    if (position === 3) return 'text-amber-600 bg-amber-50';
    return 'text-gray-900 bg-white';
  };

  if (loading && leagues.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">League Standings</h1>
          <p className="text-gray-600">Current league table and team rankings</p>
        </div>
        
        {leagues.length > 1 && (
          <div className="w-64">
            <Select value={selectedLeague} onValueChange={setSelectedLeague}>
              <SelectTrigger>
                <SelectValue placeholder="Select a league" />
              </SelectTrigger>
              <SelectContent>
                {leagues.map((league) => (
                  <SelectItem key={league.id} value={league.id}>
                    {league.name} ({league.season})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {leagues.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Leagues Available</h2>
            <p className="text-gray-600">No leagues have been created yet.</p>
          </CardContent>
        </Card>
      ) : !selectedLeague ? (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Select a League</h2>
            <p className="text-gray-600">Please select a league to view standings.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-6 w-6 text-yellow-600" />
              <span>
                {leagues.find(l => l.id === selectedLeague)?.name} Standings
              </span>
            </CardTitle>
            <CardDescription>
              Current season: {leagues.find(l => l.id === selectedLeague)?.season}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : standings.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No standings data available for this league.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 font-semibold text-gray-900">Pos</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Team</th>
                      <th className="text-center py-3 px-2 font-semibold text-gray-900">P</th>
                      <th className="text-center py-3 px-2 font-semibold text-gray-900">W</th>
                      <th className="text-center py-3 px-2 font-semibold text-gray-900">D</th>
                      <th className="text-center py-3 px-2 font-semibold text-gray-900">L</th>
                      <th className="text-center py-3 px-2 font-semibold text-gray-900">GF</th>
                      <th className="text-center py-3 px-2 font-semibold text-gray-900">GA</th>
                      <th className="text-center py-3 px-2 font-semibold text-gray-900">GD</th>
                      <th className="text-center py-3 px-2 font-semibold text-gray-900">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((standing, index) => (
                      <tr
                        key={standing.id}
                        className={`border-b border-gray-100 hover:bg-gray-50 ${
                          getPositionColor(standing.position)
                        }`}
                      >
                        <td className="py-4 px-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-lg">
                              {standing.position}
                            </span>
                            {getPositionIcon(standing.position)}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            {standing.team?.logo_url ? (
                              <img 
                                src={standing.team.logo_url} 
                                alt={`${standing.team.name} logo`}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 text-xs font-semibold">
                                  {standing.team?.name?.charAt(0) || '?'}
                                </span>
                              </div>
                            )}
                            <span className="font-medium text-gray-900">
                              {standing.team?.name || 'Unknown Team'}
                            </span>
                            {standing.position === 1 && (
                              <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
                                <Trophy className="h-3 w-3 mr-1" />
                                Leader
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-2 text-center font-medium">{standing.played}</td>
                        <td className="py-4 px-2 text-center text-green-600 font-medium">{standing.won}</td>
                        <td className="py-4 px-2 text-center text-gray-600 font-medium">{standing.draw}</td>
                        <td className="py-4 px-2 text-center text-red-600 font-medium">{standing.lost}</td>
                        <td className="py-4 px-2 text-center font-medium">{standing.goals_for}</td>
                        <td className="py-4 px-2 text-center font-medium">{standing.goals_against}</td>
                        <td className="py-4 px-2 text-center font-medium">
                          <span className={`${standing.goal_difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {standing.goal_difference > 0 ? '+' : ''}{standing.goal_difference}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-center">
                          <Badge variant="default" className="font-bold text-base px-3 py-1">
                            {standing.points}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {standings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">League Leader</p>
              <p className="text-lg font-bold text-gray-900">
                {standings[0]?.team?.name || 'TBD'}
              </p>
              <p className="text-2xl font-bold text-yellow-600">
                {standings[0]?.points || 0} pts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Total Matches</p>
              <p className="text-2xl font-bold text-gray-900">
                {standings.reduce((sum, s) => sum + s.played, 0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Total Goals</p>
              <p className="text-2xl font-bold text-gray-900">
                {standings.reduce((sum, s) => sum + s.goals_for, 0)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default StandingsPage;