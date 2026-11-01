import { test } from 'node:test';
import assert from 'node:assert/strict';
import { forDepop, forPoshmark, hashtags, clip, LIMITS } from '../public/formatters.js';
import { buildAspects, validateListing, makeSku } from '../lib/ebay.js';

const base = {
  title: 'Vestido midi floral Zara', description: 'Precioso vestido, usado dos veces.',
  price: 25, condition: 'like_new', brand: 'Zara', size: 'M', color: 'Azul',
  keywords: 'vintage, Floral, verano, boho, midi, sobra', ebayCategoryId: '63861',
  images: ['https://x.public.blob.vercel-storage.com/a.jpg', 'http://inseguro/b.jpg'],
};

test('hashtags: normaliza, quita duplicados y limita a 5', () => {
  assert.deepEqual(hashtags('Verano, verano, #Boho, café'), ['#verano', '#boho', '#cafe']);
  assert.equal(hashtags(base.keywords).length, 5);
});

test('Depop respeta 1000 caracteres y conserva los hashtags', () => {
  const d = forDepop({ ...base, description: 'x'.repeat(5000) });
  assert.ok(d.description.length <= LIMITS.depopDescription);
  assert.ok(d.description.endsWith('#vintage #floral #verano #boho #midi'));
  assert.equal(d.condition, 'Used - Excellent');
});

test('Poshmark recorta título y descripción', () => {
  const p = forPoshmark({ ...base, title: 't'.repeat(200), description: 'd'.repeat(3000) });
  assert.equal(p.title.length, 80);
  assert.equal(p.description.length, 1500);
  assert.equal(p.condition, 'Like New');
});

test('clip no toca textos cortos', () => assert.equal(clip('hola', 10), 'hola'));

test('eBay: aspects desde campos y líneas extra', () => {
  const a = buildAspects({ ...base, extraAspects: 'Department: Women\nStyle: Midi, Wrap\nsin dos puntos' });
  assert.deepEqual(a, { Brand: ['Zara'], Size: ['M'], Color: ['Azul'], Department: ['Women'], Style: ['Midi', 'Wrap'] });
});

test('eBay: validación descarta fotos http y exige campos', () => {
  const ok = validateListing(base);
  assert.deepEqual(ok.errors, []);
  assert.equal(ok.listing.images.length, 1);
  const bad = validateListing({ title: '', price: 0, condition: 'x', images: [] });
  assert.equal(bad.errors.length, 6);
});

test('eBay: SKU alfanumérico y ≤ 50', () => {
  const s = makeSku('Vestido señora ñ #1 '.repeat(5));
  assert.match(s, /^[A-Z0-9-]+$/);
  assert.ok(s.length <= 50);
});
