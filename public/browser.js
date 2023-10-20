async function runPathFinder() {
  const urls = document.getElementById('url-input')
    .value
    .replace(/[\s\n]+/g, '')
    .split(',')

  const button = document.getElementById('find-button');
  button.innerHTML = "AI Senses Tingling..."
  button.disabled = true;

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

  button.innerHTML = "Find"
  button.disabled = false;
  const pathsTextarea = document.getElementById('paths-output')
  pathsTextarea.value = JSON.stringify(resp, null, 2)
  pathsTextarea.style.height = '';
  pathsTextarea.style.height = pathsTextarea.scrollHeight + "px"
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
