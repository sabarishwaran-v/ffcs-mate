const { parse, isValid } = require('date-fns');

let refDate = new Date(2000, 0, 1);
let start1 = parse("10:00 AM", 'h:mm aa', refDate);
let end1 = parse("10:50 AM", 'h:mm aa', refDate);
let start2 = parse("9:41 AM", 'h:mm aa', refDate);
let end2 = parse("10:40 AM", 'h:mm aa', refDate);

console.log("b1:", start1, "to", end1);
console.log("b2:", start2, "to", end2);

if (start1 < end2 && end1 > start2) {
    console.log("CLASH DETECTED!");
} else {
    console.log("NO CLASH!");
}
