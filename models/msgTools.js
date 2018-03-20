var moment = require('moment');
var ParseBlaziong =  require('./parseBlaziong.js');
var ParseDefine =  require('./parseDefine.js');
var JsonFileTools =  require('./jsonFileTools.js');
var listDbTools =  require('./listDbTools.js');
var settings =  require('../settings.js');
var mData,mMac,mRecv,mDate,mTimestamp,mType,mExtra ;
var obj;
var overtime = 24;
var hour = 60*60*1000;
var isNeedGWMac = settings.isNeedGWMac;//For blazing
//Save data to file path
var path = './public/data/finalList.json';
var path2 = './public/data/gwMap.json';
//Save data
var finalList = {};
var macGwIdMapList;//For gateway map (key:mac value:id array)
var gwIdMacMapList;//For gateway map (key:id value:mac)
var mac_tag_map = {};
var type_tag_map = {};//For filter repeater message key:mac+type value:tag
var type_time_map = {};
//Save user choice device type,GW MAC
var selectType,selectMac;

function init(){
    //finalList = JsonFileTools.getJsonFromFile(path);
    listDbTools.findByName('finalist',function(err,lists){
        if(err)
            return;
        finalList = lists[0].list;
    });
}

function initMap(){
    macGwIdMapList = JsonFileTools.getJsonFromFile(path2);
    gwIdMacMapList = getMapList(macGwIdMapList);
}

/*
This function is GW map betwween id and mac transformer
Source is GW maap (key:mac, value:id array)
Transform to different map (key:id, value:)
 */
function getMapList(list){
    var keys = Object.keys(list);
    var json = {};
    for(key in list){
       json[list[key][0]]=key ;
       json[list[key][1]]=key ;
    }
    return json;
}

init();

exports.parseMsg = function (msg) {
    console.log('MQTT message :\n'+JSON.stringify(msg));
    if(getType(msg) === 'array'){
        obj = msg[0];
        console.log('msg array[0] :'+JSON.stringify(obj));
    }else if(getType(msg) != 'object'){
        try {
			obj = JSON.parse(msg.toString());
		}
		catch (e) {
			console.log('msgTools parse json error message #### drop :'+e.toString());
			return null;
		}
    }else{
        obj = msg;
        if (obj.extra.fport === 5 || obj.extra.fport === 6) {
            var finalList = JsonFileTools.getJsonFromFile(path);
            finalList[obj.macAddr] = obj;
            JsonFileTools.saveJsonToFile(path,finalList);
        } 
    }
    
    return msg;
}

exports.setFinalList = function (list) {
    finalList = list;
}

exports.getFinalList = function () {
    return finalList;
}

exports.saveFinalListToFile = function () {
    /*var json = JSON.stringify(finalList);
    fs.writeFile(path, json, 'utf8');*/
    JsonFileTools.saveJsonToFile(path,finalList);
}

exports.getMacGwIdMap = function () {
    return macGwIdMapList;
}

exports.saveMacGwIdMapToFile = function () {

    JsonFileTools.saveJsonToFile(path2,finalList);
}

exports.getGwIdByMac = function (mac) {
    selectMac = mac;
    if(macGwIdMapList === undefined){
        initMap();
    }
    return macGwIdMapList[mac];
}


exports.getDevicesData = function (type,devices) {
    var array = [];

    if(devices){
        for (var i=0;i<devices.length;i++)
        {
            //if(i==53){
              //console.log( '#### '+devices[i].mac + ': ' + JSON.stringify(devices[i]) );
            //}
            array.push(getDevicesArray(devices[i],i,type));
        }
    }

    var dataString = null;
    if (array.length>0){
        dataString = JSON.stringify(array);;
    }
    return dataString;
};

function getDevicesArray(obj,item,type){

    var arr = [];

    arr.push(item);
    arr.push(obj.date);
    arr.push(obj.data);
    var keys = Object.keys(obj.information);
    for (var i=0;i<keys.length;i++)
    {
        arr.push(obj.information[keys[i]]);
    }


    return arr;
}


exports.getFinalData = function (finalist) {
    var mItem = 1;
    var array = [];
    if(finalist){

        //console.log( 'Last Device Information \n '+JSON.stringify( mObj));

        for (var mac in finalist)
        {
            //console.log( '#### '+mac + ': ' + JSON.stringify(finalist[mac]) );

            array.push(getArray(finalist[mac],mItem));
            mItem++;
        }
    }

    var dataString = JSON.stringify(array);
    if(array.length===0){
        dataString = null;
    }
    return dataString;
};

function getArray(obj,item){

    var arr = [];
    var connection_ok = "<img src='/icons/connection_ok.png' width='30' height='30' name='status'>";
    var connection_fail = "<img src='/icons/connection_fail.png' width='30' height='30' name='status'>";
    /*if(item<10){
        arr.push('0'+item);
    }else{
        arr.push(item.toString());
    }*/
    arr.push(item);

    arr.push(obj.mac);
    arr.push(obj.date);
    arr.push(obj.extra.rssi);
    arr.push(obj.extra.snr);
    console.log('obj.overtime :'+obj.overtime);


    if( obj.overtime){
        arr.push(connection_fail);
        //console.log('overtime = true');
    }else{
        arr.push(connection_ok);
        //console.log('overtime = false');
    }
    //console.log('arr = '+JSON.stringify(arr));
    return arr;
}

function saveBlazingList(fport,mac,msg){
    var key = "gps";

    //for blazing
    if(fport === 3 || fport === 1){//GPS
        key = "gps";
    }else if(fport === 19){//PIR
        key = "pir";
    }else if(fport === 11){//PM2.5
        key = "pm25";
    }else if(fport === 21){//Flood
       key = "flood";
    }
    if(finalList[key] === undefined){
        finalList[key] = {};
    }
    //console.log('finalList1 :'+JSON.stringify(finalList));
    finalList[key][mac] = msg;
    //console.log('finalList2 :'+JSON.stringify(finalList));
}

function getType(p) {
    if (Array.isArray(p)) return 'array';
    else if (typeof p == 'string') return 'string';
    else if (p != null && typeof p == 'object') return 'object';
    else return 'other';
}

function parseDefineMessage(data){
   var mInfo = ParseDefine.getInformation(data);
   return mInfo;
}

function parseBlazingMessage(data,fport){
    var mInfo = {};

    //for blazing
    if(fport === 3 || fport === 1){//GPS
        mInfo = ParseBlaziong.getTracker(data);
    }else if(fport === 19){//PIR
        mInfo = ParseBlaziong.getPIR(data);
    }else if(fport === 11){//PM2.5
        mInfo = ParseBlaziong.getPM25(data);
    }else if(fport === 21){//Flood
        mInfo = ParseBlaziong.getFlood(data);
    }
    return mInfo;
}

//type_tag_map is local JSON object
function isSameTagCheck(type,mac,recv){
	var time =  moment(recv).format('mm');

	//Get number of tag
	var tmp = mData.substring(4,6);
	var mTag = parseInt(tmp,16)*100;//流水號:百位
        mTag = mTag + parseInt(time,10);//分鐘:10位及個位
	var key = mac.concat(type);
	var tag = type_tag_map[key];

	if(tag === undefined){
		tag = 0;
	}

	/* Fix 時間進位問題
		example : time 由59分進到00分時絕對值差為59
	*/
	if (Math.abs(tag - mTag)<2 || Math.abs(tag - mTag)==59){
		console.log('mTag=' +mTag+'(key:' +key + '):tag='+tag+' #### drop');
		return true;
	}else{
		type_tag_map[key] = mTag;
		console.log('**** mTag=' +mTag+'(key:' +key + '):tag='+tag +'=>'+mTag+' @@@@ save' );
		return false;
	}
}

