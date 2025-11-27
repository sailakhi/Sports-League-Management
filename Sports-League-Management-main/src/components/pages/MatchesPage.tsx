import React, { useState, useEffect } from 'react';
import { apiService } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Clock, MapPin, Plus, Edit } from 'lucide-react';

const MatchesPage: React.FC = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<any[]>([]);
  const [leagues, setLeagues] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed'>('all');
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [scores, setScores] = useState({ team1: '', team2: '' });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadMatches();
  }, [filter, selectedLeague]);

  const loadData = async () => {
    try {
      const [leaguesData, teamsData] = await Promise.all([
        apiService.getLeagues(),
        apiService.getTeams(),
      ]);
      
      setLeagues(leaguesData);
      setTeams(teamsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const loadMatches = async () => {
    setLoading(true);
    try {
      const params: any = {};
      
      if (filter !== 'all') {
        params.status = filter;
      }
      
      if (selectedLeague !== 'all') {
        params.leagueId = selectedLeague;
      }

      const matchesData = await apiService.getMatches(params);
      setMatches(matchesData);
    } catch (error) {
      console.error('Failed to load matches:', error);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateScore = (match: any) => {
    setSelectedMatch(match);
    setScores({
      team1: match.score_team1?.toString() || '',
      team2: match.score_team2?.toString() || '',
    });
    setScoreDialogOpen(true);
  };

  const handleScoreSubmit = async () => {
    if (!selectedMatch || !scores.team1 || !scores.team2) return;

    try {
      await apiService.updateMatchScore(
        selectedMatch.id,
        parseInt(scores.team1),
        parseInt(scores.team2)
      );
      
      setScoreDialogOpen(false);
      setSelectedMatch(null);
      setScores({ team1: '', team2: '' });
      loadMatches(); // Reload matches
    } catch (error) {
      console.error('Failed to update score:', error);
    }
  };

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  if (loading && matches.length === 0) {
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
          <h1 className="text-3xl font-bold text-gray-900">Matches</h1>
          <p className="text-gray-600">View and manage match schedules and results</p>
        </div>
        
        {user?.role === 'admin' && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Match
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Matches</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedLeague} onValueChange={setSelectedLeague}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select League" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Leagues</SelectItem>
            {leagues.map((league) => (
              <SelectItem key={league.id} value={league.id}>
                {league.name} ({league.season})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Matches List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : matches.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Matches Found</h2>
            <p className="text-gray-600">No matches match your current filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => {
            const { date, time } = formatDate(match.date);
            
            return (
              <Card key={match.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    {/* Match Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <Badge className={getMatchStatusColor(match.status)}>
                          {match.status}
                        </Badge>
                        
                        {match.league && (
                          <Badge variant="outline">
                            {match.league.name}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        {/* Teams */}
                        <div className="flex items-center space-x-8">
                          <div className="text-center">
                            <p className="font-semibold text-lg text-gray-900">
                              {match.team1?.name || 'TBD'}
                            </p>
                            {match.status === 'completed' && (
                              <p className="text-3xl font-bold text-blue-600">
                                {match.score_team1}
                              </p>
                            )}
                          </div>
                          
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-400">VS</p>
                          </div>
                          
                          <div className="text-center">
                            <p className="font-semibold text-lg text-gray-900">
                              {match.team2?.name || 'TBD'}
                            </p>
                            {match.status === 'completed' && (
                              <p className="text-3xl font-bold text-blue-600">
                                {match.score_team2}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Match Details */}
                        <div className="text-right">
                          <div className="flex items-center text-gray-600 mb-1">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>{date}</span>
                          </div>
                          
                          <div className="flex items-center text-gray-600 mb-1">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>{time}</span>
                          </div>
                          
                          <div className="flex items-center text-gray-600">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span>{match.venue}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {user?.role === 'admin' && match.status === 'scheduled' && (
                      <div className="ml-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateScore(match)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Update Score
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Score Update Dialog */}
      <Dialog open={scoreDialogOpen} onOpenChange={setScoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Match Score</DialogTitle>
            <DialogDescription>
              {selectedMatch && (
                <>Update the final score for {selectedMatch.team1?.name} vs {selectedMatch.team2?.name}</>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedMatch && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{selectedMatch.team1?.name}</label>
                <Input
                  type="number"
                  min="0"
                  value={scores.team1}
                  onChange={(e) => setScores({ ...scores, team1: e.target.value })}
                  placeholder="Score"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">{selectedMatch.team2?.name}</label>
                <Input
                  type="number"
                  min="0"
                  value={scores.team2}
                  onChange={(e) => setScores({ ...scores, team2: e.target.value })}
                  placeholder="Score"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setScoreDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleScoreSubmit}
              disabled={!scores.team1 || !scores.team2}
            >
              Update Score
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MatchesPage;