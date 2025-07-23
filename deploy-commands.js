require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('pic')
    .setDescription('Показать рандомные картинки по запросу')
    .addStringOption(opt =>
      opt.setName('query').setDescription('Ключевое слово').setRequired(true)
    )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('📤 Регистрирую команды...');
    await rest.put(
      Routes.applicationCommands('1394773925552062535'),
      { body: commands }
    );
    console.log('✅ Готово');
  } catch (e) {
    console.error(e);
  }
})();
