const ocrRequest = require('../services/ocrRequest');
let samples = ['Coin Of The Day: https://t.co/WSTXaha1Nk','Coin of the day: Reddcoin (RDD)','Coin of the day: BURST --']

const stripCotText = function(text) {
    const stripDay = text.toLocaleLowerCase().replace('coin of the day', '');
    const stripWeek = stripDay.toLocaleLowerCase().replace('coin of the week', '');
    return stripWeek;
}

function findCoinSymbol (fullText) {
    let withoutPrefix = stripCotText(fullText);
    let remainder = withoutPrefix.split(' ');
    if (remainder[1].includes('t.co')) {
        // if image return false to signal to use ocr to get symbol
        return false
    } else {
        return returnSymbol(remainder);
    }
};

function returnSymbol (words) {
    let symbolIncluded = words.filter(word => word.match(/(\()\w+(\))/));
    if (symbolIncluded.length > 0) {
        return symbolIncluded[0].replace(/[^A-Za-z0-9]+/g, '');
    } else {
        // symbol not included return word as symbol
        return 'no symbol';
    }
};

// let symbols = samples.map(sample => findCoin(sample));
// console.log(symbols);

module.exports = findCoinSymbol;
