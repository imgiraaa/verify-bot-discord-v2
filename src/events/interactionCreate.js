const { Events, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { createErrorEmbed, createWarningEmbed, createSuccessEmbed, createLogEmbed, emojis } = require('../utils/embeds');
const { logAction } = require('../utils/logger');
const configPath = path.join(__dirname, '..', '..', 'config.json');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        try {
            if (interaction.isChatInputCommand()) {
                const command = interaction.client.commands.get(interaction.commandName);
                if (!command) {
                    console.error(`No command matching ${interaction.commandName} was found.`);
                    return;
                }
                await command.execute(interaction);
            } 
            else if (interaction.isModalSubmit()) {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                if (!config[interaction.guild.id]) config[interaction.guild.id] = {};

                if (interaction.customId === 'setupUtamaModal') {
                    config[interaction.guild.id].websiteUrl = interaction.fields.getTextInputValue('websiteUrl');
                    config[interaction.guild.id].verifiedRoleId = interaction.fields.getTextInputValue('verifiedRoleId');
                    config[interaction.guild.id].unverifiedRoleId = interaction.fields.getTextInputValue('unverifiedRoleId') || null;
                    config[interaction.guild.id].accountAge = interaction.fields.getTextInputValue('accountAge') || '30';
                    config[interaction.guild.id].welcomeChannelId = interaction.fields.getTextInputValue('welcomeChannelId') || null;
                    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
                    await interaction.reply({ content: 'Konfigurasi utama berhasil disimpan!', ephemeral: true });
                }
                else if (interaction.customId === 'setupPesanModal') {
                    config[interaction.guild.id].title = interaction.fields.getTextInputValue('title');
                    config[interaction.guild.id].description = interaction.fields.getTextInputValue('description');
                    config[interaction.guild.id].welcomeMessage = interaction.fields.getTextInputValue('welcomeMessage') || null;
                    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
                    await interaction.reply({ content: 'Konfigurasi pesan berhasil disimpan!', ephemeral: true });
                }
            }
            else if (interaction.isButton()) {
                if (interaction.customId === 'startVerificationV3') {
                    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                    const config = configData[interaction.guild.id];
                    if (!config || !config.websiteUrl || !config.verifiedRoleId) {
                        return interaction.reply({ content: "Sistem verifikasi belum diatur sepenuhnya. Harap hubungi admin.", ephemeral: true });
                    }

                    if (interaction.member.roles.cache.has(config.verifiedRoleId)) {
                        return interaction.reply({ embeds: [createErrorEmbed("Verifikasi gagal! Akun Anda sudah terverifikasi.")], ephemeral: true });
                    }

                    const requiredAgeInDays = parseInt(config.accountAge || '30', 10);
                    const accountAgeInDays = Math.floor((Date.now() - interaction.user.createdAt.getTime()) / (1000 * 60 * 60 * 24));

                    if (accountAgeInDays < requiredAgeInDays) {
                        const timeLeft = requiredAgeInDays - accountAgeInDays;
                        const warningMessage = `Akun Anda harus berumur minimal **${requiredAgeInDays} hari**.\n\n` +
                                               `**Umur Akun Anda:** ${accountAgeInDays} hari.\n` +
                                               `Silakan coba lagi dalam **${timeLeft} hari**.`;
                        const warningEmbed = createWarningEmbed('Verifikasi Ditolak', warningMessage);
                        // --- INI BAGIAN YANG DIPERBAIKI ---
                        const logEmbed = createLogEmbed(`${emojis.warning} Verifikasi Ditolak (Akun Baru)`, `Pengguna ${interaction.user} ditolak karena umur akun baru ${accountAgeInDays} hari.`, interaction.user);
                        await logAction(interaction.guild, logEmbed);
                        // ------------------------------------
                        return interaction.reply({ embeds: [warningEmbed], ephemeral: true });
                    }

                    const verificationUrl = `${config.websiteUrl}?userId=${interaction.user.id}&guildId=${interaction.guild.id}`;
                    const linkEmbed = new EmbedBuilder()
                        .setColor('#2b2d31')
                        .setTitle(`${emojis.warning} Satu Langkah Lagi!`)
                        .setDescription(`Untuk menyelesaikan verifikasi, silakan klik tombol di bawah untuk melanjutkan di browser Anda.`);
                    const linkButton = new ButtonBuilder()
                        .setLabel('Lanjutkan Verifikasi')
                        .setStyle(ButtonStyle.Link)
                        .setURL(verificationUrl)
                        .setEmoji('🔗');
                    const row = new ActionRowBuilder().addComponents(linkButton);
                    
                    // --- INI BAGIAN YANG DIPERBAIKI ---
                    const logEmbed = createLogEmbed(`${emojis.success} Verifikasi Dimulai`, `Pengguna ${interaction.user} memulai verifikasi via web.`, interaction.user);
                    await logAction(interaction.guild, logEmbed);
                    // ------------------------------------
                    
                    await interaction.reply({
                        embeds: [linkEmbed],
                        components: [row],
                        ephemeral: true
                    });
                }
            }
        } catch (error) {
            console.error('Terjadi error pada interactionCreate:', error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Terjadi kesalahan saat memproses permintaan Anda.', ephemeral: true });
            } else {
                await interaction.reply({ content: 'Terjadi kesalahan saat memproses permintaan Anda.', ephemeral: true });
            }
        }
    }
};


