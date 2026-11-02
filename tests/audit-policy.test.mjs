import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewAudit, reviewedAdvisory } from '../scripts/audit-policy.mjs';
const fixture = () => ({ auditReportVersion: 2, metadata: {}, vulnerabilities: {
  minimatch: { severity: 'moderate', nodes: ['node_modules/minimatch'], via: [{ url: reviewedAdvisory, severity: 'moderate' }] },
  eslint: { severity: 'moderate', via: ['minimatch'] },
} });
test('audit permits only verified legacy source and inherited findings', () => {
  assert.deepEqual(reviewAudit(fixture(), () => true), { accepted: ['minimatch', 'eslint'], blockers: [] });
});
test('audit fails when the installed version/source is not verified', () => {
  assert.deepEqual(reviewAudit(fixture(), () => false).blockers, ['minimatch', 'eslint']);
});
test('audit keeps unknown advisories and additional findings blocking', () => {
  const r = fixture(); r.vulnerabilities.minimatch.via.push({ url: 'https://github.com/advisories/GHSA-other', severity: 'moderate' });
  assert.deepEqual(reviewAudit(r, () => true).blockers, ['minimatch', 'eslint']);
});
test('audit rejects incomplete responses and cyclic inherited findings', () => {
  assert.throws(() => reviewAudit({ auditReportVersion: 2, error: {} }, () => true));
  const r = fixture(); r.vulnerabilities.minimatch.via = ['eslint'];
  assert.deepEqual(reviewAudit(r, () => true).blockers, ['minimatch', 'eslint']);
});

test('audit follows peer cycles only when they reach the verified advisory root', () => {
  const r = fixture(); r.vulnerabilities.eslint.via.push('peer');
  r.vulnerabilities.peer = { severity: 'moderate', via: ['eslint'] };
  assert.deepEqual(reviewAudit(r, () => true).blockers, []);
  r.vulnerabilities.peer.via.push({url:'https://github.com/advisories/GHSA-other',severity:'high'});
  assert.deepEqual(reviewAudit(r, () => true).blockers, ['eslint','peer']);
});
