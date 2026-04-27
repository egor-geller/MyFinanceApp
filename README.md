# FinanceApp

A personal savings goal tracker with bilingual (Hebrew/English) support, real-time updates, and visual progress metaphors.

---

## Features

- **Savings goals** — create goals with target amounts, deadlines, and currencies
- **Visual jar metaphor** — each goal card shows a mason jar filling up with liquid animation (Framer Motion)
- **Multi-language** — full Hebrew (RTL) and English support via i18next
- **Privacy mode** — blurs all currency amounts for public viewing
- **Goal detail analytics** — weekly/monthly required savings, what-if simulator, cost of delay, saving paths, streak tracking
- **Entry history & audit log** — unified history popup per goal
- **Archive** — soft-delete goals and restore them anytime
- **Export to Excel** — localized column headers based on selected language
- **CSV import** — upload bank transaction exports to identify saving opportunities
- **Budget categories** — monthly spending categories for expense recategorization suggestions
- **Real-time updates** — Socket.IO pushes goal refresh across tabs
- **Email reminders** — weekly check-in and monthly progress report via Nodemailer
- **Dark mode** — system-aware with manual toggle

---

## Tech Stack

### Client
| Package | Purpose |
|---|---|
| React + Vite | UI framework and build tool |
| Tailwind CSS | Styling |
| Framer Motion | Animations (jar liquid fill, progress bars) |
| React Router | Client-side routing |
| i18next / react-i18next | Hebrew + English translations |
| Recharts | Progress charts |
| react-calendar-heatmap | Savings activity heatmap |
| Axios | HTTP client |
| Socket.IO client | Real-time goal refresh |

### Server
| Package | Purpose |
|---|---|
| Express | HTTP server |
| PostgreSQL + pg | Database |
| JWT + bcrypt | Authentication |
| Socket.IO | Real-time events |
| ExcelJS | Excel export |
| csv-parse + multer | CSV bank import |
| Nodemailer | Email reminders |
| node-cron | Scheduled jobs |
| express-validator | Input validation |

---

## Project Structure

```
FinanceApp/
├── client/                  # React frontend
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── pages/           # Route-level pages
│       ├── context/         # Auth, Theme, Privacy contexts
│       ├── hooks/           # Custom hooks (useSocket)
│       ├── i18n/            # Translation files (en.ts, he.ts)
│       ├── api/             # Axios client
│       └── types/           # TypeScript interfaces
└── server/                  # Express backend
    └── src/
        ├── routes/          # goals, auth, entries, export, import, profile, audit, withdrawals
        ├── middleware/       # JWT auth guard
        ├── calculations/    # Analysis, simulator, suggestions, feasibility
        ├── services/        # CSV parser, mailer, currency rates
        ├── jobs/            # Weekly reminder, monthly report cron jobs
        └── db/              # PostgreSQL pool + schema.sql
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Docker (for PostgreSQL)

### 1. Start the database

```bash
docker-compose up -d
```

This starts PostgreSQL on port `5432` and runs `schema.sql` automatically.

### 2. Configure the server

Create `server/.env`:

```env
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/financeapp
JWT_SECRET=your_secret_here
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=yourpassword
FROM_EMAIL=your@email.com
```

### 3. Install dependencies and run

```bash
# Server
cd server
npm install
npm run dev

# Client (new terminal)
cd client
npm install
npm run dev
```

Client runs on `http://localhost:5173`, server on `http://localhost:3001`.

---

## Key Pages

| Route | Description |
|---|---|
| `/` | Dashboard — all active goals as jar cards |
| `/goals/new` | Create a new savings goal |
| `/goals/:id` | Goal detail — analytics, entry form, simulators |
| `/archive` | Archived goals with restore option |
| `/profile` | Financial profile, budget categories, CSV import, language |

---

## Language & RTL

Switch between English and Hebrew from the Profile page. Hebrew activates full RTL layout. The selected language is persisted in `localStorage` and applied to Excel exports.
