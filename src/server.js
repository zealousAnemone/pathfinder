import express from 'express'
import bodyParser from 'body-parser'
import pathFinder from './pathfinder.js'
import urls from './urls.js'

const app = express()
const port = 3000

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());


app.use(express.static('public'));

app.get('/urls', async (req, res) => {
  return res.json(urls)
})

app.post('/pathfinder', async (req, res) => {
  const urls = req.body.urls
  console.log(urls)
  const attrExtractionObjs = await pathFinder(urls)
  return res.json(attrExtractionObjs)
})

app.listen(port, () => {
  console.log(`Pathfinder app listening on port ${port}`)
})