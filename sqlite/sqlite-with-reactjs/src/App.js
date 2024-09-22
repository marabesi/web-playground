import { useEffect, useState } from 'react';
import { sqlite3Worker1Promiser } from '@sqlite.org/sqlite-wasm';

import './App.css';

function getRandomArbitrary(min) {
  const max = 999999;
  return parseInt(Math.random() * (max - min) + min);
}

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
      const id = getRandomArbitrary(examples.length + 1);
      const description = formData.description;

      await promiser('exec', {
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
    await createTables();
    fetchExamples();
  }

  const createTables = async () => {
    return promiser('exec', 'CREATE TABLE IF NOT EXISTS example (id INTEGER PRIMARY KEY, description TEXT NOT NULL)');
  }

  const deleteExample = async (id) => {
    await promiser('exec', {
      sql: 'DELETE FROM example WHERE id = ?',
      bind: [id]
    });
    fetchExamples();
  }

  const fetchExamples = async () => {
    const resss = [];
    await promiser('exec', {
      sql: 'SELECT * FROM example',
      rowMode: 'array',
      callback: function (result) {
        const { row } = result
        if (row) {
          resss.push({ id: row[0], description: row[1] })
        }
        ++this.counter;
      }.bind({ counter: 0 })
    });

    setExamples(resss);
  }

  useEffect(() => {
    const initializeSQLite = async () => {
      try {
        const configResponse = await promiser('config-get', {});
        const openResponse = await promiser('open', {
          filename: 'file:mydb.sqlite3?vfs=opfs',
        });

        await createTables();
        await fetchExamples();

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
        <input type="text" autoFocus onChange={e => setFormData({ ...formData, description: e.target.value})} />
        <button type="submit">Save</button>
      </form>}

      <h2>Examples ({examples.length})</h2>
      {examples.map((item, index) => {
        return (
          <div key={item.id + index}>
            <h3>{item.description} - <button onClick={() => deleteExample(item.id)}>Delete</button></h3>
          </div>
        )}
      )}

      <h2>Utilities</h2>
      <button onClick={dropDatabase}>Clean database</button>
    </div>
  );
}

export default App;
