package com.example.marabesi.ble;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.os.Build;
import android.support.annotation.NonNull;
import android.support.annotation.RequiresApi;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ListView;
import android.widget.TextView;
import android.widget.Toast;
import java.io.IOException;
import java.util.UUID;

@RequiresApi(api = Build.VERSION_CODES.JELLY_BEAN_MR2)
public class MainActivity extends AppCompatActivity implements AdapterView.OnItemClickListener, BluetoothAdapter.LeScanCallback {

    public UUID UUIDServer = UUID.fromString("6E400002-B5A3-F393-E0A9-E50E24DCCA9E");
    public static int REQUEST_BLUETOOTH = 1;
    public static final int PERMISSION_REQUEST_COARSE_LOCATION = 456;
    public static String LOG_TAG = "BLUETOOTH";

    private BluetoothAdapter BtAdapter;
    private ArrayAdapter<DeviceItem> adapterList;
    private Button scanBtn;
    private Button sendBtn;
    private ListView devices;
    private TextView info;
    private BroadcastReceiver mReceiver;
    private BluetoothSocket mBTSocket;
    private ConnectedThread mConnectedThread;
    private EditText msg;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        info = (TextView) findViewById(R.id.info);
        scanBtn = (Button) findViewById(R.id.scan);
        sendBtn = (Button) findViewById(R.id.send);

        msg = (EditText) findViewById(R.id.msg);
        adapterList = new ArrayAdapter<DeviceItem>(this, R.layout.adapter_list);
        devices = (ListView) findViewById(R.id.devices);

        devices.setAdapter(adapterList);
        devices.setOnItemClickListener(this);

        BtAdapter = BluetoothAdapter.getDefaultAdapter();

        if (!BtAdapter.isEnabled()) {
            Intent enableBT = new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE);
            startActivityForResult(enableBT, REQUEST_BLUETOOTH);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            requestPermissions(new String[]{Manifest.permission.ACCESS_COARSE_LOCATION}, PERMISSION_REQUEST_COARSE_LOCATION);
        }

        Log.i(LOG_TAG, "BLUETOOTH ENABLED");
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String permissions[], @NonNull int[] grantResults) {
        switch (requestCode) {
            case PERMISSION_REQUEST_COARSE_LOCATION: {
                if (grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    scan();
                } else {
                    Toast.makeText(this, "Not allowed to use bluetooth", Toast.LENGTH_SHORT).show();
                }
            }
        }
    }

    public void listPaired(View v) {
        this.info.setText("Filling paired devices");
        adapterList.clear();
        adapterList.notifyDataSetChanged();

        for (BluetoothDevice bt: BtAdapter.getBondedDevices()) {
            adapterList.add(new DeviceItem(bt.getName(), bt.getAddress(), ""));
        }
        adapterList.notifyDataSetChanged();
        this.info.setText("Done");
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data)
    {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == REQUEST_BLUETOOTH)
        {
            if (resultCode == 0) {
                Toast.makeText(this, "The user decided to deny bluetooth access", Toast.LENGTH_LONG).show();
            } else {
                Log.i(LOG_TAG, "User allowed bluetooth access!");
            }
        }
    }

    public void scan()
    {
        Log.i(LOG_TAG, "Starting discover");

        BtAdapter.startDiscovery();

        Toast.makeText(
                getApplicationContext(),
                "Discovering other bluetooth devices...",
                Toast.LENGTH_SHORT
        ).show();

        mReceiver = new BroadcastReceiver()
        {
            @Override
            public void onReceive(Context context, Intent intent)
            {
                String action = intent.getAction();

                if (BluetoothDevice.ACTION_FOUND.equals(action))
                {
                    BluetoothDevice device = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);

                    int rssi = intent.getShortExtra(BluetoothDevice.EXTRA_RSSI, Short.MIN_VALUE);

                    DeviceItem bluetoothObject = new DeviceItem();
                    bluetoothObject.setName(device.getName());
                    bluetoothObject.setAddress(device.getAddress());
                    bluetoothObject.setType(device.getType());

                    adapterList.add(bluetoothObject);
                    adapterList.notifyDataSetChanged();
                }
            }
        };

        IntentFilter filter = new IntentFilter(BluetoothDevice.ACTION_FOUND);
        registerReceiver(mReceiver, filter);

        Log.i(LOG_TAG, "Intent filter registered");
    }

    public void startDiscover(View v)
    {
        this.info.setText("Discovering...");
        adapterList.clear();
        adapterList.notifyDataSetChanged();
        scan();
    }

    @Override
    protected void onPause() {
        super.onPause();

        BtAdapter.cancelDiscovery();
    }

    public void stop(View v) {
        BtAdapter.cancelDiscovery();
    }

    private BluetoothSocket createBluetoothSocket(BluetoothDevice device) throws IOException {
        return  device.createRfcommSocketToServiceRecord(UUIDServer);
    }

    @Override
    public void onItemClick(AdapterView<?> parent, View view, int position, long id) {
        final DeviceItem current = this.adapterList.getItem(position);
        Log.w(LOG_TAG, "Clicked " + current.getName());

        this.info.setText("Connecting to " + current.getName());

        new Thread()
        {
            public void run() {
                boolean fail = false;

                BluetoothDevice device = BtAdapter.getRemoteDevice(current.getAddress());
                Log.i(LOG_TAG, device.getName());

                Log.i(LOG_TAG, "Canceling discovery");
                BtAdapter.cancelDiscovery();
                Log.i(LOG_TAG, "Discovery canceled");

                try {
                    mBTSocket = createBluetoothSocket(device);
                    Log.i(LOG_TAG, "created bluetooth socket");

                    mBTSocket.connect();

                    Log.i(LOG_TAG, "Trying to connect");
                    mBTSocket.connect();

                    Log.i(LOG_TAG, "Connected");
                } catch (IOException e) {
                    fail = true;

                    Log.e(LOG_TAG,"Socket creation failed (First try)");

                    try {
                        Log.i(LOG_TAG,"trying fallback...");

                        // https://stackoverflow.com/questions/18657427/ioexception-read-failed-socket-might-closed-bluetooth-on-android-4-3
                        mBTSocket = (BluetoothSocket) device.getClass().getMethod("createRfcommSocket", new Class[] {int.class}).invoke(device,1);
                        mBTSocket.connect();

                        Log.i(LOG_TAG,"Connected");
                        fail = false;
                    } catch (Exception e2) {
                        fail = true;
                        e2.printStackTrace();
                        Log.e(LOG_TAG, "Couldn't establish Bluetooth connection! (Second try)");
                    }
                }

                if (fail == false) {
                    mConnectedThread = new ConnectedThread(mBTSocket);
                    mConnectedThread.start();
                }
            }
        }.start();
    }

    public void sendToBluetooth(View v) {
        String data = msg.getText().toString();
        mConnectedThread.write(data);
    }

    @Override
    public void onLeScan(BluetoothDevice device, int rssi, byte[] scanRecord) {
    }

    @Override
    protected void onStop()
    {
        unregisterReceiver(mReceiver);
        super.onStop();
    }
}
