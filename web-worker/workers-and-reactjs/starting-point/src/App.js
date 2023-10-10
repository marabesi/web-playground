import { useState } from "react";

function App() {
  const [loading, setLoading] = useState(false);

  const doWork = async () => { }

  return (
      <>
        <h1>Web worker playground</h1>
          <img data-testid="loading" src="/giphy.gif"  />
        <br/>
        <button onClick={doWork}>Click me, no worker</button>
        <button >Click me, worker</button>
      </>
  );
}

export default App;
