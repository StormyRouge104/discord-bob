import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

client.once('ready', () => console.log(`✅ Logged in as ${client.user.tag}`));

import { setupPic } from './pic.js';
setupPic(client);

import { setupSound } from './sounds.js';
setupSound(client);

import { setupPing } from './ping.js';
setupPing(client);

import { setupHelp } from './help.js';
setupHelp(client);

client.login(process.env.DISCORD_TOKEN);
