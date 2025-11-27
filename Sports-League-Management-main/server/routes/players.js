import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all players
router.get('/', async (req, res) => {
  try {
    const { team_id } = req.query;
    
    let query = supabase
      .from('players')
      .select(`
        *,
        team:teams(id, name),
        user:users(id, name, email)
      `)
      .order('name');

    if (team_id) {
      query = query.eq('team_id', team_id);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Get players error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get player by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('players')
      .select(`
        *,
        team:teams(id, name),
        user:users(id, name, email)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Get player error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create player
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, age, position, team_id, user_id } = req.body;

    // Check permissions
    if (req.user.role !== 'admin') {
      // Check if user is the coach of the team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('coach_id')
        .eq('id', team_id)
        .single();

      if (teamError || team.coach_id !== req.user.id) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
    }

    const { data, error } = await supabase
      .from('players')
      .insert([{ name, age, position, team_id, user_id }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Create player error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update player
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, age, position, team_id } = req.body;

    // Check permissions
    if (req.user.role !== 'admin') {
      // Get player's current team and new team (if changing)
      const { data: player, error: playerError } = await supabase
        .from('players')
        .select('team_id, user_id')
        .eq('id', id)
        .single();

      if (playerError) {
        return res.status(400).json({ error: 'Player not found' });
      }

      // Allow players to update their own profile
      if (req.user.role === 'player' && player.user_id === req.user.id) {
        // Players can only update name, age, position (not team)
        const { data, error } = await supabase
          .from('players')
          .update({ name, age, position })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          return res.status(400).json({ error: error.message });
        }

        return res.json(data);
      }

      // For coaches, check if they coach the current or new team
      const teamIds = [player.team_id];
      if (team_id && team_id !== player.team_id) {
        teamIds.push(team_id);
      }

      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id')
        .in('id', teamIds)
        .eq('coach_id', req.user.id);

      if (teamsError || teams.length !== teamIds.length) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
    }

    const { data, error } = await supabase
      .from('players')
      .update({ name, age, position, team_id })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Update player error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete player
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check permissions
    if (req.user.role !== 'admin') {
      // Check if user is the coach of the player's team
      const { data: player, error: playerError } = await supabase
        .from('players')
        .select('team_id')
        .eq('id', id)
        .single();

      if (playerError) {
        return res.status(400).json({ error: 'Player not found' });
      }

      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('coach_id')
        .eq('id', player.team_id)
        .single();

      if (teamError || team.coach_id !== req.user.id) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
    }

    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Player deleted successfully' });
  } catch (error) {
    console.error('Delete player error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;