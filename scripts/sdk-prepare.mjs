// Restore a pinned development archive before npm ci; no symlinks or network.
import { readFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const lock = JSON.parse(readFileSync('sdk.lock.json','utf8'));
assert.equal(lock.status,'development','This command is only for a local SDK development pin');
const source = resolve(process.argv[2] ?? '/home/harry/Projects/RustProjects/mathfolio');
const commit = execFileSync('git',['rev-parse','HEAD'],{cwd:source,encoding:'utf8'}).trim();
assert.equal(commit,lock.sourceCommit,'SDK source commit differs from the development pin');
execFileSync('git',['diff','--quiet','HEAD'],{cwd:source});
const archive = resolve(source,`dist/mathfolio-wasm-sdk-${lock.version}.tar.gz`);
const hash = createHash('sha256').update(readFileSync(archive)).digest('hex');
assert.equal(hash,lock.sha256,'SDK archive differs from the tested package');
mkdirSync(dirname(lock.assetPath),{recursive:true});
copyFileSync(archive,lock.assetPath);
console.log(`Prepared ${lock.package}@${lock.version}; run npm ci next.`);
