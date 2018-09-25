const utils = require("./libs/lv.utils");
const models = require("./modules/lv.model");
const sync = require("sync");
models.phi_table()
    .toArray((err, list) => {
        console.log(list)
    });

//models.ls_candidate()
//    .lookup(models.ls_recruiters(), "UserEmail", "UserEmail", "recruiter")
//    .unwind("recruiter")
//    .where("recruiter.RecruiterCode==code", { code: "lv" })
//    .skip(1)
//    .limit(1)
    
//    .select({
//        rec_Code:"recruiter.RecruiterCode",
//        UserEmail: 1,
//        _id:0

//    })
    
    
    
    //.toArray()
    //.then(lis => {
    //    console.log(lis)
    //})
    //.catch(ex => {
    //    console.log(ex)
    //});