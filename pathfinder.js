import fetch from 'node-fetch';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import dotenv from 'dotenv';

// Load the environment variables from the .env file  
dotenv.config();

const areObjectsEqual = (obj1, obj2) => {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }
  for (const key of keys1) {
    if (!keys2.includes(key) || obj1[key] !== obj2[key]) {
      return false;
    }
  }
  return true;
}

const processCode = (code) => {

  const apiUrl = 'https://sitecoreopenai-sandbox-et.openai.azure.com/openai/deployments/GPT-Test/chat/completions?api-version=2023-07-01-preview';

  let botResponse = '';

  const headers = {
    'Content-Type': 'application/json',
    'api-key': process.env.API_KEY,
  };

  const requestData = {
    messages: [
      {
        "role": "system",
        "content": "Only respond an array of objects with no other text. The objects represent attributes and the 1) Xpath expression and 2) cheerio jQuery function that you would use to extract them from the given code. The objects should have the following format, with name being lowercase with words separated by underscores: {\"name\": \"\", \"xpath\": \"\", \"JS\": \"\"}. If you cannot find an attribute looking ONLY in the specified tags, return {\"URL\":\"\", \"name\": \"\", \"xpath\": \"notfound.\"}. You should look for suitable attribiutes in the following order: 1) meta tags 2) any other tag. DO not return names other than what the user specified."
      },
      {
        role: 'user',
        content: `Can you look ONLY at the following array of HTML tags: ${code}, then find attributes that represent the title, description, image URL, site URL, locale, and subtitle along with xpath expressions for extracting those attributes? Look in the meta tags first, and if you don't find anything there, look in heading tags, image tags, or p tags.`
      },
    ],
    "temperature": 0,
  };

  return fetch(apiUrl, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(requestData),
  })
    .then((response) => response.json())
    .then((data) => {
      if (!data.choices) {
        console.log(data.error)
        return []
      }
      const tempArr = data.choices[0].message.content
      botResponse = tempArr;
      requestData.messages.push(
        {
          'role': 'assistant',
          'content': `'${botResponse.replace(/\n|\s/g, '')}'`
        },
      )
      let actualArr = JSON.parse(tempArr.replace(/\n|\s/g, ''))
      return actualArr;
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}

// This is just another version of the "getSourceCode" function that gets JUST the head.
async function extractDataFromUrl(url) {  
  const response = await axios.get(url);  
  const html = response.data;  
  const dom = new JSDOM(html);
  
  let dataStrings = [];
  
  // Gets meta tags
  const metaTags = [...dom.window.document.querySelectorAll('meta')].map(elem => elem.outerHTML);  

  // gets title element
  const title = dom.window.document.querySelector('title').outerHTML;

  // gets all headings from h1 - h3
  const h1Elements = [...dom.window.document.getElementsByTagName('h1')].map(elem => elem.outerHTML.replace(/\n/g, ' '));
  const h2Elements = [...dom.window.document.getElementsByTagName('h2')].map(elem => elem.outerHTML.replace(/\n/g, ' '));
  const h3Elements = [...dom.window.document.getElementsByTagName('h3')].map(elem => elem.outerHTML.replace(/\n/g, ' '));

  // gets all img tags
  const images = [...dom.window.document.getElementsByTagName('img')].map(elem => elem.outerHTML);

  // get any div tags that might be relevant

  const divAttributeValues = [
    'title',
    'description',
    'image'
  ]

  const divs = [];

  divAttributeValues.forEach(value => {
    const divsTags = dom.window.document.querySelectorAll(`div[*|${value}]`);
    for (let i = 0; i < divsTags.length; i++) {
      divs.push(divsTags[i].cloneNode(false).outerHTML)
    }
  })

  // pushes all retrieved tags to empty array
  dataStrings = [...metaTags, title, ...h1Elements, ...h2Elements, ...h3Elements, ...images, ...divs];
  return dataStrings;
}

async function pathFinder() {

  const attributes = [];

  const urls = [
    'https://www.torontopubliclibrary.ca/books-video-music/books/',
    'https://www.oshawa.ca/en/parks-recreation-and-culture/bright-and-merry-market.aspx',
    'https://doc.sitecore.com/search/en/users/search-user-guide/sources.html',
    'https://veronica-stork.com'
  ]; 

  const sourceCodes = [];

  for (const url of urls) {  
    const tags = await extractDataFromUrl(url);  
    sourceCodes.push(tags);

  }  

  console.log(sourceCodes);

  console.log('Fetching AI reponses...')

  for (let j = 0; j < sourceCodes.length; j++) {
    const attrArr = await processCode(sourceCodes[j]);
    attrArr.forEach(item1 => {
      if (!attributes.some(item2 => areObjectsEqual(item1, item2))) {
        attributes.push(item1);
      }
    })
  }

  return attributes;
}

const attrExtractionObjs = await pathFinder();
console.log(attrExtractionObjs);