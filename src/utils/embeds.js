const { EmbedBuilder } = require('discord.js');

const emojis = {
    success: '<:iptick:1413527357347598428>',
    error: '<:iperror:1413527320609816727>',
    warning: '<:emoji_3:1413527275265069106>',
};

function createPanelEmbed(title, description) {
    return new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(title)
        .setDescription(description)
        .setFooter({ text: '© Verification System By Girabase.' });
}

function createSuccessEmbed(message) {
    return new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle(`${emojis.success} Sukses`)
        .setDescription(message)
        .setTimestamp();
}

function createErrorEmbed(message) {
    return new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle(`${emojis.error} Terjadi Kesalahan`)
        .setDescription(message)
        .setTimestamp();
}

function createWarningEmbed(title, message) {
    return new EmbedBuilder()
        .setColor('#e67e22')
        .setTitle(`${emojis.warning} ${title}`)
        .setDescription(message)
        .setTimestamp();
}

function createLogEmbed(title, description, user) {
    const embed = new EmbedBuilder()
        .setColor('#7f8c8d')
        .setTitle(title)
        .setDescription(description)
        .setTimestamp();

    if (user) {
        embed.setFooter({ text: `Aksi oleh: ${user.tag}`, iconURL: user.displayAvatarURL() });
    }
    return embed;
}

function createComplaintEmbed(name, email, discord_name, message) {
    return new EmbedBuilder()
        .setColor('#f1c40f')
        .setTitle(`${emojis.warning} Keluhan Baru Diterima`)
        .addFields(
            { name: 'Nama Pengirim', value: name, inline: true },
            { name: 'Email', value: email, inline: true },
            { name: 'Nama Discord', value: discord_name, inline: true },
            { name: 'Isi Keluhan', value: `\`\`\`${message}\`\`\`` }
        )
        .setTimestamp()
        .setFooter({ text: 'Keluhan dari Website Verifikasi' });
}

module.exports = {
    emojis,
    createPanelEmbed,
    createSuccessEmbed,
    createErrorEmbed,
    createWarningEmbed,
    createLogEmbed,
    createComplaintEmbed,
};


