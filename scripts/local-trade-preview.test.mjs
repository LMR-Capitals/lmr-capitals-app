import test from 'node:test';
import assert from 'node:assert/strict';
import { localTradePreview } from './local-trade-preview.mjs';

async function request({ host = '127.0.0.1:4173', origin, address = '127.0.0.1', method = 'GET', authorization, url = '/', factory } = {}) {
  let handler;
  const plugin = localTradePreview(factory);
  assert.equal(plugin.apply, 'serve');
  plugin.configureServer({ config: { root: '/nonexistent-preview-test-root' }, middlewares: { use(path, fn) { assert.equal(path, '/__local-preview/recent-trades'); handler = fn; } } });
  const response = { statusCode: 200, headers: {}, setHeader(name,value) { this.headers[name] = value; }, end(body) { this.body = body; } };
  await handler({ method, url, headers: { host, origin, authorization }, socket: { remoteAddress: address } }, response);
  return response;
}
test('private preview endpoint rejects external clients and cross-origin reads', async () => {
  assert.equal((await request({ address: '192.168.1.10' })).statusCode,403);
  assert.equal((await request({ host: 'attacker.example' })).statusCode,403);
  assert.equal((await request({ origin: 'https://attacker.example' })).statusCode,403);
});
test('authenticated feed filters by verified owner and requests newest five without public image URLs', async () => {
  const calls = [];
  const chain = { select() { return this; }, eq(...args) { calls.push(['eq', ...args]); return this; }, order(...args) { calls.push(['order', ...args]); return this; }, limit(n) { calls.push(['limit',n]); return { data: [{id:'123',models:[]}] }; } };
  const factory = () => ({ auth: { getUser: async () => ({data:{user:{id:'owner'}}}) }, from: () => chain, storage: { from: () => ({list: async () => ({data:[{name:'trade-123-entry'}]})}) } });
  const result = await request({authorization:'Bearer test-only',factory});
  assert.equal(result.statusCode,200);
  assert.deepEqual(calls[0],['eq','user_id','owner']);
  assert.deepEqual(calls.filter(call=>call[0]==='order').map(call=>[call[1],call[2].ascending]),[['date',false],['open_time',false],['created_at',false],['id',false]]);
  assert.deepEqual(calls.at(-1),['limit',5]);
  assert.deepEqual(JSON.parse(result.body).trades[0].charts,[{suffix:'entry',label:'Entry'}]);
  assert.equal(result.body.includes('https:'),false);
});
test('invalid sessions and non-owned images never return trade data', async () => {
  const invalid = () => ({auth:{getUser:async()=>({data:{user:null}})}});
  assert.equal((await request({authorization:'Bearer invalid',factory:invalid})).statusCode,401);
  const chain = {select(){return this;},eq(){return this;},maybeSingle:async()=>({data:null})};
  const factory = () => ({auth:{getUser:async()=>({data:{user:{id:'owner'}}})},from:()=>chain});
  assert.equal((await request({authorization:'Bearer test-only',factory,url:'/?trade=123&chart=entry'})).statusCode,404);
});
test('private preview endpoint rejects writes and requires a session', async () => {
  assert.equal((await request({ method: 'POST' })).statusCode,405);
  const result = await request(); assert.equal(result.statusCode,401); assert.equal(result.headers['Cache-Control'],'no-store');
});
