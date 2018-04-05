package com.example.marabesi.ble;

import android.bluetooth.BluetoothSocket;
import android.os.Build;
import android.os.SystemClock;
import android.support.annotation.RequiresApi;
import android.util.Log;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

public class ConnectedThread extends Thread {
    private final BluetoothSocket mmSocket;
    private final InputStream mmInStream;
    private final OutputStream mmOutStream;

    public ConnectedThread(BluetoothSocket socket) {
        mmSocket = socket;
        InputStream tmpIn = null;
        OutputStream tmpOut = null;

        try {
            tmpIn = socket.getInputStream();
            tmpOut = socket.getOutputStream();
        } catch (IOException e) {
            e.printStackTrace();
        }

        mmInStream = tmpIn;
        mmOutStream = tmpOut;
    }

    @RequiresApi(api = Build.VERSION_CODES.JELLY_BEAN_MR2)
    public void run() {
        byte[] buffer;
        int bytes;

        while (true) {
            try {
                bytes = mmInStream.available();

                if (bytes != 0) {
                    buffer = new byte[1024];
                    SystemClock.sleep(100);

                    bytes = mmInStream.available();
                    bytes = mmInStream.read(buffer, 0, bytes);

                    String received = new String(buffer, 0, bytes);
                    Log.i(MainActivity.LOG_TAG, received);
                }
            } catch (IOException e) {
                e.printStackTrace();

                break;
            }
        }
    }

    public void write(String input) {
        byte[] bytes = input.getBytes();
        try {
            mmOutStream.write(bytes);
        } catch (IOException e) { }
    }

    public void cancel() {
        try {
            mmSocket.close();
        } catch (IOException e) { }
    }
}