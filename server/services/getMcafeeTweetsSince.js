require('dotenv').config();
const rp = require('request-promise');

const options = {
  method: 'GET',
  uri: 'https://api.twitter.com/1.1/statuses/user_timeline.json',
  qs: {
    user_id: '961445378',
    exclude_replies: 'true',
    include_rts: 'false',
    tweet_mode: 'extended'
  },
  headers: {
    Authorization: `Bearer ${process.env.TWITTER_APP_ONLY_TOKEN}`
  },
  json: true
};
// '943860891119964160'
const getMcafeeTweetsSince = function(sinceId) {
  options.qs.since_id = sinceId;
  return rp(options);
}

module.exports = getMcafeeTweetsSince;
