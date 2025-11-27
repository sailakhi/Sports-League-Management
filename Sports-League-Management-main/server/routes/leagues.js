import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all leagues
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leagues')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Get leagues error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get league by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('leagues')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Get league error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create league (admin only)
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name, season, format } = req.body;

    const { data, error } = await supabase
      .from('leagues')
      .insert([{ name, season, format }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Create league error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update league (admin only)
router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, season, format } = req.body;

    const { data, error } = await supabase
      .from('leagues')
      .update({ name, season, format })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Update league error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete league (admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('leagues')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'League deleted successfully' });
  } catch (error) {
    console.error('Delete league error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate fixtures for a league (admin only)
router.post('/:id/fixtures', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id: league_id } = req.params;
    const { team_ids, start_date, venue } = req.body;

    if (!team_ids || team_ids.length < 2) {
      return res.status(400).json({ error: 'At least 2 teams required' });
    }

    const fixtures = [];
    const startDate = new Date(start_date);
    let matchDate = new Date(startDate);

    // Generate round-robin fixtures
    for (let i = 0; i < team_ids.length; i++) {
      for (let j = i + 1; j < team_ids.length; j++) {
        fixtures.push({
          league_id,
          team1_id: team_ids[i],
          team2_id: team_ids[j],
          date: matchDate.toISOString().split('T')[0],
          venue: venue || 'TBD',
          status: 'scheduled'
        });
        
        // Increment date by one week for next match
        matchDate.setDate(matchDate.getDate() + 7);
      }
    }

    const { data, error } = await supabase
      .from('matches')
      .insert(fixtures)
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({
      message: `Generated ${fixtures.length} fixtures`,
      matches: data
    });
  } catch (error) {
    console.error('Generate fixtures error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;