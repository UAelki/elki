const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Список товаров
app.get('/api/products', (req, res) => {
  const data = fs.readFileSync(path.join(__dirname, 'public', 'products.json'), 'utf-8');
  res.json(JSON.parse(data));
});

// Оформление заказа
app.post('/api/order', async (req, res) => {
  try {
    const { name, phone, items } = req.body;

    if (!name || !phone || !items || !items.length) {
      return res.status(400).json({ ok: false, error: 'Заполните имя, телефон и корзину' });
    }

    let total = 0;
    let lines = items.map((it) => {
      const price = parseInt(String(it.price).replace(/[^\d]/g, ''), 10) || 0;
      total += price * it.qty;
      return `• ${it.title} — ${it.qty} шт. — ${it.price}`;
    });

    const text =
      `🎄 Новый заказ\n\n` +
      `👤 Имя: ${name}\n` +
      `📞 Телефон: ${phone}\n\n` +
      `Товары:\n${lines.join('\n')}\n\n` +
      `💰 Итого: ${total} грн`;

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    const tgRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text }),
    });

    const tgData = await tgRes.json();

    if (!tgData.ok) {
      console.error('Telegram error:', tgData);
      return res.status(500).json({ ok: false, error: 'Не удалось отправить заказ' });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Ошибка сервера' });
  }
});

app.listen(PORT, () => {
  console.log(`Server on port ${PORT}`);
  console.log(`Открой: ${SITE_URL}`);
});
