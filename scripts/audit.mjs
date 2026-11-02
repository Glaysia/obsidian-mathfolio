// SPDX-License-Identifier: AGPL-3.0-only
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { reviewAudit } from './audit-policy.mjs';
assert.ok(process.env.npm_execpath, 'Run npm run audit');
const run = args => {
  const result = spawnSync(process.execPath, [process.env.npm_execpath, 'audit', ...args], { encoding: 'utf8' });
  assert.ok(!result.error && [0, 1].includes(result.status), result.stderr || 'npm audit failed');
  return result;
};
const runtime = run(['--omit=dev', '--audit-level=moderate']);
console.log(runtime.stdout);
assert.equal(runtime.status, 0, 'Runtime dependency audit failed');
const result = run(['--json', '--audit-level=moderate']);
const report = JSON.parse(result.stdout);
mkdirSync('artifacts', { recursive: true });
writeFileSync('artifacts/audit-report.json', JSON.stringify(report, null, 2) + '\n');
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
const verifyLegacyNode = node => {
  const base = resolve(node);
  if (!base.startsWith(resolve('node_modules') + sep) || !lock.packages[node]?.dev) return false;
  const pkg = JSON.parse(readFileSync(resolve(base, 'package.json'), 'utf8'));
  if (pkg.name !== 'minimatch' || pkg.version !== '3.1.5') return false;
  const source = readFileSync(resolve(base, 'minimatch.js'));
  return createHash('sha256').update(source).digest('hex') === '746849f267c4868a53729225bd85c7dccd387712136fb305fcc0a3eadd4a3d9d' &&
    !/firstPhasePreProcess|secondPhasePreProcess|optimizationLevel/.test(source.toString());
};
const decision = reviewAudit(report, verifyLegacyNode);
console.log('Raw npm audit counts:', report.metadata.vulnerabilities);
console.log('Reviewed dev-only legacy minimatch advisory and inherited findings:', decision.accepted);
console.log('Review evidence: docs/DEPENDENCY-AUDIT.md; raw report: artifacts/audit-report.json');
assert.equal(decision.blockers.length, 0, `Unreviewed dependency findings: ${decision.blockers.join(', ')}`);
