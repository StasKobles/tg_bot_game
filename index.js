const TelegramApi = require("node-telegram-bot-api");
const { gameOptions, againOptions } = require("./gameOptions");
const { stickers } = require("./stickers");
const sequelize = require("./db");
require("dotenv").config();
const token = process.env.TOKEN;
const UserModel = require("./models");
const bot = new TelegramApi(token, { polling: true });
const webAppUrl = process.env.WEB_APP;

const chats = {};

const startGame = async (chatId) => {
  await bot.sendMessage(chatId, "Pepe guessed number from 1 to 9");
  const number = Math.floor(Math.random() * 10);
  chats[chatId] = number;
  await bot.sendMessage(
    chatId,
    "Pepe is ready. What is it number?)",
    gameOptions
  );
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
    {
      command: "/store",
      description: "Here you can try React App in this Bot",
    },
    { command: "/game", description: "Little guessing number game" },
    { command: "/stats", description: "Get your statistics" },

    { command: "/repo", description: "See the repo of this project on GitHub" },
  ]);

  bot.on("message", async (msg) => {
    const text = msg.text;
    const chatId = msg.chat.id;

    try {
      if (text === "/start") {
        await UserModel.create({ chatId });
        await bot.sendSticker(chatId, stickers.welcomePepe);
        return bot.sendMessage(
          chatId,
          `Welcome to PEPE guessing bot! BTW it's my [pet project](https://github.com/StasKobles/tg_bot_game). Here you can try to use Online Store in WebApp or play guessing game with PEPE (He is so strong). Enjoy it!`,
          { parse_mode: "Markdown", disable_web_page_preview: true }
        );
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
      if (text === "/store") {
        return bot.sendMessage(chatId, "Here is our store!", {
          reply_markup: {
            keyboard: [
              [
                {
                  text: "Make your order",
                  web_app: { url: webAppUrl },
                },
              ],
            ],
          },
        });
      }
      if (text === "/repo") {
        await bot.sendMessage(
          chatId,
          `[Bot part](https://github.com/StasKobles/tg_bot_game)`,
          { parse_mode: "Markdown" }
        );
        return await bot.sendMessage(
          chatId,
          `[Web App part (React)](https://github.com/StasKobles/tg_web_app_react)`,
          { parse_mode: "Markdown" }
        );
      }
      if (msg?.web_app_data?.data) {
        const data = JSON.parse(msg?.web_app_data?.data);
        if (!!data.city) {
          try {
            await bot.sendMessage(chatId, "Thanks for your time!", {
              reply_markup: { remove_keyboard: true },
            });
            await bot.sendMessage(chatId, "Your country is: " + data?.country);
            await bot.sendMessage(chatId, "Your city is: " + data?.city);
            return setTimeout(async () => {
              await bot.sendMessage(
                chatId,
                "Thank`s for your order! We will connect you soon"
              );
            }, 3000);
          } catch (e) {
            return console.log(e);
          }
        }
        if (!!data.products) {
          try {
            await bot.sendMessage(chatId, "That is your order!", {
              reply_markup: { remove_keyboard: true },
            });
            await data.products.forEach((product) => {
              bot.sendMessage(
                chatId,
                `${product.title} for ${product.price} $`
              );
            });
            setTimeout(async () => {
              await bot.sendMessage(
                chatId,
                `Total price is ${data.totalPrice} $`
              );
            }, 1000);
            return setTimeout(async () => {
              await bot.sendMessage(
                chatId,
                "Let`s complete delivery options!",
                {
                  reply_markup: {
                    keyboard: [
                      [
                        {
                          text: "Delivery form",
                          web_app: { url: webAppUrl + "/form" },
                        },
                      ],
                    ],
                  },
                }
              );
            }, 2000);
          } catch (e) {
            return console.log(e);
          }
        }
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
