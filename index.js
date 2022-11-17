const TelegramApi = require("node-telegram-bot-api");
const { gameOptions, againOptions } = require("./gameOptions");
const { stickers } = require("./stickers");
const sequelize = require("./db");
require("dotenv").config();
const token = process.env.token;
const UserModel = require("./models");
const bot = new TelegramApi(token, { polling: true });

const chats = [];

const startGame = async (chatId) => {
  await bot.sendMessage(chatId, "Pepe will guess a number from 1 to 9");
  const number = Math.floor(Math.random() * 10);
  chats[chatId] = number;
  await bot.sendMessage(chatId, "Pepe ready. What is it?)", gameOptions);
  await bot.sendSticker(chatId, stickers.pepeSarcastic);
};
const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
  } catch (e) {
    console.log("Connection is break", e);
  }
  bot.setMyCommands([
    { command: "/start", description: "First meeting" },
    { command: "/stats", description: "Get your statistics" },
    { command: "/game", description: "Little guessing number game" },
  ]);

  bot.on("message", async (msg) => {
    const text = msg.text;
    const chatId = msg.chat.id;

    try {
      if (text === "/start" && !UserModel.findOne({ chatId })) {
        await UserModel.create({ chatId });
        await bot.sendSticker(chatId, stickers.welcomePepe);
        return bot.sendMessage(
          chatId,
          "Welcome to PEPE guessing bot! It`s my [little pet project](https://github.com/StasKobles/tg_bot_game)"
        );
      }
      if (text === "/start" && UserModel.findOne({ chatId })) {
        await bot.sendSticker(chatId, stickers.letsGoPepe);
        return bot.sendMessage(chatId, "Hey! I know u. Let`s play");
      }
      if (text === "/stats") {
        const user = await UserModel.findOne({ chatId });
        await bot.sendSticker(chatId, stickers.pepeHolmes);
        return bot.sendMessage(
          chatId,
          `||*${msg.from.first_name}* ${msg.from.last_name}|| , You have ${user.right} right answers and ${user.wrong} wrong answers`,
          { parse_mode: "MarkdownV2" }
        );
      }
      if (text === "/game") {
        return startGame(chatId);
      }
      bot.sendSticker(chatId, stickers.misunderstoodPepe);
      bot.sendMessage(chatId, "I don`t get u. Try send me other command");
    } catch (e) {
      return bot.sendMessage(chatId, `There is some error, ${e}`);
    }
  });
};
bot.on("callback_query", async (msg) => {
  const data = msg.data;
  const chatId = msg.message.chat.id;
  if (data === "/again") {
    return startGame(chatId);
  }
  const user = await UserModel.findOne({ chatId });
  if (data == chats[chatId]) {
    user.right += 1;
    await bot.sendMessage(chatId, `You're right! ${data} is correct number!`);
    await bot.sendSticker(chatId, stickers.wellDonePepe, againOptions);
  } else {
    user.wrong += 1;
    await bot.sendMessage(
      chatId,
      `NOOO! It's wrong answer) I guess ${chats[chatId]}`
    );
    await bot.sendSticker(chatId, stickers.roflPepe, againOptions);
  }
  await user.save();
});
start();
