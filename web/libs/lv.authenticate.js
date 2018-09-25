/**
 * Đặt chứng thực
 * @param {any} req
 * @param {any} data bao gồm sys_login
 */
var setAuthenticate = (req, data) => {
    if (!global.lv) global.lv = {};
    if (!global.lv.auth) global.lv.auth = {};
    global.lv.auth[req.sessionID] = data;
}
/**
 * Lấy thông tin chứng thực hiện tại
 * @param {any} req
 */
var getAuthenticate = (req) => {
    if (global.lv && global.lv.auth) {
        return global.lv.auth[req.sessionID];
    }
    else {
        return;
    }
}
/**
 * lấy thông tin user đang sử dụng theo request
 * @param {any} req HttpRequest
 */
var getUser = (req) => {
    
    if (global.lv && global.lv.auth && global.lv.auth[req.sessionID]) {
        return global.lv.auth[req.sessionID].User;
    }
    else {
        return;
    }
}
var getToken = (req) => {
    if (global.lv && global.lv.auth && global.lv.auth[req.sessionID]) {
        return global.lv.auth[req.sessionID].Token;
    }
    else {
        return "";
    }
}
/**
 * Loại bỏ chứng thực
 * @param {any} req
 */
var removeUser = (req) => {
    global.lv.auth[req.sessionID] = undefined;
}
module.exports= {
    setAuthenticate: setAuthenticate,
    getAuthenticate: getAuthenticate,
    getUser: getUser,
    removeUser: removeUser,
    getToken: getToken
}