/**
 * Parse `pm2 jlist` JSON (stdin) and print shell-safe assignments for
 * deploy/pm2-sync.sh.
 *
 * Env:
 *   DEPLOY_PATH   required — this app's cwd
 *   APP_NAME      default jehovahs-light
 *   OLD_APP_NAME  default jehovahs-light.ink.net.tw
 *
 * Sibling cwd prefixes must never be targeted:
 *   /var/www/html/ai.srdc.org.tw
 *   /var/www/html/member.rsh-care.com
 */
'use strict';

const FORBIDDEN_CWD_PREFIXES = [
  '/var/www/html/ai.srdc.org.tw',
  '/var/www/html/member.rsh-care.com',
];

function normPath(p) {
  return String(p || '').replace(/\/+$/, '');
}

function cwdOf(app) {
  const env = app.pm2_env || {};
  return env.pm_cwd || env.cwd || '';
}

function scriptBlob(app) {
  const env = app.pm2_env || {};
  const args = Array.isArray(env.args) ? env.args.join(' ') : env.args || '';
  return [
    env.pm_exec_path || '',
    env.script || '',
    args,
    env.exec_interpreter || '',
  ].join(' ');
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function isForbiddenCwd(cwd) {
  const n = normPath(cwd);
  return FORBIDDEN_CWD_PREFIXES.some((prefix) => {
    const p = normPath(prefix);
    return n === p || n.startsWith(`${p}/`);
  });
}

function scriptLooksStandalone(blob) {
  return /with-env\.sh|standalone\/server\.js/.test(blob);
}

function scriptLooksNextStart(blob) {
  return /next start|(?:^|[\s/])npm(?:\.cmd)?(?:\s|$).*\bstart\b|next\/dist\/bin\/next/.test(
    blob,
  );
}

function inspect(apps, opts) {
  const deployPath = normPath(opts.deployPath);
  const appName = opts.appName;
  const oldName = opts.oldName;

  const result = {
    error: '',
    hasApp: 0,
    appId: '',
    appCwd: '',
    appScript: '',
    appStatus: '',
    hasOldAtPath: 0,
    oldId: '',
    oldName: '',
    oldCwd: '',
    id14Name: '',
    id14Cwd: '',
    id14Script: '',
  };

  for (const app of apps) {
    const name = app.name || (app.pm2_env && app.pm2_env.name) || '';
    const cwd = cwdOf(app);
    const blob = scriptBlob(app);
    const id = app.pm_id;

    if (name === appName && isForbiddenCwd(cwd)) {
      result.error = `refused to touch sibling app: PM2 name ${appName} cwd=${cwd}`;
      return result;
    }

    if (name === appName) {
      result.hasApp = 1;
      result.appId = String(id);
      result.appCwd = cwd;
      result.appScript = blob;
      result.appStatus = (app.pm2_env && app.pm2_env.status) || '';
    }

    if (name === oldName && normPath(cwd) === deployPath) {
      result.hasOldAtPath = 1;
      result.oldId = String(id);
      result.oldName = name;
      result.oldCwd = cwd;
    }

    if (Number(id) === 14) {
      result.id14Name = name;
      result.id14Cwd = cwd;
      result.id14Script = blob;
      if (name !== appName && normPath(cwd) === deployPath) {
        result.hasOldAtPath = 1;
        result.oldId = '14';
        result.oldName = name;
        result.oldCwd = cwd;
      }
    }
  }

  return result;
}

function printShell(result) {
  const lines = [
    `ERROR=${shellQuote(result.error)}`,
    `HAS_APP=${result.hasApp}`,
    `APP_ID=${shellQuote(result.appId)}`,
    `APP_CWD=${shellQuote(result.appCwd)}`,
    `APP_SCRIPT=${shellQuote(result.appScript)}`,
    `APP_STATUS=${shellQuote(result.appStatus)}`,
    `HAS_OLD_AT_PATH=${result.hasOldAtPath}`,
    `OLD_ID=${shellQuote(result.oldId)}`,
    `OLD_NAME=${shellQuote(result.oldName)}`,
    `OLD_CWD=${shellQuote(result.oldCwd)}`,
    `ID14_NAME=${shellQuote(result.id14Name)}`,
    `ID14_CWD=${shellQuote(result.id14Cwd)}`,
    `ID14_SCRIPT=${shellQuote(result.id14Script)}`,
    `SCRIPT_STANDALONE=${scriptLooksStandalone(result.appScript) ? 1 : 0}`,
    `SCRIPT_NEXT_START=${scriptLooksNextStart(result.appScript) ? 1 : 0}`,
  ];
  process.stdout.write(`${lines.join('\n')}\n`);
}

function main() {
  const deployPath = process.env.DEPLOY_PATH || '';
  if (!deployPath) {
    console.error('error: DEPLOY_PATH is required');
    process.exit(1);
  }

  const raw = require('fs').readFileSync(0, 'utf8').trim() || '[]';
  let apps;
  try {
    apps = JSON.parse(raw);
  } catch (err) {
    console.error(`error: invalid pm2 jlist JSON: ${err.message}`);
    process.exit(1);
  }
  if (!Array.isArray(apps)) {
    console.error('error: pm2 jlist did not return an array');
    process.exit(1);
  }

  const result = inspect(apps, {
    deployPath,
    appName: process.env.APP_NAME || 'jehovahs-light',
    oldName: process.env.OLD_APP_NAME || 'jehovahs-light.ink.net.tw',
  });
  printShell(result);
  if (result.error) {
    console.error(`error: ${result.error}`);
    process.exit(2);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  inspect,
  scriptLooksStandalone,
  scriptLooksNextStart,
};
