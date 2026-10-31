# TravelSmart – Personalized Travel Planner

TravelSmart is a full-stack travel-planning application that generates personalized, day-by-day itineraries for destinations across India. It uses a traveler's destination, trip duration, group details, budget, preferred travel vibe, crowd preference, and interests to recommend suitable places, arrange them into a practical route, and estimate trip expenses.

The application is designed to make trip planning more organized by combining preference-based place matching, rule-based filtering, optimization algorithms, and a structured travel-planning interface.

## Features

- **Personalized itinerary generation** based on destination state, origin city, trip duration, group type, budget, vibe, crowd preference, and interests.
- **Traveler-aware filtering** for requirements such as children, senior citizens, solo female travel, wheelchair accessibility, nearby medical facilities, internet connectivity, and DSLR permissions.
- **Preference-based place recommendations** using a hybrid matching score that combines cosine similarity, weighted preferences, and bonus/penalty adjustments.
- **Time-aware place selection** using a dynamic-programming (0/1 knapsack-style) algorithm to select places within the available sightseeing time.
- **Route optimization** using geographic distance and a nearest-neighbor approach to arrange selected places into a visit sequence.
- **Day-by-day itinerary** with suggested daily themes, place details, activities, and nearby travel information when available.
- **Estimated trip budget** covering accommodation, meals, entry fees, local transport, and estimated travel to the destination.
- **PDF export** of a generated itinerary.
- **Saved trips** through the browser's local storage, with the ability to revisit or delete saved itineraries.
- **About page** explaining the application and its planning workflow.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, Vite, JavaScript, Tailwind CSS 4, Axios, Lucide React |
| Backend | Node.js, Express 5, JavaScript (CommonJS) |
| Database | MySQL 8, `mysql2` |
| Frontend utilities | jsPDF, jsPDF-AutoTable |
| Geocoding | OpenStreetMap Nominatim |
| Data preparation scripts | Python, Pandas, MySQL Connector/Python, Requests, Groq SDK |

## How the application works

1. The traveler enters an origin city, destination state, trip duration, group information, budget, and travel preferences.
2. The frontend sends the selected preferences to the backend through `POST /api/generate-plan`.
3. The backend retrieves places for the selected state from MySQL and loads their associated activities.
4. Rule-based constraints remove places that do not satisfy applicable traveler requirements.
5. The matching service scores the remaining places against the traveler's preferences. The score combines cosine similarity with weighted preference matching and additional bonuses or penalties.
6. The knapsack-based selection service chooses suitable places within the available sightseeing-time capacity.
7. The route service orders selected places geographically using a nearest-neighbor strategy and distributes them across the requested days.
8. The cost services calculate an estimated budget. If an origin city and usable coordinates are available, the application also estimates the journey to the destination.
9. The frontend displays the itinerary and allows the traveler to save it locally or export it as a PDF.

> **Cost and route estimates:** These are planning estimates generated from the application's stored data and calculation rules. They are not live ticket, hotel, cab, or transport quotations. Verify prices, opening hours, access conditions, and travel arrangements before departure.

## Project Structure

```text
Travel_Project/
├── backend/
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── app.js
│       ├── server.js
│       ├── config/
│       │   └── db.js
│       ├── controllers/
│       │   └── itineraryController.js
│       ├── data/
│       │   └── majorCities.js
│       ├── routes/
│       │   └── itineraryRoutes.js
│       └── services/
│           ├── constraintFilterService.js
│           ├── distanceUtils.js
│           ├── knapsackService.js
│           ├── matchingService.js
│           ├── routeService.js
│           └── travelCostService.js
├── database/
│   └── travel_planner_data.sql
├── data/
│   └── Top Indian Places to Visit.csv
├── frontend/
│   ├── package.json
│   ├── index.html
│   └── src/
│       ├── App.jsx
│       ├── AboutPage.jsx
│       ├── CityAutocomplete.jsx
│       ├── ItineraryResult.jsx
│       ├── pdfUtils.js
│       └── ...
└── scripts/
    ├── config.py
    ├── enrich.py
    ├── geocode_places.py
    └── migrate.py
```

## Prerequisites

Install the following before running the project:

- **Node.js 22 LTS** (and npm)
- **MySQL 8.0** or a compatible MySQL server
- **Python 3.10+** only if you want to run the optional data-preparation scripts
- Git (optional, for cloning the repository)

## Setup and Installation

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd Travel_Project
```

If you have already downloaded the project, open a terminal in the `Travel_Project` root folder instead.

### 2. Create the MySQL database

Start MySQL and create the database:

```sql
CREATE DATABASE travel_planner;
```

Import the supplied schema and data dump from the project root:

```bash
mysql -u root -p travel_planner < database/travel_planner_data.sql
```

Alternatively, open `database/travel_planner_data.sql` in MySQL Workbench and execute it after selecting the `travel_planner` database.

The dump contains the tables and seed data required by the application, including `states`, `places`, the place relationship tables, and `constraint_rules`.

### 3. Configure the backend

Open a terminal in the backend folder:

```bash
cd backend
```

Create a local `.env` file by copying the example:

**Windows PowerShell**

```powershell
Copy-Item .env.example .env
```

**macOS / Linux**

```bash
cp .env.example .env
```

Update `.env` with your local MySQL credentials:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=travel_planner
```

Install dependencies and start the API:

```bash
npm install
node src/server.js
```

The backend should start on `http://localhost:5000`.

You can check that the API process is running by opening:

```text
http://localhost:5000/
```

Expected response:

```json
{"message":"Travel Planner API is running"}
```

### 4. Configure and start the frontend

Open a **second terminal** from the project root:

```bash
cd frontend
npm install
npm run dev
```

Vite will print the local development URL in the terminal (usually `http://localhost:5173`). Open that URL in your browser.

The current frontend source sends itinerary requests to:

```text
http://localhost:5000/api/generate-plan
```

Therefore, run the backend on port `5000` while using the frontend locally. If you deploy the backend to another host, update the `API_URL` constant in `frontend/src/App.jsx` to the deployed API URL and configure the backend's CORS policy for the deployed frontend origin.

## Running the Application

1. Make sure the MySQL server is running.
2. Make sure the `travel_planner` database has been imported.
3. Start the backend in one terminal using `node src/server.js` from `backend/`.
4. Start the frontend in another terminal using `npm run dev` from `frontend/`.
5. Open the frontend URL printed by Vite.
6. Select **Plan a Trip**, enter the trip details and preferences, and submit the form.
7. Review the generated day-wise itinerary, save it under **My Trips**, or export it as a PDF.

## API Reference

### Generate an itinerary

**Endpoint**

```http
POST /api/generate-plan
```

**Base URL (local)**

```text
http://localhost:5000
```

**Example request body**

```json
{
  "origin_city": "Mumbai",
  "destination_state": "Goa",
  "days": 3,
  "group_type": "friends",
  "group_composition": [],
  "budget_level": "mid",
  "vibe": "chill",
  "crowd_preference": "medium",
  "prefers_offbeat": "No preference",
  "wants_adventure_sports": false,
  "wants_water_activities": true,
  "wants_trekking": false,
  "wants_nightlife": false,
  "wants_shopping": false,
  "wants_photography": true,
  "religious_interest": false,
  "solo_female": false,
  "wheelchair_needed": false,
  "medical_important": false,
  "carrying_dslr": false,
  "internet_important": false
}
```

The backend returns a JSON response containing the destination, trip duration, estimated cost breakdown, travel details when calculable, day-wise itinerary, selected-place count, and any notes about limited matching results.

### Other backend endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/` | API health/status message |
| `GET` | `/test-db` | Checks database connectivity by counting places |
| `GET` | `/test-matching` | Runs a sample place-matching operation |
| `GET` | `/test-knapsack` | Runs a sample place-selection operation |
| `GET` | `/test-route` | Runs a sample matching, selection, route, and cost calculation |

## Recommendation and Optimization Logic

The backend separates recommendation, selection, and route ordering into different services:

- **Constraint filtering (`constraintFilterService.js`):** applies database-driven exclusion rules based on traveler and group requirements.
- **Place matching (`matchingService.js`):** calculates a hybrid score using cosine similarity, weighted preference matching, and bonus/penalty adjustments. Results are ranked by match score.
- **Place selection (`knapsackService.js`):** uses dynamic programming to select places within the available sightseeing-time capacity. The current implementation uses approximately eight sightseeing hours per day.
- **Route planning (`routeService.js`):** uses geographic distances and a nearest-neighbor approach to determine the visiting sequence, then distributes the places across days.
- **Distance and travel cost (`distanceUtils.js`, `travelCostService.js`):** calculate geographic distances and estimate travel cost. Coordinates for several major Indian cities are predefined; OpenStreetMap Nominatim is used as a fallback for city geocoding.

The match score is used for recommendation and selection; it is not used as the visiting order. Route ordering is handled separately using geographic distance.

## Optional: Data Preparation Scripts

The `scripts/` directory contains Python utilities for enriching the source travel dataset, migrating enriched data into MySQL, and filling missing place coordinates. These scripts are **not required** to run the application if you use the supplied SQL database dump.

Install the Python packages when you need these utilities:

```bash
python -m venv .venv
```

Activate the environment:

**Windows PowerShell**

```powershell
.\.venv\Scripts\Activate.ps1
```

**macOS / Linux**

```bash
source .venv/bin/activate
```

Install the dependencies:

```bash
pip install pandas mysql-connector-python requests python-dotenv groq
```

The enrichment script uses the Groq SDK and requires a Groq API key. The scripts also use MySQL credentials. Configure the values expected by `scripts/config.py` in a local environment file before running them:

```env
GROQ_API_KEY=your_groq_api_key
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=travel_planner
```

Run the scripts from the `scripts/` directory so their relative data paths resolve as expected. Review `scripts/enrich.py` before running it: the target state is currently set in the `STATE` variable and may need to be changed for your dataset-processing task.

## Data Sources and External Services

- **Travel dataset:** the project includes a CSV dataset of Indian tourist places and a MySQL dump containing the application's structured travel data.
- **OpenStreetMap Nominatim:** used for fallback city geocoding when a city is not found in the backend's predefined major-city coordinate list. See the [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/) and respect its request limits.
- **Groq API:** used by the optional Python enrichment script to generate structured attributes for places. It is not called by the normal itinerary-generation API flow shown in the backend source.

## Troubleshooting

| Problem | Things to check |
|---|---|
| Backend cannot connect to MySQL | Confirm MySQL is running, database `travel_planner` exists, and the values in `backend/.env` are correct. |
| `Unknown database 'travel_planner'` | Create the database and import `database/travel_planner_data.sql`. |
| Frontend reports that the server is unavailable | Start the backend on port `5000` and check `http://localhost:5000/`. |
| Itinerary request returns no places | Confirm the selected state exists in the database and try relaxing optional preferences. |
| Geocoding does not return coordinates | Check internet access and the Nominatim response; some place names may not resolve. |
| Frontend dependencies fail to install | Use a supported Node.js version, remove the relevant `node_modules` folder if necessary, and run `npm install` again. |

## Security Notes

- Never commit `.env` files, API keys, database passwords, access tokens, or private credentials.
- Keep `backend/.env` and any scripts environment file local. Use `.env.example` only for placeholder values.
- Before making this repository public, inspect the current files **and the complete Git history** for credentials. Removing a secret from the latest version does not remove it from earlier commits. If a credential has been pushed, rotate or revoke it.
- Do not commit `node_modules/` or generated build output such as `frontend/dist/`; these can be recreated using the installation and build commands.
- Restrict CORS to trusted frontend origins before deploying the backend publicly.

## Current Limitations

- The frontend currently uses a local backend URL (`http://localhost:5000/api/generate-plan`); deployment requires changing this configuration.
- Saved trips are stored in browser `localStorage`, so they are specific to the browser/device and are not synchronized to a user account or database.
- Estimated travel and trip costs are heuristic estimates and may differ from actual prices.
- The included dataset and database determine which destinations and places can be recommended.

## Contributing

Contributions and improvements are welcome:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature-name`.
3. Commit your changes with a clear message.
4. Push the branch and open a pull request.

## License

No license file was present in the supplied project archive. Unless a license is added to the repository, the project is not explicitly open-sourced for reuse. Add an appropriate `LICENSE` file if you intend to permit others to use, modify, or distribute the code.
