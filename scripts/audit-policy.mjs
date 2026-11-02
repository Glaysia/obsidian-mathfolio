// SPDX-License-Identifier: AGPL-3.0-only
import assert from 'node:assert/strict';
export const reviewedAdvisory = 'https://github.com/advisories/GHSA-g3hv-75wg-m249';

// Only this advisory's absent optimizer in the pinned, dev-only 3.1.5 source is
// reviewed as not applicable. Every other moderate/high/critical finding fails.
export function reviewAudit(report, verifyLegacyNode) {
  assert.equal(report.auditReportVersion, 2, 'Unsupported audit report');
  assert.ok(!report.error && report.vulnerabilities && report.metadata, 'Incomplete audit response');
  const findings = report.vulnerabilities;
  const reviewed = name => {
    const pending = [name], visited = new Set();
    let knownRoot = false;
    while (pending.length) {
      const current = pending.pop();
      if (visited.has(current)) continue;
      visited.add(current);
      const item = findings[current];
      if (!item || !Array.isArray(item.via) || !item.via.length) return false;
      for (const via of item.via) {
        if (typeof via === 'string') { pending.push(via); continue; }
        if (current !== 'minimatch' || via.url !== reviewedAdvisory || via.severity !== 'moderate' ||
            !Array.isArray(item.nodes) || !item.nodes.length || !item.nodes.every(verifyLegacyNode)) return false;
        knownRoot = true;
      }
    }
    // Peer dependency cycles have no new advisory of their own. A cycle with
    // no verified advisory root still fails closed.
    return knownRoot;
  };
  const accepted = [], blockers = [];
  for (const [name, item] of Object.entries(findings)) {
    assert.ok(['info', 'low', 'moderate', 'high', 'critical'].includes(item.severity), 'Unknown audit severity');
    if (reviewed(name)) accepted.push(name);
    else if (['moderate', 'high', 'critical'].includes(item.severity)) blockers.push(name);
  }
  return { accepted, blockers };
}
