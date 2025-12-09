import 'dotenv/config';
import { REST, Routes } from 'discord.js';

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    const commands = await rest.get(Routes.applicationCommands('1394773925552062535'));
    console.log('Зарегистрированные команды:', commands.map(c => c.name));
})();
