const models = require("./modules/lv.model");
const utils = require("./libs/lv.utils");
//var parallel = require('parallel');
var Excel = require('exceljs');
var workbook = new Excel.Workbook();
var sheet = workbook.addWorksheet('My Sheet');
//(new parallel())
//    .timeout(3000)
//    .add(function (done) {
//        models.sys_Users()
//            .toArray((err, list) => {
//                done(list)
//            });
//    })
//    .add(function (done) {
//        fs.readFile('index.js', 'utf8', done);
//    })
//    .done(function (err, results) {
//        console.log(results[0]);
//        console.log(results[1]);
//    })
models.ls_locations()
    .unwind("Provinces")
    .toArray((err, list) => {
        utils.convertToArrayTable(list, (err, result) => {
            var cols = [];
            result.columns.forEach(c => {
                cols.push(c.Name);
            })
            sheet.addRow(cols);
            for (var i = 0; i < cols.length; i++) {
                sheet.getCell(1,i+1).name =cols[i]
            }
            sheet.addRows(result.rows);
            workbook.xlsx.writeFile("./app_data/excel/ls_locations.xlsx")
            .then(function () {
                console.log("XONG");
            });
        });
//        if (list.length > 0) {
//            var header = utils.getSchema(list[0]);
//            var cols = [];
//            header.forEach(h => {
//                cols.push(h.Name)
//            })
//            sheet.addRow(cols);
//}
        
//        workbook.xlsx.writeFile("./app_data/excel/test7.xlsx")
//            .then(function () {
//                console.log("XONG");
//            });
    })

