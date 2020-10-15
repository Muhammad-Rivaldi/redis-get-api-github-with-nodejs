const express = require('express');
const fetch = require('node-fetch');
const redis = require('redis');

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.PORT || 6379;

const client = redis.createClient(REDIS_PORT);

const app = express();

// set response
function setResponse(username,repos) {
    return `<h2>${username} memiliki ${repos} repository github</h2>`;
}

// request ke github untuk get data
async function getData(req,res,next) {  
    try {
        // console.log('fetching data...');

        const {username} = req.params;

        const response = await fetch (`https://api.github.com/users/${username}`);

        const data = await response.json();

        const repos = data.public_repos;

        // set data to redis
        client.setex(username,3600,repos);

        res.send(setResponse(username,repos));
    } catch (err) {
        console.error(err);
        res.status(500);
    }
}

// chance middleware
function chance(req,res,next) {
    const {username} = req.params;
    
    client.get(username, (err,data)=> {
        if (err) throw err;

        if (data !== null) {
            res.send(setResponse(username,data));
        } else {
            next();
        }
    });
}

app.get('/panggil/:username',chance,getData);

app.listen(5000, () => {
    console.log(`App listening in port ${PORT}`);
});