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

  // Creates a request for GPT asking for possible metadata from the current substring of the source code - PROMPT IS IN "CONTENT"
  const requestData = {
    messages: [
      {
        "role":"system","content":"Only respond with an array of objects with no other text. The objects should have the following format: {name: '', xpath: ''}"
      },
      // {
      //   role: 'user',
      //   content: 'Can you look at the following URL: https://www.pbs.org/parents/halloween and give me a synopsis of what the page is about?'
      // }
      {
        role: 'user',
        content: `Can you look at the following source code: ${code}, then find attributes that represent the title, description, image URL, and subtitle along with xpath expressions for extracting those attributes?`
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
      console.log(tempArr);
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

async function extractHeadFromUrl(url) {  
  const response = await axios.get(url);  
  const html = response.data;  
  const dom = new JSDOM(html);  
  const head = dom.window.document.head;  
  return head.outerHTML;  
}  

function chunkSourceCode(sourceCode) {
  const textSegments = [];
  const maxTokens = 2040;
  const stringWithoutTabs = sourceCode.replace(/\t|\n/g, " ");
  for (let i = 0; i < stringWithoutTabs.length; i += maxTokens) {
    textSegments.push(stringWithoutTabs.substring(i, i + maxTokens));
  }
  return textSegments
}


async function pathFinder() {
  const sourceCode = await extractHeadFromUrl('https://www.pbs.org/parents/halloween');
  const chunkedCode = chunkSourceCode(sourceCode);

  const aiReponsePromise = chunkedCode.map(code => processCode(code))
  
  console.log('Fetching AI reponses...')
  
  const responses = await Promise.all(aiReponsePromise)

  responses.forEach(resp => console.log(resp))
}

pathFinder()