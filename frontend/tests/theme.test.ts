import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isTheme, readTheme, saveTheme, THEME_STORAGE_KEY } from '../src/utils/theme.ts';

test('theme defaults to dark for missing or invalid stored preferences', () => {
  for (const value of [null, '', 'system', 'DARK', '{invalid}']) {
    assert.equal(readTheme({ getItem: () => value }), 'dark');
  }
  assert.equal(isTheme(undefined), false);
  assert.equal(isTheme({ theme: 'dark' }), false);
});

test('valid saved themes are restored from the dedicated storage key', () => {
  for (const value of ['dark', 'light'] as const) {
    assert.equal(readTheme({ getItem(key) { assert.equal(key, THEME_STORAGE_KEY); return value; } }), value);
  }
});

test('blocked storage reads preserve the dark fallback', () => {
  assert.equal(readTheme({ getItem() { throw new Error('Storage blocked'); } }), 'dark');
});

test('saving theme affects only its own preference and can be read back', () => {
  const values = new Map([['other-setting', 'untouched']]);
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
  assert.equal(saveTheme(storage, 'light'), true);
  assert.equal(readTheme(storage), 'light');
  assert.equal(values.get('other-setting'), 'untouched');
  assert.equal(saveTheme(storage, 'dark'), true);
  assert.equal(readTheme(storage), 'dark');
});

test('blocked storage writes return failure without throwing', () => {
  assert.equal(saveTheme({ setItem() { throw new Error('Quota exceeded'); } }, 'light'), false);
});
