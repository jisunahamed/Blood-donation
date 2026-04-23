# 🩸 LifeFlow — Blood Donation Platform

A full-stack blood donation web application built with **Node.js/Express**, **Supabase**, and **Vanilla JavaScript**.

---

## Features

- **User Registration & Login** — Supabase Auth with email/password
- **Donor Search** — Filter by blood group and location
- **Contact Flow** — Copy donor contact, then confirm donation
- **Dashboard** — Donation history, network contacts, activity feed
- **Admin Panel** — 7-tab admin with users, donations, interactions, activity, locations management
- **Auto-Availability** — Donors become unavailable after donation, auto-reset after 5 months

---

## Tech Stack

| Layer    | Technology                      |
| -------- | ------------------------------- |
| Backend  | Node.js + Express.js            |
| Database | Supabase (PostgreSQL)           |
| Auth     | Supabase Auth                   |
| Frontend | Vanilla HTML + CSS + JavaScript |
| Styling  | Custom CSS (medical theme)      |

---

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to finish provisioning

### 2. Run Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Paste the contents of `supabase/schema.sql` and click **Run**
3. Paste the contents of `supabase/seed.sql` and click **Run**

### 3. Get API Keys

1. Go to **Project Settings → API**
2. Copy:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon / public key** (safe for frontend)
   - **service_role key** (server only — keep secret!)

### 4. Configure Server Environment

```bash
cd server
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3000
NODE_ENV=development
CORS_ORIGINS=http://127.0.0.1:5500,http://localhost:5500
```

### 5. Configure Frontend

Edit `client/js/supabase-client.js` and set:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

### 6. Install & Run Server

```bash
cd server
npm install
node index.js
```

Server starts at `http://localhost:3000`.

### 7. Open Frontend

Open `client/index.html` with **VS Code Live Server** (port 5500) or any static file server.

---

## Creating the Admin User

1. Register through the app with:
   - **Email**: `admin@blooddonation.com`
   - **Password**: `Admin@1234`
2. In Supabase SQL Editor, run:
   ```sql
   UPDATE profiles SET is_admin = true
   WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@blooddonation.com');
   ```
3. Log out and log back in to get admin access.

---

## Project Structure

```
├── supabase/
│   ├── schema.sql          # Tables, indexes, triggers, RLS
│   └── seed.sql            # Sample locations + user instructions
├── server/
│   ├── package.json        # Dependencies
│   ├── .env.example        # Environment template
│   ├── index.js            # Express entry point
│   ├── lib/
│   │   └── supabase.js     # Admin client (service_role)
│   ├── middleware/
│   │   └── auth.js         # JWT verify + admin guard
│   └── routes/
│       ├── auth.js         # Register, Login, Logout
│       ├── users.js        # Profile CRUD + Dashboard
│       ├── donors.js       # Donor search
│       ├── donations.js    # Confirm donation
│       ├── interactions.js # Contact copy logging
│       └── admin.js        # Full admin API
├── client/
│   ├── index.html          # App shell
│   ├── css/
│   │   └── main.css        # Complete design system
│   └── js/
│       ├── supabase-client.js  # Anon client init
│       ├── api.js              # Fetch wrapper + helpers
│       ├── auth.js             # Login/Register pages
│       ├── dashboard.js        # Dashboard page
│       ├── donors.js           # Donor search page
│       ├── profile.js          # Profile edit page
│       ├── admin.js            # Admin panel (7 tabs)
│       └── router.js           # Hash router + landing
└── README.md
```

---

## API Endpoints

| Method | Endpoint                        | Auth     | Description             |
| ------ | ------------------------------- | -------- | ----------------------- |
| POST   | `/api/auth/register`            | Public   | Register new user       |
| POST   | `/api/auth/login`               | Public   | Login                   |
| POST   | `/api/auth/logout`              | Public   | Logout                  |
| GET    | `/api/locations`                | Public   | List active locations   |
| GET    | `/api/users/me`                 | User     | Get own profile         |
| PUT    | `/api/users/me`                 | User     | Update own profile      |
| GET    | `/api/users/me/dashboard`       | User     | Dashboard data          |
| GET    | `/api/donors/search`            | User     | Search available donors |
| POST   | `/api/interactions/copy`        | User     | Copy donor contact      |
| POST   | `/api/donations/confirm`        | User     | Confirm a donation      |
| GET    | `/api/admin/stats`              | Admin    | Platform statistics     |
| GET    | `/api/admin/users`              | Admin    | Paginated user list     |
| GET    | `/api/admin/users/:id`          | Admin    | User detail + activity  |
| PUT    | `/api/admin/users/:id/make-admin` | Admin | Toggle admin status     |
| DELETE | `/api/admin/users/:id`          | Admin    | Soft delete user        |
| GET    | `/api/admin/donations`          | Admin    | Paginated donations     |
| GET    | `/api/admin/interactions`       | Admin    | All interactions        |
| GET    | `/api/admin/activity`           | Admin    | Full activity log       |
| GET    | `/api/admin/locations`          | Admin    | All locations           |
| POST   | `/api/admin/locations`          | Admin    | Create location         |
| PUT    | `/api/admin/locations/:id`      | Admin    | Update location         |
| DELETE | `/api/admin/locations/:id`      | Admin    | Deactivate location     |

---

## License

MIT — Built with ❤️ to save lives.
