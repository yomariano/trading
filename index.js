import dotenv from 'dotenv';
import api from 'binance/lib/binance.js';
import { safePrice } from './utils/helpers';
//import trade from './trade';
import {RSI,SMA} from 'technicalindicators';



dotenv.config();

const PRICE_LOG_LENGTH = 10; //
const DETECTION_THRESHOLD = 15; // Detection threshold%
const TAKE_PROFIT = 150; // Profit in %
const STOP_LOSS = -20; // Stop loss detection in %
const STOP_LOSS_LIMIT = -25; // Limit on stop loss in %
const ASSET_TO_START = 'USDT';

let ws = new api.BinanceWS(true);
let binanceApi = new api.BinanceRest({ key: process.env.BINANCE_KEY, secret: process.env.BINANCE_SECRET });
let usdtBalance = 0;
let exchangeInfo;
let klines = {};


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

const populateKlinesForPair = async (klines, pair) => {
  console.log(`Requesting historical klines for pair ${pair}`);
  const historicKlines = await binanceApi.klines({ symbol: pair, interval: '1m' });
  historicKlines.forEach((kline) => (klines[pair][kline.openTime] = kline));
};

const calculateRsi = (data, klines) => {
  if (!klines[data.symbol]) {
    klines[data.symbol] = [];
    populateKlinesForPair(klines, data.symbol);
  }

  const closePrices = Object.keys(klines[data.symbol])
  .sort()
  .map((k) => parseFloat(klines[data.symbol][k].close))

  klines[data.symbol][data.kline.startTime] = data.kline;
  const rsiInput = {
    values: closePrices,
    period: 14,
  };
  // console.log(rsiInput);
  const res = RSI.calculate(rsiInput);
  const sma99 = SMA.calculate({period : 99, values : closePrices});
  const sma25 = SMA.calculate({period : 25, values : closePrices});
  console.log(data.symbol, ' RSI: ', res[res.length - 1]);
  console.log(data.symbol, ' SMA99: ', sma99[sma99.length - 1]);
  console.log(data.symbol, ' SMA25: ', sma25[sma25.length - 1]);
};

(async () => {
  const prices = {};
  await refreshUsdtBalance();
  exchangeInfo = await binanceApi.exchangeInfo();
  const symbol = "DOGEUSDT";

  ws.onKline(symbol, "1m", (data) => calculateRsi(data, klines));
})();
