const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { createPanelEmbed, emojis } = require('../utils/embeds');
const configPath = path.join(__dirname, '..', '..', 'config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verifikasi')
        .setDescription('Perintah terkait sistem verifikasi V3.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup-utama')
                .setDescription('Mengatur konfigurasi utama (URL, Role, Channel).')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup-pesan')
                .setDescription('Mengatur pesan-pesan yang dikirim oleh bot.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Menampilkan konfigurasi verifikasi saat ini.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('kirim')
                .setDescription('Mengirim panel verifikasi ke channel yang dipilih.')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel tujuan untuk mengirim panel.')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const configData = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configData);
        const guildConfig = config[interaction.guild.id] || {};

        if (subcommand === 'setup-utama') {
            const modal = new ModalBuilder().setCustomId('setupUtamaModal').setTitle('Konfigurasi Utama Verifikasi');
            
            const urlInput = new TextInputBuilder().setCustomId('websiteUrl').setLabel("URL Website Verifikasi").setStyle(TextInputStyle.Short).setRequired(true).setValue(guildConfig.websiteUrl || '');
            const verifiedRoleInput = new TextInputBuilder().setCustomId('verifiedRoleId').setLabel("ID Role Terverifikasi").setStyle(TextInputStyle.Short).setRequired(true).setValue(guildConfig.verifiedRoleId || '');
            const unverifiedRoleInput = new TextInputBuilder().setCustomId('unverifiedRoleId').setLabel("ID Role Belum Verifikasi (Opsional)").setStyle(TextInputStyle.Short).setRequired(false).setValue(guildConfig.unverifiedRoleId || '');
            
            // --- INI BAGIAN YANG DIPERBAIKI ---
            // Mengubah nilai default menjadi string secara eksplisit untuk mencegah error
            const accountAgeValue = guildConfig.accountAge ? String(guildConfig.accountAge) : '30';
            const accountAgeInput = new TextInputBuilder().setCustomId('accountAge').setLabel("Minimal Umur Akun (Hari)").setStyle(TextInputStyle.Short).setRequired(false).setValue(accountAgeValue);
            // ------------------------------------

            const welcomeChannelInput = new TextInputBuilder().setCustomId('welcomeChannelId').setLabel("ID Channel Selamat Datang (Opsional)").setStyle(TextInputStyle.Short).setRequired(false).setValue(guildConfig.welcomeChannelId || '');

            modal.addComponents(
                new ActionRowBuilder().addComponents(urlInput),
                new ActionRowBuilder().addComponents(verifiedRoleInput),
                new ActionRowBuilder().addComponents(unverifiedRoleInput),
                new ActionRowBuilder().addComponents(accountAgeInput),
                new ActionRowBuilder().addComponents(welcomeChannelInput)
            );
            await interaction.showModal(modal);
        }
        else if (subcommand === 'setup-pesan') {
            const modal = new ModalBuilder().setCustomId('setupPesanModal').setTitle('Konfigurasi Pesan Verifikasi');

            const titleInput = new TextInputBuilder().setCustomId('title').setLabel("Judul Embed Verifikasi").setStyle(TextInputStyle.Short).setRequired(true).setValue(guildConfig.title || 'Verifikasi Server');
            const descriptionInput = new TextInputBuilder().setCustomId('description').setLabel("Deskripsi Embed Verifikasi").setStyle(TextInputStyle.Paragraph).setRequired(true).setValue(guildConfig.description || 'Klik tombol di bawah untuk memulai verifikasi.');
            const welcomeMessageInput = new TextInputBuilder().setCustomId('welcomeMessage').setLabel("Pesan Selamat Datang").setStyle(TextInputStyle.Paragraph).setRequired(false).setValue(guildConfig.welcomeMessage || 'Selamat datang {user} di server {server}!');
            
            modal.addComponents(
                new ActionRowBuilder().addComponents(titleInput),
                new ActionRowBuilder().addComponents(descriptionInput),
                new ActionRowBuilder().addComponents(welcomeMessageInput)
            );
            await interaction.showModal(modal);
        }
        else if (subcommand === 'info') {
             const infoEmbed = new EmbedBuilder()
                .setColor('#3b82f6')
                .setTitle('Informasi Konfigurasi Verifikasi')
                .setTimestamp();

            const fields = [
                { name: 'URL Website', value: guildConfig.websiteUrl || 'Belum diatur' },
                { name: 'Role Terverifikasi', value: guildConfig.verifiedRoleId ? `<@&${guildConfig.verifiedRoleId}>` : 'Belum diatur' },
                { name: 'Role Belum Verifikasi', value: guildConfig.unverifiedRoleId ? `<@&${guildConfig.unverifiedRoleId}>` : 'Tidak diatur' },
                { name: 'Minimal Umur Akun', value: `${guildConfig.accountAge || '30'} hari` },
                { name: 'Channel Selamat Datang', value: guildConfig.welcomeChannelId ? `<#${guildConfig.welcomeChannelId}>` : 'Tidak diatur' },
                { name: 'Pesan Selamat Datang', value: `\`\`\`${guildConfig.welcomeMessage || 'Tidak diatur'}\`\`\`` },
                { name: 'Judul & Deskripsi', value: `**${guildConfig.title || 'Belum diatur'}**\n${guildConfig.description || 'Belum diatur'}` }
            ];

            infoEmbed.addFields(fields);
            await interaction.reply({ embeds: [infoEmbed], ephemeral: true });
        }
        else if (subcommand === 'kirim') {
            if (!guildConfig.title || !guildConfig.description) {
                return interaction.reply({ content: 'Harap atur judul dan deskripsi terlebih dahulu melalui `/verifikasi setup-pesan`.', ephemeral: true });
            }
            const channel = interaction.options.getChannel('channel');
            const panelEmbed = createPanelEmbed(guildConfig.title, guildConfig.description);
            const verifyButton = new ButtonBuilder()
                .setCustomId('startVerificationV3')
                .setLabel('Verifikasi Diri Anda')
                .setStyle(ButtonStyle.Success)
                .setEmoji(emojis.success);
            const row = new ActionRowBuilder().addComponents(verifyButton);
            await channel.send({ embeds: [panelEmbed], components: [row] });
            await interaction.reply({ content: `Panel verifikasi berhasil dikirim ke ${channel}.`, ephemeral: true });
        }
    }
};


