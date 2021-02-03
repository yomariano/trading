import api from 'binance';
import { processTickers } from './utils/utils';

let ws = new api.BinanceWS(true);
let binanceApi = new api.BinanceRest({ key: 'a', secret: 'b' });
// let currencies = [
//   'BTC',
//   'BNB',
//   'ETH',
//   'USDT',
//   'DAI',
//   'BUSD',
//   'XLM',
//   'XRP',
//   'LINK',
//   'GRT',
//   '1INCH',
//   'NGN',
//   'DOT',
//   'ADA',
//   'LTC',
//   'ONE',
//   'UNI',
//   'AAVE',
//   'STX',
// ];

(async () => {
  const info = await binanceApi.exchangeInfo();
  let currencies = [...new Set(info.symbols.map((m) => [m.baseAsset, m.quoteAsset]).flat())];
  let markets = info.symbols.filter((m) => currencies.includes(m.baseAsset) && currencies.includes(m.quoteAsset));

  ws.onAllTickers((tickersData) => processTickers(markets, currencies, tickersData));
})();
