var elasticsearch = require('elasticsearch');
var host ="172.16.0.126:9200"
var client = new elasticsearch.Client({
    host: host,
    log: 'trace'
});

client.ping({
    // ping usually has a 3000ms timeout
    requestTimeout: 1000
}, function (error) {
    if (error) {
        console.trace('elasticsearch cluster is down!');
    } else {
        console.log('All is well');
    }
});