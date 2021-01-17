class DiGraph {
  constructor() {
    this.nodes = [];
    this.edges = [];
  }

  addEdge(u, v, w) {
    this.edges.push({ u, v, w });
  }

  addNode(i, label) {
    this.nodes.splice(i, 0, label);
  }

  V() {
    return this.nodes.length;
  }

  E() {
    return this.edges.length;
  }
}

class BellmanFord {
  constructor(_graph) {
    this.graph = _graph;
    this.predecessor = [];
    this.cost = [];
  }

  //Initialize data structure
  init(source) {
    this.graph.nodes.forEach((_, i) => {
      this.predecessor[i] = null;
      this.cost.push(Number.MAX_VALUE);
    });
    this.cost[source] = 0;
    this.seenNodes = [];
  }

  //Relax an Edge
  relax({ u, v, w }) {
    if (this.cost[u] + w < this.cost[v]) {
      this.cost[v] = this.cost[u] + w;
      this.predecessor[v] = u;
    }
  }

  //Run the algorithm and detect negative path
  run(source) {
    let opportunities = [];
    this.init(source);

    for (let i = 1; i < this.graph.V() - 1; i++) {
      this.graph.edges.forEach((e) => this.relax(e));
    }

    this.graph.edges.forEach(({ u, v, w }) => {
      if (this.cost[u] + w < this.cost[v]) {
        if (this.seenNodes.includes(v)) return; //
        let path = this.retraceNegativeCycle(v);
        if (!path) return;
        opportunities.unshift(path);
      }
    });
    return opportunities;
  }

  retraceNegativeCycle(from) {
    let path = [from];
    let previousNode = from;
    while (true) {
      previousNode = this.predecessor[previousNode];
      if (path.includes(previousNode)) {
        const idx = lastIndexInList(path, previousNode);

        let slicedPath = path.slice(undefined, idx);

        path = slicedPath;
        path.unshift(previousNode);
        return path;
      }

      if (this.seenNodes.includes(previousNode)) {
        return null;
      }

      path.unshift(previousNode);
      this.seenNodes.push(previousNode);
    }
  }
}

const lastIndexInList = (list, element) => {
  const result = list.length - [...list].reverse().indexOf(element);

  return result;
};

const buildPathGain = (tickerData, path) => {
  let accumulatedRate = 1;

  for (let i = 0; i < path.length - 1; i++) {
    let symbol = `${path[i]}${path[i + 1]}`;

    const pairData = tickerData.find((t) => t.symbol == symbol);
    if (pairData) {
      accumulatedRate *= pairData.bestBid;
    } else {
      pairData = tickerData.find((t) => t.symbol == `${path[i + 1]}${path[i]}`);
      accumulatedRate *= 1 / pairData.bestAskPrice;
    }
    // console.log(symbol, '---', 'ASK: ', pairData.bestAskPrice, 'BID: ', pairData.bestBid);
  }
  return (accumulatedRate - 1) * 100;
};

const processTickers = async (markets, currencies, tickersData) => {
  let graph = createGraph(markets, currencies, tickersData);
  let bf = new BellmanFord(graph);

  bf.run(0).forEach((op) => {
    let path = op.map((step) => currencies[step]);
    let pathGain = buildPathGain(tickersData, path);
    console.log('Opportunity: ', path, 'Rate: ', pathGain);
  });
};

const createGraph = (markets, currencies, tickersData, fee = 0.00075) => {
  let graph = new DiGraph();
  currencies.map((n, i) => graph.addNode(i, n));
  tickersData.forEach((ticker) => {
    let market = markets.find((m) => m.symbol == ticker.symbol);
    if (market) {
      let baseCurrencyIndex = currencies.indexOf(market.baseAsset);
      let quoteCurrencyIndex = currencies.indexOf(market.quoteAsset);
      let askPrice = 1 / parseFloat(ticker.bestAskPrice);
      let bidPrice = parseFloat(ticker.bestBid);
      let feeScalar = 1 - fee;

      graph.addEdge(baseCurrencyIndex, quoteCurrencyIndex, -Math.log10(feeScalar * bidPrice));
      graph.addEdge(quoteCurrencyIndex, baseCurrencyIndex, -Math.log10(feeScalar * askPrice));
    }
  });

  return graph;
};

export { processTickers, createGraph, DiGraph, buildPathGain, BellmanFord, lastIndexInList };
