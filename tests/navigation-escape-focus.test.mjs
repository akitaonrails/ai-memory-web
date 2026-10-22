import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../src/components/Nav.astro', import.meta.url), 'utf8');
const match = source.match(/addEventListener\('keydown', \(e\) => ([\s\S]*?)\);\n  document\.addEventListener\('click'/);
assert.ok(match, 'navigation Escape handler is present');
const createHandler = new Function('groups', 'document', 'setOpen', `return (e) => ${match[1]}`);

function fixture(activeElement = 'link') {
  const button = { focused: false, focus() { this.focused = true; } };
  const link = {};
  const outside = {};
  const group = {
    open: true,
    hasAttribute(name) { return name === 'data-open' && this.open; },
    contains(element) { return element === link; },
    querySelector(selector) { return selector === 'button' ? button : null; },
  };
  let open = group;
  return {
    button,
    groups: [group],
    document: { activeElement: activeElement === 'link' ? link : outside },
    setOpen(next) { open = next; group.open = next === group; },
    getOpen() { return open; },
  };
}

function press(fixture, key = 'Escape') {
  createHandler(fixture.groups, fixture.document, fixture.setOpen)({ key });
}

test('Escape closes the open group and returns focus to its trigger', () => {
  const current = fixture();
  press(current);
  assert.equal(current.getOpen(), null);
  assert.equal(current.button.focused, true);
});

test('Escape leaves focus elsewhere when the open group does not contain it', () => {
  const current = fixture('outside');
  press(current);
  assert.equal(current.getOpen(), null);
  assert.equal(current.button.focused, false);
});

test('other keys leave the group and focus alone', () => {
  const current = fixture();
  press(current, 'a');
  assert.equal(current.getOpen(), current.groups[0]);
  assert.equal(current.button.focused, false);
});

test('Escape with no open group leaves focus alone', () => {
  const current = fixture();
  current.setOpen(null);
  press(current);
  assert.equal(current.getOpen(), null);
  assert.equal(current.button.focused, false);
});
