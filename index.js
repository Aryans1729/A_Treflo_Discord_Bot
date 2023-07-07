const Discord = require("discord.js");
const express = require("express");
const axios = require("axios");
const { REST, Routes, ApplicationCommandOptionType } = require("discord.js");
//client is nothing but a new bot initialization
const client = new Discord.Client({
  //intents : set of permissions our bot have
  intents: [
    Discord.IntentsBitField.Flags.Guilds,
    Discord.IntentsBitField.Flags.GuildMembers,
    Discord.IntentsBitField.Flags.GuildMessages,
    Discord.IntentsBitField.Flags.MessageContent,
  ],
});

const dotenv = require("dotenv").config();
const api_url = process.env.API_URL;

client.on("ready", (c) => {
  console.log(`${c.user.tag} is online`);
});
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "hey") {
    interaction.reply("hey, how are you today!!!");
  }
  if (interaction.commandName === "hi") {
    interaction.reply("hey, how are you today!!!");
  }
  if (interaction.commandName === "hello") {
    interaction.reply("hey, how are you today!!!");
  }
  if (interaction.commandName === "send_message") {
    const { user, guild } = interaction;
    const calldata = {
      username: user.username,
      server: guild.name,
      userid: user.id,
      serverid: guild.id,
    };
    console.log(calldata);
    const options = {
      method: "POST",
      url: `${api_url}/users`,
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      data: calldata,
    };
    const channelId = interaction?.options?._hoistedOptions?.[0]?.value;
    const text = interaction?.options?._hoistedOptions?.[1]?.value;
    const url = interaction?.options?._hoistedOptions?.[2]?.value;
    const button_text = interaction?.options?._hoistedOptions?.[3]?.value;

    //  console.log(channelId, text, url, button_text);
    const embedMsg = {
      color: 0x4df85f,
      title: button_text,
      description: text,

      image: {
        url: url,
      },
    };
    const messageChannel = client.channels.cache.find(
      (channel) => channel.id == channelId
    );

    await messageChannel.send({ embeds: [embedMsg] });
    await interaction.reply({
      content: "post sent successfully",
      ephemeral: true,
    });
    const response = await axios.request(options);
    console.log(response?.data);
  }
});
client.on("messageCreate", (message) => {
  if (message.author.bot) {
    return;
  }
});
//------------------------------------------CONNECTION_TO_MONGODB-----------------------------------------------
const mongoose = require("mongoose");
const app = express();
require("dotenv").config();
const mongourl = process.env.MONGODB_CONNECTION_URL;
// Connect to MongoDB
const MongoClient = require("mongodb").MongoClient;
const mongoClient = new MongoClient(mongourl);
mongoose
  .connect(mongourl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

// Define User schema
const userSchema = new mongoose.Schema({
  username: String,
  server: String,
  userid: String,
  serverid: String,
});

// ------------------------------------------Create User model---------------------------------------------------
const User = mongoose.model("User", userSchema);

// Example route to store user details
app.use(express.json());
app.post("/users", async (req, res) => {
  try {
    const { username, server, userid, serverid } = req.body;
    let result = await mongoClient.connect();
    let db = result.db("test");
    let userData = db.collection("users");
    const check = await userData.findOne({ userid });
    console.log(check);
    if (check)
      return res
        .status(200)
        .json({ message: "User already exists", user: check });

    // -------------------------------------------Create a new user ----------------------------------------------
    const user = new User({
      username: username,
      server: server,
      serverid,
      userid,
    });
    console.log(user);

    //--------------------------------------- Save the user to the database--------------------------------------
    await user.save();

    res
      .status(200)
      .json({ message: "User details saved successfully", user: user });
  } catch (error) {
    console.log("An error occurred", error);
    res.status(500);
  }
});

// --------------------------------------------- route to get all users------------------------------------------
app.get("/get-all-Users", async (req, res) => {
  try {
    // let result = await mongoClient.connect();
    //let db = result.db("Treflobot");
    //let userData = db.collection("users");
    const users = await User.find({});
    // const users = await userData.find({});
    console.log(users);
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "An error occurred while retrieving users" });
  }
});
// Start the server
app.listen(3000, () => {
  console.log("Server listening on port 3000");
});

//--------------------------------------REGISTERING_SEND-MESSAGE_COMMAND--------------------------------------------
const commands = [
  {
    name: "hey",
    description: "Replies with Hey from Treflo Bot",
  },
  {
    name: "hi",
    description: "Replies with Hi from Treflo Bot",
  },
  {
    name: "hello",
    description: "Replies with Hello from Treflo Bot",
  },
  {
    name: "send_message",
    description: "Replies with channel text URI Button-Text",
    options: [
      {
        name: "channel",
        description: "channel_name",
        type: ApplicationCommandOptionType.Channel,
        required: true,
      },
      {
        name: "text",
        description: "Returns with text_entered",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: "uri",
        description: "Returns with Image_URI",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: "button_text",
        description: "Returns with Button_Text",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },
];

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log("Registering Slash Commands...");
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      {
        body: commands,
      }
    );
    console.log("Command registered successfully");
  } catch (error) {
    console.log(`Command not registered :${error}`);
  }
})();

client.login(process.env.BOT_TOKEN);
