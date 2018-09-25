var getFromContent = (content) => {
    var reg = /onload\s*=\s*\"store\:(\((?:\[??[^\[]*?\)))\"/i;
    var m = reg.exec(content);
    if (m) {
        var storeName = m[0].split('=')[1].split(':')[1].split('(')[1].split(')')[0];
        return {
            replacer: m[0].substring(0, m[0].length-1),
            storeName: storeName
        }
    }
}
module.exports = {
    scanContent: getFromContent
}