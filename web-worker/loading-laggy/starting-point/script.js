const myWorker = new Worker("./worker.js");
myWorker.addEventListener('message', (data) => {
  const loading = document.querySelector('.loading');
  if (data && data.data.completed) {
    loading.style = 'display: none';
  }
});

async function doWork(document) {
  const loading = document.querySelector('.loading');
  loading.style = 'display: block';
  myWorker.postMessage('')
}

(async function(_doc) {
})(document);
