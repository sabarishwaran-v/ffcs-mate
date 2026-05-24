var fs = require('fs');
var XLSX = require('xlsx');


var wb_freshers = XLSX.readFile(__dirname + '/report_winter_freshers_25.xlsx');
var ws_freshers = wb_freshers.Sheets[wb_freshers.SheetNames[0]];

fs.writeFile(
    __dirname + '/output_winter_freshers_25.json',
    JSON.stringify(XLSX.utils.sheet_to_json(ws_freshers, { range: 1 })),
    () => console.log('Updated output_winter_freshers_25.json'),
);
