import assert from 'node:assert/strict';
import { test } from 'node:test';
import { clusterLamps } from './cluster-lamps';

test('three people on one home Wi-Fi show as one lamp', () => {
  const home = [
    { latitude: 22.3193, longitude: 114.1694 },
    { latitude: 22.3194, longitude: 114.1695 },
    { latitude: 22.3196, longitude: 114.1692 },
  ];
  assert.equal(clusterLamps(home).length, 1);
});

test('lamps a few km apart stay separate', () => {
  const points = [
    { latitude: 22.3193, longitude: 114.1694 },
    { latitude: 22.2783, longitude: 114.1747 },
  ];
  assert.equal(clusterLamps(points).length, 2);
});

test('keeps the first lamp of a cluster', () => {
  const first = { latitude: 51.5, longitude: -0.12 };
  const out = clusterLamps([first, { latitude: 51.5001, longitude: -0.1201 }]);
  assert.deepEqual(out, [first]);
});

test('merges across the antimeridian', () => {
  const points = [
    { latitude: 0, longitude: 179.9999 },
    { latitude: 0, longitude: -179.9999 },
  ];
  assert.equal(clusterLamps(points).length, 1);
});

test('empty input', () => {
  assert.deepEqual(clusterLamps([]), []);
});
