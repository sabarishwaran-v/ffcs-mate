const fs = require('fs');
const path = require('path');

if (!fs.existsSync(path.resolve(__dirname + '/../src/data'))) {
    fs.mkdirSync(path.resolve(__dirname + '/../src/data'));
}


const outputFreshers = fs.readFileSync(path.resolve(__dirname + '/output_winter_freshers_25.json'));
let outputObjectFreshers = JSON.parse(outputFreshers);

// Normalize the keys
outputObjectFreshers = outputObjectFreshers.map(item => ({
    CODE: item["COURSE CODE"] || item.CODE,
    TITLE: item["COURSE TITLE"] || item.TITLE,
    TYPE: item["COURSE TYPE"] || item.TYPE,
    SLOT: item.SLOT,
    FACULTY: item.FACULTY,
    VENUE: item.VENUE,
    CREDITS: item.CREDITS
}));

// Remove repetitive slots with the same details
const uniqueAllData = (outputObject) =>
    outputObject.filter(
        (element, index, self) =>
            self.findIndex(
                (t) =>
                    t.CODE === element.CODE &&
                    t.SLOT === element.SLOT &&
                    t.TYPE === element.TYPE &&
                    t.FACULTY === element.FACULTY &&
                    t.VENUE === element.VENUE
            ) === index,
    );

fs.writeFile(
    __dirname + '/../src/data/all_data_winter_freshers_25.json',
    JSON.stringify(uniqueAllData(outputObjectFreshers)),
    () => console.log('Updated all_data_winter_freshers_25.json'),
);

// Remove repetitive courses
const uniqueCourses = (outputObject) =>
    outputObject.filter(
        (element, index, self) =>
            self.findIndex(
                (t) => t.CODE === element.CODE && t.TITLE === element.TITLE,
            ) === index,
    );


fs.writeFile(
    path.resolve(__dirname + '/../src/data/courses_winter_freshers_25.json'),
    JSON.stringify(uniqueCourses(outputObjectFreshers)),
    () => console.log('Updated courses_winter_freshers_25.json'),
);
