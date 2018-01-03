
// const getMcafeeTweets = require('./mcafeeTweets');
// getMcafeeTweets
//   .then(res => res)
//   .then(tweets => tweets.filter(tweet => tweet.full_text.toLowerCase().includes('coin of the day:')))
//   .then(coinTweets => {
//     redisClient.set('coinTweets', JSON.stringify(coinTweets));
//     console.log('populated redis');
//   })
//   .catch(err => console.log(err));

// const getCurrencyProximity = require('./getCurrencyProximity');
// getCurrencyProximity('Electroneum', 'ETN', 'BTC', 'CCCAGG', new Date('Thu Dec 21 15:09:07 +0000 2017').getTime() / 1000)
//   .then(cp => {
//     const currencyProximity = new CurrencyProximity(cp);
//     currencyProximity.save(err => {
//       console.log('New currencyProximity: ' + currencyProximity);
//     }).catch(e => console.log(e));
//   })
//   .catch(error => console.log(error));

// const getExactTweet = require('./getExactTweet');
// // get exact tweet
// getExactTweet('944929837671690241')
//   .then(tweet => {
//     tweet.tweet_created_at = tweet.created_at;
//     tweet.tweet_id = tweet.id;
//     tweet.tweet_id_str = tweet.id_str;
//     delete tweet.created_at;
//     delete tweet.id;
//     delete tweet.id_str;
//     // get coin proximity
//     // add coin proximity to tweet
//     return CurrencyProximity.findOne({symbol: 'RDD'})
//       .then(cp => {
//         tweet.currency_proximity = cp._id
//         console.log(cp);
//         console.log('currency_proximity', tweet.currency_proximity)
//         console.log('cp._id', cp._id)
//         return tweet
//       })
//       .catch(e => console.log(e));
//   })
//   .then(completedTweet => {
//     // insert tweet
//     const newTweet = new Tweet(completedTweet);
//     newTweet.save(err => {
//         console.log('New Tweet: ' + newTweet.full_text);
//     }).catch(e => console.log(e));
//   })
//   .catch(error => console.log(error));


// coin collection
// rp({
//     method: 'GET',
//     uri: 'https://www.cryptocompare.com/api/data/coinlist/',
//     json: true
//   })
//     .then(res => res)
//     .then(data => {
//       const coins = data.Data;
//       Object.keys(coins).forEach(coin => {
//         delete coins[coin].SortOrder;
//         delete coins[coin].Id;
//         delete coins[coin].Url;
//         delete coins[coin].ImageUrl;
//         const newCoin = new Coin(coins[coin]);
//         newCoin.save(err => {
//           console.log('New Coin: ' + newCoin.Symbol);
//         }).catch(e => console.log(e));
//       })
//     })