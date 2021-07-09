const config = require('./config.json');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const express = require('express');

const app = express();

//by unique timestamp
let earthquakesData = new Map();
//by min mag
let subscriptionCache = new Map();

const TIME_SECONDS = config.intervalInSeconds;

const TIME_INTERVAL = 1000 * TIME_SECONDS;

// const app = require('fastify')({
//     logger: true
// });

app.get('/', (request, reply) => {
    reply.send("Welcome to the earthquake subscription api");
});

app.get('/earthquakes/subscribe/getAll', (request, reply) => {

    let allSubscribers = {};

    const iterableKeys = subscriptionCache.keys();

    let currentKey = iterableKeys.next();

    while (currentKey.value) {

        const subscribers = subscriptionCache.get(currentKey.value);

        allSubscribers[currentKey.value] = subscribers;

        currentKey = iterableKeys.next();
    }

    reply.send(allSubscribers);
});



app.post('/earthquakes/subscribe/set', (request, reply) => {

    const subscriptionID = uuidv4();

    const filters = request.body.filters;
    const endpoint = request.body.endpoint;

    const magnitudeFilter = filters.find(_filter => {
        return _filter.type == "magnitude";
    });

    if (magnitudeFilter) {

        let newSubscriptions;
        //check if we have a subscriptionCache
        if (subscriptionCache.has(magnitudeFilter.minimum)) {
            const currentSubcriptions = subscriptionCache.get(magnitudeFilter.minimum);
            newSubscriptions = [...currentSubcriptions];
            newSubscriptions.push({ subscriptionID, endpoint });
        } else {
            //if not then store this as the first one
            newSubscriptions = [{ subscriptionID, endpoint }];
        }
        console.log("newSubscriptions");
        console.log(newSubscriptions);
        subscriptionCache.set(magnitudeFilter.minimum, newSubscriptions)

    } else {

        reply.send({
            id: "0",
            details: "min mag required"
        });


    }

    const ackMessage = {
        id: subscriptionID,
        start: Date.now(),
        details: request.body
    }

    reply.send(ackMessage);

});


const port = process.env.PORT || 8080;
// Run the server!
app.listen(port, () => {
    console.log(`listening on ${port}`);
})

//https://jsonplaceholder.typicode.com/todos/1




const getEarthquakesByInterval = () => {

    console.log("about to request earthquake data");

    axios.get(config.sourceURL)
        .then(response => {
            // handle success
            storeEarthquakes(response.data);

        })
        .catch(error => console.log(error))
        .then(() => {
            getEarthquakes();
        });

}

const getEarthquakes = () => {
    // always executed
    console.log("=========================================");
    console.log("WAITING TO GET THE NEXT EARTHQUAKE DATASET");
    setTimeout(() => {
        getEarthquakesByInterval();
    }, TIME_INTERVAL)
}

getEarthquakes();



const storeEarthquakes = (_data) => {

    //console.log(_data);
    const features = _data.features;

    let newEarthquakes = [];

    features.forEach(_f => {
        const time = _f.properties.time;
        if (!earthquakesData.has(time)) {
            newEarthquakes.push(_f);
            earthquakesData.set(time, _f);
        }
    });

    console.log("earthquakes found this call - " + features.length);

    console.log("total unique earthquakes saved " + earthquakesData.size);

    console.log("total new earthquakes found " + newEarthquakes.length);

    if (newEarthquakes.length) {
        processNewEarthquakeData(newEarthquakes);
    }
}

//mykeys = myCache.keys();

const processNewEarthquakeData = (newEarthquakes) => {

    //subscriptionCache.. get all keys

    const iterableKeys = subscriptionCache.keys();

    let currentKey = iterableKeys.next();
    //return;
    while (currentKey.value) {
        //console.log(currentKey);
        const subscribers = subscriptionCache.get(currentKey.value);

        const earthquakesDataForSubscriber = newEarthquakes.filter(_e => {
            return _e.properties.mag >= currentKey.value;
        });

        pushToSub(subscribers, earthquakesDataForSubscriber);

        currentKey = iterableKeys.next();
    }

}

const pushToSub = (subscribers, earthquakesDataForSubscriber) => {

    subscribers.forEach(_s => {

        const endpoint = _s.endpoint;
        const data = earthquakesDataForSubscriber;

        httpPush(endpoint, data);


    })

}


const httpPush = (url, postData) => {


    axios.post(url, postData)
        .then((_response) => {
            console.log("pushed earthquake date to subscriber");
            //console.log(_response);
        })
        .catch((_err) => {
            console.log("Failed to pushed earthquake date to subscriber");
            //console.log(_err);
        });

}
