const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const CurrencyProximitySchema = new Schema(
    {
        "name": {type: String, required: true},
        "symbol": {type: String, required: true},
        "before": {
            "epoch": {type: String, required: true},
            "price": {type: String, required: true},
            "paring_to_usd": {type: String}
        },
        "after": {
            "epoch": {type: String},
            "price": {type: String},
            "paring_to_usd": {type: String}
        },
        "pairing": {type: String, required: true}
    }
);

module.exports = mongoose.model('CurrencyProximity', CurrencyProximitySchema);
