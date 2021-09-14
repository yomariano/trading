const safePrice = (price, precision) => {
  const m = Math.pow(10, precision);
  const safePrice = Math.floor(price * m) / m;
  return safePrice;
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

// Unused
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

export { safePrice, getFilledPrice };
