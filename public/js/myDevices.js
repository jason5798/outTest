var timeFormat = 'MM/DD/YYYY HH:mm';

    function newDate1(days) {
      return moment(days).toDate();
    }

    function newDate(days) {
      return moment().add(days, 'd').toDate();
    }

    function newDateString(days) {
      return moment().add(days, 'd').format(timeFormat);
    }

    function newTimestamp(days) {
      return moment().add(days, 'd').unix();
    }

    var color = Chart.helpers.color;
    var config = {
      type: 'line',
      data: {
        labels: [
          newDate(0),
          newDate(1),
          newDate(2),
          newDate(3),
          newDate(4),
          newDate(5),
          newDate(6)
          ],
        datasets: [{
          label: "溫度1",
          backgroundColor: color(window.chartColors.red).alpha(0.5).rgbString(),
          borderColor: window.chartColors.red,
          fill: false,
          data: [],
        }, {
          label: "濕度1",
          backgroundColor: color(window.chartColors.blue).alpha(0.5).rgbString(),
          borderColor: window.chartColors.blue,
          fill: false,
          data: [],
        }, {
          label: "溫度2",
          backgroundColor: color(window.chartColors.orange).alpha(0.5).rgbString(),
          borderColor: window.chartColors.orange,
          fill: false,
          data: [],
        }, {
          label: "濕度2",
          backgroundColor: color(window.chartColors.purple).alpha(0.5).rgbString(),
          borderColor: window.chartColors.purple,
          fill: false,
          data: [],
        }]
      },
      options: {
                title:{
                    text: "Chart.js Time Scale"
                },
                tooltips: {
                  mode: 'index',
                },
              hover: {
                mode: 'index'
              },
              scales: {
                xAxes: [{
                  type: "time",
                  time: {
                    parser: 'labels',
                    // round: 'day'
                    tooltipFormat: 'll HH:mm'
                  },
                  scaleLabel: {
                    display: true,
                    labelString: 'Date'
                  }
                }, ],
                yAxes: [{
                  ticks: {
                    beginAtZero: true,
                  },
                  scaleLabel: {
                    display: true,
                    labelString: 'value'
                  }
                }]
              },
      }
    };

     //alert(JSON.stringify(config.data.labels));
     //alert(JSON.stringify(config.data.datasets[0].data));

    window.onload = function() {
      var ctx = document.getElementById("canvas").getContext("2d");
      window.myLine = new Chart(ctx, config);

    };

    document.getElementById('randomizeData').addEventListener('click', function() {
      config.data.datasets.forEach(function(dataset) {
        dataset.data.forEach(function(dataObj, j) {
          if (typeof dataObj === 'object') {
            dataObj.y = randomScalingFactor();
          } else {
            dataset.data[j] = randomScalingFactor();
          }
        });
      });

      window.myLine.update();
    });
    document.getElementById('randomizeData').style.visibility = "hidden";

    var colorNames = Object.keys(window.chartColors);
    document.getElementById('addDataset').addEventListener('click', function() {
      var colorName = colorNames[config.data.datasets.length % colorNames.length];
      var newColor = window.chartColors[colorName]
      var newDataset = {
        label: 'Dataset ' + config.data.datasets.length,
        borderColor: newColor,
        backgroundColor: color(newColor).alpha(0.5).rgbString(),
        data: [],
      };

      for (var index = 0; index < config.data.labels.length; ++index) {
        newDataset.data.push(randomScalingFactor());
      }

      config.data.datasets.push(newDataset);
      window.myLine.update();
    });
    document.getElementById('addDataset').style.visibility = "hidden";
    //alert(config.data.datasets[0].data[0]);

    document.getElementById('addData').addEventListener('click', function() {
      if (config.data.datasets.length > 0) {
        config.data.labels.push(newDate(config.data.labels.length));

        for (var index = 0; index < config.data.datasets.length; ++index) {
          if (typeof config.data.datasets[index].data[0] === "object") {
            config.data.datasets[index].data.push({
              x: newDate(config.data.datasets[index].data.length),
              y: randomScalingFactor(),
            });
          } else {
            config.data.datasets[index].data.push(randomScalingFactor());
          }
        }

        window.myLine.update();
      }
    });
    document.getElementById('addData').style.visibility = "hidden";

    document.getElementById('removeDataset').addEventListener('click', function() {
      config.data.datasets.splice(0, 1);
      window.myLine.update();
    });
    document.getElementById('removeDataset').style.visibility = "hidden";

    document.getElementById('removeData').addEventListener('click', function() {
      config.data.labels.splice(-1, 1); // remove the label first

      config.data.datasets.forEach(function(dataset, datasetIndex) {
        dataset.data.pop();
      });

      window.myLine.update();
    });
    document.getElementById('removeData').style.visibility = "hidden";

//------------------------------------------------------------
var connected = false;
var host = window.location.hostname;
var port = window.location.port;
var opt2={
    //"order": [[ 2, "desc" ]],
    "iDisplayLength": 10,
    dom: 'Blrtip',
    buttons: [
        'copyHtml5',
        //'excelHtml5',
        'csvHtml5',
        //'pdfHtml5'
    ]
};
var table = $('#table1').dataTable(opt2);

var plot1;


if(location.protocol=="https:"){
  var wsUri="wss://"+host+":"+port+"/ws/devices";
} else {
  var wsUri="ws://"+host+":"+port+"/ws/devices";
}
console.log(wsUri);
var ws=null;

function wsConn() {
  ws = new WebSocket(wsUri);
  ws.onmessage = function(m) {
    //console.log('< from-node-red:',m.data);
    if (typeof(m.data) === "string" && m. data !== null){
      var msg =JSON.parse(m.data);
      console.log("from-node-red : id:"+msg.id);
      if(msg.id === 'init_table'){
          //Remove init button active
          //console.log("v : "+msg.v);

          //Reload table data
          //console.log("v type:"+typeof(msg.v));

          table.fnClearTable();
          var data = JSON.parse(msg.v);
          //console.log("addData type : "+ typeof(data)+" : "+data);
          if(data){
              table.fnAddData(data);
          }
          waitingDialog.hide();
          showChart(data);
      }
    }
  }
  ws.onopen = function() {
    var mac = document.getElementById("mac").value;
    var type = document.getElementById("type").value;
    var date = document.getElementById("date").value;
    var option= document.getElementById("option").value;
    var host = window.location.hostname;
    var port = window.location.port;
    var json = {mac:mac,type:type,date:date,option:option,host:host,port:port};
    //alert('date :'+ date);
    connected = true;
    var obj = {"id":"init","v":json};
    var getRequest = JSON.stringify(obj);
    console.log("getRequest type : "+ typeof(getRequest)+" : "+getRequest);
    console.log("ws.onopen : "+ getRequest);
    ws.send(getRequest);      // Request ui status from NR
    console.log(getRequest);

  }
  ws.onclose   = function()  {
    console.log('Node-RED connection closed: '+new Date().toUTCString());
    connected = false;
    ws = null;
  }
  ws.onerror  = function(){
    console.log("connection error");
  }
}
wsConn();           // connect to Node-RED server

function setButton(_id,_v){ // update slider
  myselect = $("#"+_id);
   myselect.val(_v);
   myselect.slider('refresh');
}

function toSecondTable(mac){
    //alert("mac : "+mac);
    //document.location.href="/device?mac="+mac;
}

function showDialog(){
    //waitingDialog.show('Custom message', {dialogSize: 'sm', progressType: 'warning'});
    waitingDialog.show();
    setTimeout(function () {
      waitingDialog.hide();
      }, 5000);
}

function back(){
    //alert('back');
    location.href=document.referrer;
}

function showChart(data){
    // alert('chart data : ' + JSON.stringify(data));
    if(data === null || data.length === 0) {
      return;
    }
    var mLables = [];
    var dataArr = [];
    var count = data[1].length - 3;
    console.log('count :' + count);
    for (let i = 0; i < data.length; i=i+2) {
      let obj = data[i];

      if (dataArr[0] === undefined) {
        for (let j = 0; j < count; ++j) {
          dataArr[j] = [];
        }
      }
      for (let j = 0; j < count; ++j) {
          dataArr[j].push(Number(obj[j+3]));
      }

      mLables.push(newDate1(obj[1]));
    }
    console.log(JSON.stringify(dataArr));
    console.log(JSON.stringify(mLables));
    // alert('chart data : ' + JSON.stringify(mLables));

    if (config.data.datasets.length > 0) {
        //config.data.labels.push(newDate(config.data.labels.length));

        config.data.labels= mLables;

        for (var index = 0; index < config.data.datasets.length; ++index) {
           config.data.datasets[index].data = dataArr[index];
           console.log(JSON.stringify(config.data.datasets[index].data));
        }


        window.myLine.update();
    }
}


$(document).ready(function(){
    showDialog();
});