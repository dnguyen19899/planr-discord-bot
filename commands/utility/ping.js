const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	cooldown: 5, // Cooldown in seconds
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(interaction) {
		await interaction.reply('Pong!!');
	},
};