import { timingSafeEqual, createHash } from 'node:crypto';
import { tg, webhookSecret, escHtml } from '../lib/notify.js';
import { readDb, updateDb } from '../lib/db.js';
import { answerOffer } from './ebay/offers.js';

const same = (a, b) => timingSafeEqual(createHash('sha256').update(String(a)).digest(), createHash('sha256').update(String(b)).digest());
const ACTIONS = { oa: 'Accept', od: 'Decline', oc: 'Counter' };
const DONE = { Accept: '✅ Oferta aceptada', Decline: '❌ Oferta rechazada', Counter: '↩️ Contraoferta enviada' };
const PLATFORM = { poshmark: 'Poshmark', depop: 'Depop', ebay: 'eBay' };

// Telegram llama aquí cuando escribes al bot o pulsas un botón de un aviso.
export default async function handler(req, res) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !same(req.headers['x-telegram-bot-api-secret-token'] || '', webhookSecret())) {
    return res.status(401).end();
  }
  const u = req.body || {};
  try {
    if (u.message?.text) await onMessage(u.message);
    if (u.callback_query) await onButton(u.callback_query);
  } catch (e) {
    console.error('telegram webhook', e);
  }
  res.status(200).json({ ok: true }); // siempre 200 para que Telegram no repita la llamada
}

async function onMessage(m) {
  const [cmd, code] = m.text.trim().split(/\s+/);
  if (cmd !== '/start') return;
  let linked = false;
  await updateDb((db) => {
    linked = Boolean(code) && code === db.settings.telegramLinkCode;
    if (linked) {
      db.settings.telegramChatId = m.chat.id;
      db.settings.telegramLinkCode = null; // el enlace solo sirve una vez
    }
  });
  await tg('sendMessage', {
    chat_id: m.chat.id,
    text: linked
      ? '✅ ¡Listo! Te avisaré aquí de ventas, ofertas y de lo que tengas que borrar en otras plataformas.'
      : 'Para conectar, abre la app → Avisos → «Conectar Telegram».',
  });
}

async function onButton(q) {
  const { data } = await readDb();
  const chatId = q.message?.chat?.id;
  if (!chatId || chatId !== data.settings.telegramChatId) {
    return tg('answerCallbackQuery', { callback_query_id: q.id, text: 'Este chat no está vinculado a la app.' });
  }
  const [kind, a, b, c] = String(q.data || '').split(':');
  let result;
  try {
    if (ACTIONS[kind]) {
      await answerOffer({ listingId: a, offerId: b, action: ACTIONS[kind], price: c });
      result = `${DONE[ACTIONS[kind]]}${c ? ` en $${Number(c).toFixed(2)}` : ''}.`;
    } else if (kind === 'dl') {
      await updateDb((db) => {
        const item = db.items.find((i) => i.id === a);
        if (item?.listings?.[b]) item.listings[b] = { ...item.listings[b], status: 'retirado' };
      });
      result = `✅ Marcado como borrado de ${PLATFORM[b] || b}.`;
    } else {
      result = 'Botón no reconocido.';
    }
  } catch (e) {
    result = `⚠️ ${e.message}`;
  }
  await tg('answerCallbackQuery', { callback_query_id: q.id, text: result.slice(0, 190) });
  // Quita los botones ya usados y deja constancia en el mensaje.
  await tg('editMessageText', {
    chat_id: chatId,
    message_id: q.message.message_id,
    text: `${escHtml(q.message.text || '')}\n\n<b>${escHtml(result)}</b>`,
    parse_mode: 'HTML',
  }).catch(() => {});
}
