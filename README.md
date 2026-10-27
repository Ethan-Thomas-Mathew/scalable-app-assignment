# CryptoX - Cryptocurrency Marketplace

A full-stack web app for browsing live cryptocurrency prices, building a cart, placing simulated orders, and tracking a portfolio. Built with Next.js, Express and SQLite.

**Live demo:** https://ethan-thomas-mathew.github.io/scalable-app-assignment/

The demo is the real front end running on GitHub Pages with a built-in mock of the API and sample market data. Everything you do is saved only in your browser. Sign in with `demo@cryptox.dev` / `demo1234`, or register a new account (please do not use a real password).

## Features

- **Authentication:** register and log in with JWT-based sessions and bcrypt-hashed passwords
- **Market overview:** top 100 coins in INR with search and price sorting, refreshed every 60 seconds
- **Interactive charts:** custom SVG 7-day price chart with a hover tooltip, built without a charting library
- **Cart and checkout:** add quantities, edit the cart, and pay by card, UPI or net banking (payments are simulated)
- **Portfolio:** holdings grouped by coin with average buy price, current value and sparklines
- **Partial selling:** sell part of a holding; the server works through your purchases in order
- **Profile management:** edit details with a simulated OTP step, or delete the account
- **Server-side API caching:** the Express proxy caches CoinGecko responses for 60 seconds and serves stale data if the upstream API fails
- **Responsive glassmorphism UI** with dark and light themes

## Tech stack

| Layer | Technology |
| --- | --- |
| Front end | Next.js 16 (App Router), React 19, Tailwind CSS, Axios, react-hot-toast |
| Back end | Node.js, Express 5, Sequelize ORM |
| Database | SQLite |
| Auth | JSON Web Tokens, bcryptjs |
| Data source | CoinGecko public API (through the server proxy) |

## Architecture

```
Browser (Next.js client)  --->  Express API  --->  SQLite (users, cart, transactions)
                                     |
                                     +--->  CoinGecko API (cached for 60 s)
```

### API overview

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/user/register` | No | Create an account |
| POST | `/api/user/login` | No | Log in and receive a JWT |
| GET, PUT, DELETE | `/api/user` | Yes | Read, update or delete the profile |
| GET | `/api/proxy/coins` | No | Cached market data for the top 100 coins |
| GET, POST, PUT, DELETE | `/api/cart` | Yes | View, add to, adjust or clear the cart |
| GET | `/api/crypto` | Yes | Transaction history |
| POST | `/api/crypto/buy` | Yes | Turn the cart into an order |
| POST | `/api/crypto/sell` | Yes | Sell part of a holding |
| PUT, DELETE | `/api/crypto/:id` | Yes | Edit a note or remove a transaction |

## Run it locally

You need Node.js 18 or newer.

**1. Start the server**

```bash
cd server
npm install
cp .env.example .env     # then set JWT_SECRET to a long random string
npm run dev
```

The API runs on http://localhost:5000 and creates the SQLite database file on first start.

**2. Start the client**

```bash
cd client
npm install
npm run dev
```

Open http://localhost:3000. The client calls the API at `http://localhost:5000/api` (set in `client/utils/api.js`).

## Rebuild the GitHub Pages demo

```bash
cd client
npm run build:demo
```

This exports a static site into the `docs/` folder. GitHub Pages serves it from the `main` branch, `/docs` folder. The mock API lives in `client/utils/demoAdapter.js` and is only used when `NEXT_PUBLIC_DEMO=true`.

## Project structure

```
client/          Next.js app (pages in client/app, API client in client/utils)
server/          Express API (routes, controllers, Sequelize models)
docs/            Built static demo for GitHub Pages
```

## Notes and possible improvements

- Payments and the profile OTP are simulated. No real money or email is involved.
- The 60-second cache is in memory, so a multi-server setup would need a shared cache such as Redis.
- Planned: JWT expiry and refresh, rate limiting, API URL from an environment variable, automated tests.
