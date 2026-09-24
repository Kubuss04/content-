// Sprawdza spójność słowników PL/EN/DE oraz kompletność tłumaczeń cennika.
// Użycie: node scripts/check-i18n.mjs
import { readFileSync } from 'node:fs';

const langs = ['pl', 'en', 'de'];
const read = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'));

const flatten = (obj, prefix = '') => Object.entries(obj).flatMap(([k, v]) =>
  v && typeof v === 'object' ? flatten(v, `${prefix}${k}.`) : [`${prefix}${k}`]);

const dicts = Object.fromEntries(langs.map((l) => [l, read(`locales/${l}.json`)]));
const keys = Object.fromEntries(langs.map((l) => [l, new Set(flatten(dicts[l]))]));
const errors = [];

for (const l of langs.slice(1)) {
  for (const k of keys.pl) if (!keys[l].has(k)) errors.push(`[${l}] brak klucza: ${k}`);
  for (const k of keys[l]) if (!keys.pl.has(k)) errors.push(`[${l}] nadmiarowy klucz: ${k}`);
}

const pricing = read('data/pricing.json');
const pending = [];
for (const cat of pricing.categories) {
  for (const l of langs) {
    if (!keys[l].has(`pricing.categories.${cat.id}`)) errors.push(`[${l}] brak kategorii: ${cat.id}`);
  }
  for (const item of cat.items) {
    for (const l of langs) {
      if (!keys[l].has(`pricing.items.${item.id}.name`)) errors.push(`[${l}] brak nazwy usługi: ${item.id}`);
    }
    if (item.verified === false || item.price == null) pending.push(`${cat.id}/${item.id}`);
  }
}

if (pending.length) {
  console.log(`Pozycje cennika do weryfikacji/uzupełnienia ceny (${pending.length}):`);
  pending.forEach((p) => console.log(`  - ${p}`));
}
if (errors.length) {
  console.error(`\nBłędy (${errors.length}):`);
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}
console.log(`\n✓ Słowniki ${langs.join('/').toUpperCase()} są spójne (${keys.pl.size} kluczy).`);
