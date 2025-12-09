export function setupSound(client) {
    client.on('interactionCreate', async i => {
        if (i.isChatInputCommand() && i.commandName === 'sounds') {
            await i.reply({ content: 'KOK', ephemeral: true });
        }
    });
}
