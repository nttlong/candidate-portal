const fs=require("fs");
var Apply = (content) => {
    if (!global.cache) global.cache = {};
    if (!global.cache.GoogleAnalytics) global.cache.GoogleAnalytics = {};
    if (!global.cache.GoogleAnalytics.header) {
        global.cache.GoogleAnalytics.header = fs.readFileSync("./app_data/GoogleAnalytics/header.txt", "utf-8");

    }
    if (!global.cache.GoogleAnalytics.body) {
        global.cache.GoogleAnalytics.body = fs.readFileSync("./app_data/GoogleAnalytics/body.txt", "utf-8");

    }
    var headerIndex = content.indexOf("<head>");
    if (headerIndex > -1) {
        headerIndex += "<head>".length;
        var bodyIndex = content.indexOf("<body");
        if (bodyIndex > -1) {
            bodyIndex = content.indexOf(">", bodyIndex);
            bodyIndex += 1;
            content = content.substring(0, headerIndex) + global.cache.GoogleAnalytics.header
                + content.substring(headerIndex, bodyIndex)
                + global.cache.GoogleAnalytics.body + content.substring(bodyIndex, content.length);
        }
    }
    return content;
}
module.exports = {
    Apply: Apply
}