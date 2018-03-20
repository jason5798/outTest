var express = require('express');
var router = express.Router();
var DeviceDbTools = require('../models/deviceDbTools.js');
var ListDbTools = require('../models/listDbTools.js');
var UnitDbTools = require('../models/unitDbTools.js');
var mongoMap = require('../models/mongoMap.js');
var settings = require('../settings');
var JsonFileTools =  require('../models/jsonFileTools.js');
var path = './public/data/finalList.json';
var path2 = './public/data/test.json';
var unitPath = './public/data/unit.json';
var selectPath = './public/data/select.json';
var hour = 60*60*1000;
var type = 'gps';
var async  = require('async');
var axios = require('axios');
var mongoMap = require('../models/mongoMap.js');

function findUnitsAndShowSetting(req,res,isUpdate){
	/**
	 * async.series
		使用時機 :
		fun2 不需要 fun1 callback 的資料
		fun3 也不需要 fun2 callback 的資料
		但最後的結果要把 fun1 fun2 fun3 的資料整合起來

	 */
	async.series([
		function(next){
			UnitDbTools.findAllUnits(function(err1,reuslt1){
				next(err1, reuslt1);
			});
		},
		function(next){
			getMap({}, function(err2, reuslt2){
				next(err2, reuslt2);
			});
		}
	], function(errs, results){
		if(errs) throw errs;    // errs = [err1, err2, err3]
		console.log(results);   // results = [result1, result2, result3]
		var successMessae,errorMessae;
		var macTypeMap = {};
		
		if(errs){
			errorMessae = errs;
		}
		var units = results[0];
		var maps = results[1];	
		if(units) {
			successMessae = '查詢到'+results[0].length+'筆資料';
		}
		
		req.session.units = units;

		console.log( "successMessae:"+successMessae );
		res.render('setting', { title: 'Setting',
			units: req.session.units,
			user: req.session.user,
			maps: maps,
			success: successMessae,
			error: errorMessae
		});
	});
}

function findUnitsAndShowStatus(req,res){
	/**
	 * async.series
		使用時機 :
		fun2 不需要 fun1 callback 的資料
		fun3 也不需要 fun2 callback 的資料
		但最後的結果要把 fun1 fun2 fun3 的資料整合起來

	 */
	async.waterfall([
		function(next){
			UnitDbTools.findAllUnits(function(err1,reuslt1){
				next(err1, reuslt1);
			});
		},
		function(deviceList, next){
			let promises = [];
			let gwArray = [];
			
			deviceList.forEach(function(device){
				try {
					let mac = device.macAddr;
					console.log('mac : ' + mac);
					let url = 'http://localhost:'+ settings.hostPort +'/todos/last/'+mac;
					promises.push(axios.get(url, {headers : { 'test' : true }}));
				} catch (error) {
					console.log('???? get AP of loraM err: ' + error);
				}
				
			});
			axios.all(promises).then(function(results) {
				var list = {};
				var nameMap = {};
				var now = new Date().getTime();
				for(let j=0; j < deviceList.length; ++j) {
                    nameMap[deviceList[j]['macAddr']] = deviceList[j]['name'];
				}
				
				for (let i = 0 ; i < results.length ; i++){
					
					// For mongoDB data format
					try {
						let d = results[i].data;
						console.log(JSON.stringify(d));
						d.data['name'] = nameMap[d.data['macAddr']];
						console.log('(now - d.data.timestamp)/hour: ' +(now - d.data.timestamp)/hour);
						if( ((now - d.data.timestamp)/hour) < settings.overtime )  {
							d.data['overtime'] = false;
						} else {
							d.data['overtime'] = true;
						}
						list[d.data.macAddr] = d.data;
						
					} catch (error) {
						console.log('???? get all AP of loraM and set err: ' + err);
					}
				}
				next(null, list);
			});
		}
		], function(err, finalList){
			if(err) {
				res.render('index', { title: 'Index',
					success: null,
					error: err,
					finalList:finalList,
					co:settings.co,
					select:selectObj
				});
			} else {
				var selectObj = JsonFileTools.getJsonFromFile(selectPath);
				JsonFileTools.saveJsonToFile(path, finalList);
		
				res.render('index', { title: 'Index',
					success: null,
					error: null,
					finalList:finalList,
					co:settings.co,
					select:selectObj
				});
			}
		});
}


function getMap(json, callback) {
	mongoMap.find(json).then(function(data) {
		// on fulfillment(已實現時)
		return callback(null, data);
	}, function(reason) {
		// on rejection(已拒絕時)
		return callback(reason, null);
	});
  }

module.exports = function(app) {
  app.get('/', function (req, res) {
	findUnitsAndShowStatus(req,res);
  	    /*var now = new Date().getTime();
		var selectObj = JsonFileTools.getJsonFromFile(selectPath);
	
		var finalList = JsonFileTools.getJsonFromFile(path);
		var unitObj = JsonFileTools.getJsonFromFile(unitPath);

		//console.log('finalList :'+JSON.stringify(finalList));
		if(finalList){
			var keys = Object.keys(finalList);
			console.log('Index finalList :'+keys.length);
			for(var i=0;i<keys.length ;i++){
				//console.log( i + ') mac : ' + keys[i] +'=>' + JSON.stringify(finalList[keys[i]]));
				//console.log(i+' result : '+ ((now - finalList[keys[i]].timestamp)/hour));
				finalList[keys[i]].overtime = true;
				if( ((now - finalList[keys[i]].timestamp)/hour) < 2 )  {
					finalList[keys[i]].overtime = false;
				}
				finalList[keys[i]].name = '';
				//console.log(i+' keys[i] : '+ keys[i]);
				//console.log(i+' unitObj[keys[i]] : '+ unitObj[keys[i]]);
				if( unitObj[keys[i]] )  {
					finalList[keys[i]].name = unitObj[keys[i]];
				}
			}
		}else{
			finalList = null;
		}

		res.render('index', { title: 'Index',
			success: null,
			error: null,
			finalList:finalList,
			select:selectObj
		});*/
  });

  app.get('/devices', function (req, res) {
	var mac = req.query.mac;
	var finalList = JsonFileTools.getJsonFromFile(path);;
	var obj = finalList[mac];
	var type = req.query.type;
	var date = req.query.date;
	var option = req.query.option;
	req.session.type = type;
	var json = {'deviceType': type};
	async.waterfall([
		function(next){
			mongoMap.find(json).then(function(data) {
				// on fulfillment(已實現時)
				console.log(JSON.stringify(data));
				next(null, data[0]);
			}, function(reason) {
				// on rejection(已拒絕時)
				next(reason, null);
			});
		}
	], function(err, rest){
		var fields = [];
		if(err) {
			fields = null;
		} else {
		  var fieldObj = rest.fieldName;
		  var keys = Object.keys(fieldObj);
		  for (var i=0;i<keys.length;i++) {
			fields.push(fieldObj[keys[i]]);
		  }
		}
		
		res.render('devices', { title: 'Device',
			fields: fields,
			type:req.session.type,
			mac:mac,
			date:date,
			option:option
		}); 	    
	});
	
  });

  app.get('/setting', function (req, res) {
		console.log('render to setting.ejs');
		findUnitsAndShowSetting(req,res,true);
  });

  app.post('/setting', function (req, res) {
		var	post_mac = req.body.mac;
		var post_name = req.body.name;
		var post_type = req.body.type_option;
		var post_mode = req.body.mode;
		var typeString = req.body.typeString;
		try {
			post_mac = post_mac.toLowerCase();
			if (post_mac.length === 8) {
				post_mac = '00000000' + post_mac;
			}
			if(typeString.includes('-')) {
				console.log('typeName include type');
				var arr = typeString.split('-');
				typeString = arr[0];
			}
		} catch (error) {
			typeString = req.body.typeString;
		}
		
		console.log('mode : '+post_mode);
		if(post_mode == 'new'){
			if(	post_mac && post_name && post_mac.length==16 && post_name.length>=1){
				console.log('post_mac:'+post_mac);
				console.log('post_name:'+post_name);
				UnitDbTools.saveUnit(post_mac,post_name,post_type,typeString,function(err,result){
					if(err){
						req.flash('error', err);
						return res.redirect('/setting');
					}
					findUnitsAndShowSetting(req,res,true);
				});
				var unitObj = JsonFileTools.getJsonFromFile(unitPath);
				unitObj[post_mac] = post_name;
				JsonFileTools.saveJsonToFile(unitPath,unitObj);
				return res.redirect('/setting');
			}
		}else if(post_mode == 'del'){//Delete mode
			post_mac = req.body.postMac;
			UnitDbTools.removeUnitByMac(post_mac,function(err,result){
				if(err){
					req.flash('error', err);
					console.log('removeUnitByMac :'+post_mac + err);
					return res.redirect('/setting');
				}else{
					req.flash('error', err);
					console.log('removeUnitByMac :'+post_mac + 'success');
				}
				findUnitsAndShowSetting(req,res,false);
			});
			var unitObj = JsonFileTools.getJsonFromFile(unitPath);
			if(unitObj[post_mac]){
				delete unitObj[post_mac];
			}
			
			JsonFileTools.saveJsonToFile(unitPath,unitObj);

		}else{//Edit mode
			post_mac = req.body.postMac;
			UnitDbTools.updateUnit(post_type,post_mac,post_name,null,typeString,function(err,result){
				if(err){
					req.flash('error', err);
					console.log('edit  :'+post_mac + err);
					return res.redirect('/setting');
				}else{
					console.log('edit :'+post_mac + 'success');
				}
				findUnitsAndShowSetting(req,res,false);
			});
     		var unitObj = JsonFileTools.getJsonFromFile(unitPath);
			unitObj[post_mac] = post_name;
			JsonFileTools.saveJsonToFile(unitPath,unitObj);
		}
  	});
};