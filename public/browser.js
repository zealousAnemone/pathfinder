async function runPathFinder() {
  const urls = document.getElementById('url-input')
    .value
    .trim()
    .replace(/[\s\n]+/g, '')
    .split(',')

  const resp = await axios({
    method: 'post',
    url:'/pathfinder',
    data: { urls },
  })
  .then(resp => resp.data)
  .catch(err => {
    console.error('POSt /pathfinder failed')
    console.error(err)
  })

  document.getElementById('paths-output').value = JSON.stringify(resp, null, 2)
}

// pre-filling UI text box with URLs
(async function() {
  const urls = await axios({
    method: 'get',
    url: '/urls',
  })
  document.getElementById('url-input').value = urls.data.join(', ')
  document.getElementById('loading-overlay').classList.add('hidden')
})()
