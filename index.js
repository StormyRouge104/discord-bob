import 'dotenv/config';
import fetch from 'node-fetch';
import {
  Client, GatewayIntentBits,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  EmbedBuilder, InteractionType
} from 'discord.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const imageCache = new Map();

client.once('ready', () => console.log(`✅ Logged in as ${client.user.tag}`));

async function getImages(query, exclude = []) {
  const res = await fetch(
    `http://localhost:8888/search?q=${encodeURIComponent(query)}&format=json&categories=images&engines=google`,
    { headers: { 'User-Agent': 'Mozilla/5.0' } }
  );
  const data = await res.json();
  const fresh = data.results
    .filter(r => r.img_src && !r.img_src.startsWith('data:'))
    .map(r => r.img_src)
    .filter(url => !exclude.includes(url));
  return fresh.slice(0, 5);
}

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== 'pic') return;

  await interaction.deferReply({ ephemeral: true });
  const query = interaction.options.getString('query');
  const urls = await getImages(query);
  if (!urls.length) return interaction.editReply('Ничего не найдено.');

  imageCache.set(interaction.user.id, { query, urls });

  const embeds = urls.map((url, i) => new EmbedBuilder().setImage(url).setFooter({ text: `Выбери картинку` }));

  const row1 = new ActionRowBuilder().addComponents(
    urls.map((_, i) => new ButtonBuilder()
      .setCustomId(`pick_${i}`)
      .setLabel(`${i + 1}️⃣`)
      .setStyle(ButtonStyle.Primary))
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('refresh')
      .setLabel('🔄')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.editReply({ embeds, components: [row1, row2] });
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;
  const data = imageCache.get(interaction.user.id);
  if (!data) return interaction.reply({ content: 'Сессия истекла', ephemeral: true });

  if (interaction.customId === 'refresh') {
    const allPrev = data.urls;
    const newUrls = await getImages(data.query, allPrev);
    if (!newUrls.length) return interaction.reply({ content: 'Новых изображений не найдено.', ephemeral: true });

    imageCache.set(interaction.user.id, { query: data.query, urls: newUrls });

    const newEmbeds = newUrls.map(url => new EmbedBuilder().setImage(url).setFooter({ text: `Выбери картинку` }));
    const row1 = new ActionRowBuilder().addComponents(
      newUrls.map((_, i) => new ButtonBuilder()
        .setCustomId(`pick_${i}`)
        .setLabel(`${i + 1}️⃣`)
        .setStyle(ButtonStyle.Primary))
    );
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('refresh')
        .setLabel('🔄')
        .setStyle(ButtonStyle.Secondary)
    );

    try {
      await interaction.update({ embeds: newEmbeds, components: [row1, row2] });
    } catch (err) {
      console.error(err);
    }
    return;
  }

  if (interaction.customId.startsWith('pick_')) {
    const index = parseInt(interaction.customId.split('_')[1]);
    const imageUrl = data.urls[index];

    try {
      await interaction.update({ content: 'Выбор принят', embeds: [], components: [] });
      await interaction.channel.send({ content: `${interaction.user} выбрал via /pic:`, files: [imageUrl] });
    } catch (err) {
      console.error(err);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
