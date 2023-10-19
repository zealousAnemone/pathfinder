import urls from './urls.js'
import pathFinder from './pathfinder.js'

const attrExtractionObjs = await pathFinder(urls);
console.log(attrExtractionObjs);