import express from 'express';
import { dbAll, dbGet, dbRun } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all scenarios
router.get('/', async (req, res) => {
  try {
    const scenarios = await dbAll(`
      SELECT 
        s.*,
        src.name as source_system_name,
        tgt.name as target_system_name
      FROM scenarios s
      LEFT JOIN systems src ON s.source_system_id = src.id
      LEFT JOIN systems tgt ON s.target_system_id = tgt.id
      ORDER BY s.priority DESC, s.id
    `);
    
    // Parse steps JSON
    const parsedScenarios = scenarios.map(scenario => ({
      ...scenario,
      steps: scenario.steps ? JSON.parse(scenario.steps) : []
    }));

    res.json(parsedScenarios);
  } catch (error) {
    console.error('Get scenarios error:', error);
    res.status(500).json({ error: 'Failed to get scenarios' });
  }
});

// Get scenario by ID
router.get('/:id', async (req, res) => {
  try {
    const scenario = await dbGet(`
      SELECT 
        s.*,
        src.name as source_system_name,
        src.status as source_system_status,
        tgt.name as target_system_name,
        tgt.status as target_system_status
      FROM scenarios s
      LEFT JOIN systems src ON s.source_system_id = src.id
      LEFT JOIN systems tgt ON s.target_system_id = tgt.id
      WHERE s.id = ?
    `, [req.params.id]);
    
    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    // Parse steps JSON
    scenario.steps = scenario.steps ? JSON.parse(scenario.steps) : [];

    res.json(scenario);
  } catch (error) {
    console.error('Get scenario error:', error);
    res.status(500).json({ error: 'Failed to get scenario' });
  }
});

// Execute scenario
router.post('/:id/execute', async (req, res) => {
  try {
    const scenarioId = req.params.id;
    const { notes } = req.body;

    // Get scenario details
    const scenario = await dbGet(`
      SELECT s.*, src.name as source_name, tgt.name as target_name
      FROM scenarios s
      LEFT JOIN systems src ON s.source_system_id = src.id
      LEFT JOIN systems tgt ON s.target_system_id = tgt.id
      WHERE s.id = ?
    `, [scenarioId]);

    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    // Create incident for this execution
    const incidentResult = await dbRun(
      'INSERT INTO incidents (title, description, system_id, severity, status, reported_by) VALUES (?, ?, ?, ?, ?, ?)',
      [
        `Exécution: ${scenario.name}`,
        notes || `Scénario ${scenario.name} exécuté`,
        scenario.source_system_id,
        scenario.priority === 'critical' ? 'critical' : 'high',
        'in_progress',
        req.user.id
      ]
    );

    // Update source system status
    if (scenario.source_system_id) {
      await dbRun(
        'UPDATE systems SET status = ?, last_check = CURRENT_TIMESTAMP WHERE id = ?',
        ['backup', scenario.source_system_id]
      );
    }

    // Update target system status
    if (scenario.target_system_id) {
      await dbRun(
        'UPDATE systems SET status = ?, last_check = CURRENT_TIMESTAMP WHERE id = ?',
        ['active', scenario.target_system_id]
      );
    }

    // Log action
    await dbRun(
      'INSERT INTO logs (action, entity_type, entity_id, user_id, details) VALUES (?, ?, ?, ?, ?)',
      [
        'EXECUTE_SCENARIO',
        'scenario',
        scenarioId,
        req.user.id,
        JSON.stringify({ 
          scenario: scenario.name, 
          incident_id: incidentResult.lastID,
          notes 
        })
      ]
    );

    res.json({
      message: 'Scenario executed successfully',
      scenario: scenario.name,
      incident_id: incidentResult.lastID,
      estimated_time: scenario.estimated_time
    });
  } catch (error) {
    console.error('Execute scenario error:', error);
    res.status(500).json({ error: 'Failed to execute scenario' });
  }
});

// Create new scenario (admin only)
router.post('/', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, description, source_system_id, target_system_id, steps, estimated_time, priority } = req.body;

    if (!name || !steps || !priority) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await dbRun(
      'INSERT INTO scenarios (name, description, source_system_id, target_system_id, steps, estimated_time, priority) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, description, source_system_id, target_system_id, JSON.stringify(steps), estimated_time, priority]
    );

    // Log action
    await dbRun(
      'INSERT INTO logs (action, entity_type, entity_id, user_id, details) VALUES (?, ?, ?, ?, ?)',
      ['CREATE_SCENARIO', 'scenario', result.lastID, req.user.id, JSON.stringify({ name, priority })]
    );

    const newScenario = await dbGet('SELECT * FROM scenarios WHERE id = ?', [result.lastID]);
    newScenario.steps = JSON.parse(newScenario.steps);

    res.status(201).json(newScenario);
  } catch (error) {
    console.error('Create scenario error:', error);
    res.status(500).json({ error: 'Failed to create scenario' });
  }
});

export default router;