var _key = "argo_applitcaion_cache";
var _listCahcePointers = [];
var setData=(key,value)=>{
    if(!global[_key]){
        global[_key]={}
    }
    global[_key][key]=value;
};
var getData=(key)=>{
    if(!global[_key]){
        global[_key]={}
    }
    return global[_key][key];
};
var getKey=()=>{
    return _key;
}
var clear = () => {
    global[_key] = {};
}
/**
 * Xóa cache c?a các trang
 */
var clear_page_content_cache = () => {
    global.argo.pages = {};
    global.argo.lv_cacher = {};
    global.argo.cache = {};
}
module.exports = {
    setData: setData,
    getData: getData,
    getKey: getKey,
    clear_page_content_cache: clear_page_content_cache
};