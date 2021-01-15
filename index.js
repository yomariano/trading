const api = require("binance");
var jsgraphs = require("js-graph-algorithms");

const main = async (markets, currencies, tickersData) => {
  let coinGraph = new jsgraphs.WeightedDiGraph(currencies.length);

  tickersData
    .filter((td) => markets.map((m) => m.symbol).includes(td.symbol))
    .forEach((ticker) => {
      let market = markets.find((m) => m.symbol == ticker.symbol);
      let baseCurrencyIndex = currencies.indexOf(market.baseAsset);
      let quoteCurrencyIndex = currencies.indexOf(market.quoteAsset);
      let askPrice = parseFloat(ticker.bestAskPrice);
      let bidPrice = 1 / parseFloat(ticker.bestBid);

      coinGraph.addEdge(
        new jsgraphs.Edge(
          baseCurrencyIndex,
          quoteCurrencyIndex,
          -Math.log(bidPrice)
        )
      );
      coinGraph.addEdge(
        new jsgraphs.Edge(
          quoteCurrencyIndex,
          baseCurrencyIndex,
          -Math.log(askPrice)
        )
      );
    });
  currencies.forEach((curr, index) => (coinGraph.node(index).label = curr));

  for (let v = 0; v < currencies.length; v++) {
    let bf = new jsgraphs.BellmanFord(coinGraph, v);
    if (bf.hasPathTo(v) && bf.distanceTo(v) < 0) {
      console.log(
        `Currency: ${currencies[v]} - Difference: ${bf.distanceTo(v)}`
      );
      bf.pathTo(v).map((e) => {
        console.log(e);
      });
      console.log(`-------------------------------------`);
    }
  }
};

const POLLING_INTERVAL = process.env.POLLING_INTERVAL || 3000; // 3 Seconds

let ws = new api.BinanceWS(true);
let binanceApi = new api.BinanceRest({ key: "a", secret: "b" });
let currencies = ["BTC", "BNB", "ETH", "USDT", "DAI", "BUSD"];

(async () => {
  const info = await binanceApi.exchangeInfo();
  let markets = info.symbols.filter(
    (m) => currencies.includes(m.baseAsset) && currencies.includes(m.quoteAsset)
  );

  ws.onAllTickers((tickersData) => main(markets, currencies, tickersData));

  priceMonitor = setInterval(async () => {}, POLLING_INTERVAL);
})();
