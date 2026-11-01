// Avisos: se guardan en la app (db.notifications) y, si está configurado, llegan por Telegram
// con botones (aceptar oferta, "ya lo borré"...).
import { createHash, randomUUID } from 'node:crypto';

export const telegramConfigured = () => Boolean(process.env.TELEGRAM_BOT_TOKEN);

/** Secreto que Telegram envía en cada llamada al webhook (derivado de APP_PASSWORD). */
export const webhookSecret = () =>
  createHash('sha256').update(`${process.env.APP_PASSWORD || ''}:telegram`).digest('hex').slice(0, 48);

export async function tg(method, body) {
  const r = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!data.ok) throw new Error(`Telegram: ${data.description || r.status}`);
  return data.result;
}

export const escHtml = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

/**
 * Crea un aviso dentro de db (muta db) y lo devuelve para enviarlo después de guardar.
 * buttons: [[{ text, data }]] → botones de Telegram (data ≤ 64 bytes).
 */
export function addNotification(db, { text, kind = 'info', itemId, urgent = false, buttons = [] }) {
  const n = { id: randomUUID(), at: new Date().toISOString(), kind, text, itemId, urgent, read: false, buttons };
  db.notifications.push(n);
  return n;
}

/** Envía por Telegram los avisos nuevos (si hay chat vinculado). Nunca lanza error. */
export async function deliver(notifications, chatId) {
  if (!telegramConfigured() || !chatId || !notifications.length) return 0;
  let sent = 0;
  for (const n of notifications) {
    try {
      await tg('sendMessage', {
        chat_id: chatId,
        text: n.text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: n.buttons?.length
          ? { inline_keyboard: n.buttons.map((row) => row.map((b) => ({ text: b.text, callback_data: b.data }))) }
          : undefined,
      });
      sent += 1;
    } catch { /* un aviso fallido no debe parar los demás */ }
  }
  return sent;
}
