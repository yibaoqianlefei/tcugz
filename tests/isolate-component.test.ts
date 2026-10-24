/**
 * Component isolation (独立展示) contract.
 *
 * The feature is only trustworthy if it restores exactly what it changed:
 * proxies, hitboxes and authored visibility flags must survive every round trip,
 * and switching the isolated component must never overwrite an original flag
 * with a temporary one.
 *
 * Run with: npx tsx tests/isolate-component.test.ts
 */

import assert from 'node:assert/strict';
import { BoxGeometry, Group, LineSegments, LineBasicMaterial, Mesh, MeshBasicMaterial } from 'three';
import {
  applyComponentIsolation,
  clearComponentIsolation,
  createIsolationState,
} from '../src/utils/isolateComponent';

const resolveName = (name: string) => name.replace(/_\d+$/, '');

function mesh(name: string, visible = true) {
  const m = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial());
  m.name = name;
  m.visible = visible;
  return m;
}

function outline(owner: Group | Mesh, visible = true) {
  const line = new LineSegments(new BoxGeometry(1, 1, 1), new LineBasicMaterial());
  line.userData._isOutline = true;
  line.visible = visible;
  owner.add(line);
  return line;
}

function buildScene() {
  const root = new Group();
  const handrail = mesh('弧形扶手');
  const surface = mesh('木制面层');
  const hitbox = mesh('地毯棍_hitbox', false);
  const hiddenMaterial = mesh('结合层', false);
  const proxy = mesh('弧形扶手');
  proxy.userData._isProxy = true;
  proxy.visible = false;
  handrail.add(proxy);
  const handrailOutline = outline(handrail);
  const surfaceOutline = outline(surface);
  root.add(handrail, surface, hitbox, hiddenMaterial);
  return { root, handrail, surface, hitbox, hiddenMaterial, proxy, handrailOutline, surfaceOutline };
}

const state = createIsolationState();
const s = buildScene();

// ── Isolate one component ──
applyComponentIsolation(s.root, { kind: 'only', name: '弧形扶手' }, resolveName, state);
assert.equal(s.handrail.visible, true, 'selected component stays visible');
assert.equal(s.surface.visible, false, 'other component is hidden');
assert.equal(s.hiddenMaterial.visible, false, 'authored hidden mesh stays hidden');
assert.equal(s.hitbox.visible, false, 'hitbox stays hidden');
assert.equal(s.proxy.visible, false, 'proxy stays hidden');
assert.equal(s.handrailOutline.visible, true, 'outline of the selected component stays visible');
assert.equal(s.surfaceOutline.visible, false, 'outline of other components is hidden');

// ── Switch the isolated component: originals must not be overwritten ──
applyComponentIsolation(s.root, { kind: 'only', name: '木制面层' }, resolveName, state);
assert.equal(s.handrail.visible, false, 'previous component hides on switch');
assert.equal(s.surface.visible, true, 'new component shows on switch');
assert.equal(s.handrailOutline.visible, false, 'previous outline hides on switch');
assert.equal(s.surfaceOutline.visible, true, 'new outline shows on switch');

// ── Restore: every authored flag comes back ──
applyComponentIsolation(s.root, { kind: 'all' }, resolveName, state);
assert.equal(s.handrail.visible, true, 'restore shows the first component again');
assert.equal(s.surface.visible, true, 'restore shows the second component again');
assert.equal(s.hiddenMaterial.visible, false, 'restore keeps authored-hidden mesh hidden');
assert.equal(s.hitbox.visible, false, 'restore keeps the hitbox hidden');
assert.equal(s.proxy.visible, false, 'restore keeps the proxy hidden');
assert.equal(s.handrailOutline.visible, true, 'restore returns the authored outline flag');
assert.equal(s.surfaceOutline.visible, true, 'restore returns both outline flags');

// ── `none` (sibling variant) hides every selectable mesh ──
applyComponentIsolation(s.root, { kind: 'none' }, resolveName, state);
assert.equal(s.handrail.visible, false, 'none hides the first component');
assert.equal(s.surface.visible, false, 'none hides the second component');
assert.equal(s.handrailOutline.visible, false, 'none hides outlines');
assert.equal(s.hitbox.visible, false, 'none keeps hitboxes hidden');

applyComponentIsolation(s.root, { kind: 'all' }, resolveName, state);
assert.equal(s.handrail.visible, true, 'transient clears fully restore after none');

// ── Explicit teardown also restores ──
applyComponentIsolation(s.root, { kind: 'only', name: '弧形扶手' }, resolveName, state);
clearComponentIsolation(state);
assert.equal(s.surface.visible, true, 'teardown restores the hidden component');
assert.equal(state.remembered.size, 0, 'teardown forgets every recorded object');

console.log('PASS component isolation: single component, outline ownership, component switch, sibling-variant hide, authored flags preserved and teardown restore');
