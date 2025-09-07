const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { createBackend } = require('./backend.js');
const colors = require('colors'); // Pastikan 'colors' diimpor

// --- PERUBAHAN UTAMA UNTUK VERCEL ---
// Menggunakan dotenv hanya jika tidak di lingkungan produksi (seperti di Termux)
// Di Vercel, variabel akan dimuat secara otomatis
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

// Membaca token langsung dari Environment Variables
const token = process.env.DISCORD_TOKEN;
// ------------------------------------

const banner = `
  ██████╗ ██╗██████╗  █████╗  ██████╗ ███████╗
  ██╔════╝ ██║██╔══██╗██╔══██╗██╔════╝ ██╔════╝
  ██║  ███╗██║██████╔╝███████║██║  ███╗███████╗
  ██║   ██║██║██╔══██╗██╔══██║██║   ██║╚════██║
  ╚██████╔╝██║██║  ██║██║  ██║╚██████╔╝███████║
   ╚═════╝ ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
                                         Bot
`.cyan;

console.log(banner);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers, // Diperlukan untuk event member baru
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

// Memastikan bot hanya login jika token benar-benar ada
if (!token) {
    console.error('[FATAL] DISCORD_TOKEN tidak ditemukan! Pastikan sudah diatur di Environment Variables Vercel.'.red);
    process.exit(1); // Menghentikan proses jika token tidak ditemukan
}

client.login(token);

// Menjalankan server backend
createBackend(client);


