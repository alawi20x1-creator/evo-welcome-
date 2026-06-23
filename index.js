const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('البوت شغال أونلاين 24/7 بنجاح!');
});

app.listen(port, () => {
  console.log(`سيرفر الويب شغال على منفذ ${port}`);
});


const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const moment = require("moment");
require("moment-duration-format");
moment.locale("ar"); // الوقت بالعربي

const config = require("./config.json");
const invites = new Map();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildInvites
    ]
});

client.once("ready", async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    const guild = await client.guilds.fetch(config.guildId);
    const firstInvites = await guild.invites.fetch();
    invites.set(guild.id, new Map(firstInvites.map(invite => [invite.code, invite.uses])));
});

client.on("guildMemberAdd", async member => {
    const channel = member.guild.channels.cache.get(config.welcomeChannelId);
    if (!channel) return;

    const cachedInvites = invites.get(member.guild.id);
    const newInvites = await member.guild.invites.fetch();

    let inviter = "غير معروف";
    for (const [code, invite] of newInvites) {
        const oldUses = cachedInvites.get(code);
        if (oldUses < invite.uses) {
            inviter = invite.inviter ? `<@${invite.inviter.id}>` : "غير معروف";
        }
    }

    invites.set(member.guild.id, new Map(newInvites.map(invite => [invite.code, invite.uses])));

    const accountAge = moment(member.user.createdAt).fromNow();
    const memberCount = member.guild.memberCount;

    // إمبيد قصير وملموم بخمس خطوط ⚡
    const embed = new EmbedBuilder()
        .setAuthor({ 
            name: `مرحباً بك في ${member.guild.name}`, 
            iconURL: member.guild.iconURL({ dynamic: true }) 
        })
        .setColor("#2b2d31")
        .setDescription(
            `-----\n\n` +
            `👤 **العضو:** ${member}\n` +
            `📅 **الحساب:** ${accountAge}\n` +
            `🔢 **الرقم:** \`#${memberCount}\`\n` +
            `✉️ **الداعي:** ${inviter}\n\n` +
            `-----\n\n` +
            `📜 القوانين: <#${config.rulesChannelId}>\n` +
            `💬 الشات: <#${config.chatChannelId}>\n\n` +
            `-----`
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setImage(config.bigImage)
        .setFooter({ 
            text: `تطوير: ${config.developedBy} • نورتنا`, 
            iconURL: config.serverLogo 
        })
        .setTimestamp();

    channel.send({
        content: `${member}`, 
        embeds: [embed]
    });
});

client.login(config.token);


