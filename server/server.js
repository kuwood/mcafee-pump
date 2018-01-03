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
const mongoUrl = process.env.NODE_ENV === 'prod' ? process.env.MONGO_PROD : process.env.MONGO_MCPUMP;

mongoose.connect(mongoUrl, {
  useMongoClient: true
});
mongoose.Promise = global.Promise;
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const redisClient = redis.createClient();

redisClient.on('error', function (err) {
  console.log('Error ' + err)
})

redisClient.set('redisTest', 'Redis Test Success');
redisClient.get('redisTest', function(err, data){ err ? console.log(err) : console.log(data)});

const app = express();

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, '../client/build')));

app.get('/ping', function (req, res) {
  return res.send('pong');
});

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.get('/cot', function (req, res) {
  console.log('hi')
  // res.status(200).json({hi: 'hi'})
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
  .then(tweet => redisClient.set('cot', JSON.stringify(tweet)))
  .catch(e => console.log(e));

CurrencyProximity.find({symbol: {$exists: true}})
  .then(data => data.map(cp => cp.symbol))
  .then(symbols => redisClient.set('allSymbols', JSON.stringify(symbols)))
  .catch(e => console.log(e))

// Cron string format
// Seconds: 0-59
// Minutes: 0-59
// Hours: 0-23
// Day of Month: 1-31
// Months: 0-11
// Day of Week: 0-6

const updateAllPrices = new CronJob('*/10 * * * * *', function() {
  redisClient.get('allSymbols', function (err, data) {
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
// 947503819625201664
const checkForCotw = new CronJob('0 */5 * * * *', function() {
  // get last lastCotCheckId from redis
  redisClient.get('lastCotCheckId', function(err, val) {
    // get mcafeetweetssince lastCotCheckId
    getMcafeeTweetsSince(val)
    .then(tweets => {
      console.log(val)
      // update lastCotTweetId in redis
      if (tweets.length < 0) {
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
                const cp = await getCurrencyProximity(coin.Name, coin.Symbol, 'BTC', 'CCCAGG', (new Date(tweet.created_at).getTime() / 1000));
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
                    afterJob = new CronJob(new Date(AddOneHour), function() {
                      // find and update currencyproximity
                      // call histominute for the after value, Or get current?
                      CurrencyProximity.update({ _id: tweet.currency_proximity._id }, { $set: {after: after} })
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
            Coin.findOne({Symbol: symbol})
              // use symbol to get coin proximity info and insert
              .then(async coin => {
                const cp = await getCurrencyProximity(coin.Name, coin.Symbol, 'BTC', 'CCCAGG', new Date(tweet.tweet_created_at).getTime() / 1000);
                const newCp = new CurrencyProximity(cp);
                newCp.save(err => {
                  console.log('New currencyProximity: ' + currencyProximity);
                }).catch(e => console.log(e));
                //     tweet.tweet_created_at = tweet.created_at;
                tweet.tweet_id = tweet.id;
                tweet.tweet_id_str = tweet.id_str;
                delete tweet.created_at;
                delete tweet.id;
                delete tweet.id_str;
                // get coin proximity
                // add coin proximity to tweet
                CurrencyProximity.findOne({symbol: coin.symbol})
                  .then(cp => {
                    tweet.currency_proximity = cp._id
                    console.log(cp);
                    console.log('currency_proximity', tweet.currency_proximity)
                    console.log('cp._id', cp._id)
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
  })

  
// TODO:
// change price history lookup to minutes since it is within the 7 day data cutoff
  //get previous price
  //queue price update an hour after tweet

}, null, true, 'America/Los_Angeles');


let afterJob;

  // cotw happen monday mornings
  // need to add a table view for all cotw/d
  // add support for ICO of the week

// "SortOrder": "143",
// "Id": "4547",
// "Url": "/coins/kgc/overview",
// "ImageUrl": "/media/19763/kgc.png",

app.listen(process.env.PORT || 8080, () => console.log(`running on ${process.env.PORT || 8080}`));
