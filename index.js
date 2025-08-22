import 'dotenv/config';
import fetch from 'node-fetch';
import { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, AttachmentBuilder } from 'discord.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const cache = new Map();

const getImages = async (q, skip = []) => {
  const r = await fetch(`http://localhost:8888/search?q=${encodeURIComponent(q)}&format=json&categories=images&engines=google`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const j = await r.json();
  const urls = [];
  for (const x of j.results) {
    if (!x.img_src || x.img_src.startsWith('data:') || skip.includes(x.img_src)) continue;
    try { const h = await fetch(x.img_src, { method: 'HEAD' }); if (!h.ok || !h.headers.get('content-type')?.startsWith('image/')) continue; urls.push(x.img_src); if (urls.length >= 5) break } catch {}
  }
  return urls;
};

const buttons = urls => [
  new ActionRowBuilder().addComponents(urls.map((_, i) => new ButtonBuilder().setCustomId(`pick_${i}`).setLabel(`${i+1}️⃣`).setStyle(ButtonStyle.Primary))),
  new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('refresh').setLabel('🔄').setStyle(ButtonStyle.Secondary))
];

const sendImage = async (ch, url, user) => {
  try {
    const r = await fetch(url), t = r.headers.get('content-type')?.split('/')[1] === 'jpeg' ? 'jpg' : r.headers.get('content-type')?.split('/')[1];
    const buf = Buffer.from(await r.arrayBuffer());
    await ch.send({ content: `${user} выбрал через /pic:`, files: [new AttachmentBuilder(buf, { name: `image.${t}` })], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`delete_${user.id}`).setLabel('🗑️').setStyle(ButtonStyle.Danger))] });
  } catch { await ch.send({ content: `${user} выбрал картинку, но её не удалось загрузить.` }); }
};

client.once('ready', () => console.log(`✅ Logged in as ${client.user.tag}`));

client.on('interactionCreate', async i => {
  if (i.isChatInputCommand() && i.commandName === 'pic') {
    await i.deferReply({ ephemeral: true });
    const q = i.options.getString('query'), urls = await getImages(q);
    if (!urls.length) return i.editReply('Ничего не найдено');
    cache.set(i.user.id, { urls, q });
    return i.editReply({ embeds: urls.map(u => new EmbedBuilder().setImage(u).setFooter({ text: 'Выбери картинку' })), components: buttons(urls) });
  }

  if (!i.isButton()) return;
  const data = cache.get(i.user.id);

  if (i.customId === 'refresh') {
    if (!data) return i.reply({ content: 'Сессия истекла', ephemeral: true });
    await i.deferUpdate();
    try {
      const urls = await getImages(data.q, data.urls);
      if (!urls.length) return i.followUp({ content: 'Новых изображений не найдено', ephemeral: true });
      cache.set(i.user.id, { q: data.q, urls });
      return i.editReply({ embeds: urls.map(u => new EmbedBuilder().setImage(u).setFooter({ text: 'Выбери картинку' })), components: buttons(urls) });
    } catch (e) { console.error(e); return i.followUp({ content: 'Ошибка при обновлении', ephemeral: true }); }
  }

  if (i.customId.startsWith('pick_')) {
    if (!data) return i.reply({ content: 'Сессия истекла', ephemeral: true });
    await sendImage(i.channel, data.urls[parseInt(i.customId.split('_')[1])], i.user);
    return i.update({ content: 'Выбор принят', embeds: [], components: [] });
  }

  if (i.customId.startsWith('delete_')) {
    if (i.user.id !== i.customId.split('_')[1]) return i.reply({ content: 'Вы не можете удалить это сообщение', ephemeral: true });
    await i.message.delete().catch(() => {});
    return i.reply({ content: 'Сообщение удалено', ephemeral: true });
  }
});

client.login(process.env.DISCORD_TOKEN);
