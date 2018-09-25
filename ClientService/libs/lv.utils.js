const url = require('url');
const mongodb = require("mongodb")
const GUID = require("guid");
var sync = require('sync');
const contentDisposition = require('content-disposition');
const fs = require("fs");
var Excel = require('exceljs');
const Stream = require('stream');
const logs = require("./lv.logs");


var debug = (code) => {
    return true;
}
/**
 * Ghi lỗi
 */
var writeError = (res, error) => {
    logs.debug({
        url: res.req.url,
        error: error
    });
    if (!res._headerSent) {
        res.status(500).end(JSON.stringify({ message: error.message || error }));
    }

}
/**
 * Chạy code và bắt lỗi trả về
 * @param {any} fn
 * @param {any} event
 */
var _try = (fn, event) => {
   
    try {
        sync(() => {
            try {
                fn();
            }
            catch (ex) {
                writeError(event.res, { message: ex.message || ex });
            }
        })
    }
    catch (ex) {
        writeError(event.res, { message: ex.message || ex });
    }
}
/**
 * Ghi dữ liệu dạng mã hóa
 * @param {any} obj
 * @param {any} data
 */
var writeData = (obj, data) => {
    var txtJson = JSON.stringify(data);
    var x = CryptoJS();
    var content = CryptoJS().AES.encrypt(JSON.stringify(data), "123").toString();
    if (obj.end) {
        obj.end(content);
    }
    else {
        if (obj.res) {
            obj.res.end(content);
        }
    }
}
/**
 * Ghi dữ liệu dạng JSON
 * @param {any} obj
 * @param {any} data
 */
var writeJSON = (obj, data) => {
    var txtJson = JSON.stringify(data);
    if (obj.end) {
        obj.end(txtJson);
    }
    else {
        if (obj.res) {
            obj.res.end(txtJson);
        }
    }
}
/**
 * Đọc dữ liệu gởi về từ ajax
 * @param {any} obj
 */
var readData = (obj, handler) => {

    if (!handler) {
        if (obj.req) {
            if (obj.req.jsonData && (obj.req.jsonData != "")) {
                var txt = CryptoJS().AES.decrypt(obj.req.jsonData, "123").toString(CryptoJS().enc.Utf8);
                return JSON.parse(txt);
            }
            else {
                return {};
            }

        }
        else {
            if (obj.jsonData && (obj.jsonData != "")) {
                try {
                    var txt = CryptoJS().AES.decrypt(obj.jsonData, "123").toString(CryptoJS().enc.Utf8);
                    return JSON.parse(txt);
                }
                catch (ex) {
                    return {};
                }

            }
            else {
                return {};
            }

        }
    }
    else {
        var request = obj.req || obj;
        var body = "";
        request.on('data', function (data) {
            body += data;

        });

        request.on('end', function () {
            // var post = eval("("+body+")");
            handler(undefined, body);
            // use post['blah'], etc.
        });
    }

}
/**
 * Đọc dữ liệu dạng JSON
 * @param {any} obj
 * @param {any} handler
 */
var readJSON = (obj, handler) => {

    if (!handler) {
        if (obj.req) {
            if (obj.req.jsonData && (obj.req.jsonData != "")) {
                return JSON.parse(obj.req.jsonData);
            }
            else {
                return {};
            }

        }
        else {
            if (obj.jsonData && (obj.jsonData != "")) {
                try {

                    return JSON.parse(obj.jsonData);
                }
                catch (ex) {
                    return {};
                }

            }
            else {
                return {};
            }

        }
    }
    else {
        var request = obj.req || obj;
        var body = "";
        request.on('data', function (data) {
            body += data;

        });

        request.on('end', function () {
            // var post = eval("("+body+")");
            handler(undefined, body);
            // use post['blah'], etc.
        });
    }

}
/**
 * Chuyển hướng
 * @param {any} res
 * @param {any} url
 */
var redirect = (res, ur) => {
    if (!res._headerSent) {
        res.redirect(url);
    }
}
/**
 * Kiem tra 1 la null hay undefine hay ""
 * @param {any} value
 */
var isNull = (value) => {
    return (!value) || (value === null) || (value === "");
}
/**
 * Chuyển san UTC time
 * @param {any} date
 */
var getUTCDate = (date) => {
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
}
/**
 * Tạo bộ phân trang
 * @param {any} numOfShow số indicator ví dụ 1|2|3|4
 * @param {any} totalItems tổng số dòng
 * @param {any} pageSize kích thước trang
 * @param {any} pageIndex trang hiện hành
 */
var createPager = (numOfShow, totalItems, pageSize, pageIndex) => {
    if (totalItems == 0) {
        return {
            totalPages: 0,
            pageIndex: pageIndex,
            pageSize: pageSize,
            totalItems: 0,
            first: 0,
            last: numOfPage,
            numOfGroups: 0,
            numOfShow2: 0,
            groupIndex: 0,
            pagers: []
        };
    }
    var numOfPage = Math.floor(totalItems / pageSize);
    if (pageIndex > numOfPage) {
        pageIndex = numOfPage;
    }
    if ((totalItems % pageSize > 0) && (totalItems > pageSize)) {
        numOfPage++;
    }

    var numOfGroups = Math.floor(numOfPage / numOfShow);
    if (numOfPage % numOfShow > 0) {
        numOfGroups++;
    }
    var groupIndex = Math.floor(pageIndex / numOfShow);
    if ((pageIndex % numOfShow > 0) && (pageIndex > numOfShow)) {
        groupIndex++;
    }




    var numOfShow2 = Math.floor(numOfShow / 2);

    var start = 0;
    var end = start + numOfShow;
    if ((groupIndex > 0)) {
        if (groupIndex < numOfGroups) {
            start = pageIndex - numOfShow2;
            end = start + numOfShow;
        }
        else {
            start = (groupIndex - 1) * numOfShow + 1;
            end = start + numOfShow;
        }
    }
    if (end > numOfPage) {
        var n = end - numOfPage;
        start = start - n;
        end = end - n;
    }

    var ret = {
        totalPages: numOfPage,
        pageIndex: pageIndex,
        pageSize: pageSize,
        totalItems: totalItems,
        first: 0,
        last: numOfPage,
        numOfGroups: numOfGroups,
        numOfShow2: numOfShow2,
        groupIndex: groupIndex,
        pagers: []
    };

    for (var i = start; i < end; i++) {
        ret.pagers.push({
            index: i,
            caption: (i + 1)

        });
    }
    if (pageIndex < numOfPage - 1) {
        ret.next = pageIndex + 1;
    }
    if (pageIndex > 1) {
        ret.previous = pageIndex - 1;
    }
    return ret;
}
/**
 * Cat cac khoang trang dau va cuoi cua tat ca cac thuoc tinh la text
 * @param {any} data
 */
var trimData = (data) => {
    if (!data) return data;
    if (data == null) return data;
    if (data instanceof Date) return data;
    delete data["$$hashKey"]
    if (data instanceof Array) {
        data.forEach(x => {
            delete x["$$hashKey"];
            x = trimData(x);
        })
    }

    if (typeof data === "number") return data;
    if (typeof data === "boolean") return data;
    if (typeof data === "string") {
        while (data[0] == " ") data = data.substring(1, data.length);
        while (data[data.length - 1] == " ") data = data.substring(0, data.length - 1);
        return data;
    }
    else {
        var keys = Object.keys(data);
        for (var i = 0; i < keys.length; i++) {
            data[keys[i]] = trimData(data[keys[i]]);
        }
        return data;
    }

}

var getValue = (data, path) => {
    if (!path) return data;
    var items = path.split('.');
    if (items.length == 0) return data;
    var val = data;
    for (var i = 0; i < items.length; i++) {
        if (val == null) return val;
        val = val[items[i]];
    }
    if (typeof val === "string") {
        while ((val.length > 0) && (val[0] === " ")) val = val.substring(1, val.length);
        while ((val.length > 0) && (val[val.length - 1] === " ")) val = val.substring(0, val.length - 1);
        while ((val.length > 0) && (val.indexOf("  ")>-1)) val = val.replace("  ", " ");
    }
    return val;
}
/**
 * Đặt giá trị theo đường dẫn thuộc tính
 * @param {any} data
 * @param {any} path
 * @param {any} value
 */
var setValue = (data, path, value) => {
    if (!path) return data;
    var items = path.split('.');
    if (items.length == 0) return data;
    var val = data;
    for (var i = 0; i < items.length - 1; i++) {
        val = val[items[i]];
    }
    val[items[items.length - 1]] = value;
}
/**
 * Convert các field text có nội dung Datetime sang DateTime thực sự
 * @param {any} listOfFields
 * @param {any} data
 */
var convertDateFields = (listOfFields, data) => {
    var ret = [];
    for (var i = 0; i < listOfFields.length; i++) {
        var val = getValue(data, listOfFields[i]);

        if (!isNull(val)) {
            if (typeof val === "string") {
                setValue(data, listOfFields[i], new Date(val))
            }
        }
    }
    return data;
}
var checkRequireFields = (listOfFields, data) => {
    var ret = [];
    for (var i = 0; i < listOfFields.length; i++) {
        var val = getValue(data, listOfFields[i]);
        if (isNull(val)) {
            ret.push({
                errorType: listOfFields[i] + "IsEmpty",
                field: listOfFields[i],
                description: listOfFields[i] + " is empty"
            });
        }
    }
    return ret;
}
/**
 * lay dia chi goc cua web site
 * @param {any} req
 */
var getRootUrl = (req) => {
    if (!global.rootUrl) {
        global.rootUrl = url.format({
            protocol: req.protocol,
            host: req.get('host'),
            pathname: ""
        });
        while (global.rootUrl[global.rootUrl.length - 1] === '/') {
            global.rootUrl = global.rootUrl.substring(0, global.rootUrl.length - 1);
        }
    }
    return global.rootUrl;
};
/**
* Chuyển hướng
* @param {any} res
* @param {any} url
*/
var redirect = (res, url) => {
    if (!res._headerSent) {
        res.redirect(url);
        res.end();
    }
};
/**
 * Lấy ngôn ngữ đang sử dụng của Request hoặc event đang xử lý
 * @param {any} event
 */
var getCurrentLanguageCode = (event) => {
    var req = event.req || event;
    return req.currentLanguageCode
}
/**
 * lấy param từ url dựa vào route trong file route.config của hệ thống
 * @param {any} event
 */
var getUrlParams = (event) => {
    if (!event) return {};
    if (!event.req) return {};
    if (!event.req.routeInfo) return {};
    if (!event.req.routeInfo.params) return {};
    return event.req.routeInfo.params;
}
/**
 * Thực hiện trình tự các bước khử bất đồng bộ ex sequences().then(emit=>{you code here must call emit.done(error? [optional]}).then(emit=>{ code here)).done(handler)

 */
var sequences = () => {
    function ret() {
        var emiter = (index) => {
            if (!index) index = 0;
            function $emit(index) {
                var e = this;
                e.step = index;
                e.done = (err) => {
                    if (err) me.handler(err);
                    else {
                        next(e.step + 1);
                    }
                }
            }
            return new $emit(index);
        }
        var next = (index) => {
            if (!index) index = 0;
            if (index < me.fnList.length) {
                try {
                    me.fnList[index]((err) => {
                        emiter(index).done(err)
                    });

                }
                catch (ex) {
                    me.handler({
                        error: {
                            message: ex.message || ex
                        }
                    })
                }
            }
            else {
                me.handler(undefined, null);
                delete me;
            }
        }
        var me = this;
        me.fnList = [];
        me.then = (fn) => {
            me.fnList.push(fn);
            return me;
        }
        me.done = (handler) => {
            me.handler = handler;
            next(0);
        }
    }
    return new ret();
}
/**
 * lấy schema của 1 object
 * @param {any} data
 * @param {any} parent
 */
var getSchema = (data, parent) => {
    var ret = [];
    if (!data) return ret;
    else {
        var keys = Object.keys(data);
        keys.forEach(key => {
            var _key = (parent) ? (parent + "." + key) : key;
            if (data[key] instanceof Date) {
                ret.push({
                    Name: _key,
                    Type: "Date"
                });
            }
            else {
                if (typeof data[key] === "string") {
                    ret.push({
                        Name: _key,
                        Type: "Text"
                    });
                }
                else {
                    if (typeof data[key] == "boolean") {
                        ret.push({
                            Name: _key,
                            Type: "Boolean"
                        });
                    }
                    else {
                        if (typeof data[key] === 'number') {
                            ret.push({
                                Name: _key,
                                Type: "Number"
                            });
                        }
                        else {
                            if (data[key] instanceof Array) {
                                ret.push({
                                    Name: _key,
                                    Type: "List"
                                });
                            }
                            else {
                                if ((data[key]==null) || (data[key]._bsontype === "ObjectID")) {
                                    ret.push({
                                        Name: _key,
                                        Type: "Text"
                                    });
                                }
                                else {
                                    if (typeof data[key] === "object") {
                                        var _ret = getSchema(data[key], key);
                                        _ret.forEach(x => {
                                            ret.push(x);
                                        })

                                    }
                                }
                                
                            }
                        }
                    }
                }

            }
        });
        return ret;
    }
}
/**
 * tạo regex so sánh bằng vào ví dụ 'mytext'=>/^mytext$/i
 * @param {any} txt
 */
var createEqualRegExp = (txt) => {
    return new RegExp("^" + txt + "$", "i");
}
/**
 * Mã hóa sha
 * @param {any} str
 */
var sha = (str) => {

    var rotate_left = function (n, s) {
        var t4 = (n << s) | (n >>> (32 - s));
        return t4;
    };



    var cvt_hex = function (val) {
        var str = '';
        var i;
        var v;

        for (i = 7; i >= 0; i--) {
            v = (val >>> (i * 4)) & 0x0f;
            str += v.toString(16);
        }
        return str;
    };

    var blockstart;
    var i, j;
    var W = new Array(80);
    var H0 = 0x67452301;
    var H1 = 0xEFCDAB89;
    var H2 = 0x98BADCFE;
    var H3 = 0x10325476;
    var H4 = 0xC3D2E1F0;
    var A, B, C, D, E;
    var temp;


    var str_len = str.length;

    var word_array = [];
    for (i = 0; i < str_len - 3; i += 4) {
        j = str.charCodeAt(i) << 24 | str.charCodeAt(i + 1) << 16 | str.charCodeAt(i + 2) << 8 | str.charCodeAt(i + 3);
        word_array.push(j);
    }

    switch (str_len % 4) {
        case 0:
            i = 0x080000000;
            break;
        case 1:
            i = str.charCodeAt(str_len - 1) << 24 | 0x0800000;
            break;
        case 2:
            i = str.charCodeAt(str_len - 2) << 24 | str.charCodeAt(str_len - 1) << 16 | 0x08000;
            break;
        case 3:
            i = str.charCodeAt(str_len - 3) << 24 | str.charCodeAt(str_len - 2) << 16 | str.charCodeAt(str_len - 1) <<
                8 | 0x80;
            break;
    }

    word_array.push(i);

    while ((word_array.length % 16) != 14) {
        word_array.push(0);
    }

    word_array.push(str_len >>> 29);
    word_array.push((str_len << 3) & 0x0ffffffff);

    for (blockstart = 0; blockstart < word_array.length; blockstart += 16) {
        for (i = 0; i < 16; i++) {
            W[i] = word_array[blockstart + i];
        }
        for (i = 16; i <= 79; i++) {
            W[i] = rotate_left(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);
        }

        A = H0;
        B = H1;
        C = H2;
        D = H3;
        E = H4;

        for (i = 0; i <= 19; i++) {
            temp = (rotate_left(A, 5) + ((B & C) | (~B & D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B, 30);
            B = A;
            A = temp;
        }

        for (i = 20; i <= 39; i++) {
            temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B, 30);
            B = A;
            A = temp;
        }

        for (i = 40; i <= 59; i++) {
            temp = (rotate_left(A, 5) + ((B & C) | (B & D) | (C & D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B, 30);
            B = A;
            A = temp;
        }

        for (i = 60; i <= 79; i++) {
            temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B, 30);
            B = A;
            A = temp;
        }

        H0 = (H0 + A) & 0x0ffffffff;
        H1 = (H1 + B) & 0x0ffffffff;
        H2 = (H2 + C) & 0x0ffffffff;
        H3 = (H3 + D) & 0x0ffffffff;
        H4 = (H4 + E) & 0x0ffffffff;
    }

    temp = cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4);
    return temp.toLowerCase();

};
var CryptoJS = () => {
    var CryptoJS = CryptoJS || function (u, p) {
        var d = {}, l = d.lib = {}, s = function () { }, t = l.Base = { extend: function (a) { s.prototype = this; var c = new s; a && c.mixIn(a); c.hasOwnProperty("init") || (c.init = function () { c.$super.init.apply(this, arguments) }); c.init.prototype = c; c.$super = this; return c }, create: function () { var a = this.extend(); a.init.apply(a, arguments); return a }, init: function () { }, mixIn: function (a) { for (var c in a) a.hasOwnProperty(c) && (this[c] = a[c]); a.hasOwnProperty("toString") && (this.toString = a.toString) }, clone: function () { return this.init.prototype.extend(this) } },
            r = l.WordArray = t.extend({
                init: function (a, c) { a = this.words = a || []; this.sigBytes = c != p ? c : 4 * a.length }, toString: function (a) { return (a || v).stringify(this) }, concat: function (a) { var c = this.words, e = a.words, j = this.sigBytes; a = a.sigBytes; this.clamp(); if (j % 4) for (var k = 0; k < a; k++)c[j + k >>> 2] |= (e[k >>> 2] >>> 24 - 8 * (k % 4) & 255) << 24 - 8 * ((j + k) % 4); else if (65535 < e.length) for (k = 0; k < a; k += 4)c[j + k >>> 2] = e[k >>> 2]; else c.push.apply(c, e); this.sigBytes += a; return this }, clamp: function () {
                    var a = this.words, c = this.sigBytes; a[c >>> 2] &= 4294967295 <<
                        32 - 8 * (c % 4); a.length = u.ceil(c / 4)
                }, clone: function () { var a = t.clone.call(this); a.words = this.words.slice(0); return a }, random: function (a) { for (var c = [], e = 0; e < a; e += 4)c.push(4294967296 * u.random() | 0); return new r.init(c, a) }
            }), w = d.enc = {}, v = w.Hex = {
                stringify: function (a) { var c = a.words; a = a.sigBytes; for (var e = [], j = 0; j < a; j++) { var k = c[j >>> 2] >>> 24 - 8 * (j % 4) & 255; e.push((k >>> 4).toString(16)); e.push((k & 15).toString(16)) } return e.join("") }, parse: function (a) {
                    for (var c = a.length, e = [], j = 0; j < c; j += 2)e[j >>> 3] |= parseInt(a.substr(j,
                        2), 16) << 24 - 4 * (j % 8); return new r.init(e, c / 2)
                }
            }, b = w.Latin1 = { stringify: function (a) { var c = a.words; a = a.sigBytes; for (var e = [], j = 0; j < a; j++)e.push(String.fromCharCode(c[j >>> 2] >>> 24 - 8 * (j % 4) & 255)); return e.join("") }, parse: function (a) { for (var c = a.length, e = [], j = 0; j < c; j++)e[j >>> 2] |= (a.charCodeAt(j) & 255) << 24 - 8 * (j % 4); return new r.init(e, c) } }, x = w.Utf8 = { stringify: function (a) { try { return decodeURIComponent(escape(b.stringify(a))) } catch (c) { throw Error("Malformed UTF-8 data"); } }, parse: function (a) { return b.parse(unescape(encodeURIComponent(a))) } },
            q = l.BufferedBlockAlgorithm = t.extend({
                reset: function () { this._data = new r.init; this._nDataBytes = 0 }, _append: function (a) { "string" == typeof a && (a = x.parse(a)); this._data.concat(a); this._nDataBytes += a.sigBytes }, _process: function (a) { var c = this._data, e = c.words, j = c.sigBytes, k = this.blockSize, b = j / (4 * k), b = a ? u.ceil(b) : u.max((b | 0) - this._minBufferSize, 0); a = b * k; j = u.min(4 * a, j); if (a) { for (var q = 0; q < a; q += k)this._doProcessBlock(e, q); q = e.splice(0, a); c.sigBytes -= j } return new r.init(q, j) }, clone: function () {
                    var a = t.clone.call(this);
                    a._data = this._data.clone(); return a
                }, _minBufferSize: 0
            }); l.Hasher = q.extend({
                cfg: t.extend(), init: function (a) { this.cfg = this.cfg.extend(a); this.reset() }, reset: function () { q.reset.call(this); this._doReset() }, update: function (a) { this._append(a); this._process(); return this }, finalize: function (a) { a && this._append(a); return this._doFinalize() }, blockSize: 16, _createHelper: function (a) { return function (b, e) { return (new a.init(e)).finalize(b) } }, _createHmacHelper: function (a) {
                    return function (b, e) {
                        return (new n.HMAC.init(a,
                            e)).finalize(b)
                    }
                }
            }); var n = d.algo = {}; return d
    }(Math);
    (function () {
        var u = CryptoJS, p = u.lib.WordArray; u.enc.Base64 = {
            stringify: function (d) { var l = d.words, p = d.sigBytes, t = this._map; d.clamp(); d = []; for (var r = 0; r < p; r += 3)for (var w = (l[r >>> 2] >>> 24 - 8 * (r % 4) & 255) << 16 | (l[r + 1 >>> 2] >>> 24 - 8 * ((r + 1) % 4) & 255) << 8 | l[r + 2 >>> 2] >>> 24 - 8 * ((r + 2) % 4) & 255, v = 0; 4 > v && r + 0.75 * v < p; v++)d.push(t.charAt(w >>> 6 * (3 - v) & 63)); if (l = t.charAt(64)) for (; d.length % 4;)d.push(l); return d.join("") }, parse: function (d) {
                var l = d.length, s = this._map, t = s.charAt(64); t && (t = d.indexOf(t), -1 != t && (l = t)); for (var t = [], r = 0, w = 0; w <
                    l; w++)if (w % 4) { var v = s.indexOf(d.charAt(w - 1)) << 2 * (w % 4), b = s.indexOf(d.charAt(w)) >>> 6 - 2 * (w % 4); t[r >>> 2] |= (v | b) << 24 - 8 * (r % 4); r++ } return p.create(t, r)
            }, _map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
        }
    })();
    (function (u) {
        function p(b, n, a, c, e, j, k) { b = b + (n & a | ~n & c) + e + k; return (b << j | b >>> 32 - j) + n } function d(b, n, a, c, e, j, k) { b = b + (n & c | a & ~c) + e + k; return (b << j | b >>> 32 - j) + n } function l(b, n, a, c, e, j, k) { b = b + (n ^ a ^ c) + e + k; return (b << j | b >>> 32 - j) + n } function s(b, n, a, c, e, j, k) { b = b + (a ^ (n | ~c)) + e + k; return (b << j | b >>> 32 - j) + n } for (var t = CryptoJS, r = t.lib, w = r.WordArray, v = r.Hasher, r = t.algo, b = [], x = 0; 64 > x; x++)b[x] = 4294967296 * u.abs(u.sin(x + 1)) | 0; r = r.MD5 = v.extend({
            _doReset: function () { this._hash = new w.init([1732584193, 4023233417, 2562383102, 271733878]) },
            _doProcessBlock: function (q, n) {
                for (var a = 0; 16 > a; a++) { var c = n + a, e = q[c]; q[c] = (e << 8 | e >>> 24) & 16711935 | (e << 24 | e >>> 8) & 4278255360 } var a = this._hash.words, c = q[n + 0], e = q[n + 1], j = q[n + 2], k = q[n + 3], z = q[n + 4], r = q[n + 5], t = q[n + 6], w = q[n + 7], v = q[n + 8], A = q[n + 9], B = q[n + 10], C = q[n + 11], u = q[n + 12], D = q[n + 13], E = q[n + 14], x = q[n + 15], f = a[0], m = a[1], g = a[2], h = a[3], f = p(f, m, g, h, c, 7, b[0]), h = p(h, f, m, g, e, 12, b[1]), g = p(g, h, f, m, j, 17, b[2]), m = p(m, g, h, f, k, 22, b[3]), f = p(f, m, g, h, z, 7, b[4]), h = p(h, f, m, g, r, 12, b[5]), g = p(g, h, f, m, t, 17, b[6]), m = p(m, g, h, f, w, 22, b[7]),
                    f = p(f, m, g, h, v, 7, b[8]), h = p(h, f, m, g, A, 12, b[9]), g = p(g, h, f, m, B, 17, b[10]), m = p(m, g, h, f, C, 22, b[11]), f = p(f, m, g, h, u, 7, b[12]), h = p(h, f, m, g, D, 12, b[13]), g = p(g, h, f, m, E, 17, b[14]), m = p(m, g, h, f, x, 22, b[15]), f = d(f, m, g, h, e, 5, b[16]), h = d(h, f, m, g, t, 9, b[17]), g = d(g, h, f, m, C, 14, b[18]), m = d(m, g, h, f, c, 20, b[19]), f = d(f, m, g, h, r, 5, b[20]), h = d(h, f, m, g, B, 9, b[21]), g = d(g, h, f, m, x, 14, b[22]), m = d(m, g, h, f, z, 20, b[23]), f = d(f, m, g, h, A, 5, b[24]), h = d(h, f, m, g, E, 9, b[25]), g = d(g, h, f, m, k, 14, b[26]), m = d(m, g, h, f, v, 20, b[27]), f = d(f, m, g, h, D, 5, b[28]), h = d(h, f,
                        m, g, j, 9, b[29]), g = d(g, h, f, m, w, 14, b[30]), m = d(m, g, h, f, u, 20, b[31]), f = l(f, m, g, h, r, 4, b[32]), h = l(h, f, m, g, v, 11, b[33]), g = l(g, h, f, m, C, 16, b[34]), m = l(m, g, h, f, E, 23, b[35]), f = l(f, m, g, h, e, 4, b[36]), h = l(h, f, m, g, z, 11, b[37]), g = l(g, h, f, m, w, 16, b[38]), m = l(m, g, h, f, B, 23, b[39]), f = l(f, m, g, h, D, 4, b[40]), h = l(h, f, m, g, c, 11, b[41]), g = l(g, h, f, m, k, 16, b[42]), m = l(m, g, h, f, t, 23, b[43]), f = l(f, m, g, h, A, 4, b[44]), h = l(h, f, m, g, u, 11, b[45]), g = l(g, h, f, m, x, 16, b[46]), m = l(m, g, h, f, j, 23, b[47]), f = s(f, m, g, h, c, 6, b[48]), h = s(h, f, m, g, w, 10, b[49]), g = s(g, h, f, m,
                            E, 15, b[50]), m = s(m, g, h, f, r, 21, b[51]), f = s(f, m, g, h, u, 6, b[52]), h = s(h, f, m, g, k, 10, b[53]), g = s(g, h, f, m, B, 15, b[54]), m = s(m, g, h, f, e, 21, b[55]), f = s(f, m, g, h, v, 6, b[56]), h = s(h, f, m, g, x, 10, b[57]), g = s(g, h, f, m, t, 15, b[58]), m = s(m, g, h, f, D, 21, b[59]), f = s(f, m, g, h, z, 6, b[60]), h = s(h, f, m, g, C, 10, b[61]), g = s(g, h, f, m, j, 15, b[62]), m = s(m, g, h, f, A, 21, b[63]); a[0] = a[0] + f | 0; a[1] = a[1] + m | 0; a[2] = a[2] + g | 0; a[3] = a[3] + h | 0
            }, _doFinalize: function () {
                var b = this._data, n = b.words, a = 8 * this._nDataBytes, c = 8 * b.sigBytes; n[c >>> 5] |= 128 << 24 - c % 32; var e = u.floor(a /
                    4294967296); n[(c + 64 >>> 9 << 4) + 15] = (e << 8 | e >>> 24) & 16711935 | (e << 24 | e >>> 8) & 4278255360; n[(c + 64 >>> 9 << 4) + 14] = (a << 8 | a >>> 24) & 16711935 | (a << 24 | a >>> 8) & 4278255360; b.sigBytes = 4 * (n.length + 1); this._process(); b = this._hash; n = b.words; for (a = 0; 4 > a; a++)c = n[a], n[a] = (c << 8 | c >>> 24) & 16711935 | (c << 24 | c >>> 8) & 4278255360; return b
            }, clone: function () { var b = v.clone.call(this); b._hash = this._hash.clone(); return b }
        }); t.MD5 = v._createHelper(r); t.HmacMD5 = v._createHmacHelper(r)
    })(Math);
    (function () {
        var u = CryptoJS, p = u.lib, d = p.Base, l = p.WordArray, p = u.algo, s = p.EvpKDF = d.extend({ cfg: d.extend({ keySize: 4, hasher: p.MD5, iterations: 1 }), init: function (d) { this.cfg = this.cfg.extend(d) }, compute: function (d, r) { for (var p = this.cfg, s = p.hasher.create(), b = l.create(), u = b.words, q = p.keySize, p = p.iterations; u.length < q;) { n && s.update(n); var n = s.update(d).finalize(r); s.reset(); for (var a = 1; a < p; a++)n = s.finalize(n), s.reset(); b.concat(n) } b.sigBytes = 4 * q; return b } }); u.EvpKDF = function (d, l, p) {
            return s.create(p).compute(d,
                l)
        }
    })();
    CryptoJS.lib.Cipher || function (u) {
        var p = CryptoJS, d = p.lib, l = d.Base, s = d.WordArray, t = d.BufferedBlockAlgorithm, r = p.enc.Base64, w = p.algo.EvpKDF, v = d.Cipher = t.extend({
            cfg: l.extend(), createEncryptor: function (e, a) { return this.create(this._ENC_XFORM_MODE, e, a) }, createDecryptor: function (e, a) { return this.create(this._DEC_XFORM_MODE, e, a) }, init: function (e, a, b) { this.cfg = this.cfg.extend(b); this._xformMode = e; this._key = a; this.reset() }, reset: function () { t.reset.call(this); this._doReset() }, process: function (e) { this._append(e); return this._process() },
            finalize: function (e) { e && this._append(e); return this._doFinalize() }, keySize: 4, ivSize: 4, _ENC_XFORM_MODE: 1, _DEC_XFORM_MODE: 2, _createHelper: function (e) { return { encrypt: function (b, k, d) { return ("string" == typeof k ? c : a).encrypt(e, b, k, d) }, decrypt: function (b, k, d) { return ("string" == typeof k ? c : a).decrypt(e, b, k, d) } } }
        }); d.StreamCipher = v.extend({ _doFinalize: function () { return this._process(!0) }, blockSize: 1 }); var b = p.mode = {}, x = function (e, a, b) {
            var c = this._iv; c ? this._iv = u : c = this._prevBlock; for (var d = 0; d < b; d++)e[a + d] ^=
                c[d]
        }, q = (d.BlockCipherMode = l.extend({ createEncryptor: function (e, a) { return this.Encryptor.create(e, a) }, createDecryptor: function (e, a) { return this.Decryptor.create(e, a) }, init: function (e, a) { this._cipher = e; this._iv = a } })).extend(); q.Encryptor = q.extend({ processBlock: function (e, a) { var b = this._cipher, c = b.blockSize; x.call(this, e, a, c); b.encryptBlock(e, a); this._prevBlock = e.slice(a, a + c) } }); q.Decryptor = q.extend({
            processBlock: function (e, a) {
                var b = this._cipher, c = b.blockSize, d = e.slice(a, a + c); b.decryptBlock(e, a); x.call(this,
                    e, a, c); this._prevBlock = d
            }
        }); b = b.CBC = q; q = (p.pad = {}).Pkcs7 = { pad: function (a, b) { for (var c = 4 * b, c = c - a.sigBytes % c, d = c << 24 | c << 16 | c << 8 | c, l = [], n = 0; n < c; n += 4)l.push(d); c = s.create(l, c); a.concat(c) }, unpad: function (a) { a.sigBytes -= a.words[a.sigBytes - 1 >>> 2] & 255 } }; d.BlockCipher = v.extend({
            cfg: v.cfg.extend({ mode: b, padding: q }), reset: function () {
                v.reset.call(this); var a = this.cfg, b = a.iv, a = a.mode; if (this._xformMode == this._ENC_XFORM_MODE) var c = a.createEncryptor; else c = a.createDecryptor, this._minBufferSize = 1; this._mode = c.call(a,
                    this, b && b.words)
            }, _doProcessBlock: function (a, b) { this._mode.processBlock(a, b) }, _doFinalize: function () { var a = this.cfg.padding; if (this._xformMode == this._ENC_XFORM_MODE) { a.pad(this._data, this.blockSize); var b = this._process(!0) } else b = this._process(!0), a.unpad(b); return b }, blockSize: 4
        }); var n = d.CipherParams = l.extend({ init: function (a) { this.mixIn(a) }, toString: function (a) { return (a || this.formatter).stringify(this) } }), b = (p.format = {}).OpenSSL = {
            stringify: function (a) {
                var b = a.ciphertext; a = a.salt; return (a ? s.create([1398893684,
                    1701076831]).concat(a).concat(b) : b).toString(r)
            }, parse: function (a) { a = r.parse(a); var b = a.words; if (1398893684 == b[0] && 1701076831 == b[1]) { var c = s.create(b.slice(2, 4)); b.splice(0, 4); a.sigBytes -= 16 } return n.create({ ciphertext: a, salt: c }) }
        }, a = d.SerializableCipher = l.extend({
            cfg: l.extend({ format: b }), encrypt: function (a, b, c, d) { d = this.cfg.extend(d); var l = a.createEncryptor(c, d); b = l.finalize(b); l = l.cfg; return n.create({ ciphertext: b, key: c, iv: l.iv, algorithm: a, mode: l.mode, padding: l.padding, blockSize: a.blockSize, formatter: d.format }) },
            decrypt: function (a, b, c, d) { d = this.cfg.extend(d); b = this._parse(b, d.format); return a.createDecryptor(c, d).finalize(b.ciphertext) }, _parse: function (a, b) { return "string" == typeof a ? b.parse(a, this) : a }
        }), p = (p.kdf = {}).OpenSSL = { execute: function (a, b, c, d) { d || (d = s.random(8)); a = w.create({ keySize: b + c }).compute(a, d); c = s.create(a.words.slice(b), 4 * c); a.sigBytes = 4 * b; return n.create({ key: a, iv: c, salt: d }) } }, c = d.PasswordBasedCipher = a.extend({
            cfg: a.cfg.extend({ kdf: p }), encrypt: function (b, c, d, l) {
                l = this.cfg.extend(l); d = l.kdf.execute(d,
                    b.keySize, b.ivSize); l.iv = d.iv; b = a.encrypt.call(this, b, c, d.key, l); b.mixIn(d); return b
            }, decrypt: function (b, c, d, l) { l = this.cfg.extend(l); c = this._parse(c, l.format); d = l.kdf.execute(d, b.keySize, b.ivSize, c.salt); l.iv = d.iv; return a.decrypt.call(this, b, c, d.key, l) }
        })
    }();
    (function () {
        for (var u = CryptoJS, p = u.lib.BlockCipher, d = u.algo, l = [], s = [], t = [], r = [], w = [], v = [], b = [], x = [], q = [], n = [], a = [], c = 0; 256 > c; c++)a[c] = 128 > c ? c << 1 : c << 1 ^ 283; for (var e = 0, j = 0, c = 0; 256 > c; c++) { var k = j ^ j << 1 ^ j << 2 ^ j << 3 ^ j << 4, k = k >>> 8 ^ k & 255 ^ 99; l[e] = k; s[k] = e; var z = a[e], F = a[z], G = a[F], y = 257 * a[k] ^ 16843008 * k; t[e] = y << 24 | y >>> 8; r[e] = y << 16 | y >>> 16; w[e] = y << 8 | y >>> 24; v[e] = y; y = 16843009 * G ^ 65537 * F ^ 257 * z ^ 16843008 * e; b[k] = y << 24 | y >>> 8; x[k] = y << 16 | y >>> 16; q[k] = y << 8 | y >>> 24; n[k] = y; e ? (e = z ^ a[a[a[G ^ z]]], j ^= a[a[j]]) : e = j = 1 } var H = [0, 1, 2, 4, 8,
            16, 32, 64, 128, 27, 54], d = d.AES = p.extend({
                _doReset: function () {
                    for (var a = this._key, c = a.words, d = a.sigBytes / 4, a = 4 * ((this._nRounds = d + 6) + 1), e = this._keySchedule = [], j = 0; j < a; j++)if (j < d) e[j] = c[j]; else { var k = e[j - 1]; j % d ? 6 < d && 4 == j % d && (k = l[k >>> 24] << 24 | l[k >>> 16 & 255] << 16 | l[k >>> 8 & 255] << 8 | l[k & 255]) : (k = k << 8 | k >>> 24, k = l[k >>> 24] << 24 | l[k >>> 16 & 255] << 16 | l[k >>> 8 & 255] << 8 | l[k & 255], k ^= H[j / d | 0] << 24); e[j] = e[j - d] ^ k } c = this._invKeySchedule = []; for (d = 0; d < a; d++)j = a - d, k = d % 4 ? e[j] : e[j - 4], c[d] = 4 > d || 4 >= j ? k : b[l[k >>> 24]] ^ x[l[k >>> 16 & 255]] ^ q[l[k >>>
                        8 & 255]] ^ n[l[k & 255]]
                }, encryptBlock: function (a, b) { this._doCryptBlock(a, b, this._keySchedule, t, r, w, v, l) }, decryptBlock: function (a, c) { var d = a[c + 1]; a[c + 1] = a[c + 3]; a[c + 3] = d; this._doCryptBlock(a, c, this._invKeySchedule, b, x, q, n, s); d = a[c + 1]; a[c + 1] = a[c + 3]; a[c + 3] = d }, _doCryptBlock: function (a, b, c, d, e, j, l, f) {
                    for (var m = this._nRounds, g = a[b] ^ c[0], h = a[b + 1] ^ c[1], k = a[b + 2] ^ c[2], n = a[b + 3] ^ c[3], p = 4, r = 1; r < m; r++)var q = d[g >>> 24] ^ e[h >>> 16 & 255] ^ j[k >>> 8 & 255] ^ l[n & 255] ^ c[p++], s = d[h >>> 24] ^ e[k >>> 16 & 255] ^ j[n >>> 8 & 255] ^ l[g & 255] ^ c[p++], t =
                        d[k >>> 24] ^ e[n >>> 16 & 255] ^ j[g >>> 8 & 255] ^ l[h & 255] ^ c[p++], n = d[n >>> 24] ^ e[g >>> 16 & 255] ^ j[h >>> 8 & 255] ^ l[k & 255] ^ c[p++], g = q, h = s, k = t; q = (f[g >>> 24] << 24 | f[h >>> 16 & 255] << 16 | f[k >>> 8 & 255] << 8 | f[n & 255]) ^ c[p++]; s = (f[h >>> 24] << 24 | f[k >>> 16 & 255] << 16 | f[n >>> 8 & 255] << 8 | f[g & 255]) ^ c[p++]; t = (f[k >>> 24] << 24 | f[n >>> 16 & 255] << 16 | f[g >>> 8 & 255] << 8 | f[h & 255]) ^ c[p++]; n = (f[n >>> 24] << 24 | f[g >>> 16 & 255] << 16 | f[h >>> 8 & 255] << 8 | f[k & 255]) ^ c[p++]; a[b] = q; a[b + 1] = s; a[b + 2] = t; a[b + 3] = n
                }, keySize: 8
            }); u.AES = p._createHelper(d)
    })();
    return CryptoJS;
}
/**
 * Dùng để gọi đồng thời cùng lúc nhiều lệnh<br/>
* Các dùng paralell().call(()=>{}).call(()=>{}).done(()=>{})
 */
var paralellCaller = () => {
    function paralell_exec(noneTimer) {
        var me = this;
        me.listOfFn = [];
        me.call = (fn) => {
            var instance = new function () {
                _me = this;
                _me.index = me.listOfFn.length,
                    _me.fn = fn;
                _me.finish = false;
                _me.done = (err) => {
                    this.finish = true;
                    this.err = err;
                }
            }
            me.listOfFn.push(instance);
            return me;
        }
        me.wait = (handler) => {
            var errors = [];
            var x = () => {
                var ok = true;
                var i = 0;
                while ((i < me.listOfFn.length)) {
                    ok = ok && me.listOfFn[i].finish;
                    if (me.listOfFn[i].error) {
                        errors.push(me.listOfFn[i].error)
                    }
                    i++;
                }
                return ok;
            }
            var y = () => {
                var ok = x();
                if (ok) {
                    if (errors.length > 0) {
                        handler({ error: errors });
                    }
                    else {
                        handler();
                    }

                }
                else {
                    setTimeout(y, 1)
                }
            }
            y()
        }
        me.done = (handler) => {
            if (!noneTimer) {
                me.listOfFn.forEach(item => {
                    setTimeout(function () {
                        var _done = () => {
                            item.done();
                        }
                        try {
                            item.fn(_done,item)
                        }
                        catch (ex) {
                            item.error = ex;
                        }

                    }, 1);
                }, this);
               
                setTimeout(() => {
                    me.wait(handler);
                }, 1)
            }
            else {
                me.listOfFn.forEach(item => {
                    (function () {
                        var _done = () => {
                            item.done();
                        }
                        try {
                            item.fn(_done,item)
                        }
                        catch (ex) {
                            item.error = ex;
                        }

                    },1)();
                }, this);
                setTimeout(() => {
                    me.wait(handler);
                }, 1)
            }
        }
    }
    return new paralell_exec();
}
/**
 * Convert text id to BSON ID
 * @param {any} id
 */
var objectID = (id) => {
    return mongodb.ObjectID(id)
}
/**
 * Kiểm tra đây có phải là Email
 * @param {any} email
 */
var isEmail = (email) => {
    var reg = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
    return reg.test(email);
}
/**
 * Tạo dãy GUID
 */
var newGuid = () => {
    return GUID.create().value;
}
/**
 * Tải hình với cache
 * @param {any} event
 * @param {any} data
 * @param {any} cacheKey
 */
var writeImage = (event, data, cacheKey) => {
    try {
        
        
        if (cacheKey) {
            if (!global.______images) global.______images = {};
            if (global.______images[cacheKey]) {
                event.res.writeHead(200, {
                    'Content-Type': global.______images[cacheKey].contentType,
                    'Cache-Control': 'public'
                });
                event.res.end(global.______images[cacheKey].data);
                event.done();
                return;
            }
        }
        var mType = data.split(';')[0].split(':')[1];
        var content = data.split(',')[1];
        if (cacheKey) {
            global.______images[cacheKey] = {
                contentType: mType,
                data: new Buffer(content, 'base64')
            }
            event.res.writeHead(200, {
                'Content-Type': global.______images[cacheKey].contentType,
                'Cache-Control': 'public'
            });
            event.res.end(global.______images[cacheKey].data);
            event.done();
            return;
        }
        else {
            event.res.writeHead(200, {
                'Content-Type': mType,
                'Cache-Control': 'public'
            });
            event.res.end(new Buffer(content, 'base64'));
            event.done();
            return;
        }
    }
    catch (ex) {
        event.done(ex);
    }

}
/**
 * Download file dữ liệu 
 * @param {any} event
 * @param {any} data
 */
var downLoad = (event, data, fileName) => {
    try {
        var mType = data.split(';')[0].split(':')[1];
        var content = data.split(',')[1];
        var res = event.res || event;
        res.setHeader('Content-Type', mType)
        res.setHeader('Content-Disposition', contentDisposition(fileName))
        res.end(new Buffer(content, 'base64'));
        event.done();
    }
    catch (ex) {
        event.done(ex);
    }
}
/**
 * Chuyển dữ liệu sang dạng datatable để xuất ra excel hoặc in
 * @param {any} list
 */
var convertToArrayTable = (list, handler) => {
    return new Promise((resolve, reject) => {
        var ret = {
            columns: [],
            rows: [],
            header:[]
        }
        if (list.length == 0) {
            if (handler) handler(undefined, ret);
            else resolve(ret);
            return;
        }
        
        for (var i = 0; i < list.length; i++) {
            ret.rows.push([]);
        }
        var schema = getSchema(list[0]);
        ret.columns = schema;
        ret.columns.forEach(c => {
            ret.header.push(c.Name);
        })
        var chunkSize = 1000;
        var hashTable = [];
        var n = Math.floor(list.length / chunkSize);
        for (var i = 0; i < n; i++) {
            hashTable.push({
                chunkIndex: i,
                start: i * chunkSize,
                end: (i + 1) * chunkSize
            })
        }
        if (list.length % chunkSize > 0) {
            hashTable.push({
                chunkIndex: n,
                start: n * chunkSize,
                end: list.length
            })
        }
        var p = paralellCaller(true);
        for (var i = 0; i < hashTable.length; i++) {
            p.call((emit, sender) => {
                setTimeout(() => {
                    var h = hashTable[sender.index];
                    for (var i = h.start; i < h.end; i++) {
                        var data = [];
                        ret.columns.forEach(col => {
                            ret.rows[i].push(getValue(list[i], col.Name));
                        })

                    }
                    emit();
                },1)
                
               

                
               
            })
        }
        p.done(err => {
            if (err) {
                if (handler) handler(err);
                else reject(err);
            }
            else {
                if (handler) handler(undefined, ret);
                else resolve(ret);
            }
        });
            
    });
}
/**
 * Tạo 1 Excel workbbook từ dữ liệu có sẵn
 * @param {any} list
 * @param {any} handler
 */
var createWorkbook = (list, handler) => {
    return new Promise((resolve, reject) => {
        try {
            var workbook = new Excel.Workbook();
            var sheet = workbook.addWorksheet('Data');
            convertToArrayTable(list, (err, result) => {
                if (err) {
                    if (handler) handler(err);
                    else reject(err);
                    return;
                }
                var cols = [];
                result.columns.forEach(c => {
                    cols.push(c.Name);
                })
                sheet.addRow(cols);
                for (var i = 0; i < cols.length; i++) {
                    sheet.getCell(1, i + 1).name = cols[i]
                }
                sheet.addRows(result.rows);
                if (handler) handler(undefined, workbook);
                else resolve(workbook);
            });
        }
        catch (ex) {
            if (handler) handler(ex);
            else reject(ex);
        }
    })


};
/**
 * Download file excel từ một dữ liệu có sẵn
 * @param {any} event
 * @param {any} data
 * @param {any} fileName
 */
var downLoadExcel = (event, data, fileName, handler) => {
    createWorkbook(data, (err, workbook) => {
        if (err) {
            event.done(err);
        }
        else {
            try {
                var stream = new Stream();
                workbook.xlsx.writeBuffer()
                    .then(stm => {
                        var mType = "application/vnd.ms-excel";

                        var res = event.res || event;
                        res.setHeader('Content-Type', mType)
                        res.setHeader('Content-Disposition', contentDisposition(fileName + ".xlsx"))
                        res.end(stm);
                        event.done();
                        if (handler) handler();
                    })
                    .catch(ex => {
                        handler(ex);
                        event.done(ex);
                    })




            }
            catch (ex) {
                handler(ex);
                event.done(ex);
            }
        }
    })

};
/**
 * Bỏ dấu
 * @param {any} value
 */
var clear_tress = (value) => {

    var map = {
        "%C3%A9": "e", "%C3%A8": "e", "%E1%BA%BB": "e", "%E1%BA%BD": "e", "%E1%BA%B9": "e", "%C3%AA": "e", "%E1%BA%BF": "e", "%E1%BB%81": "e", "%E1%BB%83": "e", "%E1%BB%85": "e", "%E1%BB%87": "e",
        "%C3%A1": "a", "%C3%A0": "a", "%E1%BA%A3": "a", "%C3%A3": "a", "%E1%BA%A1": "a", "%C3%A2": "a", "%E1%BA%A5": "a", "%E1%BA%A7": "a", "%E1%BA%A9": "a", "%E1%BA%AB": "a", "%E1%BA%AD": "a", "%C4%83": "a", "%E1%BA%AF": "a", "%E1%BA%B1": "a", "%E1%BA%B3": "a", "%E1%BA%B5": "a", "%E1%BA%B7": "a",
        "%C3%AD": "i", "%C3%AC": "i", "%E1%BB%89": "i", "%C4%A9": "i", "%E1%BB%8B": "i",
        "%C3%B3": "o", "%C3%B2": "o", "%E1%BB%8F": "o", "%C3%B5": "o", "%E1%BB%8D": "o", "%C3%B4": "o", "%E1%BB%91": "o", "%E1%BB%93": "o", "%E1%BB%95": "o", "%E1%BB%97": "o", "%E1%BB%99": "o", "%C6%A1": "o", "%E1%BB%9B": "o", "%E1%BB%9D": "o", "%E1%BB%9F": "o", "%E1%BB%A1": "o", "%E1%BB%A3": "o",
        "%C3%BA": "u", "%C3%B9": "u", "%E1%BB%A7": "u", "%C5%A9": "u", "%E1%BB%A5": "u", "%C6%B0": "u", "%E1%BB%A9": "u", "%E1%BB%AB": "u", "%E1%BB%AD": "u", "%E1%BB%AF": "u", "%E1%BB%B1": "u",
        "%C3%BD": "y", "%E1%BB%B3": "y", "%E1%BB%B7": "y", "%E1%BB%B9": "y", "%E1%BB%B5": "y",
        "%C4%91": "d",
        "a%CC%81": "a", "a%CC%80": "a", "a%CC%89": "a", "a%CC%83": "a", "a%CC%A3": "a", "%C3%A2": "a", "%C3%A2%CC%81": "a", "%C3%A2%CC%80": "a", "%C3%A2%CC%89": "a", "%C3%A2%CC%83": "a", "%C3%A2%CC%A3": "a", "%C4%83": "a", "%C4%83%CC%81": "a", "%C4%83%CC%80": "a", "%C4%83%CC%89": "a", "%C4%83%CC%83": "a", "%C4%83%CC%A3": "a",
        "e%CC%81": "e", "e%CC%80": "e", "e%CC%89": "e", "e%CC%83": "e", "e%CC%A3": "e", "%C3%AA": "e", "%C3%AA%CC%81": "e", "%C3%AA%CC%80": "e", "%C3%AA%CC%89": "e", "%C3%AA%CC%83": "e", "%C3%AA%CC%A3": "e",
        "i%CC%81": "i", "i%CC%80": "i", "i%CC%89": "i", "i%CC%83": "i",
        "o%CC%81": "o", "o%CC%80": "o", "o%CC%89": "o", "o%CC%83": "o", "o%CC%A3": "o", "%C3%B4": "o", "%C3%B4%CC%81": "o", "%C3%B4%CC%80": "o", "%C3%B4%CC%89": "o", "%C3%B4%CC%83": "o", "%C3%B4%CC%A3": "o", "%C6%A1": "o", "%C6%A1%CC%81": "o", "%C6%A1%CC%80": "o", "%C6%A1%CC%89": "o", "%C6%A1%CC%83": "o", "%C6%A1%CC%A3": "o",
        "u%CC%81": "u", "u%CC%80": "u", "u%CC%89": "u", "u%CC%83": "u", "u%CC%A3": "u", "%C6%B0": "u", "%C6%B0%CC%81": "u", "%C6%B0%CC%80": "u", "%C6%B0%CC%89": "u", "%C6%B0%CC%83": "u", "%C6%B0%CC%A3": "u",
        "y%CC%81": "y", "y%CC%80": "y", "y%CC%89": "y", "y%CC%A3": "y",
        "%C4%91": "d"
    };

    if (value == null) return "";
    value = value.toLowerCase();
    var ret = "";
    for (var i = 0; i < value.length; i++) {
        var k = encodeURIComponent(value[i]);
        var v = value[i];
        if (map[k]) {
            v = map[k];
        }
        if ("qwertyuiopasdfghjklzxcvbnm0123456789".indexOf(v) !== -1) {
            ret += v;
        }
        else {
            if (v === " ") {
                ret += v;
            }
        }

    }
    while (ret.indexOf("  ") > -1) ret = ret.replace("  ", " ");
    while (ret[0] === " ") ret = ret.substring(1, ret.length);
    while (ret[ret.length-1] === " ") ret = ret.substring(0, ret.length-1);
    return ret;
}
var toAbsUrl = (req, relUrl) => {
    var rUrl = getRootUrl(req.req || req);
    var ret = rUrl + relUrl;
    
    while (ret.indexOf("//") > -1) {
        ret = ret.replace("//", "/");
        
    }
    ret = ret.replace(":/", "://");
    return ret;
}
module.exports = {
    objectID: objectID,
    getCurrentLanguageCode: getCurrentLanguageCode,
    checkRequireFields: checkRequireFields,
    getValue: getValue,
    isNull: isNull,
    _try: _try,
    createPager: createPager,
    getUTCDate: getUTCDate,
    writeData: writeData,
    readData: readData,
    debug: debug,
    trimData: trimData,
    getCahce: () => {
        return global;
    },
    loadModule: (name) => {
        return require(name)
    },
    getCurrentDir: () => {
        return __dirname;
    },
    writeError: writeError,

    redirect: redirect,

    getRootUrl: getRootUrl,
    setValue: setValue,
    convertDateFields: convertDateFields,
    getUrlParams: getUrlParams,
    sequences: sequences,
    getSchema: getSchema,
    createEqualRegExp: createEqualRegExp,
    sha: sha,
    paralellCaller: paralellCaller,
    isEmail: isEmail,
    newGuid: newGuid,
    readJSON: readJSON,
    writeJSON: writeJSON,
    writeImage: writeImage,
    downLoad: downLoad,
    convertToArrayTable: convertToArrayTable,
    createWorkbook: createWorkbook,
    downLoadExcel: downLoadExcel,
    clear_tress: clear_tress,
    toAbsUrl: toAbsUrl
   
}





//var test = (a, b, handler) => {
   
//    setTimeout(() => { handler(undefined, a + b) }, 200);
//}
//var x = () => {
//    var ret = test.sync(null,1,1);
//    return ret;
//}
//sync(() => {
//    try {
//        var f = x()

//    }
//    catch (ex) {
//        console.log(ex);
//    }
//}
//    )
   
   
//});
//var test1 = (fn) => {
//    Sync(() => {
//        fn();
//    })
    
//}
//test1(() => {
//    var x = test.sync(null, 1, 6);
//    console.log(x);

//})
//test(1, 2, (e, r) => {
//    console.log(r);
//})

//function asyncFunction(a, b, callback) {
//    process.nextTick(function () {
//        callback('something went wrong');
//    })
//}

//// Run in a fiber 
//Sync(function () {

//    try {
//        var result = asyncFunction.sync(null, 2, 3);
//    }
//    catch (e) {
//        console.error(e); // something went wrong 
//    }
//})