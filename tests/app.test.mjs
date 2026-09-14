import test from 'node:test';
import assert from 'node:assert/strict';
import { timingSafeEqual, createHmac } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ExcelJS from 'exceljs';
import worker from '../worker.js';
if (!crypto.subtle.timingSafeEqual) crypto.subtle.timingSafeEqual = (a,b) => timingSafeEqual(Buffer.from(a),Buffer.from(b));
const env = {
  APP_PIN: '1234', SESSION_SECRET: 'unit-test-secret-not-a-production-secret',
  LOGIN_LIMITER: { limit: async () => ({ success: true }) },
  ASSETS: { fetch: async () => new Response('asset') }
};
const request = (path, options = {}) => new Request('https://example.test' + path, options);
const login = pin => request('/api/login', { method: 'POST', headers: { Origin: 'https://example.test' }, body: JSON.stringify({ pin }) });
test('protects app code and excludes source and secrets', async () => {
  assert.equal((await worker.fetch(request('/script.js'),env)).status,401);
  for (const path of ['/.dev.vars','/worker.js','/local-pin.js','/package.json']) assert.equal((await worker.fetch(request(path),env)).status,404);
  assert.equal((await worker.fetch(request('/'),env)).status,200);
});
test('rejects invalid, unconfigured, cross-origin, oversized and rate-limited login', async () => {
  assert.equal((await worker.fetch(login('0000'),env)).status,401);
  assert.equal((await worker.fetch(login('1234'),{...env,APP_PIN:''})).status,503);
  assert.equal((await worker.fetch(request('/api/login',{method:'POST',headers:{Origin:'https://other.test'},body:'{}'}),env)).status,403);
  assert.equal((await worker.fetch(request('/api/login',{method:'POST',headers:{Origin:'https://example.test'},body:'x'.repeat(1025)}),env)).status,400);
  assert.equal((await worker.fetch(login('1234'),{...env,LOGIN_LIMITER:{limit:async()=>({success:false})}})).status,429);
});
test('signed sessions work; tampered and expired sessions fail', async () => {
  const response=await worker.fetch(login('1234'),env);
  assert.equal(response.status,200);
  const cookie=response.headers.get('set-cookie');
  assert.match(cookie,/HttpOnly/); assert.match(cookie,/Secure/); assert.match(cookie,/SameSite=Strict/);
  const pair=cookie.split(';')[0];
  assert.equal((await worker.fetch(request('/script.js',{headers:{Cookie:pair}}),env)).status,200);
  assert.equal((await worker.fetch(request('/script.js',{headers:{Cookie:pair+'a'}}),env)).status,401);
  const payload=Math.floor(Date.now()/1000-1)+'.'+'a'.repeat(32);
  const expired=payload+'.'+createHmac('sha256',env.SESSION_SECRET).update(payload).digest('hex');
  assert.equal((await worker.fetch(request('/script.js',{headers:{Cookie:'lawe_session='+expired}}),env)).status,401);
});
test('logout clears the cookie',async()=>{
  const response=await worker.fetch(request('/api/logout',{method:'POST',headers:{Origin:'https://example.test'}}),env);
  assert.match(response.headers.get('set-cookie'),/Max-Age=0/);
});
const exportCode=await readFile(new URL('../export.js',import.meta.url),'utf8');
const scope={window:{ExcelJS},Date,console}; globalThis.window = scope.window;
vm.runInThisContext(exportCode);
test('Excel layout and empty export',async()=>{
  const wb=await scope.window.buildCashWorkbook({businessDate:'2026-09-14',openingUsd:0,openingIqd:0,records:[]});
  assert.deepEqual(wb.worksheets.map(s=>s.name),['كرين','فروشتن','خشتەی گشتی','خزمەتگوزاری']);
  const loaded=new ExcelJS.Workbook(); await loaded.xlsx.load(await wb.xlsx.writeBuffer());
  assert.equal(loaded.getWorksheet('خشتەی گشتی').getCell('F12').result,0);
  assert.equal(loaded.worksheets[0].views[0].rightToLeft,true);
});
test('Excel expands past template capacity and preserves formulas, dates and literal notes',async()=>{
  const records=Array.from({length:250},()=>({kind:'buy',usd:10,rate:1477.5,date:'2026-09-14',time:'21:03',customer:'Customer',reference:'=2+2'}));
  records.push({kind:'service',direction:'deposit',amount:10000,fee:250,date:'2026-09-14'});
  const wb=await scope.window.buildCashWorkbook({businessDate:'2026-09-14',openingUsd:20,openingIqd:4000000,records});
  const buy=wb.worksheets[0], summary=wb.getWorksheet('خشتەی گشتی');
  assert.equal(buy.getCell('B255').result,2500);
  assert.equal(buy.getCell('D254').formula,'B254*C254');
  assert.equal(buy.getCell('H5').value,'=2+2');
  assert.equal(buy.getCell('F5').value.toISOString(),'2026-09-14T00:00:00.000Z');
  assert.equal(summary.getCell('F12').result,316500);
  const loaded=new ExcelJS.Workbook(); await loaded.xlsx.load(await wb.xlsx.writeBuffer());
  assert.equal(loaded.worksheets[0].getCell('H5').type,ExcelJS.ValueType.String);
});
