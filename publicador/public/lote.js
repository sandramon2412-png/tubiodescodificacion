// Pestaña "Lote": sube muchas fotos, agrúpalas por artículo y deja que la app
// edite las fotos y escriba cada anuncio. Cada artículo queda como "borrador" en Inventario.
import { mutate, esc, findItem } from './store.js';
import { uploadImage, runStudio, listingToFields } from './studio-api.js';
import { newItem } from './inventory.js';

const $ = (id) => document.getElementById(id);
const GAP_MS = 90_000; // más de 90 s entre fotos = artículo nuevo
let deps;
let photos = []; // { file, preview, time, startsGroup, notes }
let running = false;

const opt = {
  get: () => { try { return JSON.parse(localStorage.getItem('studio')) || {}; } catch { return {}; } },
  set: (v) => { try { localStorage.setItem('studio', JSON.stringify(v)); } catch { /* modo privado */ } },
};

/** Opciones de estudio actuales (estilo de fondo, arrugas, idioma). */
export function studioOptions() {
  return {
    style: $('stStyle').value,
    prompt: $('stPrompt').value.trim(),
    backgroundUrl: $('stBgUrl').value,
    iron: $('stIron').checked,
    language: $('stLang').value,
    kinds: [...document.querySelectorAll('[data-kind]:checked')].map((c) => c.dataset.kind),
    modelName: $('stModel').value,
    aiAvailable: Boolean(deps?.config.ai),
  };
}

export function initLote(d) {
  deps = d;
  const sel = $('stStyle');
  sel.add(new Option('Sin editar (solo la IA escribe)', ''));
  for (const [k, label] of Object.entries(d.config.styles || {})) sel.add(new Option(label, k));
  const saved = opt.get();
  sel.value = saved.style ?? (d.config.photos ? (d.config.ai ? 'auto' : 'boutique') : '');
  if (!d.config.ai) sel.querySelector('option[value="auto"]')?.remove();
  for (const m of d.config.models || []) $('stModel').add(new Option(m[0].toUpperCase() + m.slice(1), m));
  $('stModel').value = saved.modelName || 'avery';
  const kinds = saved.kinds || ['hanger', 'flatlay', 'model', 'background'];
  document.querySelectorAll('[data-kind]').forEach((c) => { c.checked = kinds.includes(c.dataset.kind); });
  $('stPrompt').value = saved.prompt || '';
  $('stBgUrl').value = saved.backgroundUrl || '';
  $('stIron').checked = saved.iron ?? true;
  $('stLang').value = saved.language || 'en';
  if (!d.config.photos) { sel.value = ''; sel.disabled = true; }
  syncStudioUi();
  const save = () => { opt.set(studioOptions()); syncStudioUi(); };
  for (const id of ['stStyle', 'stPrompt', 'stIron', 'stLang', 'stModel']) $(id).addEventListener('change', save);
  document.querySelectorAll('[data-kind]').forEach((c) => c.addEventListener('change', save));

  $('stBgFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    $('stBgPreview').textContent = 'Subiendo…';
    try {
      $('stBgUrl').value = await uploadImage(deps.api, file);
      opt.set(studioOptions());
    } catch (err) { alert(err.message); }
    syncStudioUi();
  });

  $('lotePhotos').addEventListener('change', (e) => {
    addPhotos([...e.target.files]);
    e.target.value = '';
  });
  $('loteGroups').addEventListener('click', onGroupsClick);
  $('loteGroups').addEventListener('input', (e) => {
    const i = e.target.dataset.notes;
    if (i !== undefined) photos[i].notes = e.target.value;
  });
  $('loteRun').addEventListener('click', run);
  $('loteClear').addEventListener('click', () => { if (!running && confirm('¿Quitar todas las fotos del lote?')) { photos = []; render(); } });
  render();
}

function syncStudioUi() {
  const style = $('stStyle').value;
  $('stPromptWrap').hidden = style !== 'personalizado';
  $('stBgWrap').hidden = style !== 'propio';
  $('stModelWrap').hidden = !document.querySelector('[data-kind="model"]').checked;
  $('stKinds').hidden = !style;
  const bg = $('stBgUrl').value;
  $('stBgPreview').innerHTML = bg ? `<img src="${esc(bg)}" alt="Tu fondo">` : 'Aún no has subido tu fondo.';
}

export function groupByTime(items, gap = GAP_MS) {
  const sorted = [...items].sort((a, b) => a.time - b.time);
  const spread = sorted.length > 1 ? sorted.at(-1).time - sorted[0].time : 0;
  const usable = spread > 3000; // si todas tienen la misma hora, la hora no sirve para agrupar
  return {
    usable,
    items: sorted.map((p, i) => ({ ...p, startsGroup: i === 0 || (usable && p.time - sorted[i - 1].time > gap) })),
  };
}

function addPhotos(files) {
  const incoming = files.map((file) => ({ file, preview: URL.createObjectURL(file), time: file.lastModified || Date.now(), notes: '' }));
  const { usable, items } = groupByTime(incoming);
  if (photos.length) items[0].startsGroup = true;
  photos = [...photos, ...items];
  $('loteHint').textContent = usable
    ? 'Agrupé las fotos por la hora en que las tomaste. Toca una foto para que empiece un artículo nuevo (o para unirla al anterior).'
    : 'No pude leer la hora de las fotos: toca la primera foto de cada artículo para separarlos.';
  render();
}

function groups() {
  const out = [];
  photos.forEach((p, i) => {
    if (p.startsGroup || !out.length) out.push({ start: i, photos: [] });
    out.at(-1).photos.push({ ...p, index: i });
  });
  return out;
}

function render() {
  const gs = groups();
  $('loteRun').disabled = running || !gs.length;
  $('loteRun').textContent = gs.length ? `✨ Procesar ${gs.length} artículo(s)` : '✨ Procesar';
  $('loteGroups').innerHTML = gs.map((g, n) => `
    <section class="card loteGroup" data-group="${g.start}">
      <div class="itemHead"><h3>Artículo ${n + 1}</h3><span class="badge" id="gstatus-${g.start}">${esc(g.status || `${g.photos.length} foto(s)`)}</span></div>
      <div class="thumbs">${g.photos.map((p) => `
        <figure class="${p.startsGroup ? 'starts' : ''}">
          <img src="${esc(p.preview)}" alt="" data-toggle="${p.index}" title="Tocar: empezar/unir artículo">
          <button type="button" data-remove="${p.index}" title="Quitar">×</button>
        </figure>`).join('')}
      </div>
      <input placeholder="Notas para la IA (opcional): talla, medidas, lo que pagaste…" data-notes="${g.start}" value="${esc(photos[g.start].notes)}">
      <div class="row wrap" id="gactions-${g.start}"></div>
    </section>`).join('');
}

function onGroupsClick(e) {
  if (running) return;
  const t = e.target.dataset;
  if (t.toggle !== undefined) {
    const i = Number(t.toggle);
    if (i > 0) photos[i].startsGroup = !photos[i].startsGroup;
    render();
  } else if (t.remove !== undefined) {
    const i = Number(t.remove);
    const wasStart = photos[i].startsGroup;
    photos.splice(i, 1);
    if (wasStart && photos[i]) photos[i].startsGroup = true;
    render();
  }
}

const setStatus = (g, text, cls = '') => {
  const el = $(`gstatus-${g.start}`);
  if (el) { el.textContent = text; el.className = `badge ${cls}`; }
};

async function run() {
  const gs = groups();
  const o = studioOptions();
  const edit = Boolean(o.style) && deps.config.photos && o.kinds.length > 0;
  const write = deps.config.ai;
  if (!edit && !write) return alert('Configura ANTHROPIC_API_KEY y/o PHOTOROOM_API_KEY en Vercel para usar el estudio.');
  if (o.style === 'propio' && !o.backgroundUrl) return alert('Sube primero la foto de tu fondo.');
  const scenes = o.kinds.filter((k) => k !== 'background').length;
  const nPhotos = gs.reduce((s, g) => s + scenes + (o.kinds.includes('background') ? g.photos.length : 0), 0);
  const plan = [edit && `crear hasta ${nPhotos} foto(s)`, write && `escribir ${gs.length} anuncio(s) con IA`].filter(Boolean).join(' y ');
  if (!confirm(`Voy a ${plan}. Cada foto creada gasta créditos de Photoroom. ¿Continuar?`)) return;

  running = true;
  $('loteRun').disabled = true;
  let ok = 0;
  for (const g of gs) {
    try {
      setStatus(g, 'Subiendo fotos…');
      const urls = [];
      for (const p of g.photos) urls.push(await uploadImage(deps.api, p.file));

      const r = await runStudio(deps.api, {
        urls, notes: photos[g.start].notes, opts: edit ? o : { ...o, kinds: [] }, write,
        onProgress: (t) => setStatus(g, t),
      });
      const fields = r.ai ? listingToFields(r.ai, { usedFlatlay: r.usedFlatlay, language: o.language }) : {};
      const failedEdits = r.failures.length;
      const { categories, catSearch, ...data } = fields;
      let id;
      mutate((db) => {
        const item = newItem({
          title: `Artículo del lote ${new Date().toLocaleDateString()}`,
          ...data,
          price: Number(data.price) || 0,
          notes: photos[g.start].notes,
          images: r.images,
          originalImages: urls,
          status: 'borrador',
          aiNotes: [data.aiNotes, failedEdits && `⚠ ${failedEdits} foto(s) no se pudieron crear.`, edit && '👀 Revisa que la prenda se vea igual que la real en las fotos creadas con IA.'].filter(Boolean).join('\n'),
        });
        id = item.id;
        db.items.push(item);
      });
      ok += 1;
      setStatus(g, failedEdits ? `Listo (${failedEdits} foto sin editar)` : 'Listo ✓', 'disponible');
      const actions = $(`gactions-${g.start}`);
      if (actions) {
        const b = Object.assign(document.createElement('button'), { type: 'button', textContent: 'Revisar y publicar' });
        b.onclick = () => deps.loadIntoForm(findItem(id));
        actions.append(b);
      }
    } catch (e) {
      setStatus(g, `Error: ${e.message}`, 'err');
    }
  }
  running = false;
  $('loteRun').disabled = false;
  alert(`${ok} de ${gs.length} artículo(s) listos. Están en Inventario como «Borrador»: revísalos y publícalos.`);
}
