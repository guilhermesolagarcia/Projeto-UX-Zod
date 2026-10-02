import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFizz } from '../src/sfx.js';

function fakeAudio() {
  const log = { created: 0, started: 0 };
  const node = () => ({ connect(n) { return n; }, frequency: { value: 0 }, Q: { value: 0 }, gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} } });
  class Ctx {
    constructor() { log.created++; this.sampleRate = 8000; this.currentTime = 0; this.destination = {}; }
    createBuffer(_c, len) { return { getChannelData: () => new Float32Array(len) }; }
    createBufferSource() { return { ...node(), start() { log.started++; } }; }
    createBiquadFilter() { return node(); }
    createGain() { return node(); }
  }
  return { Ctx, log };
}

test('não cria áudio nem toca nada enquanto o som está desligado', () => {
  const { Ctx, log } = fakeAudio();
  const fizz = createFizz({ AudioCtx: Ctx });
  fizz.play();
  assert.equal(log.created, 0);
  assert.equal(log.started, 0);
  assert.equal(fizz.enabled, false);
});

test('ligar cria o contexto uma vez e tocar dispara o som', () => {
  const { Ctx, log } = fakeAudio();
  const fizz = createFizz({ AudioCtx: Ctx });
  assert.equal(fizz.toggle(), true);
  fizz.play(); fizz.play();
  assert.equal(log.created, 1);
  assert.equal(log.started, 2);
});

test('desligar de novo silencia', () => {
  const { Ctx, log } = fakeAudio();
  const fizz = createFizz({ AudioCtx: Ctx });
  fizz.toggle(); fizz.toggle();
  fizz.play();
  assert.equal(log.started, 0);
});

test('sem suporte a áudio, ligar não quebra', () => {
  const fizz = createFizz({ AudioCtx: undefined });
  assert.doesNotThrow(() => { fizz.toggle(); fizz.play(); });
});
