require('dotenv').config();
const rp = require('request-promise');

const options = {
  method: 'GET',
  uri: 'https://api.twitter.com/1.1/statuses/show.json',
  qs: {
    tweet_mode: 'extended'
  },
  headers: {
    Authorization: `Bearer ${process.env.TWITTER_APP_ONLY_TOKEN}`
  },
  json: true
};

const getExactTweet = id => {
    options.qs.id = id;
    return rp(options);
};

module.exports = getExactTweet;
// 944929837671690241
