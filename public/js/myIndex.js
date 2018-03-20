console.log("message manager");
var now = new Date();
var date = (now.getFullYear() + '/' + (now.getMonth() + 1) + '/' + now.getDate() );
if (document.getElementById("date").value === '') {
  document.getElementById("date").value = date;
}
var connected = false;
var initBtnStr ="#pir";
var host = window.location.hostname;
var port = window.location.port;

var opt2={
     "order": [[ 2, "desc" ]],
     "iDisplayLength": 25
 };

var table = $("#table1").dataTable(opt2);
if(location.protocol=="https:"){
  var wsUri="wss://"+window.location.hostname+":"+window.location.port+"/ws/";
} else {
  var wsUri="ws://"+window.location.hostname+":"+window.location.port+"/ws/";
}
console.log("wsUri:"+wsUri);

function toSecondTable(mac, fport){
    //alert("fport :"+fport);
    var date =document.getElementById("date").value;
    var option =document.getElementById("time_option").value;
    //alert("date :"+date);
    document.location.href="/devices?mac="+mac+"&type="+ fport+"&date="+date+"&option="+option;
}

function newPage(){
    //alert('back');
    location.href="/gateway";
}


$(document).ready(function(){

    table.$('tr').click(function() {
        var row=table.fnGetData(this);
        toSecondTable(row[1], row[6]);

    });
    new Calendar({
        inputField: "date",
        dateFormat: "%Y/%m/%d",
        trigger: "BTN",
        bottomBar: true,
        weekNumbers: true,
        showTime: 24,
        onSelect: function() {this.hide();}
    });

});