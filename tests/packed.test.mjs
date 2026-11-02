import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { build } from 'esbuild';
async function load(file) {
  const result = await build({ entryPoints: [file], bundle: true, format: 'esm', platform: 'browser', write: false });
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const { inflateAssets, unpack } = await load('src/packed.ts');
const { encode91 } = await load('src/encoding.ts');
function packet() {
  const wasm = Buffer.from([0,97,115,109,1,0,0,0]);
  const font = Buffer.from('font fixture');
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x3841464d); header.writeUInt32LE(wasm.length,4); header.writeUInt32LE(font.length,8);
  return Buffer.concat([header,wasm,font,Buffer.from('AGPL · 글꼴 고지')]);
}
test('browser gzip API restores WASM, font and Unicode notices without a Node decoder', async()=>{
  const assets = await inflateAssets(encode91(gzipSync(packet())));
  assert.equal(WebAssembly.validate(assets.wasm),true);
  assert.equal(new TextDecoder().decode(assets.font),'font fixture');
  assert.equal(assets.notices,'AGPL · 글꼴 고지');
});
test('wrong asset version and truncated binary ranges fail before mounting WASM',()=>{
  for(const change of [p=>p.writeUInt32LE(0,0),p=>p.writeUInt32LE(0xffffffff,4),p=>p.writeUInt32LE(0,8),p=>p[12]=255]) {
    const p=packet();change(p);assert.throws(()=>unpack(p));
  }
  assert.throws(()=>unpack(packet().subarray(0,15)));
});
test('corrupted gzip and invalid printable transport are rejected', async()=>{
  const compressed=gzipSync(packet());compressed[compressed.length-1]^=1;
  await assert.rejects(inflateAssets(encode91(compressed)));
  await assert.rejects(inflateAssets('"'));
});
