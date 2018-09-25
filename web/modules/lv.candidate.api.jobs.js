(api=>{
    api.find = (event) => {
        var forms = event.form;
        var location = forms["ByLocation"]|| "all";
        var province = "all";
        var job = forms["ByJob"]|| "all";
        var job_group = "all";
        var byText =  forms["ByText"]||"all";
        var pageIndex = "0";
        //Redirect = Libs.Uitils.Url.ToAbs("~/jobs/") + $"{forms["bytype"]}/{Libs.Languages.Provider.GetCurrentLanguage()}/{forms["recruiter"]}/{location}/{province}/{job_group}/{job}/{byText}/{pageIndex}"
        var ret = {
            action: {
                refresh:false,
                redirect: event.rootUrl + "/jobs/" + forms["bytype"] + "/vn/" + forms["recruiter"] + "/" + location + "/" + province + "/" + job + "/" + byText + "/" + pageIndex
            }
        }
        event.res.end(JSON.stringify(ret));
        event.done();
    }
});