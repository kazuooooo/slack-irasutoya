// index.js

const serverless = require("serverless-http");
const express = require("express");
const app = express();
const axios = require("axios");
const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({ extended: false });
const responseBuilder = require("./responseBuilder");
const service = require("./service");
const _ = require("lodash");

app.post("/", urlencodedParser, async function(req, res) {
  res.end();
  let response;
  const { text, response_url } = req.body;
  try {
    if (text) {
      // search
      response = await _search(text);
    } else {
      // random
      response = await _random();
    }
    await axios.post(response_url, response);
  } catch (err) {
    // 500 INTERNAL SERVER ERROR
    axios.post(response_url, responseBuilder.internalServerError());
  }
});

app.post("/action", urlencodedParser, async function(req, res) {
  res.end();
  let response;
  const { response_url, actions } = JSON.parse(req.body.payload);
  const { value: actionName } = actions[0];
  try {
    if (actionName === "RETRY_RANDOM") {
      response = await _random();
    } else {
      response = responseBuilder.sendImageResponse(req);
    }
    await axios.post(response_url, response);
  } catch (err) {
    axios.post(response_url, responseBuilder.internalServerError());
  }
});

const _search = async text => {
  const images = await service.search(text);
  if (images.length === 0) {
    // 404 NOT FOUND
    return responseBuilder.notFound();
  }
  return responseBuilder.searchResponse(images);
};

const _random = async () => {
  const image = await service.random();
  return responseBuilder.randomResponse(image);
};

module.exports.handler = serverless(app);
