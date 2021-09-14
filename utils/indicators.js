
import { RSI, SMA } from 'technicalindicators';


const calculateRsi = (values) => {
    const input = {
      values,
      period: 14,
    };
    const res = RSI.calculate(input);
    return res[res.length - 1];
  };
  
  const calculateSma = (values, period) => {
    const input = {
      values,
      period,
    };
    const res = SMA.calculate(input);
    return res[res.length - 1];
  };

  export {calculateRsi,calculateSma}