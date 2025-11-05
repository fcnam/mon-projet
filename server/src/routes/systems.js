import express from 'express';
import { dbAll, dbGet, dbRun } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all systems
router.get('/', async (req, res) => {
  try {
    const systems = await dbAll('SELECT * FROM systems ORDER BY id');
    res.json(systems);
  } catch (error) {
    console.error('Get systems error:', error);
    res.status(500).json({ error: 'Failed to get systems' });
  }
});

// Get system by ID
router.get('/:id', async (req, res) => {
  try {
    const system = await dbGet('SELECT * FROM systems WHERE id = ?', [req.params.id]);
    
    if (!system) {
      return res.status(404).json({ error: 'System not found' });
    }

    res.json(system);
  } catch (error) {
    console.error('Get system error:', error);
    res.status(500).json({ error: 'Failed to get system' });
  }
});

// Update system status
router.put('/:id', async (req, res) => {
  try {
    const { status, location, frequency, description } = req.body;
    const systemId = req.params.id;

    // Check if system exists
    const system = await dbGet('SELECT * FROM systems WHERE id = ?', [systemId]);
    if (!system) {
      return res.status(404).json({ error: 'System not found' });
    }

    // Build update query
    const updates = [];
    const params = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
    }
    if (location) {
      updates.push('location = ?');
      params.push(location);
    }
    if (frequency) {
      updates.push('frequency = ?');
      params.push(frequency);
    }
    if (description) {
      updates.push('description = ?');
      params.push(description);
    }

    updates.push('last_check = CURRENT_TIMESTAMP');
    params.push(systemId);

    await dbRun(
      `UPDATE systems SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Log action
    await dbRun(
      'INSERT INTO logs (action, entity_type, entity_id, user_id, details) VALUES (?, ?, ?, ?, ?)',
      ['UPDATE_SYSTEM', 'system', systemId, req.user.id, JSON.stringify({ status, location, frequency })]
    );

    const updatedSystem = await dbGet('SELECT * FROM systems WHERE id = ?', [systemId]);
    res.json(updatedSystem);
  } catch (error) {
    console.error('Update system error:', error);
    res.status(500).json({ error: 'Failed to update system' });
  }
});

// Switch system (activate backup)
router.post('/:id/switch', async (req, res) => {
  try {
    const sourceSystemId = req.params.id;
    const { targetSystemId, reason } = req.body;

    if (!targetSystemId) {
      return res.status(400).json({ error: 'Target system ID required' });
    }

    // Get both systems
    const sourceSystem = await dbGet('SELECT * FROM systems WHERE id = ?', [sourceSystemId]);
    const targetSystem = await dbGet('SELECT * FROM systems WHERE id = ?', [targetSystemId]);

    if (!sourceSystem || !targetSystem) {
      return res.status(404).json({ error: 'System not found' });
    }

    // Update source system to backup/failure
    await dbRun(
      'UPDATE systems SET status = ?, last_check = CURRENT_TIMESTAMP WHERE id = ?',
      ['backup', sourceSystemId]
    );

    // Update target system to active
    await dbRun(
      'UPDATE systems SET status = ?, last_check = CURRENT_TIMESTAMP WHERE id = ?',
      ['active', targetSystemId]
    );

    // Create incident
    await dbRun(
      'INSERT INTO incidents (title, description, system_id, severity, status, reported_by) VALUES (?, ?, ?, ?, ?, ?)',
      [
        `Basculement ${sourceSystem.name} → ${targetSystem.name}`,
        reason || 'Basculement système effectué',
        sourceSystemId,
        'high',
        'in_progress',
        req.user.id
      ]
    );

    // Log action
    await dbRun(
      'INSERT INTO logs (action, entity_type, entity_id, user_id, details) VALUES (?, ?, ?, ?, ?)',
      [
        'SYSTEM_SWITCH',
        'system',
        sourceSystemId,
        req.user.id,
        JSON.stringify({ from: sourceSystem.name, to: targetSystem.name, reason })
      ]
    );

    res.json({
      message: 'System switch completed',
      source: await dbGet('SELECT * FROM systems WHERE id = ?', [sourceSystemId]),
      target: await dbGet('SELECT * FROM systems WHERE id = ?', [targetSystemId])
    });
  } catch (error) {
    console.error('Switch system error:', error);
    res.status(500).json({ error: 'Failed to switch system' });
  }
});

// Get system statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const systemId = req.params.id;

    const incidents = await dbAll(
      'SELECT COUNT(*) as total, severity FROM incidents WHERE system_id = ? GROUP BY severity',
      [systemId]
    );

    const logs = await dbAll(
      'SELECT COUNT(*) as count, DATE(created_at) as date FROM logs WHERE entity_id = ? AND entity_type = ? GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30',
      [systemId, 'system']
    );

    res.json({ incidents, logs });
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({ error: 'Failed to get system statistics' });
  }
});

export default router;