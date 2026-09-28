import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTERS, METHOD_COUNT, PACING, makeTimeline, sampleTimeline, chapterProgress } from './journey-content.js';

test('camera landing and Observe reading hold share continuous visible content', () => {
  for (const phone of [false, true]) {
    const timeline = makeTimeline(phone);
    const handoff = timeline.segments.find(s => s.phase === 'handoff');
    const before = sampleTimeline((handoff.end - .000001) / timeline.total, timeline);
    const after = sampleTimeline((handoff.end + .000001) / timeline.total, timeline);
    assert.equal(before.chapter, after.chapter);
    assert.ok(Math.abs(before.opacity - after.opacity) < .000001);
    assert.equal(after.opacity, 1);
    assert.equal(sampleTimeline((handoff.start + handoff.span * .65) / timeline.total, timeline).opacity, 0);
  }
});

test('all eleven chapters carry substantive public explanations and compact fields', () => {
  assert.equal(CHAPTERS.length, 11);
  assert.equal(new Set(CHAPTERS.map(c => c.id)).size, 11);
  for (const chapter of CHAPTERS) {
    const words = chapter.copy.split(/\s+/).length;
    assert.ok(words >= 40 && words <= 65, `${chapter.id}: ${words} words`);
    assert.ok(chapter.question.endsWith('?'));
    assert.ok(chapter.fields.length <= 3);
  }
});
for (const phone of [false, true]) {
  const mode = phone ? 'phone' : 'desktop';
  const timeline = makeTimeline(phone);
  test(`${mode}: spans are continuous, with explicit entry, handoff, and exit`, () => {
    assert.equal(timeline.segments.length, 14);
    timeline.segments.forEach((s, i) => { assert.equal(s.start, i ? timeline.segments[i - 1].end : 0); assert.equal(s.end - s.start, s.span); });
    assert.equal(timeline.segments.at(-1).end, timeline.total);
    assert.equal(timeline.segments.filter(s => s.phase === 'method').length, METHOD_COUNT);
    assert.equal(timeline.segments.find(s => s.phase === 'handoff').start, timeline.conviction);
  });
  test(`${mode}: chapter navigation targets stable reading holds`, () => {
    CHAPTERS.forEach((_, index) => {
      const sample = sampleTimeline(chapterProgress(index, timeline), timeline);
      assert.equal(sample.chapter, index);
      assert.equal(sample.phase, index < 7 ? 'method' : 'desk');
      assert.equal(sample.opacity, 1);
    });
  });
  test(`${mode}: forward and backward sampling has no history dependence`, () => {
    for (const segment of timeline.segments) {
      for (const local of [0, .15, .5, .85, .9999]) {
        const p = (segment.start + segment.span * local) / timeline.total;
        const a = sampleTimeline(p, timeline);
        sampleTimeline(1, timeline); sampleTimeline(0, timeline);
        assert.deepEqual(sampleTimeline(p, timeline), a);
        assert.ok(a.opacity >= 0 && a.opacity <= 1);
      }
    }
  });
  test(`${mode}: clamp overscroll and preserve the 70% reading plateau`, () => {
    assert.equal(sampleTimeline(-3, timeline).phase, 'entry');
    assert.equal(sampleTimeline(3, timeline).phase, 'exit');
    for (const s of timeline.segments.filter(s => ['method', 'desk'].includes(s.phase))) {
      for (const t of [.16, .5, .84]) assert.equal(sampleTimeline((s.start + t * s.span) / timeline.total, timeline).opacity, 1);
    }
    assert.equal(PACING.fade * 2, .3);
  });
}
