const TelegramApi = require("node-telegram-bot-api");
const { gameOptions, againOptions } = require("./gameOptions");
const express = require("express");
const cors = require("cors");
const { stickers } = require("./stickers");
const sequelize = require("./db");
require("dotenv").config();
const token = process.env.TOKEN;
const UserModel = require("./models");
const bot = new TelegramApi(token, { polling: true });
const webAppUrl = process.env.WEB_APP;
const PORT = process.env.PORT;
const app = express();

app.use(express.json());
app.use(cors());

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
    { command: "/store", description: "Here you can try React App in this Bot" },
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
          "Welcome to PEPE guessing bot! It`s my [ pet project](https://github.com/StasKobles/tg_bot_game). Here you can try to use Online Store in WebApp or play guessing game with PEPE (He is so strong)"
        );
      }
      if (text === "/start" && UserModel.findOne({ chatId })) {
        await bot.sendSticker(chatId, stickers.letsGoPepe);
        return bot.sendMessage(
          chatId,
          "Hey, I know U. BTW it`s my [ pet project](https://github.com/StasKobles/tg_bot_game). Here you can try to use Online Store in WebApp or play guessing game with PEPE (He is so strong). Enjoy it!"
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
        await bot.sendMessage(chatId, "Click the below button!", {
          reply_markup: {
            keyboard: [
              [
                {
                  text: "Fill the delivery form",
                  web_app: { url: webAppUrl + "/form" },
                },
              ],
            ],
          },
        });
        return bot.sendMessage(chatId, "Heres is our store!", {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Make the order", web_app: { url: webAppUrl } }],
            ],
          },
        });
      }
      if (msg?.web_app_data?.data) {
        try {
          const data = JSON.parse(msg?.web_app_data?.data);

          await bot.sendMessage(chatId, "Thanks for your time!");
          await bot.sendMessage(chatId, "Your country is: " + data?.country);
          await bot.sendMessage(chatId, "Your city is: " + data?.city);
          return setTimeout(async () => {
            await bot.sendMessage(chatId, "All info will be in this bot");
          }, 3000);
        } catch (e) {
          return console.log(e);
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
app.post("/web-data", async (req, res) => {
  const { queryId, product, totalPrice } = req.body;
  try {
    await bot.answerWebAppQuery(queryId, {
      type: "article",
      id: queryId,
      title: "Authorization success!",
      input_message_content: {
        message_text: `Congratulations with your purchases. Your total price is ${totalPrice} and you bought ${products
          .map((item) => item.title)
          .join(", ")}`,
      },
    });
    return res.status(200).json({});
  } catch (e) {
    await bot.answerWebAppQuery(queryId, {
      type: "article",
      id: queryId,
      title: "We can`t finish this order",
      input_message_content: {
        message_text: "Some problems with your order",
      },
    });
    return res.status(500).json({});
  }
});

app.listen(PORT, () => console.log("Server started on PORT " + PORT));

start();
