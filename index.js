const TelegramApi = require("node-telegram-bot-api");

require("dotenv").config();
const token = process.env.token;

const bot = new TelegramApi(token, { polling: true });

const chats = [];

const gameOptions = {
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [
        { text: "1", callback_data: "1" },
        { text: "2", callback_data: "2" },
        { text: "3", callback_data: "3" },
      ],
      [
        { text: "4", callback_data: "4" },
        { text: "5", callback_data: "5" },
        { text: "6", callback_data: "6" },
      ],
      [
        { text: "7", callback_data: "7" },
        { text: "8", callback_data: "8" },
        { text: "9", callback_data: "9" },
      ],
      [{ text: "0", callback_data: "0" }],
    ],
  }),
};

const againOptions = {
  reply_markup: JSON.stringify({
    inline_keyboard: [[{ text: "Play again", callback_data: "/again" }]],
  }),
};
const startGame = async (chatId) => {
  await bot.sendMessage(chatId, "I will guess a number from 1 to 9");
  const number = Math.floor(Math.random() * 10);
  chats[chatId] = number;
  await bot.sendMessage(chatId, "I`m ready. What is it?)", gameOptions);
  await bot.sendSticker(
    chatId,
    "https://cdn.tlgrm.app/stickers/4dd/300/4dd300fd-0a89-3f3d-ac53-8ec93976495e/192/8.webp"
  );
};
const start = () => {
  bot.setMyCommands([
    { command: "/start", description: "First meeting" },
    { command: "/info", description: "Get your own first name and last name" },
    { command: "/game", description: "Little guessing number game" },
  ]);

  bot.on("message", async (msg) => {
    const text = msg.text;
    const chatId = msg.chat.id;
    const opts = {
      parse_mode: "MarkdownV2",
    };

    if (text === "/start") {
      await bot.sendSticker(
        chatId,
        "https://tlgrm.ru/_/stickers/4dd/300/4dd300fd-0a89-3f3d-ac53-8ec93976495e/1.webp"
      );
      return bot.sendMessage(chatId, "Welcome to my pet project bot!");
    }
    if (text === "/info") {
      await bot.sendSticker(
        chatId,
        "https://tlgrm.ru/_/stickers/4dd/300/4dd300fd-0a89-3f3d-ac53-8ec93976495e/192/115.webp"
      );
      return bot.sendMessage(
        chatId,
        `You are ||${msg.from.first_name} ${msg.from.last_name}||`,
        opts
      );
    }
    if (text === "/game") {
      return startGame(chatId);
    }
    bot.sendSticker(
      chatId,
      "https://tlgrm.ru/_/stickers/4dd/300/4dd300fd-0a89-3f3d-ac53-8ec93976495e/192/34.webp"
    );
    bot.sendMessage(chatId, "I don`t get u. Try send me other command");
    console.log(msg);
  });
};
bot.on("callback_query", async (msg) => {
  const data = msg.data;
  const chatId = msg.message.chat.id;
  if (data === "/again") {
    return startGame(chatId);
  }
  if (data === chats[chatId]) {
    await bot.sendMessage(chatId, `You're right! ${data} is correct number!`);
    return await bot.sendSticker(
      chatId,
      "https://tlgrm.ru/_/stickers/4dd/300/4dd300fd-0a89-3f3d-ac53-8ec93976495e/192/114.webp",
      againOptions
    );
  } else {
    await bot.sendMessage(
      chatId,
      `NOOO! It's wrong answer) I guess ${chats[chatId]}`
    );
    return bot.sendSticker(
      chatId,
      "https://cdn.tlgrm.app/stickers/4dd/300/4dd300fd-0a89-3f3d-ac53-8ec93976495e/192/7.webp",
      againOptions
    );
  }
});
start();
