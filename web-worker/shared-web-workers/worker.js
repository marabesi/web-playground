onmessage = async (message) => {
  let i = 1
  while ( i < 2000) {
    i++
  }
  self.postMessage({ completed: true })
}
