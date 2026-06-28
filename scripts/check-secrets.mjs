#!/usr/bin/env node
/**
 * Scans git-tracked or staged files for likely secrets before commit/push.
 * Usage: node scripts/check-secrets.mjs [--staged]
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const stagedOnly = process.argv.includes('--staged');
const repoRoot = process.cwd();

const IGNORED_PATH_PREFIXES = [
  'node_modules/',
  'dist/',
  '.expo/',
  'coverage/',
  'package-lock.json',
];

const ALLOWED_ENV_FILES = new Set([
  '.env.example',
  'apps/api/.env.example',
  'apps/mobile/.env.example',
]);

const SECRET_PATTERNS = [
  { name: 'AWS access key', regex: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'Stripe live secret key', regex: /\bsk_live_[A-Za-z0-9]{16,}\b/ },
  { name: 'Stripe test secret key', regex: /\bsk_test_[A-Za-z0-9]{16,}\b/ },
  { name: 'GitHub personal access token', regex: /\bghp_[A-Za-z0-9]{20,}\b/ },
  { name: 'GitHub fine-grained token', regex: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/ },
  { name: 'Slack token', regex: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { name: 'Private key block', regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  {
    name: 'Hardcoded assignment secret',
    regex: /(?:api[_-]?key|secret|token|password)\s*[:=]\s*['"][^'"\s]{24,}['"]/i,
  },
];

function runGit(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim();
}

function listFiles() {
  if (stagedOnly) {
    const output = runGit(['diff', '--cached', '--name-only', '--diff-filter=ACMR']);
    return output ? output.split('\n').filter(Boolean) : [];
  }

  return runGit(['ls-files']).split('\n').filter(Boolean);
}

function shouldScan(filePath) {
  if (ALLOWED_ENV_FILES.has(filePath.replace(/\\/g, '/'))) {
    return false;
  }

  if (IGNORED_PATH_PREFIXES.some((prefix) => filePath.startsWith(prefix))) {
    return false;
  }

  const normalized = filePath.replace(/\\/g, '/');
  const baseName = path.basename(normalized);

  if (baseName === '.env' || baseName.endsWith('.pem') || baseName.endsWith('.p12')) {
    return true;
  }

  if (normalized.includes('/.env') && !normalized.endsWith('.env.example')) {
    return true;
  }

  const ext = path.extname(normalized).toLowerCase();
  return ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.yml', '.yaml', '.env'].includes(ext);
}

function scanFile(filePath) {
  const absolutePath = path.join(repoRoot, filePath);
  if (!existsSync(absolutePath)) {
    return [];
  }

  const findings = [];
  const content = readFileSync(absolutePath, 'utf8');
  const lines = content.split('\n');

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.regex.test(line)) {
        findings.push({
          filePath,
          line: index + 1,
          rule: pattern.name,
          snippet: line.trim().slice(0, 120),
        });
      }
    }
  }

  return findings;
}

function checkTrackedEnvFiles(files) {
  return files.filter((filePath) => {
    const normalized = filePath.replace(/\\/g, '/');
    const baseName = path.basename(normalized);
    return (
      (baseName === '.env' || normalized.endsWith('/.env')) &&
      !normalized.endsWith('.env.example') &&
      !ALLOWED_ENV_FILES.has(normalized)
    );
  });
}

const files = listFiles().filter(shouldScan);
const envViolations = checkTrackedEnvFiles(listFiles());
const findings = files.flatMap(scanFile);

if (envViolations.length > 0 || findings.length > 0) {
  console.error('\nSecret scan failed.\n');

  for (const filePath of envViolations) {
    console.error(`  - ${filePath}: .env files must not be committed (use .env.example instead)`);
  }

  for (const finding of findings) {
    console.error(`  - ${finding.filePath}:${finding.line} [${finding.rule}] ${finding.snippet}`);
  }

  console.error('\nRemove secrets from the repo and use environment variables instead.\n');
  process.exit(1);
}

const scope = stagedOnly ? 'staged files' : 'tracked files';
console.log(`Secret scan passed (${scope}).`);
