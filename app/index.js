// index.js

const serverless = require("serverless-http");
const express = require("express");
const app = express();
const axios = require("axios");
const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({
  extended: false
});
const responseBuilder = require("./responseBuilder");
const service = require("./service");
const _ = require("lodash");
const qs = require("qs")

app.post("/", urlencodedParser, async function (req, res) {
  let response;
  const {
    token,
    text,
    response_url
  } = req.body;
  try {
    if (token !== process.env.VERIFICATION_TOKEN) {
      res.send(401)
    }
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
  res.end();
});

app.post("/action", urlencodedParser, async function (req, res) {
  let response;
  const {
    token,
    response_url,
    actions
  } = JSON.parse(req.body.payload);
  const {
    value: actionName
  } = actions[0];
  try {
    if (token !== process.env.VERIFICATION_TOKEN) {
      res.send(401)
    }
    if (actionName === "RETRY_RANDOM") {
      response = await _random();
    } else {
      response = responseBuilder.sendImageResponse(req);
    }
    const res = await axios.post(response_url, response);
  } catch (err) {
    axios.post(response_url, responseBuilder.internalServerError());
  }
  res.end();
});

app.get("/authorize", function (req, res) {
  return res.redirect(302, `https://slack.com/oauth/authorize?client_id=${process.env.CLIENT_ID}&scope=commands`);
})

app.get("/callback", async function (req, res) {
  const {
    code
  } = req.query
  const postBody = {
    code,
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET
  }
  const result = await axios.post('https://slack.com/api/oauth.access', qs.stringify(postBody), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
  return res.redirect(302, 'https://s3-ap-northeast-1.amazonaws.com/slack-irasutoya/index_success.html')
})

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