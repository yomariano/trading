import dotenv from 'dotenv';
import api from 'binance/lib/binance.js';
import { safePrice } from './utils/helpers';
import trade from './trade';
import indicators from 'technicalindicators';



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

const updatePrices = async (binanceApi,prices, tickers) => {
  // console.log('Tickers Length: ', tickers.length);
  const usdtTickers = tickers.filter((t) => t.symbol.includes(ASSET_TO_START));
  // console.log('USDT Tickers Length: ', usdtTickers.length);

  usdtTickers.forEach((ticker) => {
    if (!prices[ticker.symbol]) {
      prices[ticker.symbol] = {
        priceLog: [],
        rsi: null
      };
    }
   
    prices[ticker.symbol].rsi = await getRsi(binanceApi, ticker.symbol, "1m");

    prices[ticker.symbol].priceLog.unshift(parseFloat(ticker.bestAskPrice));
    prices[ticker.symbol].inputRsi.values.unshift(parseFloat(ticker.currentClose));
    prices[ticker.symbol].priceLog.length = Math.min(prices[ticker.symbol].priceLog.length, PRICE_LOG_LENGTH);
    // const max = Math.max(...prices[ticker.symbol].priceLog);
    // const min = Math.min(...prices[ticker.symbol].priceLog);
    const ratio = prices[ticker.symbol].priceLog[0] / prices[ticker.symbol].priceLog[prices[ticker.symbol].priceLog.length - 1];

    if (
      ratio > 1 + DETECTION_THRESHOLD / 100 && // Ratio is GT than specified
      usdtBalance > 10 // && // Meets the minimum required balance on Binance
      // prices[ticker.symbol].priceLog[0] > prices[ticker.symbol].priceLog[prices[ticker.symbol].priceLog.length - 1] // Overall trend is going up
    ) {
      const symbol = getSymbolData(ticker.symbol);
      if (symbol.ocoAllowed && symbol.permissions.includes('SPOT')) {
        //trade(binanceApi, symbol, usdtBalance, TAKE_PROFIT, STOP_LOSS, STOP_LOSS_LIMIT);
      }
    }
  });
};

const timeIndex = 0,
    oIndex = 1,
    hIndex = 2,
    lIndex = 3,
    cIndex = 4,
    vIndex = 5

const detachSource = (ohlcv) => {
  let source = []
  source["open"] = []
  source["high"] = []
  source["low"] = []
  source["close"] = []
  source["volume"] = []
  if (ohlcv.length == 0) {
      return source
  }
  ohlcv.forEach(data => {
      source["open"].push(data[oIndex])
      source["high"].push(data[hIndex])
      source["low"].push(data[lIndex])
      source["close"].push(data[cIndex])
      source["volume"].push(data[vIndex])
  })
  return source
}

const getRsi = async (binanceApi, symbol, interval) => {
    const values = await binanceApi.klines(symbol, interval);
   // let source = detachSource(values)
    let rsiInput = {
      values: values,
      period: rsiLength
  }
  let res =  await indicators.RSI.calculate(rsiInput);
  return res;
}

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
  const prices = {};
  await refreshUsdtBalance();
  exchangeInfo = await binanceApi.exchangeInfo();

  //ws.onAllTickers((tickersData) => updatePrices(binanceApi,prices, tickersData));
  ws.onKline()
  ws.onUserData(binanceApi, processUserData);
})();
