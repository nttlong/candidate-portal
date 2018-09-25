const entities = require("./../libs/lv.entity");
entities.setConnectionString("mongodb://172.16.0.126:2324/candidate");
const models = require("./../modules/lv.model");

/*models.ls_requisition()
   // .where("MetaGroupSearch==NULL", { NULL: null })
    .toArray((e, r) => {
        r.forEach(item => {
            models.ls_requisition().where("_id==_id", item)
                .set(item).commit((e, t) => {
                    console.log(t);
                    console.log(e);
                })
        })
    });*/
//models.sys_Users()
//    .where("MetaGroupSearch==NULL", { NULL: null })
//    .toArray((e, r) => {
//        r.forEach(i => {
//            models.sys_Users().where("_id==_id", i)
//                .set(i)
//                .commit((e, r) => {
//                    console.log(e);
//                    console.log(i);
//                })
//        });

//    })
models.sys_Users().toArray((e, lst) => {
    lst.forEach(item => {
        models.ls_candidate()
            .where("UserEmail==Email",item)
            .toItem((e, i) => {
                if (!i) {
                    models.ls_candidate()
                        .insert({
                            UserEmail: item.Email,
                            IsLongTest:true
                        }).commit((e, r) => {
                            if (e) console.log(e);
                            else {
                                console.log("insert");
                                console.log(r);
                            }
                        });
                }
                else {
                    models.ls_candidate()
                        .where("_id==_id",i)
                        .set(i)

                        .commit((e, r) => {
                            if (e) console.log(e);
                            else {
                                console.log("update");
                                console.log(i);
                            }
                        })
                }
            })
    })
    
});