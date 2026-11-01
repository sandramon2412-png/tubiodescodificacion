import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildEditUrl, resolveLook, STYLES } from '../lib/photo.js';
import { cleanListing, buildSystemPrompt } from '../lib/ai.js';
import { priceStats } from '../lib/ebay.js';

const q = (u) => new URL(u).searchParams;

test('Photoroom: fondo vintage con prompt, semilla, sombra y arrugas', () => {
  const p = q(buildEditUrl({ imageUrl: 'https://b/x.jpg', style: 'boutique', iron: true, seed: 42 }));
  assert.equal(p.get('imageUrl'), 'https://b/x.jpg');
  assert.equal(p.get('background.prompt'), STYLES.boutique.backdrop);
  assert.equal(p.get('background.seed'), '42');
  assert.equal(p.get('ironing.mode'), 'ai.auto');
  assert.equal(p.get('shadow.mode'), 'ai.auto-with-overrides');
  assert.equal(p.get('export.format'), 'jpeg');
});

test('Photoroom: blanco, fondo propio y personalizado', () => {
  assert.equal(q(buildEditUrl({ imageUrl: 'https://b/x.jpg', style: 'blanco' })).get('background.color'), 'FFFFFF');
  assert.equal(q(buildEditUrl({ imageUrl: 'https://b/x.jpg', style: 'propio', backgroundUrl: 'https://b/bg.jpg' })).get('background.imageUrl'), 'https://b/bg.jpg');
  assert.throws(() => buildEditUrl({ imageUrl: 'https://b/x.jpg', style: 'propio' }), /fondo/);
  assert.equal(q(buildEditUrl({ imageUrl: 'https://b/x.jpg', style: 'personalizado', prompt: 'pink velvet' })).get('background.prompt'), 'pink velvet');
  assert.equal(q(buildEditUrl({ imageUrl: 'https://b/x.jpg', style: 'blanco' })).get('ironing.mode'), null);
});

test('IA: limpia título, palabras clave y precio', () => {
  const l = cleanListing({ title: '  Zara  Floral Midi Dress Women\'s M Boho Cottagecore Ruffle Hem Vintage Style Summer Sundress Extra ', keywords: ['Boho', 'boho', ' midi', ''], suggestedPrice: 24.999 });
  assert.ok(l.title.length <= 80 && !l.title.endsWith(' '));
  assert.deepEqual(l.keywords, ['Boho', 'midi']);
  assert.equal(l.suggestedPrice, 25);
  const odd = cleanListing({ title: 'x', keywords: [], suggestedPrice: 1, condition: 'mint', look: { modelScene: 'moon' }, detailPhotoIndexes: [1, -1, 2.5] });
  assert.equal(odd.condition, 'good');
  assert.equal(odd.look.modelScene, 'goldenlight');
  assert.deepEqual(odd.detailPhotoIndexes, [1]);
});

test('IA: el idioma del anuncio llega al prompt', () => {
  assert.match(buildSystemPrompt('es'), /title, description, keywords and color in Spanish/);
  assert.match(buildSystemPrompt('xx'), /in English/);
});

test('precios de referencia: cuartiles', () => {
  assert.deepEqual(priceStats([10, 20, 30, 40, 50], 'q'), { query: 'q', count: 5, low: 20, median: 30, high: 40 });
  assert.deepEqual(priceStats([]), { query: '', count: 0 });
});

test('lote: agrupa por hora y detecta horas inútiles', async () => {
  const { groupByTime } = await import('../public/lote.js');
  const t = (s) => ({ time: s * 1000 });
  const g = groupByTime([t(0), t(20), t(300), t(310), t(1000)]);
  assert.equal(g.usable, true);
  assert.deepEqual(g.items.map((p) => p.startsGroup), [true, false, true, false, true]);
  const same = groupByTime([t(5), t(5), t(5)]);
  assert.equal(same.usable, false);
  assert.deepEqual(same.items.map((p) => p.startsGroup), [true, false, false]);
});

const boho = { backdrop: 'boho room', hanger: 'an old wooden door', flatlay: 'a persian rug with a straw hat', modelScene: 'countryside', modelVibe: 'boho festival' };

test('look: en automático manda la IA; con estilo fijo manda el estilo', () => {
  assert.equal(resolveLook('auto', boho).hanger, 'an old wooden door');
  assert.equal(resolveLook('deportivo', boho).hanger, STYLES.deportivo.hanger);
  assert.equal(resolveLook('auto', null).hanger, STYLES.boutique.hanger, 'sin IA usa boutique');
  assert.equal(resolveLook('auto', { ...boho, modelScene: 'luna' }).modelScene, STYLES.boutique.modelScene, 'escena inválida');
  assert.equal(resolveLook('personalizado', boho).flatlay, boho.flatlay, 'personalizado toma las escenas de la IA');
});

test('Photoroom: colgada en gancho con Edit With AI', () => {
  const p = q(buildEditUrl({ imageUrl: 'https://b/x.jpg', kind: 'hanger', style: 'auto', look: boho }));
  assert.equal(p.get('editWithAI.mode'), 'ai.auto');
  assert.match(p.get('editWithAI.prompt'), /wooden clothes hanger against an old wooden door/);
  assert.match(p.get('editWithAI.prompt'), /exactly as it is/);
  assert.equal(p.get('removeBackground'), 'false');
  assert.equal(p.get('background.prompt'), null);
});

test('Photoroom: en el piso con accesorios (Flat Lay)', () => {
  const p = q(buildEditUrl({ imageUrl: 'https://b/x.jpg', kind: 'flatlay', style: 'auto', look: boho }));
  assert.equal(p.get('flatLay.mode'), 'ai.auto');
  assert.match(p.get('flatLay.prompt'), /persian rug with a straw hat/);
  assert.equal(p.get('flatLay.size'), 'SQUARE_HD');
});

test('Photoroom: en modelo (Virtual Model) con escena según el estilo', () => {
  const p = q(buildEditUrl({ imageUrl: 'https://b/x.jpg', kind: 'model', style: 'auto', look: boho, modelName: 'maya' }));
  assert.equal(p.get('virtualModel.mode'), 'ai.auto');
  assert.equal(p.get('virtualModel.model.preset.name'), 'maya');
  assert.equal(p.get('virtualModel.scene.preset.name'), 'countryside');
  assert.equal(p.get('virtualModel.prompt'), 'boho festival');
  assert.equal(p.get('referenceBox'), 'originalImage');
  const bad = q(buildEditUrl({ imageUrl: 'https://b/x.jpg', kind: 'model', style: 'deportivo', modelName: 'nadie' }));
  assert.equal(bad.get('virtualModel.model.preset.name'), 'avery');
  assert.equal(bad.get('virtualModel.scene.preset.name'), 'concretestudio');
});
