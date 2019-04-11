const axios = require("axios");
const cheerio = require("cheerio");
const _ = require("lodash");
const {
  parseString
} = require("xml2js");
const nthline = require('nthline')

const opts = {
  xmlMode: true,
  withDomLvl1: false,
  normalizeWhitespace: true
};

const MAX_IMAGE_INDEX = 9985

// Irasutoya service
const SEARCH_SMAPLE_SIZE = 1;
const search = async query => {
  const imagePageUrls = await _scrapeImagePageUrlsFromSearchResults(query);

  // sample from results
  const urls = _.sampleSize(imagePageUrls.toArray(), SEARCH_SMAPLE_SIZE);

  // scrape image from image page
  const images = await Promise.all(
    urls.map(async url => await _scrapeImageObjectFromUrl(url))
  );
  return _.compact(images);
};

const random = async () => {
  // pick random
  const randomIndex = 1 + Math.floor(Math.random() * MAX_IMAGE_INDEX);
  const image = await _readImageObjectFromListFile(randomIndex);
  return image;
};

const withIndex = async index => {
  const url = await _pickEntryUrl(index);
  const image = await _scrapeImageObjectFromUrl(url);
  return image;
};

// private
_scrapeImagePageUrlsFromSearchResults = async query => {
  // scrape image page urls from search results
  const searchResultsResponse = await axios.get(
    encodeURI(`https://www.irasutoya.com/search?q=${query}`)
  );
  const resultsPageScraper = cheerio.load(searchResultsResponse.data, opts);
  const imagePageUrls = resultsPageScraper(".boxim > a").map((i, e) =>
    resultsPageScraper(e).attr("href")
  );
  return imagePageUrls;
};
_scrapeImageObjectFromUrl = async url => {
  try {
    const imagePageResponse = await axios.get(url);
    const imagePageScraper = cheerio.load(imagePageResponse.data, opts);
    const imageObject = {
      title: imagePageScraper("div.title").text(),
      imageUrl: imagePageScraper(".entry .separator a").attr("href")
    };
    if (!imageObject.imageUrl) return null;
    return imageObject;
  } catch (err) {
    // Discard page scrape error
    return null;
  }
};

const _pickEntryUrl = async startIndex => {
  const requestPath = `https://www.irasutoya.com/feeds/posts/summary?start-index=${startIndex}&max-results=1`;
  const res = await axios.get(requestPath);
  const resObject = await _parseXmlResponse(res.data);
  const entry = resObject.feed.entry[0];
  return entry.link[2].$.href;
};

const _parseXmlResponse = xml => {
  return new Promise((resolve, reject) => {
    parseString(xml, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

const _readImageObjectFromListFile = async index => {
  const res = await nthline(index, './images.csv')
  const [title, imageUrl] = res.split(',')
  return {
    title,
    imageUrl
  }
}

module.exports = {
  search,
  random,
  withIndex
};