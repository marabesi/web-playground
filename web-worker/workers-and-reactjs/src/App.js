import { useState } from "react";

function App() {
  const [loading, setLoading] = useState(false);

  const doWork = async () => {
      setLoading(true);

      let i = 0;

       await new Promise((resolve, reject) => {
         setTimeout(() => resolve(true), 800);
       });

      setLoading(false);
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
