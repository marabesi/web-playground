package com.example.marabesi.ble;

public class DeviceItem {

    private String name;
    private String address;
    private String status;
    private String uuid;
    private int type;

    DeviceItem(String name, String address, String status) {
        this.name = name;
        this.address = address;
        this.status = status;
    }

    DeviceItem() {};

    public String getUuid() {
        return uuid;
    }

    public void setUuid(String uuid) {
        this.uuid = uuid;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    @Override
    public String toString() {
        return this.getName();
    }

    public int getType() {
        return type;
    }

    public void setType(int type) {
        this.type = type;
    }
}
