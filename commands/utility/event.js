const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	cooldown: 5, // Cooldown in seconds
	data: new SlashCommandBuilder()
		.setName('event')
		.setDescription('Create an event with title and time and options to RSVP!')
		.addStringOption(option =>
			option.setName('title')
				.setDescription('title of the event.')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('time')
				.setDescription('Time of the event')
				.setRequired(true)),
	async execute(interaction) {
		await interaction.reply('Event created! Title: ' + interaction.options.getString('title') + ', Time: ' + interaction.options.getString('time'));
	},
};