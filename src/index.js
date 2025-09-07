const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { createBackend } = require('./backend.js');
const colors = require('colors');
require('dotenv').config();

const banner = `
  ██████╗ ██╗██████╗  ██████╗  █████╗ ███████╗███████╗    ██████╗  ██████╗ ████████╗
  ██╔══██╗██║██╔══██╗██╔═══██╗██╔══██╗██╔════╝██╔════╝    ██╔══██╗██╔═══██╗╚══██╔══╝
  ██████╔╝██║██████╔╝██║   ██║███████║███████╗███████╗    ██████╔╝██║   ██║   ██║   
  ██╔═══╝ ██║██╔══██╗██║   ██║██╔══██║╚════██║╚════██║    ██╔══██╗██║   ██║   ██║   
  ██║     ██║██║  ██║╚██████╔╝██║  ██║███████║███████║    ██████╔╝╚██████╔╝   ██║   
  ╚═╝     ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝    ╚═════╝  ╚═════╝    ╚═╝   
`.green;

console.log(banner);
console.log('[INFO] Memulai Bot...'.cyan);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
    ]
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[PERINGATAN] Command di ${filePath} tidak memiliki properti "data" atau "execute".`.yellow);
    }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

client.login(process.env.DISCORD_TOKEN);

client.once('ready', () => {
    console.log(`[INFO] Bot siap! Login sebagai ${client.user.tag}`.cyan);
    createBackend(client);
});


