# TinyLink - URL Shortener

A full-featured URL shortening service built with Node.js, Express, and PostgreSQL. Create short links, track clicks, and manage your URLs with ease.

##  Features

- **Create Short Links**: Generate short URLs with optional custom codes
- **Click Tracking**: Monitor total clicks and last clicked timestamp
- **Link Management**: View, search, sort, and delete links
- **Stats Dashboard**: Detailed statistics for each link
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Health Check**: Built-in endpoint for monitoring

##  Tech Stack

- **Backend**: Node.js + Express
- **Database**: PostgreSQL (Neon or any Postgres provider)
- **Frontend**: Vanilla JavaScript + CSS
- **Hosting**: Vercel/Render/Railway compatible

##  Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **PostgreSQL Database** - You can use:
  - [Neon](https://neon.tech/) (Free tier available)
  - [Supabase](https://supabase.com/) (Free tier available)
  - [ElephantSQL](https://www.elephantsql.com/) (Free tier available)
  - Local PostgreSQL installation

##  Installation & Setup

### Step 1: Clone or Create Project

Create a new folder for your project:

```bash
mkdir tinylink
cd tinylink
```

### Step 2: Create Project Structure

Create the following folder structure:

```
tinylink/
├── src/
│   ├── server.js
│   ├── db.js
│   └── routes.js
├── public/
│   ├── styles.css
│   ├── dashboard.js
│   └── stats.js
├── views/
│   ├── dashboard.html
│   └── stats.html
├── package.json
├── .env
├── .env.example
├── .gitignore
└── README.md
```

### Step 3: Copy Files

Copy all the code from the artifacts provided into their respective files according to the structure above.

### Step 4: Install Dependencies

Open your terminal in VS Code (Terminal → New Terminal) and run:

```bash
npm install
```

This will install:
- `express` - Web framework
- `pg` - PostgreSQL client
- `dotenv` - Environment variable management
- `valid-url` - URL validation
- `nodemon` (dev dependency) - Auto-restart server on changes

### Step 5: Setup Database

1. **Create a PostgreSQL database** (recommended: use [Neon](https://neon.tech/) for free hosting)

2. **Get your database connection string**. It should look like:
   ```
   postgresql://username:password@host:5432/database
   ```

3. **Create a `.env` file** in the root directory:
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env`** and add your database URL:
   ```env
   DATABASE_URL=postgresql://your-username:your-password@your-host:5432/your-database
   BASE_URL=http://localhost:3000
   PORT=3000
   ```

### Step 6: Run the Application

**For Development (with auto-restart):**
```bash
npm run dev
```

**For Production:**
```bash
npm start
```

The server will start on `http://localhost:3000`

### Step 7: Verify Installation

1. Open your browser and visit: `http://localhost:3000`
2. Check health endpoint: `http://localhost:3000/healthz`
3. Create your first short link!

## 📁 Project Structure Explained

```
tinylink/
├── src/
│   ├── server.js       # Main Express server setup
│   ├── db.js          # Database connection and initialization
│   └── routes.js      # API route handlers
├── public/
│   ├── styles.css     # All CSS styling
│   ├── dashboard.js   # Dashboard page logic
│   └── stats.js       # Stats page logic
├── views/
│   ├── dashboard.html # Main dashboard page
│   └── stats.html     # Individual link stats page
└── package.json       # Project dependencies
```

## 🔌 API Endpoints

### Create Link
```http
POST /api/links
Content-Type: application/json

{
  "target_url": "https://example.com",
  "code": "abc123"  // optional
}
```

**Responses:**
- `201` - Link created successfully
- `400` - Invalid URL or code format
- `409` - Code already exists

### Get All Links
```http
GET /api/links
```

**Response:** Array of all links

### Get Link Stats
```http
GET /api/links/:code
```

**Responses:**
- `200` - Link details
- `404` - Link not found

### Delete Link
```http
DELETE /api/links/:code
```

**Responses:**
- `200` - Link deleted
- `404` - Link not found

### Health Check
```http
GET /healthz
```

**Response:**
```json
{
  "ok": true,
  "version": "1.0",
  "uptime": 3600,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🌐 Routes

| Path | Description |
|------|-------------|
| `/` | Dashboard - View and manage all links |
| `/code/:code` | Stats page for specific link |
| `/:code` | Redirect to target URL (302) |
| `/healthz` | Health check endpoint |

## 🧪 Testing

The application follows all required conventions for automated testing:

### URL Conventions ✅
- Dashboard: `/`
- Stats page: `/code/:code`
- Redirect: `/:code` (302 or 404)
- Health check: `/healthz`

### API Conventions ✅
- All endpoints follow spec exactly
- Proper HTTP status codes (200, 201, 404, 409)
- Code format: `[A-Za-z0-9]{6,8}`

### Test Checklist
- [x] `/healthz` returns 200
- [x] Creating link works
- [x] Duplicate codes return 409
- [x] Redirect works and increments clicks
- [x] Deletion stops redirect (404)
- [x] UI meets expectations

## 🚀 Deployment

### Deploy to Vercel

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Create `vercel.json` in root:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "src/server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "src/server.js"
       }
     ]
   }
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Add environment variables in Vercel dashboard

### Deploy to Render

1. Create `render.yaml`:
   ```yaml
   services:
     - type: web
       name: tinylink
       env: node
       buildCommand: npm install
       startCommand: npm start
   ```

2. Connect your GitHub repo to Render
3. Add environment variables in Render dashboard

### Deploy to Railway

1. Install Railway CLI:
   ```bash
   npm i -g @railway/cli
   ```

2. Deploy:
   ```bash
   railway login
   railway init
   railway up
   ```

3. Add environment variables:
   ```bash
   railway variables set DATABASE_URL="your-db-url"
   railway variables set BASE_URL="your-app-url"
   ```

## 🐛 Troubleshooting

### Database Connection Issues

**Error: "Connection refused"**
- Check your `DATABASE_URL` in `.env`
- Ensure your database is accessible
- For Neon, verify SSL settings

**Error: "Table doesn't exist"**
- The table is created automatically on first run
- Check server logs for initialization errors

### Port Already in Use

**Error: "EADDRINUSE"**
```bash
# Kill process on port 3000 (Mac/Linux)
lsof -ti:3000 | xargs kill -9

# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Module Not Found

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📝 Development Tips

### VS Code Extensions (Recommended)
- ESLint
- Prettier
- REST Client (for testing APIs)
- PostgreSQL (for database management)

### Useful Commands

```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Check for outdated packages
npm outdated

# Update packages
npm update
```

