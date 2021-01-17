const data = {
  markets: [
    { symbol: 'EURUSD', baseAsset: 'EUR', quoteAsset: 'USD' },
    { symbol: 'USDARS', baseAsset: 'USD', quoteAsset: 'ARS' },
    { symbol: 'ARSBRL', baseAsset: 'ARS', quoteAsset: 'BRL' },
    { symbol: 'BRLCLP', baseAsset: 'BRL', quoteAsset: 'CLP' },
    { symbol: 'PENBRL', baseAsset: 'PEN', quoteAsset: 'BRL' },
    { symbol: 'BRLEUR', baseAsset: 'BRL', quoteAsset: 'EUR' },
  ],
  currencies: ['EUR', 'USD', 'ARS', 'BRL', 'PEN', 'CLP'],
  tickersData: [
    {
      symbol: 'EURUSD',
      bestBid: '1.2',
      bestAskPrice: '1.22',
    },
    {
      symbol: 'USDARS',
      bestBid: '85.74',
      bestAskPrice: '87.5',
    },
    {
      symbol: 'ARSBRL',
      bestBid: '0.062',
      bestAskPrice: '0.065',
    },
    {
      symbol: 'BRLCLP',
      bestBid: '100000',
      bestAskPrice: '101000',
    },
    {
      symbol: 'PENBRL',
      bestBid: '3',
      bestAskPrice: '3.1',
    },
    {
      symbol: 'BRLEUR',
      bestBid: '0.16',
      bestAskPrice: '0.165',
    },
  ],
};

export { data };
