document.addEventListener('DOMContentLoaded', async () => {
  const connectedDevices = []

  const find = document.querySelector('#find')

  find.addEventListener('click', async () => {
    const filterBy = document.querySelector('#filter-by').value
    const filters = []

    if (filterBy) {
      filters.push({
        classCode: filterBy
      })
    }

    const device = await navigator.usb.requestDevice({
      filters
    })

    connectedDevices.push(device)

    drawList(connectedDevices)
  })

  const devices = await navigator.usb.getDevices()
  console.log(devices)
  drawList(devices)

  const opened = await devices[0].open();
  console.log(opened)
  // await devices[1].selectConfiguration(1);
  // await devices[1].claimInterface(0);
  //
  // listen(devices[1])
})

const listen = async (device) => {
  const result = await device.transferIn(3, 64);
  const decoder = new TextDecoder();
  const message = decoder.decode(result.data);
  console.log(message)
  listen();
};

function drawList(devices) {
  document.querySelector('#list').innerHTML = ''
  for (const device of devices) {
    document.querySelector('#list').innerHTML +=
      `<tr>
        <td>${device.productId}</td>
        <td>${device.productName}</td>
        <td>${device.opened}</td>
      </tr>`
  }
}