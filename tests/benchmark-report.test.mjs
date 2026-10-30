import test from 'node:test';
import assert from 'node:assert/strict';
import { releaseMetrics } from '../scripts/benchmark-report.mjs';

test('release report reads the requested full-run rows, including bold cells', () => {
  const rows = releaseMetrics(`
| mode | hit@1 | hit@5 | hit@10 |
| local 3.2.0 | 0.757 | 0.938 | 0.974 |
| **FTS 3.2.1** | **0.857** | **0.951** | **0.972** |
| **local 3.2.1** | **0.760** | **0.949** | **0.968** |
`, '3.2.1');
  assert.deepEqual([...rows], [['FTS', {hit1: .857, hit5: .951}], ['local', {hit1: .760, hit5: .949}]]);
});

test('missing or malformed current results cannot borrow historical numbers', () => {
  assert.equal(releaseMetrics('| local 3.2.0 | 0.757 | 0.938 |', '3.2.1').size, 0);
  assert.equal(releaseMetrics('| local 3.2.1 | | 0.949 |', '3.2.1').size, 0);
  assert.equal(releaseMetrics('| local 3.2.1 | unknown | 0.949 |', '3.2.1').size, 0);
});


test('release report finds hit@5 after a new hit@3 column', () => {
  const rows = releaseMetrics(`
| mode | hit@1 | hit@3 | hit@5 | hit@10 |
| **FTS 3.3.0** | **0.857** | **0.930** | **0.951** | **0.972** |
| **local 3.3.0** | **0.762** | **0.909** | **0.945** | **0.970** |
`, '3.3.0');
  assert.deepEqual([...rows], [['FTS', {hit1: .857, hit5: .951}], ['local', {hit1: .762, hit5: .945}]]);
});
