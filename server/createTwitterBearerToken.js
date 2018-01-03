// import { log } from 'util';
require('dotenv').config();

/*** create-twitter-bearer-token.js ***/
const request = require('request');
const consumer_key = 'sbIwSDV1ywhH94EPlhKxmrIdJ';
const consumer_secret = 'pcqVwKRjUfgIviDSGia2mUtyFAVhIFL4DauRC47oUANLmIjb82';
const encode_secret = new Buffer(consumer_key + ':' + consumer_secret).toString('base64');

console.log(encode_secret)

// const options = {
//     url: 'https://api.twitter.com/oauth2/token',
//     headers: {
//         'Authorization': 'Basic ' + encode_secret,
//         'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'},
//     body: 'grant_type=client_credentials'
// };

// request.post(options, function(error, response, body) {
//     console.log(body); // <<<< This is your BEARER TOKEN !!!
// });
