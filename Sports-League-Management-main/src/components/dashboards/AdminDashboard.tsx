import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, TrendingUp, Trophy, Users } from "lucide-react";
import React, { useEffect, useState } from "react";
import { apiService } from "../../lib/api";

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalPlayers: 0,
    totalLeagues: 0,
    totalMatches: 0,
    upcomingMatches: 0,
    completedMatches: 0,
  });
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [teams, players, leagues, matches] = await Promise.all([
        apiService.getTeams(),
        apiService.getPlayers(),
        apiService.getLeagues(),
        apiService.getMatches(),
      ]);

      const upcomingMatches = matches.filter(
        (match: any) => match.status === "scheduled"
      );
      const completedMatches = matches.filter(
        (match: any) => match.status === "completed"
      );

      setStats({
        totalTeams: teams.length,
        totalPlayers: players.length,
        totalLeagues: leagues.length,
        totalMatches: matches.length,
        upcomingMatches: upcomingMatches.length,
        completedMatches: completedMatches.length,
      });

      // Get recent completed matches
      setRecentMatches(
        completedMatches
          .sort(
            (a: any, b: any) =>
              new Date(b.date).getTime() - new Date(a.date).getTime()
          )
          .slice(0, 5)
      );
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">
            Overview of your sports league management system
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Teams</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalTeams}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Players
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalPlayers}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Leagues
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalLeagues}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Trophy className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Matches
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalMatches}
                </p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <Calendar className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Match Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Match Overview</CardTitle>
            <CardDescription>Current match statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Upcoming Matches
                  </p>
                  <p className="text-2xl font-bold text-blue-700">
                    {stats.upcomingMatches}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-green-900">
                    Completed Matches
                  </p>
                  <p className="text-2xl font-bold text-green-700">
                    {stats.completedMatches}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Results</CardTitle>
            <CardDescription>Latest completed matches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentMatches.length > 0 ? (
                recentMatches.map((match) => (
                  <div
                    key={match.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-sm">
                        <p className="font-medium">
                          {match.team1?.name} vs {match.team2?.name}
                        </p>
                        <p className="text-gray-600">
                          {new Date(match.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        {match.score_team1} - {match.score_team2}
                      </Badge>
                      <Badge
                        variant={
                          match.status === "completed" ? "default" : "secondary"
                        }
                      >
                        {match.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No recent matches
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center"
            >
              <Trophy className="h-6 w-6 mb-2" />
              Create League
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center"
            >
              <Users className="h-6 w-6 mb-2" />
              Add Team
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center"
            >
              <Calendar className="h-6 w-6 mb-2" />
              Schedule Match
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center"
            >
              <TrendingUp className="h-6 w-6 mb-2" />
              Update Scores
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
