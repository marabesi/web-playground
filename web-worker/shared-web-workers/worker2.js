onmessage = async (message) => {
  let i = 1
  while ( i < 2000) {
    i++
    console.log(i)
  }
  console.log(111)
  self.postMessage({ completed: true })
}
