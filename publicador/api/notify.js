import { randomBytes } from 'node:crypto';
import { tg, telegramConfigured, webhookSecret } from '../lib/notify.js';
import { readDb, updateDb } from '../lib/db.js';
import { requireAuth } from '../lib/auth.js';

// GET  → estado de Telegram
// POST { action: 'link' } → registra el webhook y devuelve el enlace para vincular tu chat
// POST { action: 'test' } → manda un aviso de prueba
export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (!telegramConfigured()) return res.status(200).json({ configured: false });
  try {
    if (req.method === 'GET') {
      const { data } = await readDb();
      return res.status(200).json({ configured: true, linked: Boolean(data.settings.telegramChatId) });
    }
    const action = req.body?.action;
    if (action === 'link') {
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      await tg('setWebhook', {
        url: `https://${host}/api/telegram`,
        secret_token: webhookSecret(),
        allowed_updates: ['message', 'callback_query'],
      });
      const me = await tg('getMe', {});
      const code = randomBytes(9).toString('hex');
      await updateDb((db) => { db.settings.telegramLinkCode = code; });
      return res.status(200).json({ link: `https://t.me/${me.username}?start=${code}`, bot: me.username });
    }
    if (action === 'test') {
      const { data } = await readDb();
      if (!data.settings.telegramChatId) return res.status(400).json({ error: 'Primero conecta Telegram.' });
      await tg('sendMessage', { chat_id: data.settings.telegramChatId, text: '🔔 Aviso de prueba del Publicador. ¡Funciona!' });
      return res.status(200).json({ ok: true });
    }
    res.status(400).json({ error: 'Acción no válida.' });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
}
