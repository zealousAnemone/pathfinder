import fetch from 'node-fetch';
import axios from 'axios'; 
import { JSDOM } from 'jsdom';  
import fs from 'fs'; 

// Function to check if two objects are equal
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

// Function to process HTML code and extract attributes
const processCode = (code) => {
  const apiUrl = 'https://sitecoreopenai-sandbox-et.openai.azure.com/openai/deployments/GPT-Test/chat/completions?api-version=2023-07-01-preview';

  const headers = {
    'Content-Type': 'application/json',
    'api-key': '95e3d36e83884506ae19c44fc482ac05',
  };

  const requestData = {
    messages: [
      {
        "role":"system","content":"Only respond with an array of objects with no other text. The objects represent attributes and the 1) Xpath expression and 2) cheerio Jquery function that you would use to extract them from the given code. The objects should have the following format, with name being lowercase with words separated by underscores: {\"name\": \"\", \"xpath\": \"\", \"JS\": \"\"}."
      },
      {
        role: 'user',
        content: `Can you look at the following array of HTML tags: ${code}, then find attributes that represent the title, description, image URL, site URL, locale, and subtitle along with xpath expressions for extracting those attributes?`
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
      const tempArr = data.choices[0].message.content
      console.log("tempArr: ", tempArr)
      let actualArr = JSON.parse(tempArr.replace(/\n|\s/g, ''))
      return actualArr;
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}

// Function to extract meta tags and title from a URL
async function extractMetaAndTitleFromUrl(url) {  
  const response = await axios.get(url);  
  const html = response.data;  
  const dom = new JSDOM(html);  
  const metaTags = dom.window.document.querySelectorAll('meta');  

  const metaStrings = [];  
  for (let i = 0; i < metaTags.length; i++) {  
    metaStrings.push(metaTags[i].outerHTML)
  }  
  const title = dom.window.document.querySelector('title');
  metaStrings.push(title.outerHTML)

  return metaStrings;
}  

// Function to process multiple URLs and group attributes by name
async function pathFinder() {
  const attributesByName = {}; // Store attributes grouped by name

  const urls = [
    'https://www.rbcroyalbank.com/en-ca/my-money-matters/debt-and-stress-relief/struggling-to-make-ends-meet/managing-and-consolidating-debt/6-ways-to-help-manage-your-debt-during-a-financial-crisis/',  
    'https://www.oshawa.ca/en/parks-recreation-and-culture/bright-and-merry-market.aspx',
    'https://www.whitby.ca/en/play/arenas-and-skating.aspx',
    'https://www.pbs.org/parents/printables/jamming-on-the-job-robotics-engineer'
  ]; 

  const sourceCodes = [];

  for (const url of urls) {  
    const tags = await extractMetaAndTitleFromUrl(url);  
    sourceCodes.push(tags);
  }  

  console.log('Fetching AI responses...')

  for (let j = 0; j < sourceCodes.length; j++) {
    const attrArr = await processCode(sourceCodes[j]);
    attrArr.forEach(item1 => {
      const name = item1.name; // Extract the attribute name
      if (!attributesByName[name]) {
        attributesByName[name] = []; // Initialize an array for the name if it doesn't exist
      }
      attributesByName[name].push(item1); // Push the attribute object to the corresponding name's array
    });
  }

  // Convert the grouped attributes back to a flat array
  const attributes = Object.values(attributesByName).flat();

  return attributes;
}

// Call the pathFinder function and log the result
const attrExtractionObjs = await pathFinder();
console.log(attrExtractionObjs);
