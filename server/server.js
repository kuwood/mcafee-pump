require('dotenv').config();
const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const redis = require('redis');
const rp = require('request-promise');
const CronJob = require('cron').CronJob;
const mongoose = require('mongoose');
const getMcafeeTweetsSince = require('./services/getMcafeeTweetsSince');
const findCoinSymbol = require('./helpers/findCoinSymbol');
const ocrRequest = require('./services/ocrRequest');
const symbolFromString = require('./helpers/symbolFromString');
const getCurrencyProximity = require('./services/getCurrencyProximity');

const CurrencyProximity = require('./models/CurrencyProximity');
const Tweet = require('./models/Tweet');
const Coin = require('./models/Coin');
const mongoUrl = process.env.NODE_ENV === 'production' ? process.env.MONGO_MCPUMP : process.env.MONGO_DEV;

mongoose.connect(mongoUrl, {
  useMongoClient: true
});
mongoose.Promise = global.Promise;
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const redisClient = redis.createClient({url: process.env.REDIS_URL});

redisClient.on('error', function (err) {
  console.log('Error ' + err)
})

const app = express();

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('common', {
  skip: function (req, res) {
      return res.statusCode < 400
  }}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../client/build')));

app.get('/ping', function (req, res) {
  return res.send('pong');
});

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.get('/cot', function (req, res) {
  redisClient.get('cot', function(err, data) {
    if (err) console.log(err)
    res.json(data);
  })
});

app.get('/coin/:symbol/current', function (req, res) {
  const symbol = req.params.symbol
  redisClient.get('currentPrices', function(err, data) {
    if (err) console.log(err)
    const currentPrices = JSON.parse(data);
    const coinPrice = currentPrices[symbol.toUpperCase()];
    res.json(JSON.stringify(coinPrice));
  })
});

Tweet.findOne()
  .sort('-tweet_created_at')
  .populate('currency_proximity')
  // .then(t => console.log('thing',t))
  .then(tweet => {
    redisClient.set('cot', JSON.stringify(tweet));
    return tweet;
  })
  .then(tweet => {
    redisClient.get('lastCotCheckId', function(err, data) {
      if (!data) {
        redisClient.set('lastCotCheckId', tweet.tweet_id_str);
      }
    });
  })
  .catch(e => console.log(e));

CurrencyProximity.find({symbol: {$exists: true}})
  .then(data => data.map(cp => cp.symbol))
  .then(symbols => redisClient.set('allSymbols', JSON.stringify(symbols)))
  .catch(e => console.log(e));



// Cron string format
// Seconds: 0-59
// Minutes: 0-59
// Hours: 0-23
// Day of Month: 1-31
// Months: 0-11
// Day of Week: 0-6

const updateAllPrices = new CronJob('*/10 * * * * *', function() {
  redisClient.get('allSymbols', function (err, data) {
    if (err) console.log(err);
    const symbols = JSON.parse(data).join(',');
    const options = {
      method: 'GET',
      uri: 'https://min-api.cryptocompare.com/data/pricemulti',
      qs: {
        fsyms: symbols,
        tsyms: 'BTC'
      },
      json: true
    };
    // console.log(options)
    rp(options)
      .then(res => res)
      .then(data => redisClient.set('currentPrices', JSON.stringify(data)))
      .catch(e => console.log(e));
  })
}, null, true, 'America/Los_Angeles');


const checkForCotw = new CronJob('0 * * * * *', function() {
  // get last lastCotCheckId from redis
  redisClient.get('lastCotCheckId', function(err, val) {
    if (err) console.log(err);
    // get mcafeetweetssince lastCotCheckId
    getMcafeeTweetsSince(val)
    .then(tweets => {
      // update lastCotTweetId in redis
      if (tweets.length > 0) {
        redisClient.set('lastCotCheckId', tweets[0].id_str);
      }
      return tweets;
    })
    .then(tweets => {
      // look for cotw
      tweets.forEach(tweet => {
        const cotw = tweet.full_text.toLowerCase().includes('coin of the week');
        const cotd = tweet.full_text.toLowerCase().includes('coin of the day');
        if (cotw || cotd) {
          // use coin helper to determine if text tweet or image
          const symbol = findCoinSymbol(tweet.full_text);
          if (symbol === 'no symbol') {
            return
          } else if (!symbol) {
            // findCoinSymbol signalled its an image
            ocrRequest(tweet.entities.media[0].media_url_https)
              .then(data => symbolFromString(data.ParsedResults[0].ParsedText))
              // look up coin by symbol in db to get name
              .then(symbol => Coin.findOne({Symbol: symbol}))
              // use symbol to get coin proximity info and insert
              .then(async coin => {
                const cp = await getCurrencyProximity(coin.CoinName, coin.Symbol, 'BTC', 'CCCAGG', Math.round((new Date(tweet.created_at).getTime() / 1000)));
                const newCp = new CurrencyProximity(cp);
                newCp.save(err => {
                  console.log('New currencyProximity: ' + newCp);
                }).catch(e => console.log(e));
                tweet.tweet_created_at = tweet.created_at;
                tweet.tweet_id = tweet.id;
                tweet.tweet_id_str = tweet.id_str;
                delete tweet.created_at;
                delete tweet.id;
                delete tweet.id_str;
                // get coin proximity
                // add coin proximity to tweet
                CurrencyProximity.findOne({symbol: coin.Symbol})
                  .then(cp => {
                    tweet.currency_proximity = cp._id
                    console.log('currency_proximity', tweet.currency_proximity)
                    return tweet
                  })
                  .then(completedTweet => {
                    // insert tweet
                    const newTweet = new Tweet(completedTweet);
                    newTweet.save(err => {
                        console.log('New Tweet: ' + newTweet.full_text);
                    }).catch(e => console.log(e));
                    return newTweet;
                  })
                  .then(tweet => {
                    const AddOneHour = (tweet.tweet_created_at.getTime() / 1000) + 3600;
                    afterJob = new CronJob(new Date(AddOneHour), async function() {
                      const currentTime = new Date().getTime() / 1000;
                      const options = {
                        method: 'GET',
                        uri: 'https://min-api.cryptocompare.com/data/',
                        qs: {
                          fsyms: coin.Symbol,
                          tsyms: 'BTC'
                        },
                        json: true
                      };
                      // console.log(options)
                      const priceInBtc = await rp(options).catch(e => console.log(e));
                      const after = {
                        "epoch": currentTime,
                        "price": priceInBtc.BTC
                      }
                      // find and update currencyproximity
                      CurrencyProximity.update({ _id: tweet.currency_proximity._id }, { $set: {after: after} }).exec()
                        .catch(e => console.log(e));
                      this.stop();
                    }, () => console.log('Finished hour later job'), true, 'America/Los_Angeles');
                  })
                  .then(_ => {
                    //update all symbols
                    CurrencyProximity.find({symbol: {$exists: true}})
                      .then(data => data.map(cp => cp.symbol))
                      .then(symbols => redisClient.set('allSymbols', JSON.stringify(symbols)))
                      .catch(e => console.log(e));
                    //update COT
                    Tweet.findOne()
                      .sort('-tweet_created_at')
                      .populate('currency_proximity')
                      // .then(t => console.log('thing',t))
                      .then(tweet => redisClient.set('cot', JSON.stringify(tweet)))
                      .catch(e => console.log(e));
                  })
                  .catch(e => console.log(e));
              })
              .catch(e => console.log(e));
          } else {
            // use symbol to get coin proximity info and insert
            Coin.findOne({Symbol: symbol.toUpperCase()})
              // use symbol to get coin proximity info and insert
              .then(async coin => {
                const cp = await getCurrencyProximity(coin.CoinName, coin.Symbol, 'BTC', 'CCCAGG', new Date(tweet.created_at).getTime() / 1000);
                const newCp = new CurrencyProximity(cp);
                newCp.save(err => {
                  console.log('New currencyProximity: ' + newCp);
                }).catch(e => console.log(e));
                tweet.tweet_created_at = tweet.created_at;
                tweet.tweet_id = tweet.id;
                tweet.tweet_id_str = tweet.id_str;
                delete tweet.created_at;
                delete tweet.id;
                delete tweet.id_str;
                // get coin proximity
                // add coin proximity to tweet
                CurrencyProximity.findOne({symbol: coin.Symbol})
                  .then(cpToAdd => {
                    tweet.currency_proximity = cpToAdd._id
                    console.log(cpToAdd);
                    console.log('currency_proximity', tweet.currency_proximity)
                    console.log('cpToAdd._id', cpToAdd._id)
                    return tweet
                  })
                  .then(completedTweet => {
                    // insert tweet
                    const newTweet = new Tweet(completedTweet);
                    newTweet.save(err => {
                        console.log('New Tweet: ' + newTweet.full_text);
                    }).catch(e => console.log(e));
                  })
                  .then(tweet => {
                    //update all symbols
                    CurrencyProximity.find({symbol: {$exists: true}})
                      .then(data => data.map(cp => cp.symbol))
                      .then(symbols => redisClient.set('allSymbols', JSON.stringify(symbols)))
                      .catch(e => console.log(e));
                    //update COT
                    Tweet.findOne()
                      .sort('-tweet_created_at')
                      .populate('currency_proximity')
                      .then(tweet => redisClient.set('cot', JSON.stringify(tweet)))
                      .catch(e => console.log(e));
                  })
                  .catch(e => console.log(e));

            })
            .catch(e => console.log(e));
          }
        }
      })
    })
    .catch(e => console.log(e));
  })

  
// TODO:
  // clean up and seperate the code
}, null, true, 'America/Los_Angeles');


let afterJob;

  // cotw happen monday mornings
  // need to add a table view for all cotw/d

app.listen(process.env.PORT || 8080, () => console.log(`running on ${process.env.PORT || 8080}`));
