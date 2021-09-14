import dotenv from 'dotenv';
import api from 'binance/lib/binance.js';
import { safePrice } from './utils/helpers';
import { calculateRsi, calculateSma } from './utils/indicators';
import trade from './trade';
import socket from 'simple-websocket';
import PubNub from 'pubnub';

dotenv.config();

const ASSET_TO_START = 'USDT';

let ws = new api.BinanceWS(true);
let binanceApi = new api.BinanceRest({ key: process.env.BINANCE_KEY, secret: process.env.BINANCE_SECRET });
const pubnub = new PubNub({
  publishKey: process.env.PUBNUB_PUBLISH,
  subscribeKey: process.env.PUBNUB_SUSCRIBE
});

pubnub.subscribe({
  channels: ['demo']
});

pubnub.addListener({
  message: (pubnubMessage) => {
      console.log('New Message:', pubnubMessage.message);
  }
});

let usdtBalance = 0;
let exchangeInfo;
let balance = 100;

const klines = {};
const trades = {};
const indicators = {};
const transactions = {
  buy: [],
  sell: []
};

const populateKlinesForPair = async (klines, pair) => {
  console.log(`Requesting historical klines for pair`);

  try {
    const historicKlines = await binanceApi.klines({ symbol: pair, interval: '1m' });
    historicKlines.forEach((kline) => (klines[pair][kline.openTime] = kline));
  }
  catch (e) {
    console.log(e)

  }

};

const updateTrades = (data) => {
  const { symbol, price } = data;
  trades[symbol] = price;
}

const updateKlines = async (data) => {
  const { symbol, kline } = data;

  if (!klines[symbol]) {
    klines[symbol] = [];
    await populateKlinesForPair(klines, symbol);
  }

  klines[symbol][kline.startTime] = kline;
  calculateIndicators(symbol);
  analyzeIndicators(symbol);
};

const calculateIndicators = (symbol) => {
  if (!indicators[symbol]) {
    indicators[symbol] = {};
  }
  const values = Object.keys(klines[symbol])
    .sort()
    .map((k) => parseFloat(klines[symbol][k].close));

  indicators[symbol].RSI = calculateRsi(values);
  indicators[symbol].SMA200 = calculateSma(values, 200);
  indicators[symbol].SMA50 = calculateSma(values, 50);
  console.log(indicators)
  
  // pubnub.publish({
  //   message: indicators,
  //   channel: 'demo'
  // });

  pubnub.publish({
    message: indicators,
    channel: 'demo'
});
};

const analyzeIndicators = (symbol) => {
  // if (indicators[symbol].RSI < 25) {
  //   console.log(`${symbol} esta con RSI ${indicators[symbol].RSI}`);
  // }

  if (trades[symbol] >= indicators[symbol].SMA50 > indicators[symbol].SMA200 && transactions.buy.length === transactions.sell.length) {
    transactions.buy.push({ symbol, price: trades[symbol] })
   // console.log(transactions)
  }

  if (trades[symbol] < indicators[symbol].SMA50 && transactions.buy.length === transactions.sell.length) {
    transactions.sell.push({ symbol, price: trades[symbol] })
    //console.log(transactions)
  }


};

const refreshUsdtBalance = async () => {
  const account = await binanceApi.account();
  usdtBalance = safePrice(parseFloat(account.balances.find((asset) => asset.asset === ASSET_TO_START).free), 8);
};

const getSymbolData = (symbol) => {
  return exchangeInfo.symbols.find((s) => s.symbol === symbol);
};

const processUserData = (data) => {
  if (data.e === 'outboundAccountPosition') {
    console.log('Previous USDT Balance: ', usdtBalance);
    let usdtData = data.B.find((balance) => balance.a === ASSET_TO_START);
    if (usdtData) {
      usdtBalance = safePrice(parseFloat(usdtData.f), 8);
    }
    console.log('USDT Balance updated: ', usdtBalance);
  }
};

(async () => {
  await refreshUsdtBalance();
  exchangeInfo = await binanceApi.exchangeInfo();
  const filteredSymbols = exchangeInfo.symbols.filter((symbol) => {
    return symbol.symbol.includes(ASSET_TO_START) && symbol.ocoAllowed && symbol.permissions.includes('SPOT');
  });
  filteredSymbols.length = 5;
  filteredSymbols.forEach((symbol) => ws.onKline(symbol.symbol, '1m', async (data) => updateKlines(data)));
  filteredSymbols.forEach((symbol) => ws.onTrade(symbol.symbol, (data) => updateTrades(data)));
  ws.onUserData(binanceApi, processUserData);

  // setInterval(() => console.log(indicators), 1000);
})();