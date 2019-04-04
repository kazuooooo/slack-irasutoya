const {
    withIndex
} = require("../app/service");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const csvWriter = createCsvWriter({
    path: "./images.csv",
    header: [{
            id: "title",
            title: "title"
        },
        {
            id: "imageUrl",
            title: "imageUrl"
        }
    ]
});

const START_INDEX = 1;
const END_INDEX = 10000;
const scrapeImages = async () => {
    for (i = START_INDEX; i <= END_INDEX; i++) {
        try {
            const image = await withIndex(i);
            csvWriter.writeRecords([image]);
            console.log(`DONE INDEX ${i}`);
        } catch (e) {
            console.log(`FAIL INDEX: ${i} cuz ${e}`);
        }
        await _sleep(1000);
    }
};

const _sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

scrapeImages();