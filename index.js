import dotenv from 'dotenv';
import api from 'binance';
import { safePrice } from './utils/helpers';
import trade from './trade';

dotenv.config();

const PRICE_LOG_LENGTH = 10; //
const DETECTION_THRESHOLD = 15; // Detection threshold%
const TAKE_PROFIT = 150; // Profit in %
const STOP_LOSS = -20; // Stop loss detection in %
const STOP_LOSS_LIMIT = -25; // Limit on stop loss in %

let ws = new api.BinanceWS(true);
let binanceApi = new api.BinanceRest({ key: process.env.BINANCE_KEY, secret: process.env.BINANCE_SECRET });
let usdtBalance = 0;
let exchangeInfo;

const updatePrices = async (prices, tickers) => {
  // console.log('Tickers Length: ', tickers.length);
  const usdtTickers = tickers.filter((t) => t.symbol.includes('USDT'));
  // console.log('USDT Tickers Length: ', usdtTickers.length);

  usdtTickers.forEach((ticker) => {
    if (!prices[ticker.symbol]) {
      prices[ticker.symbol] = {
        priceLog: [],
      };
    }
    prices[ticker.symbol].priceLog.unshift(parseFloat(ticker.bestAskPrice));
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
        trade(binanceApi, symbol, usdtBalance, TAKE_PROFIT, STOP_LOSS, STOP_LOSS_LIMIT);
      }
    }
  });
};

const refreshUsdtBalance = async () => {
  const account = await binanceApi.account();
  usdtBalance = safePrice(parseFloat(account.balances.find((asset) => asset.asset === 'USDT').free), 8);
};

const getSymbolData = (symbol) => {
  return exchangeInfo.symbols.find((s) => s.symbol === symbol);
};
const processUserData = (data) => {
  if (data.e === 'outboundAccountPosition') {
    console.log('Previous USDT Balance: ', usdtBalance);
    let usdtData = data.B.find((balance) => balance.a === 'USDT');
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

  ws.onAllTickers((tickersData) => updatePrices(prices, tickersData));
  ws.onUserData(binanceApi, processUserData);
})();
