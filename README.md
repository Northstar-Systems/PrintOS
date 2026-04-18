# printOS

**Real-time 3D printing dashboard for Bambu Lab P1S**

printOS is a self-hosted, mobile-first dashboard that gives you a single-screen view of your 3D printing operation — live printer telemetry, print history, cost tracking, and savings analysis. Built by Northstar Systems LLC.

## What It Does

- **Live Printer Monitoring** — Real-time nozzle, bed, and chamber temperatures streamed from the P1S via MQTT. Progress ring with layer count and ETA during active prints.
- **Print Job Tracking** — Automatically detects print start/end from MQTT state transitions. Logs every completed and failed print with layer counts and timestamps.
- **KPI Dashboard** — Total prints, success rate, print hours, and failure count at a glance. Historical temperature charts with 30m / 1h / 6h / 24h / 7d ranges.
- **Cost Analysis** — Per-print cost breakdown (filament + electricity + depreciation). Compares your print cost against retail prices on Etsy and Amazon to calculate savings.
- **Financial Overview** — P&L summary, cost composition charts, savings leaderboard, and expense tracking. All financial data sourced from ERPNext.
- **Mobile-First PWA** — Dark theme, bottom tab navigation, installable on iOS/Android home screen for a native app experience.

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16 + React 19 + Tailwind CSS | Server-rendered PWA with glassmorphism UI |
| **Charts** | Recharts | Temperature line charts, cost breakdowns |
| **Icons** | Lucide React | Consistent icon system across all views |
| **Database** | TimescaleDB (PostgreSQL 17) | Time-series telemetry storage with auto-compression |
| **MQTT Broker** | Eclipse Mosquitto | Bridges P1S local MQTT to internal consumers |
| **Telemetry Ingestion** | Node-RED | Subscribes to MQTT, parses payloads, writes to TimescaleDB |
| **ERP / Accounting** | ERPNext (Frappe) | Source of truth for expenses, inventory, BOMs, cost centers |
| **Automation** | n8n | ETL workflows: ERPNext sync, price scraping, cost calculations |
| **Reverse Proxy** | Nginx Proxy Manager | SSL termination, DuckDNS wildcard certs |
| **Hosting** | Unraid (Dell R630) | All services run as Docker containers on-prem |

## Architecture

```
Bambu P1S ──MQTTS:8883──► Mosquitto ──MQTT:1883──► Node-RED
                           (bridge)                    │
                                                       ▼
                                                 TimescaleDB
                                                   :65432
                                                       │
                                    ┌──────────────────┤
                                    ▼                  ▼
                                 Next.js           ERPNext
                                  :3002             :8080
                                    │                  │
                              Nginx Proxy Manager (:80/:443)
                                        │
                                   DuckDNS SSL
                                        │
                                   Your Phone
```

## Data Flow

1. **Telemetry (real-time):** P1S → MQTTS → Mosquitto bridge → Node-RED parses + accumulates state → writes to TimescaleDB every 10s (change-detected, only when values change)
2. **Pushall (every 60s):** Node-RED requests full status dump from P1S to capture fields like `gcode_state`, `subtask_name`, `total_layer_num` that aren't in every partial push
3. **Dashboard (SSE):** Next.js SSE endpoint polls TimescaleDB every 5s → streams to browser. Initial page load fetches latest row immediately for instant display.
4. **Cost data (daily):** n8n syncs expenses, filament inventory, and product BOMs from ERPNext into TimescaleDB cache tables
5. **Retail prices (weekly):** n8n queries Etsy API + Amazon scraper → updates Item custom fields in ERPNext → writes history to TimescaleDB

## Pages

| Tab | Route | What's On It |
|-----|-------|-------------|
| Home | `/home` | Printer status card, KPI grid (prints/success/hours/failed), temperature chart with time range selector, recent prints list |
| Print | `/print` | Live printer panel with progress ring + temp chart when printing, filter chips (All/Success/Failed), print history list |
| Money | `/money` | Period P&L summary, cost/savings KPIs, cost breakdown, savings leaderboard, expense breakdown (populated when ERPNext data flows) |
| Settings | `/settings` | Printer config, cost rates (electricity/depreciation/labor), integration status (MQTT/DB/ERPNext), about info |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HOSTNAME` | `localhost` | Set to `0.0.0.0` in Docker for container networking |
| `DB_HOST` | `192.168.1.33` | TimescaleDB host |
| `DB_PORT` | `65432` | TimescaleDB port |
| `DB_NAME` | `printos` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `postgres` | Database password |

## Deployment

printOS runs as a Docker container on Unraid:

```bash
docker build -t printos .
docker run -d --name printos \
  --restart unless-stopped \
  -p 3002:3000 \
  -e HOSTNAME=0.0.0.0 \
  -e DB_HOST=172.17.0.1 \
  -e DB_PORT=65432 \
  -e DB_NAME=printos \
  -e DB_USER=postgres \
  -e DB_PASSWORD=postgres \
  printos
```

Accessible at `https://printos.northstarsystems.duckdns.org` via Nginx Proxy Manager with Let's Encrypt wildcard SSL. Basic auth enforced at the proxy layer.

## Local Development

```bash
cd app
npm install
npm run dev
```

Opens at `http://localhost:3000`. Requires TimescaleDB accessible at the configured host/port.

## Roadmap

- [ ] Live camera feed (RTSPS → HLS transcoding)
- [ ] Push notifications (print complete/failed via Pushover/Telegram)
- [ ] n8n cost calculator workflow (auto-cost every completed print)
- [ ] ERPNext → TimescaleDB sync for expenses and inventory
- [ ] Etsy/Amazon price scraping automation
- [ ] Multi-printer support (data model already supports `printer_id`)
- [ ] Filament consumption tracking via FTPS .3mf metadata scraping
