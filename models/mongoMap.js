var mongoose = require('./mongoose');
var Schema = mongoose.Schema;
var settings =  require('../settings.js');
var debug = false;

let mapSchema = new Schema({
    deviceType : {  type: String, required: true},
    typeName   : {  type: String, required: true},
    fieldName  : {  type: Schema.Types.Mixed, 
                    default: null, 
                    required: false},
    map        : {  type: Schema.Types.Mixed, 
                    default: null, 
                    required: true},
    createUser : {  type: String, 
                    default: null, 
                    required: false},
    createTime : {  type: Date, 
                    default: null, 
                    required: false},
    updateUser : {  type: String, 
                    default: null, 
                    required: false},
    updateTime : {  type: Date, 
                    default: null, 
                    required: false},
});

var MapModel = mongoose.model('Map', mapSchema);

module.exports = {
    create,
    findLast,
    find,
    update,
    remove
}

function create (obj) {
    var newMap = new MapModel({
        deviceType  : obj.deviceType,
        typeName    : obj.typeName,
        fieldName   : obj.fieldName,
        map         : obj.map,
        createUser  : obj.createUser,
        createTime  : new Date(),
        updateUser  : null,
        updateTime  : null
    });
    return new Promise(function (resolve, reject) {
        newMap.save(function(err, docs){
            if(!err){
                // console.log(now + ' Debug : Device save fail!');
                resolve(docs);
            }else{
                // console.log(now + ' Debug : Device save success.');
                reject(err);
            }
        });
    });
}

function findLast (json) {
    return new Promise(function (resolve, reject) {
        MapModel.find(json).sort({recv: -1}).limit(1).exec(function(err,docs){
            if(err){
                if (debug) {
                    console.log(new Date() + 'findLast err : ' + err.message);
                }
                reject(err);
            }else{
                if (debug) {
                    console.log(new Date() + 'findLast : ' + JSON.stringify(docs[0]));
                }
                resolve(docs[0]);
            }
        });
    });
}

function find (json) {
    return new Promise(function (resolve, reject) {
        MapModel.find(json).exec(function(err,docs){
            if(err){
                if (debug) {
                    console.log(new Date() + 'findLast err : ' + err.message);
                }
                reject(err);
            }else{
                if (debug) {
                    console.log(new Date() + 'find : ' + JSON.stringify(docs.length));
                }
                resolve(docs);
            }
        });
    });
}

function update (conditions, json) {
    return new Promise(function (resolve, reject) {
        MapModel.update(conditions,
            json,
            {safe : true, upsert : true},
            (err, rawResponse)=>{
                if (err) {
                    if (debug) {
                        console.log(new Date() + 'update map err : ' + err.message);
                    }
                    reject(err);
                } else {
                    if (debug) {
                        console.log(new Date() + 'update map : ' + rawResponse);
                    }
                    resolve('Update map success');
                }
        });
    });
}

function remove (json) {
    return new Promise(function (resolve, reject) {
        MapModel.remove(json, (err)=>{
            if (err) {
              console.log('Map remove occur a error:', err);
               reject(err);
            } else {
                console.log('Map remove success');
                resolve('Map remove success');
            }
        });
    });
}





