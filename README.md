# MedKeep - Smart Medicine Reminder & Adherence System

MedKeep is a premium, full-stack medication management and adherence tracking platform. It features a modern glassmorphic React dashboard, a robust Django REST Framework backend, adherence analytics, browser push notifications, and a Doctor-Patient integration portal for synchronizing prescriptions.

## 🚀 Features

- **Patient Dashboard:** Clear visualization of today's schedule, taken status, and adherence rates.
- **Adherence Analytics:** Dynamic Chart.js visualizations showing medication adherence trends.
- **Doctor Portal:** Dedicated interface for doctors to manage patients, prescribe medications, and trigger direct notification synchronization.
- **Interactive Reminders:** Real-time push notifications and modal systems to log Taken/Missed/Pending statuses.
- **AI Medication Extraction:** (Extensible) API endpoint to parse raw medical texts into structured dosage rules.
- **Responsive Theme:** A responsive, light slate glassmorphic design system matching modern UI standards.

---

## 📁 Project Structure

```text
medicine-reminder-system/
├── backend/                  # Django REST Framework Backend
│   ├── config/               # Project-wide settings and URLs
│   ├── medicines/            # Main app containing models, views, and serializers
│   ├── db.sqlite3            # Local SQLite database (Git ignored)
│   ├── requirements.txt      # Python dependencies
│   └── venv/                 # Virtual environment (Git ignored)
├── frontend/                 # React (Vite) Frontend
│   ├── src/
│   │   ├── components/       # Reusable React components (Navbar, forms, lists)
│   │   ├── pages/            # Core views (Dashboard, LoginPage, DoctorPortal)
│   │   ├── services/         # Axios API connection
│   │   ├── index.css         # Global design system & theme style sheets
│   │   └── App.jsx           # Main React coordinator
│   ├── package.json          # Node dependencies and scripts
│   └── vite.config.js        # Vite configuration (includes API proxies)
└── .gitignore                # Project-wide Git ignore settings
```

---

## 🛠️ Setup & Installation

### Prerequisites
- **Python** (version 3.10 or higher)
- **Node.js** (version 18 or higher)
- **npm** (comes with Node.js)

### 1. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Activate the pre-configured virtual environment:
   - **Windows (PowerShell):**
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux:**
     ```bash
     source venv/bin/activate
     ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run migrations to initialize the database:
   ```bash
   python manage.py migrate
   ```
5. Start the backend development server:
   ```bash
   python manage.py runserver
   ```
   *The backend will run on `http://127.0.0.1:8000/`.*

### 2. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will run on `http://localhost:5173/` (or the next available port).*

---

## 🧪 Testing

To run the backend suite of unit tests:
```bash
cd backend
.\venv\Scripts\python.exe manage.py test medicines
```

---

## 📦 Preparing for GitHub

To publish this project to GitHub, initialize git in the root folder `medicine-reminder-system` and push:

```bash
# 1. Initialize git
git init

# 2. Add files (tracked files will obey the root .gitignore)
git add .

# 3. Create initial commit
git commit -m "Initial commit: MedKeep Medication Reminder and Adherence System"

# 4. Link your remote repository and push
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```
"# Medicine-scheduling" 
