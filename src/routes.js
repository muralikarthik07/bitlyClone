const express = require('express');
const validUrl = require('valid-url');
const { pool } = require('./db');

const router = express.Router();

// Helper function to validate short code format
function isValidCode(code) {
  return /^[A-Za-z0-9]{6,8}$/.test(code);
}

// Helper function to generate random code
function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// POST /api/links - Create a new short link
router.post('/api/links', async (req, res) => {
  try {
    const { target_url, code } = req.body;

    // Validate target URL
    if (!target_url || !validUrl.isUri(target_url)) {
      return res.status(400).json({ error: 'Invalid URL provided' });
    }

    // Generate or validate code
    let shortCode = code;
    if (shortCode) {
      // Validate custom code format
      if (!isValidCode(shortCode)) {
        return res.status(400).json({ 
          error: 'Code must be 6-8 alphanumeric characters' 
        });
      }

      // Check if code already exists
      const existing = await pool.query('SELECT code FROM links WHERE code = $1', [shortCode]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Code already exists' });
      }
    } else {
      // Generate unique code
      let attempts = 0;
      while (attempts < 10) {
        shortCode = generateCode();
        const existing = await pool.query('SELECT code FROM links WHERE code = $1', [shortCode]);
        if (existing.rows.length === 0) break;
        attempts++;
      }
      if (attempts === 10) {
        return res.status(500).json({ error: 'Failed to generate unique code' });
      }
    }

    // Insert into database
    const result = await pool.query(
      'INSERT INTO links (code, target_url) VALUES ($1, $2) RETURNING *',
      [shortCode, target_url]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create link error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/links - Get all links
router.get('/api/links', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM links ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get links error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/links/:code - Get stats for a specific link
router.get('/api/links/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const result = await pool.query('SELECT * FROM links WHERE code = $1', [code]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Link not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get link error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/links/:code - Delete a link
router.delete('/api/links/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const result = await pool.query(
      'DELETE FROM links WHERE code = $1 RETURNING *',
      [code]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Link not found' });
    }
    
    res.json({ message: 'Link deleted successfully' });
  } catch (err) {
    console.error('Delete link error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;