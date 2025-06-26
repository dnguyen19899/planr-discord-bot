const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const chrono = require('chrono-node');

module.exports = {
	cooldown: 5, // Cooldown in seconds
	data: new SlashCommandBuilder()
		.setName('event')
		.setDescription('Create an event with title and time and options to RSVP!')
		.addStringOption(option =>
			option.setName('title')
				.setDescription('What is the name of the event?')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('datetime')
				.setDescription('When is the event? (e.g., "Tomorrow at 5pm")')
				.setRequired(true)),
	// The execute function is called when the command is used.
	async execute(interaction) {
		const title = interaction.options.getString('title');
		const datetimeStr = interaction.options.getString('datetime');
		const eventDate = chrono.parseDate(datetimeStr, new Date(), { forwardDate: true });

		if (!eventDate) {
			await interaction.reply({
				content: `Sorry, I couldn't understand the date and time: '${datetimeStr}'. Try something like 'Tomorrow at 7pm' or 'July 1st 8pm'.`,
				ephemeral: true,
			});
			return;
		}

		if (eventDate < new Date()) {
			await interaction.reply({ content: 'You can\'t create an event in the past!', ephemeral: true });
			return;
		}

		// Discord timestamp formatting
		const unixTimestamp = Math.floor(eventDate.getTime() / 1000);

		const embed = new EmbedBuilder()
			.setColor(0x0099FF) // Blue
			.setTitle(`📅 ${title}`)
			.addFields(
				{ name: 'Time', value: `<t:${unixTimestamp}:F> (<t:${unixTimestamp}:R>)`, inline: false },
				{ name: 'Attendees (0)', value: 'No one yet.', inline: false },
			)
			.setFooter({ text: `Event created by ${interaction.user.username}` });

		if (embed.footer && typeof embed.footer.text === 'string') {
			embed.footer.text += `\u200B${interaction.user.id}`;
		}

		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('rsvp_button')
					.setLabel('✅ RSVP')
					.setStyle(ButtonStyle.Success),
				new ButtonBuilder()
					.setCustomId('cancel_event_button')
					.setLabel('🗑️ Cancel Event')
					.setStyle(ButtonStyle.Danger),
			);
		await interaction.reply({
			embeds: [embed],
			components: [row],
		});
	},
};