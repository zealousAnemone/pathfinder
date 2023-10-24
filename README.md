# pathfinder

### Prerequisite
1. You need an Open AI API key and chat/completions endpoint. 

### To run
1. Create a branch from Main.
2. In the pathfinder directory on your system, create a .env file with the following info:
    API_KEY=<your API key>
    API_URL=<your Open API chat endpoint>
3. To install dependencies, run `npm install.` You need Axios and JS DOM.
4. Run the program on the CLI or on a local server.


## Run on a local server 
1. In VS code, ensuring  that you are in the Pathfinder repository, open a terminal
2. To start the local server,  `npm run dev`.
3. In a Chrome browser, go to `http://localhost:3000`.
4. You see the Pathfinder UI.
5. Enter a comma-separated list of URLs and click the button.

## Run only in CLI
1. In VS code, go to src > urls.js, replace the sample URLs with the URLs you want, and save the file.
2. Open a terminal and run `npm run cli`.
