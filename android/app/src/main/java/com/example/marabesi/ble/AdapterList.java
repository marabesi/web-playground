package com.example.marabesi.ble;

import android.content.Context;
import android.support.annotation.NonNull;
import android.widget.ArrayAdapter;

public class AdapterList extends ArrayAdapter<DeviceItem> {

    public AdapterList(@NonNull Context context, int resource) {
        super(context, resource);
    }
}
