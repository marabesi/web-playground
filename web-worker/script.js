async function doWork(_doc) {
  const loading = _doc.querySelector('.loading');

  loading.style = 'display: block'

  let i = 0;

  while (i < 136857) {
    console.log(i)
    i++
  }

  loading.style = 'display: none'
}

(async function(_doc) {
  const loading = _doc.querySelector('.loading');
  const fire = _doc.querySelector('.do-work');

  const worker = new Worker('worker.js')

  fire.addEventListener('click', () => {
    loading.style = 'display: block'
    worker.postMessage('go');
  })

  worker.onmessage = () => {
    loading.style = 'display: none'
  }
})(document);
