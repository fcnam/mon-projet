import express from 'express';
import { dbAll, dbRun } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all logs
router.get('/', async (req, res) => {
  try {
    const { action, entity_type, user_id, limit = 100 } = req.query;
    
    let query = `
      SELECT 
        l.*,
        u.username,
        u.full_name
      FROM logs l
      LEFT JOIN users u ON l.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (action) {
      query += ' AND l.action = ?';
      params.push(action);
    }
    if (entity_type) {
      query += ' AND l.entity_type = ?';
      params.push(entity_type);
    }
    if (user_id) {
      query += ' AND l.user_id = ?';
      params.push(user_id);
    }
    
    query += ' ORDER BY l.created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const logs = await dbAll(query, params);
    
    // Parse details JSON
    const parsedLogs = logs.map(log => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null
    }));
    
    res.json(parsedLogs);
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Failed to get logs' });
  }
});

// Create log
router.post('/', async (req, res) => {
  try {
    const { action, entity_type, entity_id, details, ip_address } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Action required' });
    }

    const result = await dbRun(
      'INSERT INTO logs (action, entity_type, entity_id, user_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
      [action, entity_type, entity_id, req.user.id, JSON.stringify(details), ip_address]
    );

    res.status(201).json({ id: result.lastID, message: 'Log created' });
  } catch (error) {
    console.error('Create log error:', error);
    res.status(500).json({ error: 'Failed to create log' });
  }
});

export default router;