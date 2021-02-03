import dotenv from 'dotenv'
import api from "binance"

dotenv.config();

const waitForOrder = async (order) => {

    let anOrder = order
    while(anOrder.status !== 'FILLED') 
    {
        console.log(`waiting for order`);
        anOrder =  await binanceApi.queryOrder({symbol: order.symbol, orderId: order.orderId, timestamp: new Date().getTime() })
        console.log(anOrder)
    }

    return anOrder;

}

let binanceApi = new api.BinanceRest({ key: process.env.BINANCE_KEY, secret: process.env.BINANCE_SECRET });
const account = await binanceApi.account();
const quantityUsdt = Math.floor( parseFloat(account.balances.find(asset => asset.asset === "USDT").free));
console.log(`Balance USDT ${quantityUsdt}`);
const symbol = "BNBUSDT";
const orderPrice = 51.15;
//const buyOrder  = await binanceApi.newOrder({symbol, type: 'MARKET', side: 'BUY', quoteOrderQty: quantityUsdt })
const buyOrder  = await binanceApi.newOrder({symbol, type: 'LIMIT', side: 'BUY', timeInForce: "GTC", quantity: Math.floor(quantityUsdt * 1000 / orderPrice) / 1000, price: orderPrice })
console.log(buyOrder)
console.log(await waitForOrder(buyOrder))

// const sellOrder  = await binanceApi.newOcoOrder({symbol, type: 'MARKET', side: 'SELL', quoteOrderQty: quantityUsdt })

// console.log(sellOrder)


