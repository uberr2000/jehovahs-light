/**
 * PM2 ecosystem for jehovahs-light.
 *
 * Server deploy path: /var/www/html/jehovahs-light.ink.net.tw/
 * PM2 process id: 14
 * App name: jehovahs-light
 *
 * PORT must come from the server .env (parsed here and sourced by
 * deploy/with-env.sh). Never add --port to package.json start.
 *
 * next.config.ts sets output: 'standalone', so the process is:
 *   bash deploy/with-env.sh node .next/standalone/server.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ENV_FILE = path.join(ROOT, '.env');

function loadDotEnv(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) {
    return env;
  }

  const text = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const eq = line.indexOf('=');
    if (eq === -1) {
      continue;
    }

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }

  return env;
}

const fileEnv = loadDotEnv(ENV_FILE);

module.exports = {
  apps: [
    {
      name: 'jehovahs-light',
      // Existing server process: pm2 id 14. Reload 14; do not start a second app.
      cwd: ROOT,
      script: path.join(ROOT, 'deploy', 'with-env.sh'),
      args: 'node .next/standalone/server.js',
      interpreter: 'bash',
      env: {
        NODE_ENV: 'production',
        ...fileEnv,
      },
    },
  ],
};
