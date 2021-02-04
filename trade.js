import { getFilledPrice, safePrice } from './utils/helpers';
//import { ValueProcessor } from 'binance';

import pkg from 'binance';
const { ValueProcessor } = pkg;

const waitForOrder = async (binanceApi, order) => {
  let anOrder = order;
  while (anOrder.status !== 'FILLED') {
    console.log(`waiting for order`);
    anOrder = await binanceApi.queryOrder({ symbol: order.symbol, orderId: order.orderId, timestamp: new Date().getTime() });
    console.log(anOrder);
  }

  return anOrder;
};

const trade = async (binanceApi, symbol, balance, earningMargin, stopMargin, stopLimitMargin) => {
  console.log(symbol);
  console.log(`Will buy ${balance} USDT on ${symbol.symbol}`);
  try {
    const buyQuery = {
      symbol: symbol.symbol,
      type: 'MARKET',
      side: 'BUY',
      quoteOrderQty: balance,
    };
    console.log(buyQuery);
    const buyOrder = await binanceApi.newOrder(buyQuery);

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

    const filledOrder = await waitForOrder(binanceApi, buyOrder);
    const buyPrice = getFilledPrice(filledOrder);

    console.log(filledOrder);
    const price = ValueProcessor.processFilters(symbol, {
      price: safePrice(buyPrice * (1 + earningMargin / 100), symbol.baseAssetPrecision),
      quantity: 0,
    }).price;
    const stopPrice = ValueProcessor.processFilters(symbol, {
      price: safePrice(buyPrice * (1 + stopMargin / 100), symbol.baseAssetPrecision),
      quantity: 0,
    }).price;
    const stopLimitPrice = ValueProcessor.processFilters(symbol, {
      price: safePrice(buyPrice * (1 + stopLimitMargin / 100), symbol.baseAssetPrecision),
      quantity: 0,
    }).price;

    const quantity = ValueProcessor.processFilters(symbol, {
      quantity: parseFloat(filledOrder.executedQty) * 0.999,
      price: price,
    }).quantity;

    const sellQuery = {
      symbol: symbol.symbol,
      price,
      stopPrice,
      stopLimitPrice,
      stopLimitTimeInForce: 'GTC',
      side: 'SELL',
      quantity: quantity,
      timestamp: new Date().getTime(),
    };
    console.log(sellQuery);

    const sellOrder = await binanceApi.newOcoOrder(sellQuery);
    console.log(sellOrder);
  } catch (e) {
    console.log(e);
  }
};

export default trade;
