# Dependency audit review — 2026-11-02

`npm run audit` first runs an unmodified runtime-only npm audit at the moderate threshold. It then retains the full raw audit in `artifacts/audit-report.json` and fails every unreviewed moderate/high/critical finding. This is not a claim of zero raw npm audit findings.

The current full audit reports 20 moderate entries, all rooted in GHSA-g3hv-75wg-m249 on dev-only minimatch 3.1.5. Runtime audit reports zero. Newer minimatch consumers use patched 11.0.4. The JSON schema lint plugin is updated to 6.3.2, which supports the named minimatch API. ESLint 9 and legacy import/React lint helpers retain the callable 3.1.5 API; a global major override would break these consumers.

## Narrow source-based assessment

- The [maintainer advisory](https://github.com/isaacs/minimatch/security/advisories/GHSA-g3hv-75wg-m249) identifies amplification in `firstPhasePreProcess()` followed by `secondPhasePreProcess()` when `optimizationLevel >= 2`, and lists affected 10.2.6 / patched 11.0.1.
- The [database record](https://github.com/advisories/GHSA-g3hv-75wg-m249) currently uses the broader range `<11.0.1`. The [range clarification issue](https://github.com/github/advisory-database/issues/10811) remains open. This project's assessment is not upstream confirmation of a corrected range.
- The pinned installed [upstream 3.1.5 source](https://github.com/isaacs/minimatch/blob/v3.1.5/minimatch.js) has SHA-256 `746849f267c4868a53729225bd85c7dccd387712136fb305fcc0a3eadd4a3d9d` and contains none of those three optimizer identifiers. Its parser splits and parses brace-expanded patterns without that optimizer. The specific reported mechanism is absent from this inspected source.

The policy therefore reviews only this one advisory as not applicable to that exact, hash-verified, lockfile-dev-only 3.1.5 implementation and its inherited npm findings. It does not dismiss other minimatch risks, any different source/version, runtime findings or new advisories. Missing audit data, an altered source, unknown advisory or unresolved graph fails closed. Peer-dependency cycles are accepted only when their reachable advisory roots all match this verified case.

Five regression tests cover the policy's accepted root, rejected source, additional advisory, malformed response and inherited cycles. CI retains the review decision in its log. Remove the exception when upstream tooling no longer requires the legacy callable API or the database range is corrected.
