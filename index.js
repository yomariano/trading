const api = require("binance");

const negateLogarithmConvertor = (graph) => {
  return graph.map((row) => {
    return row.map((edge) => -Math.log(edge));
  });
};

const arbitrage = (currencies, ratesMatrix) => {
  let transGraph = negateLogarithmConvertor(ratesMatrix);

  let source = 0;
  let n = transGraph.length;
  let minDist = Array.from({ length: n }, (_, i) => parseFloat(Infinity));
  let pre = Array.from({ length: n }, (_, i) => -1);

  minDist[source] = source;

  for (let i = 0; i < n - 1; i++) {
    for (let sourceCurr = 0; sourceCurr < n; sourceCurr++) {
      for (let destCurr = 0; destCurr < n; destCurr++) {
        if (
          minDist[destCurr] >
          minDist[sourceCurr] + transGraph[sourceCurr][destCurr]
        ) {
          minDist[destCurr] =
            minDist[sourceCurr] + transGraph[sourceCurr][destCurr];
          pre[destCurr] = sourceCurr;
        }
      }
    }
  }

  for (let sourceCurr = 0; sourceCurr < n; sourceCurr++) {
    for (let destCurr = 0; destCurr < n; destCurr++) {
      if (
        minDist[destCurr] >
        minDist[sourceCurr] + transGraph[sourceCurr][destCurr]
      ) {
        // negative cycle exists, and use the predecessor chain to print the cycle
        let printCycle = [destCurr, sourceCurr];
        // Start from the source and go backwards until you see the source vertex again or any vertex that already exists in print_cycle array
        while (!printCycle.includes(pre[sourceCurr])) {
          printCycle.push(pre[sourceCurr]);
          sourceCurr = pre[sourceCurr];
          printCycle.push(pre[sourceCurr]);
        }
        let printCycleR = printCycle.reverse();
        let value = 1;
        console.log("=========== TRADE ============");
        for (let j = 0; j < printCycleR.length - 1; j++) {
          let step = printCycle[j];
          let exchangeRate = ratesMatrix[step][printCycle[j + 1]];

          console.log(
            `${value} ${currencies[step]} --${exchangeRate}--> ${(value =
              value * exchangeRate)} ${currencies[printCycle[j + 1]]}`
          );
        }
      }
    }
  }
};

const main = async (markets, currencies, tickersData) => {
  let matrix = [[]];
  for (var i = 0; i < currencies.length; i++) {
    matrix[i] = new Array(currencies.length);
    matrix[i][i] = 1;
  }

  tickersData
    .filter((td) => markets.map((m) => m.symbol).includes(td.symbol))
    .forEach((ticker) => {
      let market = markets.find((m) => m.symbol == ticker.symbol);
      matrix[currencies.indexOf(market.baseAsset)][
        currencies.indexOf(market.quoteAsset)
      ] = parseFloat(ticker.bestAskPrice);

      matrix[currencies.indexOf(market.quoteAsset)][
        currencies.indexOf(market.baseAsset)
      ] = 1 / parseFloat(ticker.bestBid);
    });

  console.table(matrix);

  arbitrage(currencies, matrix);
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
