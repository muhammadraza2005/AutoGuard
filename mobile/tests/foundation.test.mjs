import test from 'node:test';
import assert from 'node:assert/strict';
import { canAccessSection, sections } from '../src/features/auth/access.ts';

test('signed-out accounts cannot enter a section', () => {
  for (const section of sections) assert.equal(canAccessSection(null, section), false);
});

test('consumer grants cannot reveal privileged sections', () => {
  const session = { source: 'server', subject: 'test', sectionGrants: ['consumer'] };
  assert.equal(canAccessSection(session, 'consumer'), true);
  for (const section of ['agent', 'institutional', 'administration']) {
    assert.equal(canAccessSection(session, section), false);
  }
});

test('an agent grant does not grant other privileged sections', () => {
  const session = { source: 'server', subject: 'test', sectionGrants: ['consumer', 'agent'] };
  assert.equal(canAccessSection(session, 'agent'), true);
  assert.equal(canAccessSection(session, 'institutional'), false);
  assert.equal(canAccessSection(session, 'administration'), false);
});

test('release bundles cannot enable fixtures through the public demo flag', async () => {
  const previousDev = globalThis.__DEV__;
  const previousMode = process.env.EXPO_PUBLIC_APP_MODE;
  try {
    for (const mode of ['demo', 'live', undefined]) {
      if (mode === undefined) delete process.env.EXPO_PUBLIC_APP_MODE;
      else process.env.EXPO_PUBLIC_APP_MODE = mode;
      globalThis.__DEV__ = false;
      const { runtime } = await import('../src/config/runtime.ts?release=' + String(mode));
      assert.equal(runtime.isDemo, false);
    }
    globalThis.__DEV__ = true;
    process.env.EXPO_PUBLIC_APP_MODE = 'demo';
    assert.equal((await import('../src/config/runtime.ts?dev=demo')).runtime.isDemo, true);
    process.env.EXPO_PUBLIC_APP_MODE = 'live';
    assert.equal((await import('../src/config/runtime.ts?dev=live')).runtime.isDemo, false);
  } finally {
    globalThis.__DEV__ = previousDev;
    if (previousMode === undefined) delete process.env.EXPO_PUBLIC_APP_MODE;
    else process.env.EXPO_PUBLIC_APP_MODE = previousMode;
  }
});

