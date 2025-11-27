import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all matches
router.get('/', async (req, res) => {
  try {
    const { league_id, team_id, status } = req.query;
    
    let query = supabase
      .from('matches')
      .select(`
        *,
        league:leagues(id, name, season),
        team1:teams!matches_team1_id_fkey(id, name),
        team2:teams!matches_team2_id_fkey(id, name)
      `)
      .order('date');

    if (league_id) {
      query = query.eq('league_id', league_id);
    }

    if (team_id) {
      query = query.or(`team1_id.eq.${team_id},team2_id.eq.${team_id}`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get match by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        league:leagues(id, name, season),
        team1:teams!matches_team1_id_fkey(id, name),
        team2:teams!matches_team2_id_fkey(id, name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Get match error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create match (admin only)
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { league_id, team1_id, team2_id, date, venue } = req.body;

    if (team1_id === team2_id) {
      return res.status(400).json({ error: 'Teams cannot play against themselves' });
    }

    const { data, error } = await supabase
      .from('matches')
      .insert([{
        league_id,
        team1_id,
        team2_id,
        date,
        venue,
        status: 'scheduled'
      }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Create match error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update match (admin only)
router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { league_id, team1_id, team2_id, date, venue, score_team1, score_team2, status } = req.body;

    if (team1_id && team2_id && team1_id === team2_id) {
      return res.status(400).json({ error: 'Teams cannot play against themselves' });
    }

    const updateData = {};
    if (league_id !== undefined) updateData.league_id = league_id;
    if (team1_id !== undefined) updateData.team1_id = team1_id;
    if (team2_id !== undefined) updateData.team2_id = team2_id;
    if (date !== undefined) updateData.date = date;
    if (venue !== undefined) updateData.venue = venue;
    if (score_team1 !== undefined) updateData.score_team1 = score_team1;
    if (score_team2 !== undefined) updateData.score_team2 = score_team2;
    if (status !== undefined) updateData.status = status;

    const { data, error } = await supabase
      .from('matches')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Update match error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update match score (admin only)
router.patch('/:id/score', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { score_team1, score_team2 } = req.body;

    if (score_team1 === undefined || score_team2 === undefined) {
      return res.status(400).json({ error: 'Both team scores are required' });
    }

    const { data, error } = await supabase
      .from('matches')
      .update({
        score_team1: parseInt(score_team1),
        score_team2: parseInt(score_team2),
        status: 'completed'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Update match score error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete match (admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('matches')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Match deleted successfully' });
  } catch (error) {
    console.error('Delete match error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;