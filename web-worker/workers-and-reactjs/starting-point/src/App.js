import { useState } from "react";

function App() {
  const [loading, setLoading] = useState(false);
  const code = `onmessage = e => {
    let i = 0;

    while (i < 10) {
      i++;
    }
    postMessage()
  }`;

  const worker = new Worker(URL.createObjectURL(new Blob([code])));

  worker.onmessage = () => setLoading(false);


  const doWork = async () => {
    setLoading(true);

    worker.postMessage();
  }

  return (
      <>
        <h1>Web worker playground</h1>
        {loading && <img data-testid="loading" src="/giphy.gif"  />}
        <br/>
        <button onClick={doWork}>Click me, no worker</button>
        <button >Click me, worker</button>
      </>
  );
}

export default App;
