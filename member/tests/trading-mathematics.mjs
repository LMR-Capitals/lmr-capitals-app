import assert from 'node:assert/strict';
import { eurUsdPractice, foundationPages } from '../foundation-content.mjs';
assert.deepEqual(eurUsdPractice(10, 20), { units: 5000, pipValue: .5, plannedLoss: 10 });
assert.deepEqual(eurUsdPractice(10, 40), { units: 2500, pipValue: .25, plannedLoss: 10 });
assert.equal(eurUsdPractice(10, 30).units, 3333);
assert.ok(eurUsdPractice(10, 30).plannedLoss <= 10);
for (const [risk, stop] of [[0,20],[-1,20],[10,0],[10,-1],[NaN,20],[10,Infinity],[Infinity,20],[.00001,100],[Number.MAX_VALUE,.001]]) assert.equal(eurUsdPractice(risk,stop),null);
for (const page of Object.values(foundationPages)) {
 assert.equal(new Set(page.sections.map(s=>s.id)).size,page.sections.length);
 for(const section of page.sections) { assert.ok(section.title);assert.ok(section.paragraphs.length); for(const [,url] of section.sources || []) assert.equal(new URL(url).protocol,'https:'); }
}
assert.equal(Object.keys(foundationPages).join(','),'fundamentals,mathematics');
console.log('PASS: EUR/USD sizing, doubled stop, downward rounding, invalid inputs, and two-page course structure.');
