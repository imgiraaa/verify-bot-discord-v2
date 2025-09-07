const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '..', '..', '..', 'config.json');

// --- INI BAGIAN YANG DIPERBAIKI ---
// Fungsi sekarang menerima 'guild' secara eksplisit
async function logAction(guild, logEmbed) {
// ------------------------------------
    if (!guild) {
        console.error("Logger dipanggil tanpa referensi guild.");
        return;
    }

    try {
        const configData = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configData);
        const guildConfig = config[guild.id];

        // Menggunakan channel log dari setup utama
        if (!guildConfig || !guildConfig.logChannelId) {
            // console.log(`[${guild.name}] Log channel tidak diatur. Melewatkan log.`);
            return;
        }

        const logChannel = await guild.channels.fetch(guildConfig.logChannelId);
        if (logChannel && logChannel.isTextBased()) {
            await logChannel.send({ embeds: [logEmbed] });
        }
    } catch (error) {
        console.error(`Gagal mengirim log ke server ${guild.name}:`, error.message);
    }
}

module.exports = { logAction };


