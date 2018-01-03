const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const CoinSchema = new Schema(
    {

        "Name": {type: String, required: true},
        "Symbol": {type: String, required: true},
        "CoinName": {type: String, required: true},
        "FullName": {type: String},
        "Algorithm": {type: String},
        "ProofType": {type: String},
        "FullyPremined": {type: String},
        "TotalCoinSupply": {type: String},
        "PreMinedValue": {type: String},
        "TotalCoinsFreeFloat": {type: String},
        "Sponsored": {type: Boolean}
    }
);

module.exports = mongoose.model('Coin', CoinSchema);
