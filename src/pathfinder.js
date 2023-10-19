import fetch from 'node-fetch';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import dotenv from 'dotenv';
import urls from './urls.js';

// Load the environment variables from the .env file  
dotenv.config();

// Function to check if objects are equal
const areObjectsEqual = (obj1, obj2) => {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  // Iterates through the name, xpath, and js properties of the object and sees if they match the other object
  for (let i = 0; i < 3; i++) {
    if (!keys2.includes(keys1[i]) || obj1[keys1[i]] !== obj2[keys1[i]]) {
      return false;
    }
  }
  return true;
}

// This sends HTML source code to OpenAI API to extract and return array of attribute objects it finds
const processCode = (code) => {

  const apiUrl = process.env.API_URL;

  let botResponse = '';

  const headers = {
    'Content-Type': 'application/json',
    'api-key': process.env.API_KEY,
  };

  const requestData = {
    messages: [
      {
        "role": "system",
        "content": "Only respond an array of objects with no other text. The objects represent attributes from a given URL and the 1) Xpath expression and 2) cheerio jQuery function that you would use to extract them from the given code. The objects should have the following format, with name being lowercase with words separated by underscores: {\"name\": \"\", \"xpath\": \"\", \"JS\": \"\", \"url\": \"\"}. If you cannot find an attribute looking ONLY in the tags provided by the user, return {\"URL\":\"\", \"name\": \"\", \"xpath\": \"notfound.\"}. You should look for suitable attribiutes in the following order: 1) meta tags, 2) heading tags (h1-h2). DO not return names other than what the user specified."
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
        console.log(data.error);
        return [];
      }
      const tempArr = data.choices[0].message.content;
      botResponse = tempArr;
      // console.log("bot response: ", botResponse)
      // This pushes the bots response to the messages array - We are not using this functionality, but it's here
      // in case we end up wanting to make it go back and forth more
      requestData.messages.push(
        {
          'role': 'assistant',
          'content': `'${botResponse.replace(/\n|\s/g, '')}'`
        },
      )
      // Takes the "array" returned by the bot (which is actually a string) and parses it as JSON
      let actualArr = JSON.parse(tempArr.replace(/\n|\s/g, ''))
      return actualArr;
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}

// Extracts data from source code - meta tags, title elements, and headings.
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
  // const h3Elements = [...dom.window.document.getElementsByTagName('h3')].map(elem => elem.outerHTML.replace(/\n/g, ' '));

  // gets all img tags
  // const images = [...dom.window.document.getElementsByTagName('img')].map(elem => elem.outerHTML);

  // get any div tags that might be relevant

  // const divAttributeValues = [
  //   'title',
  //   'description',
  //   'image'
  // ]

  // const divs = [];

  // divAttributeValues.forEach(value => {
  //   const divsTags = dom.window.document.querySelectorAll(`div[*|${value}]`);
  //   for (let i = 0; i < divsTags.length; i++) {
  //     divs.push(divsTags[i].cloneNode(false).outerHTML)
  //   }
  // })

  // pushes all retrieved tags to empty array - Leaving out h3, divs, and images for now to save room in request
  dataStrings = [url, ...metaTags, title, ...h1Elements, ...h2Elements];
  return dataStrings;
}

export default async function pathFinder(urls) {

  // this is the array that will hold all of the attribute objects
  const attributes = [];

  // This holds all of the HTML retrieved from the URLs using the extractDataFromUrl function
  const sourceCodes = [];

  // loops through all urls and extracts tags, then pushes them to sourceCodes array
  for (const url of urls) {  
    const tags = await extractDataFromUrl(url);  
    // console.log("URL: ", url, " tags: ", tags)
    sourceCodes.push(tags);

  }  

  console.log('Fetching AI reponses...')

  // Array to hold attribute objects extracted from HTML of a single URL
  let attrArr = [];

  // Loops through array of HTML tags from each URL
  for (let j = 0; j < sourceCodes.length; j++) {  
    // calls processCode on each collection of tags from a single URL
    // puts the resulting array of attribute objects in attrArr
    attrArr = await processCode(sourceCodes[j]);  

    // looks through the attribute objects retrieved from a URLs HTML tags
    attrArr.forEach(item1 => {  
      let temp = [];  
      let found = false;  
      // Compares objects to the objects already in the attributes array
      attributes.forEach(item2 => {  
        // If that attribute and extraction method already exists in the shared attributes array...
        if (areObjectsEqual(item1, item2)) {  
          found = true;  
          // Increment the number of URLs that use that extraction method
          item2.used_in += 1;
        }  
      });  
      // If that object doesn't exist yet in the attributes array...
      if (!found) {  
        // Insert it
        let newItem = Object.assign({}, item1);  
        // Give it the "used_in" property and give that the value of 1
        newItem.used_in = 1;  
        delete newItem.url;  
        // Put that object in a temp array
        temp.push(newItem);  
      } 
      // Push the contents of the temp array to the attributes array
      attributes.push(...temp);  
    });  
  } 

  return attributes;
}
