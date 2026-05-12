# Blockage Survey – Managerial Effectiveness Self-Review Tool

A complete responsive web application for psychometric assessment, built with HTML, CSS, Vanilla JavaScript, and Supabase. Designed for academic research and managerial self-review.

## Features

- **110 Managerial Effectiveness Questions** spread across 11 dimensions.
- **Auto-save & Session Recovery:** Uses `localStorage` to save progress every 10 seconds and recover sessions after accidental reloads.
- **Duplicate Prevention:** Validates Employee IDs against the database to prevent multiple submissions.
- **Quality Checks:** Detects speed-running (completing too fast) and straight-lining (answering identical options repeatedly) and flags them in the admin dashboard.
- **Personalized Results:** Automatically calculates strengths, blockages, and provides unique improvement recommendations.
- **PDF Report Generation:** Allows users to download their personalized results instantly.
- **Admin Dashboard:** Secure login to view all respondents, analyze score distributions, view organizational blockages, and export data to CSV.

## Tech Stack

- **Frontend:** HTML5, Vanilla CSS (with CSS Variables for Dark/Light Mode), Vanilla JavaScript (ES6 Modules).
- **Backend:** Supabase (PostgreSQL, GoTrue Auth).
- **Libraries (CDN):** 
  - `@supabase/supabase-js` (Database & Auth)
  - `chart.js` (Analytics visualization)
  - `html2pdf.js` (PDF Generation)

## Setup Instructions

### 1. Supabase Setup

1. Create a new project on [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Open the `supabase/schema.sql` file from this repository, copy its contents, and run it in the SQL Editor. This will create all necessary tables and configure Row Level Security (RLS).
4. Go to **Authentication > Users** and manually create your first Admin user (provide an email and password). This will be used to log into the Admin Dashboard.

### 2. Configure the Application

1. Open `scripts/config.js`.
2. Replace `YOUR_SUPABASE_URL_HERE` and `YOUR_SUPABASE_ANON_KEY_HERE` with your actual Supabase project credentials (found in Project Settings > API).

### 3. Running Locally

Since this is a vanilla HTML/JS project using ES6 modules, it needs to be served via a local web server (opening the file directly in the browser via `file://` will cause CORS/module loading issues).

You can use any simple HTTP server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js (http-server)
npx http-server .
```
Navigate to `http://localhost:8000`.

### 4. GitHub Pages Deployment

1. Initialize a git repository in this folder.
2. Commit all files.
3. Push to a new GitHub repository.
4. In the GitHub repository settings, go to **Pages**.
5. Set the source to deploy from a branch (e.g., `main`), root directory `/`.
6. Save. Your application will be live at `https://<your-username>.github.io/<repo-name>/`.

> **Note on Security:** Because this is a static site hosted on GitHub Pages, the Supabase Anon Key is visible in the source code. This is normal and expected for Supabase architecture. Security is strictly enforced via the **Row Level Security (RLS)** policies defined in `schema.sql`, which prevent unauthorized users from reading or modifying data they do not own.

## Project Structure

```
/
├── index.html            # Main Survey Application
├── admin.html            # Admin Dashboard
├── styles/               # CSS Files
│   ├── main.css          # Global styles, variables, dark mode
│   ├── survey.css        # Survey-specific UI
│   └── admin.css         # Admin dashboard layout
├── scripts/              # JavaScript Modules
│   ├── config.js         # Configuration variables
│   ├── supabase-client.js# Supabase API wrappers
│   ├── questions.js      # 110 Questions and dimension mappings
│   ├── scoring.js        # Calculation logic, quality checks
│   ├── survey.js         # Main UI controller for survey
│   ├── admin.js          # Admin dashboard controller
│   └── export.js         # CSV Export logic
├── supabase/             
│   └── schema.sql        # Database definitions
└── README.md             # Documentation
```
# blocksurvey
