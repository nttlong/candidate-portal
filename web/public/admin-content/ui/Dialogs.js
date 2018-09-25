
var _____dialog_template_root_dir = "";
var $set_dialog_template_root_dir =function(url) {
    _____dialog_template_root_dir = url;
};
var $get_dialog_template_root_dir = function() {
    return _____dialog_template_root_dir;
};
var $get_dialog_template = function () {
    
   var ret= "<div id=\"myModal\" class=\"modal fade\" role=\"dialog\">"+
  "<div class=\"modal-dialog\">"+
    "<div class=\"modal-content\">"+
      "<div class=\"modal-header\">"+
        "<button type=\"button\" class=\"close\" data-dismiss=\"modal\">&times;</button>"+
        "<h4 class=\"modal-title\"></h4>"+
      "</div>"+
      "<div class=\"modal-body\">"+
       
      "</div>"+
    "</div>"+
  "</div>"+
"</div>";
   return ret;
}
var ______$$$_dialog_instance = 0;
function $dialog(template) {
    function ret(template) {
        var me = this;
        me._url = $get_dialog_template_root_dir() + "/" + template;
        me.done = function (callback) {
            var mask = $("<div class='mask'></div>").appendTo("body");
            $.ajax({
                url: me._url,
                type: 'get',
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    mask.remove();

                    var data = "<p>This is 'myWindow'</p>";
                    myWindow = window.open("data:text/html," + encodeURIComponent(XMLHttpRequest.responseText),
                                           "_blank");
                    myWindow.focus();
                },
                success: function (data) {
                    mask.remove();
                    var newId = ______$$$_dialog_instance++;


                    var startBody = data.indexOf("<body>") + "<body>".length;
                    var endBody = data.indexOf("</body>");
                    var txt = data.substring(startBody, endBody);
                    var startScript = txt.indexOf("<script>");
                    var script = "";
                    var funs = [];
                    while (startScript > -1) {
                        startScript += "<script>".length;
                        var endScript = txt.indexOf("</script>");
                        script = txt.substring(startScript, endScript);
                        funs.push(eval(script))
                        txt = txt.replace("<script>" + script + "</script>", "");
                        startScript = txt.indexOf("<script>");
                    }


                    
                    var ele = $($("<div>" + txt + "</div>").children()[0]);
                    var data = {
                        $ele: ele,
                        $eleId: "ele_dialog_" + newId
                    };
                    for (var i = 0; i < funs.length; i++) {
                        funs[i](data);
                    }

                    data.doClose = function () {

                    };

                    ele.attr("id", "ele_dialog_" + newId);
                   
                    
                    var $modal = $($get_dialog_template())
                    .appendTo("body");
                    ele.appendTo($modal.find(".modal-body")[0]);
                    $modal.modal("show");
                    var app = new Vue({
                        el: "#ele_dialog_" + newId,
                        data: data
                    });
                    data.doClose = function () {
                        $modal.find(".modal-header")
                        .find(".close").trigger("click");
                    };
                    $modal.find(".modal-title").html(data.dialog_header);
                    if (callback) {
                        callback(data);
                    }
                }
            });
        };
       
    }
    return new ret(template);
};