var path = require("path");
var loadLanguage = (page, items, hanlder) => {
    var languageCache = {};
    if (global.argo && global.argo.cache && global.argo.language) {
        languageCache = global.argo.language
    }
    
    var dir = path.join("./../app_data/language");
    hanlder(undefined, {});
};
module.exports = {
    loadLanguage: loadLanguage
}