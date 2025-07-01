const { Events, MessageFlags, Collection, EmbedBuilder } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (interaction.isChatInputCommand()) {
			const command = interaction.client.commands.get(interaction.commandName);

			if (!command) {
				console.error(`No command matching ${interaction.commandName} was found.`);
				return;
			}

			const { cooldowns } = interaction.client;
			if (!cooldowns.has(command.data.name)) {
				cooldowns.set(command.data.name, new Collection());
			}

			const now = Date.now();
			const timestamps = cooldowns.get(command.data.name);
			const defaultCooldownDuration = 3;
			const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1_000;

			if (timestamps.has(interaction.user.id)) {
				const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

				if (now < expirationTime) {
					const expiredTimestamp = Math.round(expirationTime / 1_000);
					return interaction.reply({ content: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`, flags: MessageFlags.Ephemeral });
				}
			}

			timestamps.set(interaction.user.id, now);
			setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

			try {
				await command.execute(interaction);
			}
			catch (error) {
				console.error(error);
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
				}
				else {
					await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
				}
			}
		}
		else if (interaction.isButton()) {
			if (interaction.customId === 'rsvp_yes') {
				await handleRsvpButton(interaction);
			}
			else if (interaction.customId === 'debug') {
				await debugButton(interaction);
			}
			else if (interaction.customId === 'cancel_event_button') {
				await handleCancelButton(interaction);
			}
		}
		else if (interaction.isStringSelectMenu()) {
			// respond to the select menu
		}
	},
};

// RSVP button handler
async function handleRsvpButton(interaction) {
	await interaction.deferUpdate();
	const embed = interaction.message.embeds[0];
	const updatedEmbed = EmbedBuilder.from(embed);

	const attendeesField = updatedEmbed.data.fields.find(field => field.name.startsWith('Attendees'));
	let attendees = attendeesField.value === 'No one yet.' ? [] : attendeesField.value.split('\n');
	const userMention = `<@${interaction.user.id}>`;

	if (attendees.includes(userMention)) {
		// remove the user from the attendees list
		attendees = attendees.filter(attendee => attendee !== userMention);
		await interaction.followUp({ content: 'You have been removed from the RSVP list.', ephemeral: true });
	}
	else {
		// Add the user to the attendees list
		attendees.push(userMention);
		await interaction.followUp({ content: 'You have RSVP\'d to the event.', ephemeral: true });
	}

	// Update the embed with the new attendees list
	if (attendees.length === 0) {
		attendeesField.value = 'No one yet.';
	}
	else {
		attendeesField.value = attendees.join('\n');
	}
	attendeesField.name = `Attendees (${attendees.length})`;

	await interaction.message.edit({ embeds: [updatedEmbed] });
}

async function debugButton(interaction) {
	await interaction.deferUpdate();
	const embed = interaction.message.embeds[0];
	const attendeesField = embed.data.fields.find(field => field.name.startsWith('Attendees'));

	await interaction.followUp({
		content: `Debug Info:\nEmbed Title: ${embed.title}\nAttendees Field: ${attendeesField.name}\nAttendees Count: ${attendeesField.value.split('\n').length}\n Attendees List: ${attendeesField.value}\n Datetime: ${embed.datetime}`,
		ephemeral: true,
	});
}

async function handleCancelButton(interaction) {
	const embed = interaction.message.embeds[0];
	const timeField = embed.fields.find(field => field.name === 'Time');
	await interaction.deferUpdate();
	// delete the event message
	await interaction.message.delete();
	await interaction.followUp({ content: `'${embed.title}' on '${timeField.value} has been cancelled.`, ephemeral: true });
}