const entities = require("./../libs/lv.entity");
const mongodb = require("mongodb");
const logs = require("./../libs/lv.logs");
/**
 * Menu hệ thống
 */
var sys_menus = () => { return entities.entity("sys_menus") };
/**
 * Các email đang và đã gởi
 */
var sys_email_sent = () => { return entities.entity("sys_email_sent") };
/**
 * Thiết lập chính sách policy
 */
var sys_Security_Policy = () => { return entities.entity("sys_Security_Policy") };
/**
 * cấu hình ngôn ngữ hỗ trợ và mặc định
 */
var sys_global_language_setting = () => { return entities.entity("sys_global_language_setting") };
/**
 * Danh sách các activation từ user dành cho liên kết mạng xã hội
 */
var sys_social_network_active = () => { return entities.entity("sys_social_network_active") };
/**
 * Danh sách nhóm kỹ năng
 */
var ls_group_skills = () => { return entities.entity("ls_group_skills") };
/**
 * danh sách các active request
 */
var sys_activation_accounts = () => { return entities.entity("sys_activation_accounts") };
/**
 * Tất cả các dữ liệu xóa được lưu trong bảng này
 */
var sys_trash_data = () => { return entities.entity("sys_trash_data") };
/**
 * Log lỗi
 */
var sys_logs = () => { return entities.entity("sys_logs") };
/**
 * cấu hình web mail
 */
var sys_email_config = () => { return entities.entity("sys_email_config") };
/**
 * Hệ thống banner chính
 */
var sys_banner_images = () => { return entities.entity("sys_banner_images") };
/**
 * Không dùng nữa
 */
var sys_track_store = () => { return entities.entity("sys_track_store") };
/**
 * Ai login thì coi ở đây
 */
var sys_logins = () => { return entities.entity("sys_logins") };
/**
 * Danh mục cấp bậc
 */
var ls_experience_levels = () => { return entities.entity("ls_experience_levels") };
/**
 * Cấu hình toàn cục
 */
var sys_Global_Settings = () => { return entities.entity("sys_Global_Settings") };
/**
 * Danh sách các user
 */
var sys_Users = () => { return entities.entity("sys_Users") };
/**
 * Danh sách các đăng tuyển
 */
var ls_requisition = () => { return entities.entity("ls_requisition") };
/**
 * Danh sách ứng viên
 */
var ls_candidate = () => { return entities.entity("ls_candidate") };
/**
 * danh sách nhà tuyển dụng
 */
var ls_recruiters = () => { return entities.entity("ls_recruiters") };
/**
 * Danh sách công việc
 */
var ls_group_jobs = () => { return entities.entity("ls_group_jobs") }
/**
 * Danh sách khu vực và tỉnh thành
 */
var ls_locations = () => { return entities.entity("ls_locations") }
/**
 * Nhóm user
 */
var sys_roles = () => { return entities.entity("sys_roles") }
/**
 * Danh sách danh mục
 */
var sys_categories = () => { return entities.entity("sys_categories") }
/**
 * Danh sách template email
 */
var sys_email_template = () => { return entities.entity("sys_email_template") };
/**
 * Bản danh sách activation
 */
var sys_activation = () => { return entities.entity("sys_activation") };
/**
 * Danh sách quốc gia
 */
var ls_nations = () => { return entities.entity("ls_nations") }
/**
 * Danh sách các token dùng để export
 */
var sys_export_token = () => { return entities.entity("sys_export_token") };
/**
 * Danh sách các attachment
 */
var sys_attachments = () => { return entities.entity("sys_attachments") };
/**
 * Danh much tinh trang hon nhan
 */
var ls_marriage_status = () => { return entities.entity("ls_marriage_status"); };
/**
 * Api access token
 */
var sys_api_access_token = () => { return entities.entity("sys_api_access_token"); };
entities.setTrashCollectionName(sys_trash_data().name);
/**
 * Build database tao index, search text,...
 */
var buildModels = () => {
    ls_candidate().createIndex({ UserEmail: 1 }, { unique: true }, (e, r) => {
        if (e) logs.debug("Create unique index of ls_candidate", e);
        else
        logs.info("Create unique index of ls_candidate", r);
    });
    ls_candidate().createMetaSearch("PublishSearch", {
        "DesireLocation.Name.vn": "DesireLocation_Name_vn",
        "DesireLocation.Name.en": "DesireLocation_Name_en",
        "DesireLocation.Province.Name.en": "DesireLocation_Province_Name_en",
        "DesireLocation.Province.Name.vn": "DesireLocation_Province_Name_vn",
        "Location.Name.vn": "Location_Name_vn",
        "Location.Name.en": "Location_Name_en",
        "Location.Province.Name.en": "Location_Province_Name_en",
        "Location.Province.Name.vn": "Location_Province_Name_vn",
        "Nationality.Name.vn": "Nationality_Name_vn",
        "Nationality.Name.en": "Nationality_Name_en",
        "DesireMajor.Name.vn": "DesireMajor_Name_vn",
        "DesireMajor.Name.en": "DesireMajor_Name_en",
        "MarriageStatus.Name.vn": "MarriageStatus_Name_vn",
        "MarriageStatus.Name.en": "MarriageStatus_Name_en"

    });
    sys_Users().createIndex({ Email: 1 }, { unique: true }, (err, result) => {
        if (err) {
            if (err.code === 85) {
                sys_Users().dropIndexes("Email_1")
                    .then(result => {
                        sys_Users().createIndex({ Email: 1 }, { unique: true })
                            .then(x => {
                                logs.info("Create unique index", x);
                            })
                            .catch(ex => {
                                logs.debug("Create unique index fail", ex);
                            })

                    })
                    .catch(ex => {
                        logs.debug("Create unique index fail", ex);
                    })
            }
        }
        else {
            logs.info("Create unique index", result);
        }
    });
    sys_Users().createMetaSearch("PublishSearch", {
        "FirstName": "FirstName",
        "LastName": "LastName",
        "(data)=>{return data.FirstName+' '+data.LastName}":"FullName"
        
    })
    ls_requisition().createIndex({ Code: 1, RecruiterId: 1 },
        {
            unique: true,
            partialFilterExpression: { Code: { $type: "string" } }
        }).then(result => {
            logs.info("Create unique index", result);
        }).catch(ex => {
            logs.debug("Create unique index fail", ex);
        });
    ls_requisition().createMetaSearch(
    "PublishSearch",
        {
        "Job.JobName.vn": "Job_JobName_vn",
        "Job.JobName.en": "Job_JobName_en",
        "Job.GroupName.vn": "Job_GroupName_vn",
        "Job.GroupName.en": "Job_GroupName_en",
        "JobTitle": "JobTitle",
        "Description.vn": "Description_vn",
        "Description.en": "Description_en",
        "ExperienceLevel.Name.vn": "ExperienceLevel_Name_vn",
        "ExperienceLevel.Name.en": "ExperienceLevel_Name_en",
        "Requirements.vn": "Requirements_vn",
        "Requirements.en": "Requirements_en",
        "Locations$Name.vn": "Locations_Name_vn",
        "Locations$Name.en": "Locations_Name_en",
        "Locations$Provinces.Name.vn": "Locations_Provinces_Name_vn",
        "Locations$Provinces.Name.en": "Locations_Provinces_Name_en",
        "Skills.vn": "Skills_vn",
        "Skills.en": "Skills_en"

    })
    ls_recruiters().createIndex({ UserEmail: 1 }, { unique: true })
        .then(result => {
            logs.info("Create 'UserEmail' index of 'ls_recruiters'", result);
        })
        .catch(ex => {
            logs.debug("Create 'UserEmail' index of 'ls_recruiters' fails", ex);
        });
    ls_recruiters().createIndex({ RecruiterCode: 1 }, { unique: true })
        .then(result => {
            logs.info("Create index of 'ls_recruiters'", result);
        })
        .catch(ex => {
            logs.debug("Create index of 'ls_recruiters' fails", ex);
        });
    ls_recruiters().createMetaSearch("PublishSearch", {
        "RecruiterCode": "RecruiterCode",
        "ShortName": "ShortName",
        "RecruiterName": "RecruiterName"
    });
    ls_group_jobs().createIndex({ Code: 1 }, { unique: true })
        .then(result => {
            logs.info("create index of 'ls_group_jobs'", result);
        })
        .catch(ex => {
            logs.info("create index of 'ls_group_jobs' fial", ex);
        });
    
    ls_group_jobs().createIndex({ Code: 1,"Jobs.Code":1 }, { unique: true })
        .then(result => {
            logs.info("create index of 'ls_group_jobs'", result);
        })
        .catch(ex => {
            logs.info("create index of 'ls_group_jobs' fial", ex);
        });
    ls_locations().createIndex({ Code: 1 }, { unique: true })
        .then(result => {
            logs.info("create index of 'ls_locations'", result);
        })
        .catch(ex => {
            logs.info("create index of 'ls_locations' fail", ex);
        });
    ls_locations().createIndex({ Code: 1,"Provinces.Code":1 }, { unique: true })
        .then(result => {
            logs.info("create index of 'ls_locations'", result);
        })
        .catch(ex => {
            logs.info("create index of 'ls_locations' fail", ex);
        });
    ls_marriage_status().createIndex({ Code: 1 }, { unique: true })
        .then(result => {
            logs.info("create index of 'ls_marriage_status'", result);
        })
        .catch(ex => {
            logs.info("create index of 'ls_marriage_status' fail", ex);
        });
    ls_nations().createIndex({ Code: 1 }, { unique: true })
        .then(result => {
            logs.info("create index of 'ls_nations'", result);
        })
        .catch(ex => {
            logs.info("create index of 'ls_nations' fail", ex);
        });
    ls_experience_levels().createIndex({ Code: 1 }, { unique: true })
        .then(result => {
            logs.info("create index of 'ls_experience_levels'", result);
        })
        .catch(ex => {
            logs.info("create index of 'ls_experience_levels' fail", ex);
        });
};
entities.onStart(() => {
    entities.getConnect()
        .then(db => {
            buildModels();
        });
})
module.exports = {
    sys_menus: sys_menus,
    sys_email_sent: sys_email_sent,
    sys_Security_Policy: sys_Security_Policy,
    sys_global_language_setting: sys_global_language_setting,
    sys_social_network_active: sys_social_network_active,
    ls_group_skills: ls_group_skills,
    sys_activation_accounts: sys_activation_accounts,
    sys_trash_data: sys_trash_data,
    sys_logs: sys_logs,
    sys_email_config: sys_email_config,
    sys_banner_images: sys_banner_images,
    sys_track_store: sys_track_store,
    sys_logins: sys_logins,
    ls_experience_levels: ls_experience_levels,
    sys_Global_Settings: sys_Global_Settings,
    sys_Users: sys_Users,
    ls_requisition: ls_requisition,
    ls_candidate: ls_candidate,
    ls_recruiters: ls_recruiters,
    ls_group_jobs: ls_group_jobs,
    ls_locations: ls_locations,
    sys_roles: sys_roles,
    sys_categories: sys_categories,
    sys_email_template: sys_email_template,
    sys_activation: sys_activation,
    ls_nations: ls_nations,
    sys_export_token: sys_export_token,
    sys_attachments: sys_attachments,
    ls_marriage_status: ls_marriage_status,
    sys_api_access_token: sys_api_access_token,
    phi_table: () => { return  entities.entity("phi_table") }
    
}
//sys_Users()
//    .where("((Email==email)or" +
//    "(LinkToGoogle.Email == email)or" +
//    "(LinkToFacebook.Email == email)or" +
//    "(LinkToLinkedIn.Email == email)or" +
//    "(LinkToTwitter.Email == email))and(UserId != userId)", { email: "nttlong@lacviet.com.vn", userId: "d749e5dca9c61f02d33225b0b2efd244aa8ae1da" })
//    .query().count( (e,r) => {
//        console.log(r);
//    })
/*sys_Users()
    .where("(Email=='xxx')", { email: "XXX" });
/*Ví dụ 1:*/
//buildModels();
/*sys_Users()
    .where("MetaGroupSearch==NULL", {NULL:null})
    .toArray((e, r) => {
        r.forEach(i => {
            sys_Users().where("_id==_id", i)
                .set(i)
                .commit((e, r) => {
                    console.log(e);
                    console.log(i);
                })
        });
    
})*/
//ls_requisition()
//    .where("MetaGroupSearch==NULL", { NULL: null })
//    .toArray((e, r) => {
//        r.forEach(item => {
//            ls_requisition().where("_id==_id", item)
//                .set(item).commit((e, t) => {
//                    console.log(t);
//                })
//        })
//    })
//ls_requisition().toItem((e, i) => {
//    ls_requisition()
//        .where("_id==_id",i)
//        .set(i)
//        .commit((e, r) => {
//            console.log(e);
//            console.log(r);
//        });
//})
/*sys_Users().dropIndexes("Email_1")
    .then(result => {
        console.log(result);
    })
    .catch(ex => {
        console.log(ex);
    });*/

/*sys_Users().getIndexes()
    .then(result => {
        console.log(result);
    })
    .catch(ex => {
        console.log(ex);
    });*/
/*sys_Users().createIndex({ Email: 1 }, (err, result) => {
    console.log(err);
    console.log(result);
});*/

/*
sys_Users().createIndex({ Email: 1 }, { unique: true }, (err, result) => {
    if (err) {
        if (err.code === 85) {
            sys_Users().dropIndexes("Email_1")
                .then(result => {
                    sys_Users().createIndex({ Email: 1 }, { unique: true })
                        .then(x => {
                            console.log(x);
                        })
                        .catch(ex => {
                            console.log(ex);
                        })
                    
                })
                .catch(ex => {
                    console.log(ex);
                })
        }
    }
    
    
    
});*/
/*ls_requisition()
    .createIndex({ Code: 1, RecruiterId: 1 },
    {
        unique: true,
        partialFilterExpression: { Code: { $type: "string" } }
    }).then(result => {
        console.log(result);
    })
    .catch(ex => {
        console.log(ex);
    });*/
/*
ls_requisition().getIndexes((err, result) => {
    console.log(err);
    console.log(result);
});*/



/*ls_candidate().toArray((err, lst) => {
    console.log(lst)
});


ls_candidate()
    .lookup(sys_Users(), "UserEmail", "Email", "User")
    .unwind("User")
    .select(["User.FirstName","User.LastName"])
    .limit(2)
    .toArray((err, list) => {
        console.log(err)
        console.log(list)
    })

ls_candidate()
    .lookup(sys_Users(), "UserEmail=Email")
    .unwind(sys_Users())
    .select(["sys_Users.FirstName", "sys_Users.LastName"])
    .limit(2)
    .toArray((err, list) => {
        console.log(err)
        console.log(list)
    })

ls_candidate()
    .lookup(sys_Users(), "UserEmail=Email")
    .unwind(sys_Users())
    .select(["sys_Users.FirstName", "sys_Users.LastName"])
    .limit(2)
    .toArray()
    .then(list => {
        console.log(list);
    })

ls_candidate()
    .lookup(sys_Users(), "UserEmail=Email")
    .unwind(sys_Users())
    .select("Email")
    .select(sys_Users().getFields("FirstName"))
    .select({
        ID: "_id",
        Name: sys_Users().getFields("FirstName")
    })
    .limit(2)
    .toArray()
    .then(list => {
        console.log(list);
    })


ls_requisition()
    .unwind("CandidateApplyList")
    .lookup(sys_Users(), "CandidateApplyList.CandidateEmail=Email")
    .unwind(sys_Users())
    .select({
        FirstName: sys_Users().name + ".FirstName",
        LastName: sys_Users().name + ".FirstName"
    }).toArray((e, l) => {
        console.log(l)
    })*/
//ls_requisition()
//    .unwind("CandidateApplyList")
//    .lookup("ls_candidate", "CandidateApplyList.CandidateEmail", "UserEmail", "candidate")
//    .unwind("candidate")
//    //.lookup("sys_Users", "CandidateApplyList.CandidateEmail", "Email", "user")
    
//    //.unwind("user")
//    .lookup("ls_recruiters", "RecruiterId", "_id", "recruiter")
//    .unwind("recruiter")
//    //.where("candidate.AllowSearch", true)
//    //.whereOr("recruiter.UserEmail","nttlong@lacviet.com.vn")
//    .skip(0)
//    .limit(20)
//    .select("candidate.AllowSearch","AllowSearch")
//    .toArray((err, list) => {
//        console.log(err);
//        console.log(list);
//    })
/*
ls_candidate()
    .lookup("ls_requisition", "UserEmail", "CandidateApplyList.CandidateEmail", "requisition")
  
    .where("requisition.RecruiterId", "=", mongodb.ObjectID("59f835a313b9f21c84a389ec"))
    .lookup("sys_Users","UserEmail","Email","user")
    .unwind("user")
    .select({
        FirstName: "user.FirstName",
        LastName: "user.LastName",
        Email: "user.Email",
        Photo:1,
        requisition: 1,
        user: 1,
        CandidateApplyList: "$requisition.CandidateApplyList",
        typeOfCandidateApplyList: {
            $type: "$requisition.CandidateApplyList"
        },
        Desier: 1,
        TopDegree: 1,
        TotalExpYear: 1,
        RecentInfo: 1,
        UserId: "user.UserId"
    })
    .query()
    .select({
        FirtsName: 1,
        UserId: 1,
        LastName: 1,
        Photo: 1,
        Email: 1,
        TotalExpYear: 1,
        Desier: 1,
        TopDegree: 1,
        RecentInfo: 1,
        len: {
            $cond: {
                if: { $eq: ["$typeOfCandidateApplyList", "array"] },
                then: { $size: "$requisition.CandidateApplyList" },
                else: 0
            }
        }
    })
    .where("len", ">", 0)
    .whereOr("AllowSearch", true)

    .limit(20)
    .toArray((err, list) => {
        console.log(err);
        console.log(list)
    })


sys_Users()
    .where("UserId", 'd749e5dca9c61f02d33225b0b2efd244aa8ae1da')
    .toItem((err, data) => {
        console.log(data)
    })


ls_group_jobs()
    .unwind("Jobs")
    .where("Code", "san_xuat")
    .whereAnd("Jobs.Code", "dia_chat-khoan_san")
    .toArray((err, result) => {
        console.log(result)
    })


ls_recruiters()
    .where("UserEmail", "tnadmin")
    .toItem((err, result) => {
        console.log(result);
        console.log(err);
    });*/

//ls_locations()
//    .unwind("Provinces")
//    //.where("Code", "mien_trung")
//    //.whereAnd("Provinces.Code", "lam_dong")
//    .toItem((err, result) => {
//        console.log(result);
//    })


/*ls_requisition()
                        .unwind("CandidateApplyList")
                        .where("CandidateApplyList.CandidateEmail", "nttlong@lacviet.com.vn")
                        .lookup("ls_recruiters", "RecruiterId", "_id", "recruiter")
                        .unwind("recruiter")
                        .unwind("CandidateApplyList.Tasks")
                        .group({
                            RecruiterCode: "$recruiter.RecruiterCode",
                            RecruiterName: "$recruiter.RecruiterName"
                        })
                        .push("Tasks",{
                            TaskID: "CandidateApplyList.Tasks.TaskID",
                            TaskName: "CandidateApplyList.Tasks.Description",
                            ActionDate: "CandidateApplyList.Tasks.ActionDate",
                            Actor: "CandidateApplyList.Tasks.Actor",
                            AttachmentFileName:"CandidateApplyList.Tasks.AttachmentFileName",
                            HasAttachment: {
                                $cond: {
                                    if: { $ne: ["$CandidateApplyList.Tasks.AttachmentFileContent", null] },
                                    then: true,
                                    else:false
                                }
                            }
                        })
    .toArray((err, result) => {
        console.log(err);
                           console.log(result)
                        })*/

//ls_requisition()
//    .where("_id", "59f92a216b6300220c2c86f3".toObjectID())
//    .unwind("CandidateApplyList")
//    ////.where("CandidateApplyList.CandidateEmail", user.Email)
//    .lookup("ls_recruiters", "RecruiterId", "_id", "recruiter")
//    //.unwind("recruiter")
//    .unwind("CandidateApplyList.Tasks")
//    //.group({
//    //    RecruiterCode: "$recruiter.RecruiterCode",
//    //    RecruiterName: "$recruiter.RecruiterName"
//    //})
//    //.select(
//    //{
//    //    TaskID: "CandidateApplyList.Tasks.TaskID",
//    //    TaskName: "CandidateApplyList.Tasks.Description",
//    //    ActionDate: "CandidateApplyList.Tasks.ActionDate",
//    //    Actor: "CandidateApplyList.Tasks.Actor",
//    //    AttachmentFileName: "CandidateApplyList.Tasks.AttachmentFileName",
//    //    HasAttachment: {
//    //        $cond: {
//    //            if: { $ne: ["$CandidateApplyList.Tasks.AttachmentFileContent", null] },
//    //            then: true,
//    //            else: false
//    //        }
//    //    },
//    //    Result: "CandidateApplyList.Task.Result",
//    //    Note: "CandidateApplyList.Task.Note",

//    //})
//    .toArray((err, result) => {
//        console.log(err);
//        console.log(result)
//    })