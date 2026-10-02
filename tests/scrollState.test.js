import { test } from 'node:test';
import assert from 'node:assert/strict';
import { flavorState, currentFlavor } from '../src/scrollState.js';

test('começo da seção mostra o primeiro sabor parado', () => {
  assert.deepEqual(flavorState(0, 4), { from: 0, to: 1, mix: 0 });
});

test('fim da seção mostra o último sabor parado', () => {
  assert.deepEqual(flavorState(1, 4), { from: 3, to: 3, mix: 0 });
});

test('cada sabor tem um ponto exato de repouso', () => {
  assert.deepEqual(flavorState(1 / 3, 4), { from: 1, to: 2, mix: 0 });
  assert.deepEqual(flavorState(2 / 3, 4), { from: 2, to: 3, mix: 0 });
});

test('a troca acontece só nos 40% finais de cada trecho', () => {
  assert.equal(flavorState(0.5 / 3, 4).mix, 0);
  assert.equal(flavorState(0.6 / 3, 4).mix, 0);
  assert.ok(Math.abs(flavorState(0.8 / 3, 4).mix - 0.5) < 1e-9);
});

test('saltos grandes vão direto pro par certo', () => {
  const s = flavorState(0.95, 4);
  assert.equal(s.from, 2);
  assert.equal(s.to, 3);
  assert.ok(s.mix > 0.5 && s.mix <= 1);
});

test('entradas fora do intervalo são limitadas', () => {
  assert.deepEqual(flavorState(-2, 4), flavorState(0, 4));
  assert.deepEqual(flavorState(7, 4), flavorState(1, 4));
  assert.deepEqual(flavorState(NaN, 4), flavorState(0, 4));
});

test('um sabor só nunca troca', () => {
  assert.deepEqual(flavorState(0.7, 1), { from: 0, to: 0, mix: 0 });
});

test('currentFlavor troca na metade da transição', () => {
  assert.equal(currentFlavor({ from: 1, to: 2, mix: 0.49 }), 1);
  assert.equal(currentFlavor({ from: 1, to: 2, mix: 0.5 }), 2);
});
