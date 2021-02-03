import dotenv from 'dotenv';
import api from 'binance';

dotenv.config();
let binanceApi = new api.BinanceRest({ key: process.env.BINANCE_KEY, secret: process.env.BINANCE_SECRET });

const waitForOrder = async (order) => {
  let anOrder = order;
  while (anOrder.status !== 'FILLED') {
    console.log(`waiting for order`);
    anOrder = await binanceApi.queryOrder({ symbol: order.symbol, orderId: order.orderId, timestamp: new Date().getTime() });
    console.log(anOrder);
  }

  return anOrder;
};

const weightedAverage = (fills) => {
  const wa = fills.reduce(
    (counter, fill) => {
      return {
        totalQty: counter.totalQty + parseFloat(fill.qty),
        avgPrice: counter.avgPrice + parseFloat(fill.qty) * parseFloat(fill.price),
      };
    },
    { totalQty: 0, avgPrice: 0 }
  );
  return wa.avgPrice / wa.totalQty;
};

const safePrice = (price, precision) => {
  const m = Math.pow(10, precision);
  return Math.floor(price * m) / m;
};

const getFilledPrice = (order) => {
  switch (order.type) {
    case 'LIMIT':
      return parseFloat(order.price);
    case 'MARKET':
      return parseFloat(order.cummulativeQuoteQty) / parseFloat(order.executedQty); // weightedAverage(order.fills);
    default:
      return null;
  }
};

(async () => {
  const account = await binanceApi.account();
  const quantityUsdt = safePrice(parseFloat(account.balances.find((asset) => asset.asset === 'USDT').free), 3);
  console.log(`Balance USDT ${quantityUsdt}`);
  const symbol = 'XRPUSDT';
  //   const orderPrice = 50.75;
  const buyOrder = await binanceApi.newOrder({ symbol, type: 'MARKET', side: 'BUY', quoteOrderQty: quantityUsdt });

  //   LIMIT Order
  //   ---------
  //   const buyOrder = await binanceApi.newOrder({
  //     symbol,
  //     type: 'LIMIT',
  //     side: 'BUY',
  //     timeInForce: 'GTC',
  //     quantity: Math.floor((quantityUsdt * 1000) / orderPrice) / 1000,
  //     price: orderPrice,
  //   });

  const filledOrder = await waitForOrder(buyOrder);
  const buyPrice = getFilledPrice(filledOrder);

  const price = safePrice(buyPrice * 1.01, 6);
  const stopPrice = safePrice(buyPrice * 0.99, 6);
  const stopLimitPrice = safePrice(buyPrice * 0.985, 6);

  const sellQuery = {
    symbol,
    price,
    stopPrice,
    stopLimitPrice,
    stopLimitTimeInForce: 'GTC',
    side: 'SELL',
    quantity: parseFloat(filledOrder.executedQty),
    timestamp: new Date().getTime(),
  };
  console.log(sellQuery);

  try {
    const sellOrder = await binanceApi.newOcoOrder(sellQuery);
    console.log(sellOrder);
  } catch (e) {
    console.log(e);
  }
})();
