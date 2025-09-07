const { Events, ActivityType } = require("discord.js");
const { createBackend } = require("../backend"); // Impor fungsi backend

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`Bot siap! Login sebagai ${client.user.tag}`);

        client.user.setPresence({
            activities: [
                {
                    name: "Nako Moderator By Gira.",
                    type: ActivityType.Streaming
                }
            ],
            status: "idle"
        });

        console.log(`Status bot berhasil diatur.`);

        // Menjalankan server backend setelah bot benar-benar siap
        createBackend(client);
    }
};
