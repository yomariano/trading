import { data } from '../simpleTestData.js';
import assert from 'assert';
import { DiGraph, BellmanFord, lastIndexInList, buildPathGain } from '../utils/utils.js';

describe('Last item in list', () => {
  it('In the list [0, 2, 2, 3, 3, 2, 2] index of elemen 2 should be 7', () => {
    let list = [0, 2, 2, 3, 3, 2, 2];
    assert.equal(lastIndexInList(list, 2), 7);
  });

  it('In the list [0, 2, 2, 3, 3, 2, 2] index of elemen 2 should be 7', () => {
    let list = [0, 2, 2, 3, 3, 2, 2];
    assert.equal(lastIndexInList(list, 3), 5);
  });
});

describe('Graph Creation', () => {
  it('Shortest path should be correct', () => {
    let graph = new DiGraph();
    ['A', 'B', 'C', 'D', 'E'].map((n, i) => graph.addNode(i, n));
    graph.addEdge(0, 1, 1);
    graph.addEdge(1, 2, 2);
    graph.addEdge(0, 3, 2);
    graph.addEdge(2, 3, -20);
    graph.addEdge(3, 2, 2);
    graph.addEdge(2, 4, 8);
    graph.addEdge(3, 4, 3);

    let bf = new BellmanFord(graph);

    assert.deepEqual(bf.run(0), [[3, 2, 3]]);
  });

  it('Shortest path should be correct', () => {
    let markets = data.markets;
    let currencies = data.currencies;
    let graph = new DiGraph();
    data.currencies.map((n, i) => graph.addNode(i, n));
    data.tickersData.forEach((ticker) => {
      let market = markets.find((m) => m.symbol == ticker.symbol);
      let baseCurrencyIndex = currencies.indexOf(market.baseAsset);
      let quoteCurrencyIndex = currencies.indexOf(market.quoteAsset);
      let askPrice = 1 / parseFloat(ticker.bestAskPrice);
      let bidPrice = parseFloat(ticker.bestBid);

      graph.addEdge(baseCurrencyIndex, quoteCurrencyIndex, -Math.log10(bidPrice));
      graph.addEdge(quoteCurrencyIndex, baseCurrencyIndex, -Math.log10(askPrice));
    });

    let bf = new BellmanFord(graph);

    let result = bf.run(0);
    let steps = result.map((op) => op.map((step) => currencies[step]));
    console.log(buildPathGain(data.tickersData, steps[0]));
    assert.deepEqual(steps, [['USD', 'ARS', 'BRL', 'EUR', 'USD']]);
  });
});
