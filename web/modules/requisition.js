const utils = require("./../libs/lv.utils");
const aut=require("./../libs/lv.authenticate");
const Data = require("./../modules/lv.db");
const model = require("./../modules/lv.model");
/**
 * cập nhật hoặc thêm mới requisition
 * @param {any} event
 */
var  saveRequisition = (event) => {
    utils._try(() => {
        var clientData = utils.readData(event);
        var data = clientData.data;
        var ret=utils.checkRequireFields([
            "Code",
            "JobTitle", 
            "Job.FullJobCodeF",
            "ExperienceLevel.CodeF",
            "LocationFullCode",
            "SalaryType",
            "Description",
            "ReceiveTo"
        ], data);
        data = utils.trimData(data);
        data = utils.convertDateFields([
            "ReceiveTo", 
            "ReceiveFrom"
        ], data);
        if (data.SalaryType == 1) {
            if (!data.Salary) {
                utils.writeData(event, {
                    apiError: {
                        errorType: "SalaryIsNull", field: "Salary", description: "Salary is null"
                    }
                });
                event.done();
                return;
            }
        }
        if (data.ReceiveTo < data.ReceiveFrom) {
            utils.writeData(event, {
                apiError: {
                    errorType: "ReceiveFromGtThanReceiveTo", field: "ReceiveTo", description: "ReceiveFrom greater than ReceiveTo"
                }
            });
            event.done();
            return;
        }
        if (ret.length > 0) {
            utils.writeData(event, { apiError: ret[0] });
            event.done();
            return;
        }

        var locations=[];/*Các nơi làm việc*/
        var ls_experience_level;
        var db;
        var photoId;
        
        var user = aut.getUser(event.req);
        var recruiter = model.ls_recruiters()
            .where("UserEmail==Email", user).toItem.sync();
        var code = data.Job.FullJobCode.split("::")[0];
        var JobCode = data.Job.FullJobCode.split("::")[1];
        var job = model.ls_group_jobs()
            .unwind("Jobs")
            .where("(Code==code)and(Jobs.Code==JobCode)", { code: code, JobCode: JobCode })
            .toItem.sync();
        if (data.LocationFullCode) {
            var items = data.LocationFullCode.split(',');
            var query = model.ls_locations()
                .unwind("Provinces");
            items.forEach(FullLocationCode => {
                var code = FullLocationCode.split("::")[0];
                var provinceCode = FullLocationCode.split("::")[1];

                query = query.whereOr("(Code==code)and(Provinces.Code==provinceCode)", {
                    code: code,
                    provinceCode: provinceCode
                });
            });
            locations = query.toArray.sync();
        }
        if (data.ExperienceLevel) {
            ls_experience_level = model.ls_experience_levels()
                .where("Code==Code", data.ExperienceLevel)
                .toItem.sync();
        }

        if (locations.length == 0) {

            utils.writeData(event, {
                apiError: {
                    errorType: "at_least_one_location_is_require",
                    message: "Select at least one location"
                }
            });
            event.done();
            return;
        }

        if (data.Photo) {
            var mType = data.Photo.split(":")[1].split(";")[0]
            var retPhoto = model.sys_attachments()
                .insert({
                    MimeType: mType,
                    Content: data.Photo
                }).commit.sync();
            photoId = retPhoto._id;
                
        }

        data.Locations = locations;
        data.Code = data.Code.toString();
        data.Job.JobName = job.Jobs.Name;
        data.Job.GroupName = job.Name;
        data.Job.JobCode = job.Jobs.Code;
        data.Job.GroupCode = job.Code;
        data.RecruiterId = recruiter._id;
        if (data.IsPublished && !data.PublishDate) {
            data.PublishDate = new Date();
        }
        if (data._id) {
            if (!data.IsPublished) {
                delete data.PublishDate;
            }
            delete data.CreatedOn;
            delete data.CreatedOnUTC;
            data.ModifiedOn = new Date();
            data.ReceiveTo = new Date(data.ReceiveTo);
            if (data.ReceiveFrom) {
                data.ReceiveFrom = new Date(data.ReceiveFrom);
            }
            data.ModifiedOnUTC = utils.getUTCDate(new Date());
            model.ls_requisition()
                .where("_id==id", { id: utils.objectID(data._id) })
                .set(data)
                .commit.sync();
            utils.writeData(event, data);
            event.done();
        }
        else {
            data = model.ls_requisition().insert(data)
                .commit.sync();
            utils.writeData(event, data);
            event.done();
        }

        

               

        
    }, event);
};
/**
 * Lấy danh sách recruiter theo kh căn cứ vào email của người dùng xác định KH
 * @param {any} event
 */
var recruiter_get_list = (event) => {
    var user = aut.getUser(event.req);
    utils._try(() => {
        var recruitrer;
        var requisition;
        var clientData = utils.readData(event);
        var year = clientData.year;
        var starDate = new Date(year, 0, 1);
        var endDate = new Date(year, 12, 0);
        var status = clientData.status;
        utils.sequences()
            
            .then(next => {
                model.ls_recruiters()
                    .where("UserEmail", user.Email)
                    .toItem((err, result) => {
                        recruitrer = result || { _id: null };
                        next(err);
                    });
               
            })
            .then(next => {
                var query = model.ls_requisition()
                    //.where({ RecruiterId: recruitrer._id });
                    .where("RecruiterId==_id", { _id: recruitrer._id }).query();
                if (year != "" && year != null && year != undefined) {
                    query = query.where("(PublishDate >= _stardate) and (PublishDate <= _enddate)", {
                        _stardate: starDate,
                        _enddate: endDate
                    }).query();
                }
                if (status != "" && status != null && status != undefined) {
                    if (status == 1) {
                        query = query.where("(IsLocked==_islocked) and (IsPublished==_ispublished) and (ReceiveTo >= _receiveto)", {
                            _islocked: false,
                            _ispublished: true,
                            _receiveto: new Date()
                        }).query();
                    } else if (status == 2) {
                        query = query.where("IsLocked==_islocked", {
                            _islocked: true
                        }).query()
                    } else if (status == 3) {
                        query = query.where("IsPublished==_ispublished", {
                            _ispublished: false
                        }).query()
                    } else if (status == 4) {
                        query = query.where("ReceiveTo <= _receiveto", {
                            _receiveto: new Date()
                        }).query()
                    }
                }
                if (clientData.sortBy == "TotalApplyCandidate") {
                    query = query.sort("TotalApplyCandidate",-1);
                } else
                if (clientData.sortBy == "PublishDate") {
                    query= query.sort("PublishDate",-1);
                } else
                if (clientData.sortBy == "HitCount") {
                    query= query.sort("HitCount", -1);
                } else {
                    query= query.sort("PublishDate", -1);
                }
                query.toArray((err, list) => {
                        requisition = list;
                        next(err);
                    })
               
            })
            .done(err => {
                utils.writeData(event, { items: requisition });
                event.done();
            })


    }, event)
};
var getRequisitionById = (event) => {
    utils._try(() => {
        var clientData = utils.readData(event);
        if (!clientData.id) {
            utils.writeData(event, { data: {} });
            event.done();
            return;
        }
        model.ls_requisition()
            .where("_id", utils.objectID(clientData.id))
            .toItem((err, result) => {
                       
                        utils.writeData(event, { data: result });
                      event.done(err);
                    
            })
       
      
    }, event);


}
module.exports = {
    saveRequisition: saveRequisition,
    recruiter_get_list: recruiter_get_list,
    getRequisitionById: getRequisitionById
}