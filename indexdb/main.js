const container = document.createElement("div")
container.textContent = "loading"

document.body.appendChild(container)

const databaseVersion = 1
let database;

setTimeout(() => {
  const request = window.indexedDB.open("WebPlayground", databaseVersion);
  
  request.onerror = (event) => {
    // Do something with request.error!
    console.error(event);
    console.error(`Database error: ${event.target.error?.message}`);
    container.textContent = 'something wrong happened'
  };

  request.onsuccess = (event) => {
    container.textContent = `database version ${request.result.version}`
    // Do something with request.result!
    console.info('result ', request.result);
    database = event.target.result;
  };
}, 1000);

