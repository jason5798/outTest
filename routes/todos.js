var express = require('express');
var router = express.Router();
//var UnitDbTools = require('../models/unitDbTools.js');
var DeviceDbTools = require('../models/deviceDbTools.js');
var JsonFileTools =  require('../models/jsonFileTools.js');
var ListDbTools = require('../models/listDbTools.js');
var moment = require('moment');
var typepPath = './public/data/test.json';
var selectPath = './public/data/select.json';
var hour = 60*60*1000;

router.route('/devices')

	// create a bear (accessed at POST http://localhost:8080/bears)
	/*.post(function(req, res) {

		var bear = new Bear();		// create a new instance of the Bear model
		bear.name = req.body.name;  // set the bears name (comes from the request)

		bear.save(function(err) {
			if (err)
				res.send(err);

			res.json({ message: 'Bear created!' });
		});

	})*/

	// get all the bears (accessed at GET http://localhost:8080/api/bears)
	.get(function(req, res) {
		var mac    = req.query.mac;
		var option = req.query.option;
		var mdate  = req.query.mdate;
		var gwId     = req.query.gwId;
		var selectObj = JsonFileTools.getJsonFromFile(selectPath);
		selectObj.option = Number(option);
		selectObj.date = mdate;
		JsonFileTools.saveJsonToFile(selectPath,selectObj);
		if(mac){
			DeviceDbTools.findDevicesByDate(mdate,mac,Number(option),'asc',function(err,devices){
			    if (err)
					return res.send(err);
				return res.json(devices);
			});
		}else if(gwId){
			DeviceDbTools.findDevicesByGWID(mdate,gwId,Number(option),'asc',function(err,devices){
			    if (err)
					return res.send(err);
				return res.json(devices);
			});
		}else{
			return res.json({});
		}
	});

router.route('/devices/:mac')

	// get the bear with that id
	.get(function(req, res) {
		DeviceDbTools.findByMac(req.params.mac, function(err, devices) {
			if (err)
				return res.send(err);
			return res.json(devices);
		});
	})

	// update the bear with this id
	.put(function(req, res) {
		/*Bear.findById(req.params.bear_id, function(err, bear) {

			if (err)
				res.send(err);

			bear.name = req.body.name;
			bear.save(function(err) {
				if (err)
					res.send(err);

				res.json({ message: 'Bear updated!' });
			});

		});*/
	})

	// delete the bear with this id
	.delete(function(req, res) {
		var json = {macAddr:req.params.mac};
		var from = new Date(req.body.date);
		json.recv = {$lt:from};
		DeviceDbTools.removeDevices(json, function(err, devices) {
			if (err)
				return res.send(err);
			return res.json(devices);
		});
	});

router.route('/lists')

	// get all the bears (accessed at GET http://localhost:8080/api/bears)
	.get(function(req, res) {
		var name    = req.query.name;
		var type    = req.query.type;
		var json    = {type:req.query.type};
		var now = new Date().getTime();

		JsonFileTools.saveJsonToFile(typepPath,json);

		ListDbTools.findByName('finalist',function(err,lists){
			if (err)
				return res.send(err);
			if(lists.length>0 ){
				if(type){
					var finalList = lists[0]['list'][type];
				}else{
					var finalList = lists[0]['list'];
				}

				if(finalList === undefined ){
					finalList = null;
				}else{
					var overtime = 1;
					if(type==='pir'){
						overtime = 6;
					} else if(type==='flood'){
						overtime = 8;
					}
					console.log('finalList :'+JSON.stringify(finalList));

					var keys = Object.keys(finalList);

					for(var i=0;i<keys.length ;i++){
						//console.log(i+' timestamp : '+ finalList[keys[i]].timestamp);
						//console.log(i+' result : '+ ((now - finalList[keys[i]].timestamp)/hour));
						finalList[keys[i]].overtime = true;
						if( ((now - finalList[keys[i]].timestamp)/hour) < overtime )  {
							finalList[keys[i]].overtime = false;
						}
					}
				}
				return res.json(finalList);

			}else{
				return res.json({});
			}

		});
	});

	router.get('/last/:mac', function(req, res) {
		var test = req.get("test");
		if (test === undefined) {
			res.send({
				"responseCode" : '999',
				"responseMsg" : 'Missing parameter'
			});
			return false;
		}
		var mac = req.params.mac;
		if (mac.length === 0 ) {
			res.send({
				"responseCode" : '999',
				"responseMsg" : 'Missing parameter'
			});
			return false;
		}

		DeviceDbTools.findLastDeviceByMac(req.params.mac, function(err,event){
			if(err) {
				res.send({
					"responseCode" : '999',
					"responseMsg" : reason
				});
				return;
			}
			res.json({
				"responseCode" : '000',
				"data" : event
			});
		}) 
	});


module.exports = router;