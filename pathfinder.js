import fetch from 'node-fetch';

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
        role: 'user',
        content: `Can you find tags representing the title, image URL, and description attributes in the following code sample? Return one  array containing three objects. Each object should have the attribute and an xpath expression to target it. If you cannot find objects, return an array of strings. There should be no further explanation. If there is no relevant metadata, return []. ${code}`
      },
    ],
  };

  return fetch(apiUrl, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(requestData),
  })
    .then((response) => response.json())
    .then((data) => {
      const tempArr = data.choices[0].message.content
      return tempArr
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}


function getSourceCode() {
  return fetch('https://doc.sitecore.com/search/en/users/search-user-guide/sources.html')
    .then(response => {
      if (response.ok) {
        return response.text();
      } else {
        throw new Error('Network response was not ok');
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
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
  const sourceCode = await getSourceCode();
  const chunkedCode = chunkSourceCode(sourceCode);

  const aiReponsePromise = chunkedCode.map(code => processCode(code))
  
  console.log('Fetching AI reponses...')
  
  const responses = await Promise.all(aiReponsePromise)

  responses.forEach(resp => console.log(resp))
}

pathFinder()