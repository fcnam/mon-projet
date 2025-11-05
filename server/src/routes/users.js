import express from 'express';
import bcrypt from 'bcrypt';
import { dbAll, dbGet, dbRun } from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const userRouter = express.Router();

// All routes require authentication
userRouter.use(authenticateToken);

// Get all users (admin only)
userRouter.get('/', requireAdmin, async (req, res) => {
  try {
    const users = await dbAll(
      'SELECT id, username, full_name, email, role, created_at, last_login FROM users ORDER BY id'
    );
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get user by ID
userRouter.get('/:id', async (req, res) => {
  try {
    // Users can only view their own profile unless admin
    if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await dbGet(
      'SELECT id, username, full_name, email, role, created_at, last_login FROM users WHERE id = ?',
      [req.params.id]
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Create user (admin only)
userRouter.post('/', requireAdmin, async (req, res) => {
  try {
    const { username, password, full_name, email, role } = req.body;

    if (!username || !password || !full_name || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user exists
    const existingUser = await dbGet('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await dbRun(
      'INSERT INTO users (username, password, full_name, email, role) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, full_name, email, role]
    );

    // Log action
    await dbRun(
      'INSERT INTO logs (action, entity_type, entity_id, user_id, details) VALUES (?, ?, ?, ?, ?)',
      ['CREATE_USER', 'user', result.lastID, req.user.id, JSON.stringify({ username, role })]
    );

    res.status(201).json({
      id: result.lastID,
      username,
      full_name,
      email,
      role
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
userRouter.put('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Users can only update their own profile unless admin
    if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { full_name, email, password } = req.body;

    const updates = [];
    const params = [];

    if (full_name) {
      updates.push('full_name = ?');
      params.push(full_name);
    }
    if (email) {
      updates.push('email = ?');
      params.push(email);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push('password = ?');
      params.push(hashedPassword);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(userId);
    await dbRun(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    // Log action
    await dbRun(
      'INSERT INTO logs (action, entity_type, entity_id, user_id, details) VALUES (?, ?, ?, ?, ?)',
      ['UPDATE_USER', 'user', userId, req.user.id, JSON.stringify({ updated_fields: Object.keys(req.body) })]
    );

    const updatedUser = await dbGet(
      'SELECT id, username, full_name, email, role FROM users WHERE id = ?',
      [userId]
    );

    res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (admin only)
userRouter.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    // Can't delete yourself
    if (req.user.id === parseInt(userId)) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await dbGet('SELECT username FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await dbRun('DELETE FROM users WHERE id = ?', [userId]);

    // Log action
    await dbRun(
      'INSERT INTO logs (action, entity_type, entity_id, user_id, details) VALUES (?, ?, ?, ?, ?)',
      ['DELETE_USER', 'user', userId, req.user.id, JSON.stringify({ username: user.username })]
    );

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export { userRouter as default };