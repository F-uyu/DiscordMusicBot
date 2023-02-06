const discord = require('discord.js');
const { DisTube, DisTubeVoice } = require('distube');
const fs = require('fs');
const {token} = require('./config.json');
const {SpotifyPlugin} = require('@distube/spotify');
const { SoundCloudPlugin } = require('@distube/soundcloud');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const ytdl = require('ytdl-core');
const { EmbedBuilder } = require('discord.js');
let SongOnGoing = false;
let VCin = false;


const client = new discord.Client({
    intents: [
        "Guilds",
        "GuildMessages",
        "MessageContent",
        "GuildVoiceStates"
    ]
});

client.DisTube = new DisTube(client,
    {
        plugins: [
            new SpotifyPlugin({
              emitEventsAfterFetching: true
            }),
            new SoundCloudPlugin(),
            new YtDlpPlugin()
        ],
        leaveOnStop: false,
        emitNewSongOnly: true,
        emitAddSongWhenCreatingQueue: false,
        emitAddListWhenCreatingQueue: false,
        searchSongs: 15
    }
);






client.on("ready", client => {
    console.log(client.user.tag);
})

client.on("messageCreate", (message) =>{
    if (message.author.bot || !message.guild) return;
    const prefix = ";";
    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    if (!message.content.toLowerCase().startsWith(prefix)) return;
    const action = args.shift().toLowerCase();
    if (action === 'play'){
        if (args.length == 0 || args === undefined){
            message.channel.send("Put a song");
        }
        else{
            const voicechannel = message.member?.voice?.channel;
            SongOnGoing = true;
            VCin = true;
            if (voicechannel){
                client.DisTube.play(message.member.voice.channel, args.join(" "),{
                    member: message.member,
                    textChannel: message.channel,
                    message
                })
            }
            else{
                message.channel.send("Join a voice channel");
            }
        }
            
    }
    if (action === 'pause'){
        if (SongOnGoing){
            client.DisTube.pause(message);
        }
        else{
            message.channel.send("Song is already paused");
        }
        
    }
    if (action == 'resume'){
        if (SongOnGoing){
            message.channel.send("Song is already playing");
        }
        else{
            client.DisTube.resume(message);
        }
    }
    if (action == 'previous'){
        client.DisTube.previous(message);
    }
    //testinggg
    if (action == 'search'){
        client.DisTube.search("pokemon",{
            limit: 15,
        })
    }
    //testing
    if (action == 'queue'){
        const queue = client.DisTube.getQueue(message);
        message.channel.send(queue.songs.map((song, id) =>
        `${song.name} + ${id + 1}`
    ).join("\n"))
    }
    if (action == 'join'){
        const voicec = message.member?.voice?.channel;
        if (voicec){
            client.DisTube.voices.join(voicec);
        }
        else{
            message.channel.send("Join a voice channel");
        }
    }
    //test
    if (action == 'voice'){
        const check = client.DisTube.voices.get(message);
        console.log(check);
    }
    if (action == 'get'){
        const test = client.DisTube.queues.get(message);
        console.log(test.songs[0]);
    }
    if (action == 'skip'){
        client.DisTube.skip(message);
    }
    if (action == 'autoplay'){
        const mode = client.DisTube.toggleAutoplay(message);
        message.channel.send("Automode mode: " + (mode ? "On" : "Off"));
    }

})

client.DisTube
    .on("playSong", (queue, song) => {
        console.log(song);
        const frame = new EmbedBuilder()
            .setColor(0xDAF7A6)
            .setTitle(`${song.name}`)
            .setURL(`${song.url}`)
            .setThumbnail(`${song.thumbnail}`)
            .addFields(
                { name: `**Duration**`, value: `${song.formattedDuration}`, inline: true },
                //{ name: '\u200B', value: '\u200B' },
                { name: `**Views**`, value: `${song.views}`, inline: true },
                { name: `**Age-Restricted**`, value: `${song.age_restricted}`, inline: true },
            )
            .setTimestamp()
            .setFooter({ text: `${song.name}`, iconURL: `${song.thumbnail}` });
        queue.textChannel.send({ embeds: [frame] });
    })
    .on("searchResult", (message, results, query) => {
        const frame = new EmbedBuilder()
            .setColor(0xDAF7A6)
            .setTitle("List of songs:")
        results.map((song, i) =>
            frame.addFields(
                {name: "hello", value: `**${i+1}**. ${song.name} - \`${song.formattedDuration}\``}
            )
        )
        message.channel.send(`**Choose an option from below**\n${
                results.map((song, i) => `**${i+1}**. ${song.name} - \`${song.formattedDuration}\``).join("\n")
            }
            \n*Enter anything else or wait 60 seconds to cancel*`
        );
        message.channel.send({ embeds: [frame]})
    })
    .on("searchCancel", (message) => {
        message.channel.send("Search cancelled.");
    })
    .on("searchInvalidAnswer", (message, answer) => {
        message.channel.send(`${answer} does not exist.`);
    })
    .on("searchNoResult", (message, query) => {
        message.channel.send(`Message not found for ${query}.`);
    })
    .on("searchDone", (message, query) => {
        message.channel.send(`**Song selected: ${query}.**`);
    })
    .on("disconnect", queue => {
        queue.textChannel.send("Bot has disconnected");
        VCin = false;
    })
    .on("addSong", (queue, song) => queue.textChannel.send(
        `Added ${song.name} - \`${song.formattedDuration}\` to the queue by ${song.user}.`
    ));
    



client.login(token);
