conmessage = async () => {
  await new Promise((resolve) => setTimeout(resolve, 5000));

  postMessage({
    result: true
  })
}
