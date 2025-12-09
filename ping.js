import os from 'os';

export function setupPing(client) {
    client.on('interactionCreate', async i => {
        if (i.isChatInputCommand() && i.commandName === 'ping') {
            const wsPing = client.ws.ping;
            const uptime = Math.floor(client.uptime / 1000);
            const memory = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

            let connectionStatus = "❌ ХУЙНЯ";
            if (wsPing < 100) connectionStatus = "✅ Хорошее";
            else if (wsPing < 250) connectionStatus = "⚠️ Среднее";

            await i.reply({
                content: `**Статус бота:**\n` +
                `Соединение: ${connectionStatus} (${wsPing}ms)\n` +
                `Аптайм: ${Math.floor(uptime / 3600)}ч ${Math.floor((uptime % 3600) / 60)}м\n` +
                `Память (используемая ботом): ${memory}MB\n` +
                `Система: Fedora 42 (${process.platform} ${process.arch})\n` +  // ТУТ СИСЬКИ СИСЯНДРЫ ПРЯМ ТАКИЕ ОГРОМЕННЫЕ АХУЕТЬ ПРОСТО
                `Node.js: ${process.version}`,
                ephemeral: true
            });
        }
    });
}
