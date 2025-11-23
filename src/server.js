require('dotenv').config();
const express = require('express');
const path = require('path');
const { pool, initDatabase } = require('./db');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;
const startTime = Date.now();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use(routes);

// Health check endpoint
app.get('/healthz', (req, res) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  res.status(200).json({
    ok: true,
    version: '1.0',
    uptime: uptime,
    timestamp: new Date().toISOString()
  });
});

// Dashboard page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/dashboard.html'));
});

// Stats page for a specific code
app.get('/code/:code', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/stats.html'));
});

// Redirect handler - must be last to not interfere with other routes
app.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    // Skip favicon and other common requests
    if (code === 'favicon.ico') {
      return res.status(404).end();
    }

    const result = await pool.query('SELECT * FROM links WHERE code = $1', [code]);
    
    if (result.rows.length === 0) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>404 - Link Not Found</title>
          <link rel="stylesheet" href="/styles.css">
        </head>
        <body>
          <div class="container" style="text-align: center; padding: 60px 20px;">
            <h1>404</h1>
            <p>This short link does not exist or has been deleted.</p>
            <a href="/" class="btn btn-primary" style="display: inline-block; margin-top: 20px;">Go to Dashboard</a>
          </div>
        </body>
        </html>
      `);
    }

    const link = result.rows[0];
    
    // Update click count and last clicked time
    await pool.query(
      'UPDATE links SET total_clicks = total_clicks + 1, last_clicked = CURRENT_TIMESTAMP WHERE code = $1',
      [code]
    );

    // Perform 302 redirect
    res.redirect(302, link.target_url);
  } catch (err) {
    console.error('Redirect error:', err);
    res.status(500).send('Internal server error');
  }
});

// Initialize database and start server
async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`✓ TinyLink server running on http://localhost:${PORT}`);
      console.log(`✓ Health check available at http://localhost:${PORT}/healthz`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();