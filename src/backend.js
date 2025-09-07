const express = require('express');
const cors = require('cors');
const { logAction } = require('./utils/logger');
const { createSuccessEmbed, createLogEmbed, createComplaintEmbed, emojis } = require('./utils/embeds');
const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '..', 'config.json');

module.exports = {
    createBackend: function(client) {
        const app = express();
        // Railway akan memberikan port secara otomatis melalui variabel ini
        const port = process.env.PORT || 3000;

        app.use(cors()); // Izin keamanan wajib ada
        app.use(express.json());

        // Endpoint untuk mengecek apakah server hidup
        app.get('/', (req, res) => {
            res.send('Backend Girabase Bot Aktif!');
        });

        app.post('/verify', async (req, res) => {
            const { userId, guildId } = req.body;
            if (!userId || !guildId) return res.status(400).json({ success: false, message: 'Data tidak lengkap.' });

            try {
                const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                const config = configData[guildId];
                if (!config) throw new Error('Konfigurasi server tidak ditemukan.');

                const guild = await client.guilds.fetch(guildId);
                const member = await guild.members.fetch(userId);
                const verifiedRole = await guild.roles.fetch(config.verifiedRoleId);
                if (!guild || !member || !verifiedRole) throw new Error('Guild, member, atau role tidak ditemukan.');

                await member.roles.add(verifiedRole);
                if (config.unverifiedRoleId) {
                    await member.roles.remove(config.unverifiedRoleId).catch(() => {});
                }

                await member.send({ embeds: [createSuccessEmbed(`Anda telah berhasil diverifikasi di server **${guild.name}**!`)] }).catch(() => {});
                
                const logEmbed = createLogEmbed(`${emojis.success} Verifikasi Sukses`, `Pengguna ${member.user} berhasil verifikasi via web.`, member.user);
                await logAction(guild, logEmbed);

                res.status(200).json({ success: true, message: 'Verifikasi berhasil!' });
            } catch (error) {
                console.error('Error di backend /verify:', error);
                res.status(500).json({ success: false, message: 'Terjadi kesalahan internal.' });
            }
        });

        app.listen(port, () => {
            console.log(`[Backend] Server API berjalan di port ${port}`.green);
        });
    }
};


