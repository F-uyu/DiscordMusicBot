const discord = require('discord.js');
const { DisTube, DisTubeVoice } = require('distube');
const fs = require('fs');
const {token} = require('./config.json');
const {SpotifyPlugin} = require('@distube/spotify');
const { SoundCloudPlugin } = require('@distube/soundcloud');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const ytdl = require('ytdl-core');
const { EmbedBuilder } = require('discord.js');
const { NONAME } = require('dns');
let SongOnGoing = false;
let VCin = false;
let numOfsongs = 0;

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
                numOfsongs++;
            }
            else{
                message.channel.send("Join a voice channel");
            }
        }
            
    }
    if (action === 'pause'){
        if (SongOnGoing){
            client.DisTube.pause(message);
            SongOnGoing = false;
        }
        else{
            message.channel.send("Song is already paused");
        }
        
    }
    if (action == 'resume'){
        if (SongOnGoing){
            message.channel.send("Song is already playing.");
        }
        else{
            client.DisTube.resume(message);
            SongOnGoing = true;
        }
    }
    if (action == 'previous'){
        if (numOfsongs > 1){
            client.DisTube.previous(message);
        }
        else{
            message.channel.send("No previous song.")
        }
        
    }
    //testinggg
    if (action == 'search'){
        client.DisTube.search("pokemon",{
            limit: 15,
        })
    }
    if (action == 'queue'){
        const queue = client.DisTube.getQueue(message);
        if (!queue){
            message.channel.send(`**No song is currently playing.**`)
        }
        else{
            console.log(queue.songs.length)
            if (queue.songs.length == 1){
                const frame = new EmbedBuilder()
                    .setColor(0xDAF7A6)
                    .setTitle(`Current song:`)
                queue.songs.map((song, id) =>
                    frame.addFields({name: `Current => ${song.name}`, value: `Duration: ${song.formattedDuration}`})
                )
                message.channel.send({embeds: [frame]})
            }
            else{
                const frame = new EmbedBuilder()
                    .setColor(0xDAF7A6)
                    .setTitle(`Upcoming: ${queue.songs[1].name}`)
                    .setURL(`${queue.songs[1].url}`)
                    .setThumbnail(`${queue.songs[1].thumbnail}`)
                queue.songs.map((song, id) =>
                    frame.addFields({name: `${id + 1}. ${song.name}`, value: `Duration: ${song.formattedDuration}`})
                )
                message.channel.send({embeds: [frame]})
            }
        }
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
    if (action == 'skip'){
        const len = client.DisTube.getQueue(message);
        if (len.songs.length <= 1){
            message.channel.send("No song to skip to")
        }
        else{
            client.DisTube.skip(message);
        }
        
    }
    if (action == 'autoplay'){
        const mode = client.DisTube.toggleAutoplay(message);
        message.channel.send("Automode mode: " + (mode ? "On" : "Off"));
    }
    if (action == 'shuffle'){
        client.DisTube.shuffle(message)
    }
    if (action == 'help'){
        const frame = new EmbedBuilder()
            .setColor(0xDAF7A6)
            .setTitle("List of commands")
            .setAuthor({name: "Created by Fyxru#5702; Debugger by ahneh#3410"})
            .setFields(
                {name: "play", value: "Play/queue a song."},
                {name: "pause", value: "Pause a song."},
                {name: "resume", value: "Resume a song."},
                {name: "previous", value: "Play the previous song."},
                {name: "queue", value: "Check the queue of the song."},
                {name: "join", value: "Makes the bot join VC."},
                {name: "skip", value: "Skip current song."},
                {name: "autoplay", value: "Autoplay songs."}
            )
        message.channel.send({embeds: [frame]})
    }
})

client.DisTube
    .on("playSong", (queue, song) => {
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
            .setTimestamp()
            .setThumbnail(results[0].thumbnail)
        results.map((song, i) =>
            frame.addFields(
                {name: `\u200B`, value: `**${i+1}**. ${song.name} - \`${song.formattedDuration}\``}
            )
        )
        frame.addFields(
            {name: `\u200B`, value: `*Enter anything else or wait 60 seconds to cancel*`}
        )
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
