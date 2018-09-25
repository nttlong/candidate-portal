
var widthDefault = 300;
var heightDefault = 430;
$(document).ready(function () {
    $('#notify_assign').draggable({ containment: "parent", handle: '.notify-titlebox' });
    $('#maximize_btn').draggable({
        containment: "parent",
        start: function () {
            $("#maximize_btn").unbind("click");
        },
        stop: function (event, ui) {
            setTimeout(function () {
                RegisterMaximize_click();
            }, 100);
        }
    });
    $("#minimize_btn").click(function () {
        $("#maximize_btn").css("display", "block");
        var top = $("#maximize_btn").position().top + ($("#maximize_btn").position().top < 40 ? (75 - $("#maximize_btn").position().top) : 20);
        var left = $("#maximize_btn").position().left + ($("#maximize_btn").position().left < 40 ? (75 - $("#maximize_btn").position().left) : 20);
        $("#maximize_btn").css("display", "none");
        $("#notify_assign").animate({ top: top - 40, left: left - 40, height: 40, width: 40 }, widthDefault, (function () { $(this).css("display", "none"); $('#maximize_btn').fadeIn(); }));
        //PFN_createCookie('isMinimize', true, 1);
    })
    RegisterMaximize_click();
    setTimeout(function () {
        //CallNotify();
        $('#notify_assign').fadeOut();
        $('#maximize_btn').fadeIn();
        SetPosition();
    }, 500);

    //setInterval(CallNotify, 300000);

})
// Set lai vi tri cho div notify, button icon maximize
function SetPosition() {
    //$('#notify_assign').css({ 'top': $("#contentbody").height() - 476, 'left': $("#contentbody").width() - 316, 'width': widthDefault, 'height': heightDefault, 'z-index': 99999 });
    //$('#maximize_btn').css({ 'top': $("#contentbody").height() - 20 - ($(window).scrollLeft(1).scrollLeft() == 1 ? 0 : 17), 'left': $("#contentbody").width() - 30 });
    $('#notify_assign').css({ 'top': $(window).height() - 460, 'right': $("body").width() - 316, 'width': widthDefault, 'height': heightDefault, 'z-index': 99999 });
    $('#maximize_btn').css({ 'top': $("body").height, 'right': $("body").width() - 45 });
}
// Goi thong bao cho user
function CallNotify() {

}

function RegisterMaximize_click() {
    $("#maximize_btn").click(function () {
        var top = $("#maximize_btn").position().top - heightDefault;
        var left = $("#maximize_btn").position().left - widthDefault;
        $('#notify_assign').css({ 'top': top < 0 ? 0 : top, 'left': left < 0 ? 0 : left, 'width': widthDefault, 'height': heightDefault, 'z-index': 99999 });
        $('#notify_assign').fadeIn();
        $("#maximize_btn").fadeOut();
        //PFN_createCookie('isMinimize', false, 1);
    });
}
