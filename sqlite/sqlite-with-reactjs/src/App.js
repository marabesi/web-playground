import { useEffect, useState } from 'react';
import { sqlite3Worker1Promiser } from '@sqlite.org/sqlite-wasm';

import './App.css';

const promiser = await new Promise((resolve) => {
  const _promiser = sqlite3Worker1Promiser({
    onready: () => resolve(_promiser),
  });
});

const log = console.log;
const error = console.error;
const emptyThing = {
  description: ""
};

function App() {
  const [examples, setExamples] = useState([]);
  const [formData, setFormData] = useState(emptyThing);
  const [loading, setLoading] = useState(false);

  const saveExample = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      const id = examples.length + 1;
      const description = formData.description;

      const insert = await promiser('exec', {
        sql: 'INSERT INTO example (id, description) VALUES (?,?)',
        bind: [id, description]
      });
      setFormData(emptyThing);
    } catch (e) {
      error(e);
      error(' eeeorrrro ', e.result.message);
    }

    setLoading(false);
    fetchExamples();
  }

  const dropDatabase = async () => {
    await promiser('exec', 'DROP TABLE IF EXISTS example');
    await promiser('exec', 'CREATE TABLE IF NOT EXISTS example (id INTEGER PRIMARY KEY, description TEXT NOT NULL)');
    fetchExamples();
  }

  const fetchExamples = async () => {
    const resss = [];
    const responseaa = await promiser('exec', {
      sql: 'SELECT * FROM example',
      rowMode: 'array',
      callback: function (row) {
        if (row.row) {
          log('row ', row.row);
          resss.push({ id: row.row[0], description: row.row[1] })
        }
        ++this.counter;
      }.bind({ counter: 0 })
    });

    setExamples(resss);
  }

  useEffect(() => {
    const initializeSQLite = async () => {
      try {
        //log('Done initializing. Running demo...');
        const configResponse = await promiser('config-get', {});
        //log('Running SQLite3 version', configResponse.result.version.libVersion);

        const openResponse = await promiser('open', {
          filename: 'file:mydb.sqlite3?vfs=opfs',
        });

        const createTable = await promiser('exec', 'CREATE TABLE IF NOT EXISTS example (id INTEGER PRIMARY KEY, description TEXT NOT NULL)');

        fetchExamples();
        // log(
        //   'OPFS is available, created persisted database at',
        //   openResponse.result.filename.replace(/^file:(.*?)\?vfs=opfs$/, '$1'),
        // );
        // Your SQLite code here.
        // log(dbId)
      } catch (err) {
        if (!(err instanceof Error)) {
          err = new Error(err.result.message);
        }
        error('error ', err.name, err.message);
      }
    };
    initializeSQLite();
  }, []);

  return (
    <div className="App">
      <h1>Sqlite + webassembly</h1>
      {!loading && <form onSubmit={saveExample} method="post" style={{ padding: '10px' }}>
        <label>Description</label>
        <input type="text" onChange={e => setFormData({ ...formData, description: e.target.value})} />
        <button type="submit">Save</button>
      </form>}

      <h2>Examples ({examples.length})</h2>
      {examples.map((item, index) => <p key={item.id + index}>{item.id} - {item.description}</p>)}

      <h2>Utilities</h2>
      <button onClick={dropDatabase}>Clean database</button>
    </div>
  );
}

export default App;
