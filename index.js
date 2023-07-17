const { DisconnectReason } = require("@whiskeysockets/baileys");
const makeWASocket = require("@whiskeysockets/baileys").default;
const { Boom } = require("@hapi/boom");
const { MongoClient } = require("mongodb");
const useMongoDBAuthState = require("./mongoAuthState.js");
const mongoose = require("mongoose");
const mongoURL = "mongodb+srv://Saif:Arhaan123@cluster0.mj6hd.mongodb.net";
const dbName = "<YOUR_DATABASE_NAME>np";

async function connectToWhatsApp(mongoClient) {
  const collection = mongoClient.db("whatsapp-api").collection("something_key");
  const { state, saveCreds } = await useMongoDBAuthState(collection);

  const sock = makeWASocket({
    // can provide additional config here
    printQRInTerminal: true,
    auth: state,
  });

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut;
      console.log(
        "Connection closed due to",
        lastDisconnect.error,
        ", reconnecting",
        shouldReconnect
      );
      // reconnect if not logged out
      if (shouldReconnect) {
        connectToWhatsApp(mongoClient);
      } else {
        // delete the table in mongodb and try again, it will start working
      }
    } else if (connection === "open") {
      console.log("Opened connection");
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async (m) => {
    console.log(m?.[0]?.key);
    console.log("------");
    console.log(m?.[0]?.messageStubParameters);
  });

  console.log("WhatsApp bot connected");
}

const mongoClient = new MongoClient(mongoURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoClient.connect().then(() => {
  connectToWhatsApp(mongoClient).catch(console.error);
});
