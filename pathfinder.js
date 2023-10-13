import fetch from 'node-fetch';
import axios from 'axios'; 
import { JSDOM } from 'jsdom';  
import fs from 'fs'; 

const processCode = (code) => {

  const apiUrl = 'https://sitecoreopenai-sandbox-et.openai.azure.com/openai/deployments/GPT-Test/chat/completions?api-version=2023-07-01-preview';

  const headers = {
    'Content-Type': 'application/json',
    'api-key': '95e3d36e83884506ae19c44fc482ac05',
  };

  const requestData = {
    messages: [
      {
        "role":"system","content":"Only respond with an array of objects with no other text. The objects should have the following format: {name: '', xpath: ''}. If there is no valid array of objects to return, just return an empty array."
      },
      // {
      //   role: 'user',
      //   content: 'Can you look at the following URL: https://www.pbs.org/parents/halloween and give me a synopsis of what the page is about?'
      // }
      {
        role: 'user',
        content: `Can you look at the following array of HTML tags: ${code}, then find attributes that represent the title, description, image URL, site URL, locale, and subtitle along with xpath expressions for extracting those attributes? If an attribute does not appear to be in the HTML tags, do not return an object for it.`
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
      console.log(tempArr)
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

// extractMetaAndTitleFromUrl('https://www.pbs.org/parents/halloween')

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

  const sourceCode = await extractMetaAndTitleFromUrl('https://www.pbs.org/parents/halloween');
  // const chunkedCode = chunkSourceCode(sourceCode);

  // const aiReponsePromise = chunkedCode.map(code => processCode(code))
  
  console.log('Fetching AI reponses...')
  
  const response = await processCode(sourceCode);
  // const responses = await Promise.all(aiReponsePromise)
  console.log(response);
  // responses.forEach(resp => console.log(resp))
}

pathFinder();