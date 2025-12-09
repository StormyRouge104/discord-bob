import fetch from 'node-fetch';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, AttachmentBuilder } from 'discord.js';

const cache = new Map();

const getImages = async (q, skip = []) => {
    // ТВОЙ КОД getImages
    try {
        const j = await (await fetch(`http://localhost:8888/search?q=${encodeURIComponent(q)}&format=json&categories=images&engines=google`)).json();
        const urls = [];
        for (const x of j.results) {
            if (!x.img_src || x.img_src.startsWith('data:') || skip.includes(x.img_src)) continue;
            try {
                const ct = (await fetch(x.img_src, { method: 'HEAD' })).headers.get('content-type') || '';
                if (!ct.startsWith('image/') || ct.includes('webp')) continue;
                urls.push(x.img_src); if (urls.length >= 5) break;
            } catch {}
        }
        return urls;
    } catch (error) {
        console.error('Ошибка поиска изображений:', error);
        return [];
    }
};

const buttons = urls => [
    new ActionRowBuilder().addComponents(urls.map((_, i) =>
    new ButtonBuilder().setCustomId(`pick_${i}`).setLabel(`${i+1}`).setStyle(ButtonStyle.Primary)
    )),
new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('refresh').setLabel('🔄').setStyle(ButtonStyle.Secondary)
)
];

const sendImage = async (ch, url, user) => {
    try {
        const r = await fetch(url);
        const t = r.headers.get('content-type')?.split('/')[1].replace('jpeg', 'jpg') || 'jpg';
        const buf = Buffer.from(await r.arrayBuffer());
        await ch.send({
            content: `${user} выбрал через /pic:`,
            files: [new AttachmentBuilder(buf, { name: `image.${t}` })],
                      components: [new ActionRowBuilder().addComponents(
                          new ButtonBuilder().setCustomId(`delete_${user.id}`).setLabel('🗑️').setStyle(ButtonStyle.Danger)
                      )]
        });
    } catch (error) {
        console.error('Ошибка отправки изображения:', error);
        await ch.send(`${user} выбрал картинку, но она не загрузилась`).catch(() => {});
    }
};

export function setupPic(client) {
    client.on('interactionCreate', async i => {
        try {
            if (i.isChatInputCommand() && i.commandName === 'pic') {
                await i.deferReply({ ephemeral: true }).catch(() => { });
                const q = i.options.getString('query'), urls = await getImages(q);
                if (!urls.length) return i.editReply('Ничего не найдено').catch(() => { });

                const embeds = urls.map(u => new EmbedBuilder().setImage(u));
                cache.set(i.user.id, {
                    urls,
                    q,
                    allSeenUrls: [...urls]
                });
                return i.editReply({ embeds, components: buttons(urls) }).catch(() => { });
            }

            if (!i.isButton()) return;
            const data = cache.get(i.user.id);
            if (!data) return i.reply({ content: 'Сессия истекла', ephemeral: true }).catch(() => {});

            if (i.customId === 'refresh') {
                await i.deferUpdate().catch(() => { });
                const urls = await getImages(data.q, data.allSeenUrls || []);
                if (!urls.length) return i.followUp({ content: 'Новых нет', ephemeral: true }).catch(() => {});

                const updatedAllSeenUrls = [...(data.allSeenUrls || []), ...urls];
                cache.set(i.user.id, {
                    urls,
                    q: data.q,
                    allSeenUrls: updatedAllSeenUrls
                });

                return i.editReply({ embeds: urls.map(u => new EmbedBuilder().setImage(u)), components: buttons(urls) }).catch(() => { });
            }

            if (i.customId.startsWith('pick_')) {
                const idx = +i.customId.split('_')[1];
                const url = data.urls[idx];
                if (!url) return i.reply({ content: 'Ошибка, изображения нет', ephemeral: true }).catch(() => {});

                await sendImage(i.channel, url, i.user);
                await i.deferUpdate().catch(() => { });
                return i.editReply({ content: 'Выбор принят', embeds: [], components: [] }).catch(() => { });
            }

            if (i.customId.startsWith('delete_')) {
                if (i.user.id !== i.customId.split('_')[1]) return i.reply({ content: 'Не ваше', ephemeral: true }).catch(() => {});
                await i.message.delete().catch(() => { });
                return i.reply({ content: 'Удалено', ephemeral: true }).catch(() => {});
            }
        } catch (error) {
            console.error('Ошибка в обработчике взаимодействий:', error);
            try {
                if (i.isRepliable()) {
                    await i.reply({ content: 'Произошла ошибка', ephemeral: true }).catch(() => {});
                }
            } catch {}
        }
    });
}
