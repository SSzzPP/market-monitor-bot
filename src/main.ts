import Web3 from "web3";
import {AbiItem} from 'web3-utils'
import {PancakeSwapRouterABI, PancakeSwapRouterAddress} from "./contract/pancakeswap/router";
import {CronJob} from "cron";
import {TONCOINAddress} from "./token/toncoin";
import {USDTAddress} from "./token/usdt";
import {Client as PostgresClient} from "pg";
import "dotenv/config";
import {Telegraf} from "telegraf";

const main = async () => {
    const postgresClient = new PostgresClient({
        host: process.env.POSTGRES_HOST,
        port: Number(process.env.POSTGRES_PORT),
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DATABASE,
    });
    await postgresClient.connect();

    const telegramBot = new Telegraf(String(process.env.TELEGRAM_BOT_TOKEN));

    const web3 = new Web3(process.env.WEB3_PROVIDER || "https://bsc-dataseed.binance.org/");
    const pancakeSwapRouterContract = new web3.eth.Contract(PancakeSwapRouterABI as AbiItem[], PancakeSwapRouterAddress);

    const cronJob = new CronJob("0 * * * *", async () => {
        pancakeSwapRouterContract.methods.getAmountsOut(1, [TONCOINAddress, USDTAddress]).call({}, (error: any, result: number[]) => {
            telegramBot.telegram.sendMessage(Number(process.env.TELEGRAM_CHAT_ID), `*TONCOIN/USDT*\n\n*Price*\n\`$${result[1] / 1e9}\`\n\n*Change of 1H*\n\`-\``, { parse_mode: "MarkdownV2" })
        });
    });
    cronJob.start();
}

main().then();
