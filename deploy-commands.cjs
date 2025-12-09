require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
  .setName('pic')
  .setDescription('Показать картинки по запросу')
  .addStringOption(opt =>
  opt.setName('query').setDescription('Ключевое слово').setRequired(true)
  ),
new SlashCommandBuilder()
.setName('help')
.setDescription('шо это за бот и команды'),
// УБРАЛ query ЗДЕСЬ ↑
new SlashCommandBuilder()
.setName('sounds')
.setDescription('Найти и отправить аудио')
.addStringOption(opt =>
opt.setName('query').setDescription('шо искать').setRequired(true)
),
new SlashCommandBuilder()
.setName('ping')
.setDescription('Проверка работы бота')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Регистрирую команды');
    // БОЛЬШИЕ ПИСЬКИ
    await rest.put(
      Routes.applicationCommands('1394773925552062535'),
                   { body: commands }
    );
    console.log('✅ Готово');
  } catch (e) {
    console.error(e);
  }
})();
