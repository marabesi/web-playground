var connectBtButton = document.getElementById('btn-bluetooth');
var disconnectButton = document.getElementById('btn-disconnect');
var bluetooth = null;

connectBtButton.addEventListener('click', function () {
    console.log('calling device');

    navigator.bluetooth.requestDevice({ filters: [{ services: ['battery_service'] }] })
        .then(device => {
            device.addEventListener('gattserverdisconnected', onDisconnected)

            bluetooth = device;

            return device.gatt.connect();
        }).then(server => {
            console.log('server');
        }).catch(error => {
            console.log(error);
        });
});

disconnectButton.addEventListener('click', function() {
    return disconnect(bluetooth);
});

function onDisconnected(event) {
    var device = event.target;
    console.log('Device ' + device.name + ' is disconnected.');
}

function disconnect(device) {
    return device.gatt.disconnect();
}
