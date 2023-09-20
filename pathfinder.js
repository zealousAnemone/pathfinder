import fetch from 'node-fetch';

const processCode = (code) => {
  
  const responses = [];
  const apiUrl = 'https://sitecoreopenai-sandbox-et.openai.azure.com/openai/deployments/GPT-Test/chat/completions?api-version=2023-07-01-preview';

  const headers = {
    'Content-Type': 'application/json',
    'api-key': '<YOUR API KEY HERE>',
  };

  // Goes through each substring in array
  for (let i = 0; i < code.length; i++) {
    // Creates a request for GPT asking for possible metadata from the current substring of the source code - PROMPT IS IN "CONTENT"
    const requestData = {
      messages: [
        { role: 'user', content: `Can you find tags representing the title, image URL, and description attributes in the following code sample? Return ONLY an array containing objects with the name of the attribute and an xpath expression to target it. There should be no further explanation. If there is no relevant metadata, return []. ${code[i]}`},
      ],
    };
    
    // Hits GPT API
    fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestData),
    })
      .then((response) => response.json())
      .then((data) => {
        let tempArr = JSON.parse(data.choices[0].message.content)
        console.log(tempArr);
        // Pushes the response, which should be an array of attribute objects, to the response array
        responses.push(...tempArr);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
    
  }  
  console.log(responses);
}


const getSourceCode = () => {
  const textSegments = [];
  fetch('https://doc.sitecore.com/search/en/users/search-user-guide/sources.html')
    .then(response => {
      if (response.ok) {
        return response.text();
      } else {
        throw new Error('Network response was not ok');
      }
    })
    .then(sourceCode => {
      // console.log(sourceCode);
      let maxTokens = 2040;
      const stringWithoutTabs = sourceCode.replace(/\t|\n/g, " ");
      for (let i = 0; i < stringWithoutTabs.length; i += maxTokens) {
        textSegments.push(stringWithoutTabs.substring(i, i + maxTokens));
      }
      processCode(textSegments);
    })
    .catch(error => {
      console.error('Error:', error);
    });
    
}

getSourceCode();