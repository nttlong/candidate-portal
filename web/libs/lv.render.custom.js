const hanldeBars = require("handlebars");
const moment = require("node-moment");
const moment_vn = require("./lv.moment.vn");
const humanizeDuration = require("../public/Scripts/humanize-duration")
moment_vn.install(moment);
var _apply_handlebar = () => {
    hanldeBars.registerHelper('eachItemInArray', function (path, options) {
        var items = path.split('/');
        if (path.indexOf('$') > -1) {
            items = path.split('$')
        }
        var data = this;
        for (var i = 1; i < items.length; i++) {
            data = data[items[i]];
        }
        if (data == null) {
            return "";
        }
        var ret = "";
        for (var i = 0; i < data.length; i++) {
            ret += options.fn(data[i]);
        }
        return ret;

    });
    hanldeBars.registerHelper('getValue', function (path, options) {

        var items = path.split('/');
        if (path[0] == "$") {
            items = path.split('$');
        }

        var data = this;
        if (items.length > 1) {
            for (var i = 1; i < items.length; i++) {
                data = data[items[i]];
                if ((!data) || (data == null)) return "";
            }
        }
        else {
            data = data[path]
        }
        return data;
    });
    hanldeBars.registerHelper('getvalue', function (path, options) {
        var items = path.split('/');
        if (path[0] == "$") {
            items = path.split('$');
        }
        var data = this;
        if (items.length > 1) {
            for (var i = 1; i < items.length; i++) {
                data = data[items[i]];
                if ((!data) || (data == null)) return "";
            }
        }
        else {
            data = data[path]
        }
        return data;
    });

    hanldeBars.registerHelper('getValueByLang', function (path, options) {
        if (options) {
            if (path) {
                return path[options];
            } else {
                return "";
            }
        } else {
            if (path) {
                return path['vn'];
            } else {
                return "";
            }
        }
    });

    hanldeBars.registerHelper("toJSON", (path, options) => {
        return JSON.stringify(path);
    });
    hanldeBars.registerHelper("toJson", (path, options) => {
        return JSON.stringify(path);
    });
    hanldeBars.registerHelper("getName", function (path, options) {
        if (typeof path === 'string' || path instanceof String) {
            var items = path.split('/');
            if (path[0] == "$") {
                items = path.split('$');
            }
            var data = this;
            if (items.length > 1) {
                for (var i = 1; i < items.length; i++) {
                    data = data[items[i]];
                    if ((!data) || (data == null)) return "";
                }
            }
            else {
                data = data[path]
            }
            return data["vn"];
        }
        else 
        {
            if ((!path) || (path == null)) return "";
            return path["vn"];
        }
    });
    hanldeBars.registerHelper("getValueByCurrentLanguage", (path, options) => {
        var items = path.split('/');
        if (path[0] == "$") {
            items = path.split('$');
        }
        var data = this;
        for (var i = 1; i < items.length; i++) {
            data = data[items[i]];
            if ((!data) || (data == null)) return "";
        }
        return data["vn"];
    });
    hanldeBars.registerHelper("ifValue", (path, options) => {
        var items = path.split('/');
        if (path[0] == "$") {
            items = path.split('$');
        }
        var data = this;
        for (var i = 1; i < items.length; i++) {
            data = data[items[i]];
            if ((!data) || (data == null)) {
                options.inverse();
               // return "&nbsp;"
            }
            else {
                return options.fn(this);
            }
        }
        if (data) return options.fn(this); else {
            options.inverse();
        }
        
    });
    hanldeBars.registerHelper("ifNotValue", (path, options) => {
        var items = path.split('/');
        if (path[0] == "$") {
            items = path.split('$');
        }
        var data = this;
        for (var i = 1; i < items.length; i++) {
            data = data[items[i]];
            if ((!data) || (data == null)) {
                
                return options.fn(this);
                // return "&nbsp;"
            }
            else {
                options.inverse();
            }
        }
        if (!data) return options.fn(this); else {
            options.inverse();
        }
    });
    hanldeBars.registerHelper("dateFormat", (value, options) => {

        if ((!value) || (value == null)) return " ";
        return moment(value).format(options.toUpperCase())
        
    });
    hanldeBars.registerHelper("dateFormatValue", (value, options) => {

        if ((!value) || (value == null)) return " ";
        return moment(value).format(options.toUpperCase())

    });

    hanldeBars.registerHelper("dateFormatValueFull", (value, options) => {

        if ((!value) || (value == null)) return " ";
        return moment(value).format(options)

    });

    hanldeBars.registerHelper("getValueLang", (value) => {

        if ((!value) || (value == null)) return " ";
        else if (value === 'vn') {
            return "Tiếng việt";
        } else if (value === 'en') {
            return "English";
        } else if (value === 'any') {
            return "Bất kỳ";
        }

    });

    hanldeBars.registerHelper('ifCond', function (v1, v2, options) {
        if (v1 === v2) {
            return options.fn(this);
        }
        return options.inverse(this);
    });

    hanldeBars.registerHelper('ifCondi', function (v1, v2, options) {
        if (parseInt(v1) === parseInt(v2)) {
            return options.fn(this);
        }
        return options.inverse(this);
    });

    hanldeBars.registerHelper('agoFormat', function (val, lang) {
        return moment(val).lang(lang||"vn").fromNow();
    });

    hanldeBars.registerHelper('ifObj', function (v1, v2, options) {
        if (v1 && v1[v2]) {
            return options.fn(this);
        }
        return options.inverse();
    });

    hanldeBars.registerHelper('humanizeDuration', function (val, lang) {
        if (lang === 'vn') lang = 'vi';
        var starts = moment(val.getFullYear() + '-' + (val.getMonth() + 1) + '-' + val.getDate());
        var toDate = new Date();
        var ends = moment(toDate.getFullYear() + '-' + (toDate.getMonth() + 1) + '-' + toDate.getDate());
        var spanishHumanizer = humanizeDuration.humanizer({
            language: lang || 'vi',
            units: ['y', 'mo', 'd']
        })
        return spanishHumanizer(ends.diff(starts), { language: (lang || 'vi') });
    });

    hanldeBars.registerHelper('ifCondNowDate', function (value, options) {
        if (moment(value).isSame(new Date())) {
            return options.inverse(this);
        } else {
            if (!moment(value).isAfter(new Date()))
                return options.fn(this);
            return options.inverse(this);
        }
    });
    hanldeBars.registerHelper("getArrLocationByLang", (val, lang, options) => {
        var lang = lang || 'vn';
        var str = "";
        for (var i = 0; i < val.length; i++) {
            var local = val[i].Provinces.Name[lang];
            if (local) {
                str += local + ', ';
            }
        }
        str = str.slice(0, -2);
        return str;
    });
    hanldeBars.registerHelper("formatSalary", (val, options) => {
        return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    });
    hanldeBars.registerHelper("getValFullCode", (val, options) => {
        if (val.indexOf("::") > -1) {
            return val.split('::')[1];
        }
        return val;
    });
};

module.exports = {
    /**
    *Bổ sung 1 số hàm khi render
    */
    apply_handlebar: _apply_handlebar
}