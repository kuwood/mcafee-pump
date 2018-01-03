require('dotenv').config();
const rp = require('request-promise');

const options = {
    method: 'GET',
    uri: `https://api.ocr.space/parse/imageurl`,
    qs: {
        apikey: process.env.OCR_SPACE_KEY
    },
    json: true
};

function ocrRequest(imageUrl) {
    options.qs.url = imageUrl;

    return rp(options)
}

module.exports = ocrRequest;
