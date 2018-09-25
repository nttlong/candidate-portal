const models = require("./../../modules/lv.model");
const utils = require("./../../libs/lv.utils");
const api_public = require("./../api_public");
var sync = require('sync');
const FS = require('fs');
const logs = require("./../../libs/lv.logs");

api_public.createApi("post_requisition")
    .setDescription("This api create new requisition")
    .setParamInfo("Code", "text", true, "Code of requisition")
    .setParamInfo("Job.GroupCode", "text", false, "Code of Job Type")
    .setParamInfo("Job.GroupName.en", "text", false, "Name of job type in English")
    .setParamInfo("Job.GroupName.vn", "text", false, "Name of job type in Vietnamese")
    .setParamInfo("Job.JobCode", "text", false, "Code of Job")
    .setParamInfo("Job.JobName.en", "text", false, "Name of Job in English")
    .setParamInfo("Job.JobName.vn", "text", false, "Name of Job in Vietnamese")
    .setParamInfo("ExperienceLevel.Code", "text", false, "Code of level")
    .setParamInfo("ExperienceLevel.Name.en", "text", false, "Name of level in English")
    .setParamInfo("ExperienceLevel.Name.vn", "text", false, "Name of level in Vietnamese")
    .setParamInfo("Locations", "array", false, "List of location for recruitement")
    .setParamInfo("Locations.Code", "text", false, "Code of location for recruitement")
    .setParamInfo("Locations.Name.en", "text", false, "English name of location for recruitement")
    .setParamInfo("Locations.Name.vn", "text", false, "Vietnamese name of location for recruitement")
    .setParamInfo("Locations.Name.vn", "text", false, "Vietnamese name of location for recruitement")
    .setParamInfo("Locations.Provinces.Code", "text", false, "Code of province in each location")
    .setParamInfo("Locations.Provinces.Name.en", "text", false, "English name of province in each location")
    .setParamInfo("Locations.Provinces.Name.vn", "text", false, "Vietnamese name of province in each location")
    .setParamInfo("Locations.Provinces.Name.vn", "text", false, "Vietnamese name of province in each location")
    .setParamInfo("JobTitle", "text", true, "Job title of requisition")
    .setParamInfo("Requirements.vn", "text", false, "requisition requirement in Vietnamese")
    .setParamInfo("Requirements.en", "text", false, "requisition requirement in English")
    .setParamInfo("Description.en", "text", true, "Job description in English")
    .setParamInfo("Description.vn", "text", true, "Job description in Vietnamese")
    .setParamInfo("NumOfStaff", "number", true, "The number of person that recruiter is looking for hire")
    .setParamInfo("SalaryType", "number", true, "The advertising salary range in 0,1,2 (0:negotiative, 1: start at, 2: competetion)")
    .setReturnInfo("ID", "text", "ID of requisition if post is successfull")
    .setBody(sender => {
        try {
            var data = sender.params;
            data.RecruiterId = sender.server.recruiter._id;
            var ret = models.ls_requisition()
                .insert(data)
                .commit.sync();
            sender.done({ ID: ret._id })
        }
        catch (ex) {
            if (ex.isUnique &&
                (ex.fields.indexOf("Code") > -1)) {
                sender.error({
                    code: "DUP001",
                    message: "'Code' of requisition is already to use",
                    param: "Code"
                });
            }
            else {
                sender.error(ex);
            }
        }
    }).regist(module);
