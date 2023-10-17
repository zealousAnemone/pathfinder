import fetch from 'node-fetch';
import axios from 'axios'; 
import { JSDOM } from 'jsdom';  
import fs from 'fs'; 

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
  // https://sitecoreopenai-sandbox-et.openai.azure.com/openai/deployments/Test/completions?api-version=2023-09-15-preview
  const apiUrl = 'https://sitecoreopenai-sandbox-et.openai.azure.com/openai/deployments/GPT-Test/chat/completions?api-version=2023-07-01-preview';

  let botResponse = '';

  const headers = {
    'Content-Type': 'application/json',
    'api-key': '95e3d36e83884506ae19c44fc482ac05',
  };

  const requestData = {
    messages: [
      {
        "role":"system","content":"Only respond with an array of objects with no other text. The objects represent attributes and the xpath expression that you would use to extract them from the given code. The objects should have the following format, with name being lowercase with words separated by underscores: {\"name\": \"\", \"xpath\": \"\"}."
      },
      // {
      //   role: 'user',
      //   content: 'Can you look at the following URL: https://www.pbs.org/parents/halloween and give me a synopsis of what the page is about?'
      // }
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
      botResponse = tempArr;
      requestData.messages.push(
        {'role': 'assistant', 'content': `'${botResponse.replace(/\n|\s/g, '')}'`},
      )
      let actualArr = JSON.parse(tempArr.replace(/\n|\s/g, ''))
      console.log("New request: ", requestData);
      return actualArr;
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}

// function getSourceCode() {
//   return fetch('https://doc.sitecore.com/search/en/users/search-user-guide/sources.html')
//     .then(response => {
//       if (response.ok) {
//         return response.text();
//       } else {
//         throw new Error('Network response was not ok');
//       }
//     })
//     .catch(error => {
//       console.error('Error:', error);
//     });
// } 

// This is just another version of the "getSourceCode" function that gets JUST the head.
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

function chunkSourceCode(sourceCode) {
  const textSegments = [];
  const maxTokens = 4000;
  const stringWithoutTabs = sourceCode.replace(/\s{2,}/g, ' ');
  
  for (let i = 0; i < stringWithoutTabs.length; i += maxTokens) {
    textSegments.push(stringWithoutTabs.substring(i, i + maxTokens));
  }
  return textSegments;
}

async function pathFinder() {

  const attributes = [];

  const urls = [  
    'https://www.torontopubliclibrary.ca/books-video-music/books/',  
    'https://www.oshawa.ca/en/parks-recreation-and-culture/bright-and-merry-market.aspx',
    'https://doc.sitecore.com/search/en/users/search-user-guide/sources.html'
  ]; 

  const sourceCodes = [];

  for (const url of urls) {  
    const tags = await extractMetaAndTitleFromUrl(url);  
    sourceCodes.push(tags);
  }  

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