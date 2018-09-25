const Sync = require("sync");
const entity = require("./../libs/ls.sql");
var ls_employees = entity.entity("ls_employees")
    .columns({
        ID: { type: "int", isRequire: true, isIdentity: true },
        EmpCode: { type: "nvarchar(50)", isRequire: true },
        FirstName: { type: "nvarchar(150)", isRequire: true },
        LasttName: { type: "nvarchar(150)", isRequire: true },
        DepCode: { type: "nvarchar(50)", isRequire: true }
    });
Sync(() => {
    var ret = ls_employees.create.sync();
    ls_employees.createColumn.sync(null, "CreatedOn", "datetime", false);
    ls_employees.createKey.sync(null, {ID:0});
    console.log(ret);
});