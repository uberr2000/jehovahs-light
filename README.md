# Jehovah's Light | 耶和華的光 | 耶和华的光

A global beacon of faith - Light up the world with Jehovah's guiding light.

## Features

- 🌍 **3D Interactive Globe** - NASA Blue Marble satellite Earth with light points showing believers around the world
- 📍 **GPS Location Sharing** - Share your location to light up your position on the globe
- 🌐 **Multi-language Support** - 14 locales (cookie → Accept-Language → navigator → en). See [docs/i18n-viewport.md](docs/i18n-viewport.md).
- ✨ **Lighthouse Animation** - Beautiful entrance animation with scripture
- 💡 **Real-time Stats** - Total lights, today's lights, countries reached

## Tech Stack

- **Frontend**: Next.js 15, React 19, Three.js (React Three Fiber)
- **Backend**: Next.js API Routes
- **Database**: MySQL (Drizzle ORM + mysql2; no Prisma)
- **Deployment**: PM2, Nginx, Let's Encrypt SSL
- **DNS**: Cloudflare

## Live Demo

Visit: [https://lordlight.nelioxai.com](https://lordlight.nelioxai.com)

## Scripture

> "The LORD is my light and my salvation— whom shall I fear?"
> — Psalm 27:1

> "For with you is the fountain of life; in your light we see light."
> — Psalm 36:9

## Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev

# Apply MySQL migrations (reads DB_* from env; CREATE IF NOT EXISTS)
npm run db:migrate
```

## Environment Variables

See `.env.example`. **PORT** must be set in `.env` (Next.js / standalone
`server.js` read it). Never add `--port` to `package.json` `start`.
`DB_HOST` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` are used by Drizzle
(`drizzle.config.ts` and `src/lib/db`; pool host defaults to `localhost`).
Schema SQL: [docs/schema.sql](docs/schema.sql). Server deploy (including
`db:migrate` before PM2): [docs/deploy.md](docs/deploy.md).
Develop CI/CD: [docs/ci-cd.md](docs/ci-cd.md).

```
PORT=3000
DB_HOST=localhost
DB_USER=jehovahs_light
DB_PASSWORD=your_password
DB_NAME=jehovahs_light
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Globe texture

The globe map is NASA Blue Marble (2002), stored locally at
`public/globe/earth-blue-marble.jpg`. Credit NASA GSFC. Full source, license,
and attribution: [docs/globe-texture.md](docs/globe-texture.md).

## License

MIT
