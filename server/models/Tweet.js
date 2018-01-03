const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const TweetSchema = new Schema(
    {
        "tweet_created_at": {type: Date, required: true},
        "tweet_id": {type: Number, required: true},
        "tweet_id_str": {type: String, required: true},
        "full_text": {type: String, required: true},
        "truncated": {type: Boolean, required: true},
        "display_text_range": {type: Array},
        "entities": {type: Schema.Types.Mixed},
        "source": {type: String},
        "in_reply_to_status_id": {type: Number},
        "in_reply_to_status_id_str": {type: String},
        "in_reply_to_user_id": {type: Number},
        "in_reply_to_user_id_str": {type: String},
        "in_reply_to_screen_name": {type: String},
        "user": {type: Schema.Types.Mixed},
        "geo": {type: Schema.Types.Mixed},
        "coordinates": {type: Schema.Types.Mixed},
        "place": {type: Schema.Types.Mixed},
        "contributors": {type: Schema.Types.Mixed},
        "is_quote_status": {type: Number},
        "retweet_count": {type: Number},
        "favorite_count": {type: Number},
        "favorited": {type: Boolean},
        "retweeted": {type: Boolean},
        "possibly_sensitive": {type: Boolean},
        "possibly_sensitive_appealable": {type: Boolean},
        "lang": {type: String},
        "currency_proximity": {type: Schema.Types.ObjectId, ref: 'CurrencyProximity'}
    }
);

module.exports = mongoose.model('Tweet', TweetSchema);
