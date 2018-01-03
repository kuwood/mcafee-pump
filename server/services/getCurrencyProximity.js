require('dotenv').config();
const rp = require('request-promise');

const ONE_HOUR_IN_SECONDS = 3600;

const options = {
  method: 'GET',
  uri: 'https://min-api.cryptocompare.com/data/histohour',
  qs: {
    limit: 1
  },
  json: true
};

function getCurrencyHourHistory(symbol, pairSym, exchange, tweetTime) {
    const options = {
        method: 'GET',
        uri: 'https://min-api.cryptocompare.com/data/histohour',
        qs: {
          limit: 1
        },
        json: true
    };
    options.qs.toTs = tweetTime;
    options.qs.fsym = symbol;
    options.qs.tsym = pairSym;
    options.qs.e = exchange;
    return rp(options);
};

function getCurrencyMinuteHistory(symbol, pairSym, exchange, tweetTime) {
    const options = {
        method: 'GET',
        uri: 'https://min-api.cryptocompare.com/data/histominute',
        qs: {
          limit: 2
        },
        json: true
      };
    options.qs.toTs = tweetTime;
    options.qs.fsym = symbol;
    options.qs.tsym = pairSym;
    options.qs.e = exchange;
    return rp(options);
};

async function getCurrencyProximity(name, symbol, pairSym, exchange, tweetTime) {
    const before = await getCurrencyMinuteHistory(symbol, pairSym, exchange, tweetTime - ONE_HOUR_IN_SECONDS);
    // const after = await getCurrencyHourHistory(symbol, pairSym, exchange, tweetTime + ONE_HOUR_IN_SECONDS);
    const currencyProximity = {
        name,
        symbol,
        before: {
           epoch: before.Data[1].time,
           price: before.Data[1].high 
        },
        // after: {
        //     epoch: after.Data[1].time,
        //     price: after.Data[1].high 
        // },
        pairing: pairSym
    }

    return currencyProximity;
}


// rdd time 1514123803
module.exports = getCurrencyProximity;
// rdd tweet id 944929837671690241

// (take index 1 in data array, and use high of the hour)
// hour before
// 7.3e-7 = 0.00000073
// https://min-api.cryptocompare.com/data/histohour?fsym=RDD&tsym=BTC&e=BITTREX&toTs=1514123803&limit=1

// hour after
// https://min-api.cryptocompare.com/data/histohour?fsym=RDD&tsym=BTC&e=BITTREX&toTs=1514124000&limit=1
