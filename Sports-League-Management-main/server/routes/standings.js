import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Get standings for a league
router.get('/', async (req, res) => {
  try {
    const { league_id } = req.query;

    if (!league_id) {
      return res.status(400).json({ error: 'league_id is required' });
    }

    const { data, error } = await supabase
      .from('standings')
      .select(`
        *,
        team:teams(id, name, logo_url)
      `)
      .eq('league_id', league_id)
      .order('points', { ascending: false })
      .order('goals_for', { ascending: false })
      .order('goals_against', { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Add position based on sorting
    const standingsWithPosition = data.map((standing, index) => ({
      ...standing,
      position: index + 1,
      goal_difference: standing.goals_for - standing.goals_against
    }));

    res.json(standingsWithPosition);
  } catch (error) {
    console.error('Get standings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all standings grouped by league
router.get('/all', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('standings')
      .select(`
        *,
        team:teams(id, name, logo_url),
        league:leagues(id, name, season)
      `)
      .order('points', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Group by league
    const standingsByLeague = data.reduce((acc, standing) => {
      const leagueId = standing.league_id;
      if (!acc[leagueId]) {
        acc[leagueId] = {
          league: standing.league,
          standings: []
        };
      }
      
      acc[leagueId].standings.push({
        ...standing,
        goal_difference: standing.goals_for - standing.goals_against
      });
      
      return acc;
    }, {});

    // Add positions within each league
    Object.values(standingsByLeague).forEach(leagueData => {
      leagueData.standings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
        return b.goals_for - a.goals_for;
      });

      leagueData.standings.forEach((standing, index) => {
        standing.position = index + 1;
      });
    });

    res.json(standingsByLeague);
  } catch (error) {
    console.error('Get all standings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;