import assert from 'node:assert/strict';
import { makeRoster, parseNames, newDailyState, selectBatch, buildDetectiveClues } from '../giao-vien/goi-hoc-sinh-core.mjs';

const surnames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng'];
const given = ['An', 'Bảo', 'Chi', 'Dũng', 'Hà', 'Khánh', 'Linh', 'Minh Anh', 'Nam'];
function namesFor(size, offset = 0) {
  return Array.from({ length: size }, (_, i) => surnames[(i + offset) % surnames.length] + ' ' + given[Math.floor((i + offset) / surnames.length) % given.length] + (i >= surnames.length * given.length ? ' ' + (i + 1) : ''));
}
function cyclingRandom() {
  let seed = 0;
  return length => { const result = seed % length; seed++; return result; };
}

for (const size of [5, 20, 45]) {
  const girls = parseNames(namesFor(Math.ceil(size / 2), 0).join('\n'));
  const boys = parseNames(namesFor(Math.floor(size / 2), 2).join('\n'));
  const roster = makeRoster(girls, boys);
  assert.equal(roster.girls.length, Math.ceil(size / 2));
  assert.equal(roster.boys.length, Math.floor(size / 2));
  assert.equal(roster.all.length, size);

  for (const [scope, list] of [['girls', roster.girls], ['boys', roster.boys], ['all', roster.all]]) {
    for (const count of [1, 2, 3]) {
      const state = newDailyState('2026-11-27');
      const batch = selectBatch(list, count, scope, state, cyclingRandom());
      assert.equal(batch.length, Math.min(count, list.length), `${scope} ${size} count ${count}`);
      assert.equal(new Set(batch.map(student => student.id)).size, batch.length, 'a batch cannot repeat a student');
    }

    const state = newDailyState('2026-11-27');
    const random = cyclingRandom();
    const round = [];
    while (round.length < list.length) {
      const batch = selectBatch(list, 1, scope, state, random);
      assert.equal(batch.length, 1);
      round.push(batch[0].id);
    }
    assert.equal(new Set(round).size, list.length, `${scope} ${size} must call everyone before resetting`);
    const nextRound = selectBatch(list, 3, scope, state, random);
    assert.equal(nextRound.length, 0, 'the teacher starts a new round explicitly');
    state.round[scope] = [];
    const refreshedRound = selectBatch(list, 3, scope, state, random);
    assert.equal(refreshedRound.length, Math.min(3, list.length));
    assert.equal(new Set(refreshedRound.map(student => student.id)).size, refreshedRound.length);

    // If fewer than requested remain, finish the old round without repeating or mixing rounds.
    const edgeState = newDailyState('2026-11-27');
    edgeState.round[scope] = list.slice(0, list.length - 1).map(student => student.id);
    const lastStudent = selectBatch(list, 3, scope, edgeState, random);
    assert.equal(lastStudent.length, 1);
    assert.equal(selectBatch(list, 1, scope, edgeState, random).length, 0);
  }

  const detectiveRoster = roster.all.slice(0, Math.max(size, 5));
  for (const target of detectiveRoster) {
    const { clues, finalCandidates, targetIncluded } = buildDetectiveClues(detectiveRoster, target, cyclingRandom(), 5);
    assert.ok(clues.length >= 3, `detective must give at least 3 clues for ${size} names`);
    assert.equal(targetIncluded, true);
    let before = detectiveRoster;
    for (const clue of clues) {
      const remaining = clue.remaining;
      assert.ok(remaining.some(student => student.id === target.id), 'every clue keeps the selected student');
      assert.ok(remaining.length < before.length, 'every clue clears at least one innocent');
      assert.ok(clue.removed.length > 0);
      before = remaining;
    }
    assert.ok(finalCandidates.some(student => student.id === target.id));
  }
}

// A gender-specific game must not erase calls made earlier from another group.
{
  const roster = makeRoster(parseNames('Nguyễn Ngọc An\nTrần Hà Chi'), parseNames('Lê Minh Khang\nPhạm Gia Bảo'));
  const state = newDailyState('2026-11-27');
  const girl = selectBatch([roster.girls[0]], 1, 'all', state)[0];
  const boy = selectBatch([roster.boys[0]], 1, 'all', state)[0];
  assert.ok(state.round.all.includes(girl.id));
  assert.ok(state.round.all.includes(boy.id));
  assert.equal(selectBatch([roster.girls[0]], 1, 'all', state).length, 0, 'switching games keeps prior calls in the shared round');
}

console.log('Teacher games checks passed: 5, 20, 45 students; 1/2/3 selections; no-repeat rounds; truthful detective clues.');
