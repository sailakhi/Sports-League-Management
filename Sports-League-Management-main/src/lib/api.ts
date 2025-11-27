const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  private getAuthHeader() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_URL}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeader(),
      ...(options.headers || {}),
    };

    const config: RequestInit = {
      method: options.method || 'GET',
      mode: 'cors',
      credentials: 'include',
      headers,
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const text = await response.text();
      const data = text ? JSON.parse(text) : null;

      if (!response.ok) {
        const errMsg = data?.error || data?.message || response.statusText || 'API request failed';
        throw new Error(errMsg);
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Auth methods
  async login(email: string, password: string) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (data.session?.access_token) {
      localStorage.setItem('token', data.session.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  }

  async register(name: string, email: string, password: string, role: string = 'player') {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // Teams methods
  async getTeams() {
    return this.request('/teams');
  }

  async getTeam(id: string) {
    return this.request(`/teams/${id}`);
  }

  async createTeam(team: any) {
    return this.request('/teams', {
      method: 'POST',
      body: JSON.stringify(team),
    });
  }

  async updateTeam(id: string, team: any) {
    return this.request(`/teams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(team),
    });
  }

  async deleteTeam(id: string) {
    return this.request(`/teams/${id}`, {
      method: 'DELETE',
    });
  }

  // Players methods
  async getPlayers(teamId?: string) {
    const query = teamId ? `?team_id=${teamId}` : '';
    return this.request(`/players${query}`);
  }

  async getPlayer(id: string) {
    return this.request(`/players/${id}`);
  }

  async createPlayer(player: any) {
    return this.request('/players', {
      method: 'POST',
      body: JSON.stringify(player),
    });
  }

  async updatePlayer(id: string, player: any) {
    return this.request(`/players/${id}`, {
      method: 'PUT',
      body: JSON.stringify(player),
    });
  }

  async deletePlayer(id: string) {
    return this.request(`/players/${id}`, {
      method: 'DELETE',
    });
  }

  // Leagues methods
  async getLeagues() {
    return this.request('/leagues');
  }

  async getLeague(id: string) {
    return this.request(`/leagues/${id}`);
  }

  async createLeague(league: any) {
    return this.request('/leagues', {
      method: 'POST',
      body: JSON.stringify(league),
    });
  }

  async updateLeague(id: string, league: any) {
    return this.request(`/leagues/${id}`, {
      method: 'PUT',
      body: JSON.stringify(league),
    });
  }

  async deleteLeague(id: string) {
    return this.request(`/leagues/${id}`, {
      method: 'DELETE',
    });
  }

  async generateFixtures(leagueId: string, teamIds: string[], startDate: string, venue: string) {
    return this.request(`/leagues/${leagueId}/fixtures`, {
      method: 'POST',
      body: JSON.stringify({ team_ids: teamIds, start_date: startDate, venue }),
    });
  }

  // Matches methods
  async getMatches(params?: { leagueId?: string; teamId?: string; status?: string }) {
    const query = new URLSearchParams();
    if (params?.leagueId) query.append('league_id', params.leagueId);
    if (params?.teamId) query.append('team_id', params.teamId);
    if (params?.status) query.append('status', params.status);
    
    return this.request(`/matches${query.toString() ? '?' + query.toString() : ''}`);
  }

  async getMatch(id: string) {
    return this.request(`/matches/${id}`);
  }

  async createMatch(match: any) {
    return this.request('/matches', {
      method: 'POST',
      body: JSON.stringify(match),
    });
  }

  async updateMatch(id: string, match: any) {
    return this.request(`/matches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(match),
    });
  }

  async updateMatchScore(id: string, scoreTeam1: number, scoreTeam2: number) {
    return this.request(`/matches/${id}/score`, {
      method: 'PATCH',
      body: JSON.stringify({ score_team1: scoreTeam1, score_team2: scoreTeam2 }),
    });
  }

  async deleteMatch(id: string) {
    return this.request(`/matches/${id}`, {
      method: 'DELETE',
    });
  }

  // Standings methods
  async getStandings(leagueId: string) {
    return this.request(`/standings?league_id=${leagueId}`);
  }

  async getAllStandings() {
    return this.request('/standings/all');
  }
}

export const apiService = new ApiService();