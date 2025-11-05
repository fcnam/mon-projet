import express from 'express';
import { dbAll, dbGet, dbRun } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all incidents
router.get('/', async (req, res) => {
  try {
    const { status, severity, system_id, limit = 50 } = req.query;
    
    let query = `
      SELECT 
        i.*,
        s.name as system_name,
        u1.username as reported_by_username,
        u2.username as resolved_by_username
      FROM incidents i
      LEFT JOIN systems s ON i.system_id = s.id
      LEFT JOIN users u1 ON i.reported_by = u1.id
      LEFT JOIN users u2 ON i.resolved_by = u2.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (status) {
      query += ' AND i.status = ?';
      params.push(status);
    }
    if (severity) {
      query += ' AND i.severity = ?';
      params.push(severity);
    }
    if (system_id) {
      query += ' AND i.system_id = ?';
      params.push(system_id);
    }
    
    query += ' ORDER BY i.created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const incidents = await dbAll(query, params);
    res.json(incidents);
  } catch (error) {
    console.error('Get incidents error:', error);
    res.status(500).json({ error: 'Failed to get incidents' });
  }
});

// Get incident by ID
router.get('/:id', async (req, res) => {
  try {
    const incident = await dbGet(`
      SELECT 
        i.*,
        s.name as system_name,
        s.type as system_type,
        u1.full_name as reported_by_name,
        u2.full_name as resolved_by_name
      FROM incidents i
      LEFT JOIN systems s ON i.system_id = s.id
      LEFT JOIN users u1 ON i.reported_by = u1.id
      LEFT JOIN users u2 ON i.resolved_by = u2.id
      WHERE i.id = ?
    `, [req.params.id]);
    
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    res.json(incident);
  } catch (error) {
    console.error('Get incident error:', error);
    res.status(500).json({ error: 'Failed to get incident' });
  }
});

// Create incident
router.post('/', async (req, res) => {
  try {
    const { title, description, system_id, severity } = req.body;

    if (!title || !severity) {
      return res.status(400).json({ error: 'Title and severity required' });
    }

    const result = await dbRun(
      'INSERT INTO incidents (title, description, system_id, severity, status, reported_by) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description, system_id, severity, 'open', req.user.id]
    );

    // Log action
    await dbRun(
      'INSERT INTO logs (action, entity_type, entity_id, user_id, details) VALUES (?, ?, ?, ?, ?)',
      ['CREATE_INCIDENT', 'incident', result.lastID, req.user.id, JSON.stringify({ title, severity })]
    );

    const newIncident = await dbGet('SELECT * FROM incidents WHERE id = ?', [result.lastID]);
    res.status(201).json(newIncident);
  } catch (error) {
    console.error('Create incident error:', error);
    res.status(500).json({ error: 'Failed to create incident' });
  }
});

// Update incident
router.put('/:id', async (req, res) => {
  try {
    const incidentId = req.params.id;
    const { status, description, severity } = req.body;

    const incident = await dbGet('SELECT * FROM incidents WHERE id = ?', [incidentId]);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const updates = [];
    const params = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
      
      // If resolved or closed, set resolved_by and resolved_at
      if (status === 'resolved' || status === 'closed') {
        updates.push('resolved_by = ?', 'resolved_at = CURRENT_TIMESTAMP');
        params.push(req.user.id);
      }
    }
    if (description) {
      updates.push('description = ?');
      params.push(description);
    }
    if (severity) {
      updates.push('severity = ?');
      params.push(severity);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(incidentId);
    await dbRun(
      `UPDATE incidents SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Log action
    await dbRun(
      'INSERT INTO logs (action, entity_type, entity_id, user_id, details) VALUES (?, ?, ?, ?, ?)',
      ['UPDATE_INCIDENT', 'incident', incidentId, req.user.id, JSON.stringify({ status, severity })]
    );

    const updatedIncident = await dbGet('SELECT * FROM incidents WHERE id = ?', [incidentId]);
    res.json(updatedIncident);
  } catch (error) {
    console.error('Update incident error:', error);
    res.status(500).json({ error: 'Failed to update incident' });
  }
});

// Get incident statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const bySeverity = await dbAll(
      'SELECT severity, COUNT(*) as count FROM incidents GROUP BY severity'
    );

    const byStatus = await dbAll(
      'SELECT status, COUNT(*) as count FROM incidents GROUP BY status'
    );

    const bySystem = await dbAll(`
      SELECT s.name, COUNT(i.id) as count
      FROM systems s
      LEFT JOIN incidents i ON s.id = i.system_id
      GROUP BY s.id, s.name
    `);

    const recentTrend = await dbAll(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM incidents
      WHERE created_at >= date('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    res.json({
      by_severity: bySeverity,
      by_status: byStatus,
      by_system: bySystem,
      recent_trend: recentTrend
    });
  } catch (error) {
    console.error('Get incident stats error:', error);
    res.status(500).json({ error: 'Failed to get incident statistics' });
  }
});

export default router;