import usb.core
import usb.util
import serial.tools.list_ports
import sys

print("\n==============================")
print(" ORACLE USB DEBUGGER")
print("==============================\n")

print("Scanning USB devices...\n")

devices = usb.core.find(find_all=True)

found = False

for dev in devices:
    found = True

    try:
        vendor_id = hex(dev.idVendor)
        product_id = hex(dev.idProduct)

        manufacturer = usb.util.get_string(dev, dev.iManufacturer)
        product = usb.util.get_string(dev, dev.iProduct)
        serial_number = usb.util.get_string(dev, dev.iSerialNumber)

        print("--------------------------------------------------")
        print(f"Vendor ID   : {vendor_id}")
        print(f"Product ID  : {product_id}")
        print(f"Manufacturer: {manufacturer}")
        print(f"Product     : {product}")
        print(f"Serial      : {serial_number}")

    except Exception as e:
        print(f"Could not fully read device: {e}")

if not found:
    print("No USB devices found.")

print("\n==============================")
print(" SERIAL PORTS")
print("==============================\n")

ports = serial.tools.list_ports.comports()

if not ports:
    print("No serial ports found.")
    sys.exit(0)

for port in ports:
    print("--------------------------------------------------")
    print(f"Device      : {port.device}")
    print(f"Name        : {port.name}")
    print(f"Description : {port.description}")
    print(f"HWID        : {port.hwid}")
    print(f"VID:PID     : {port.vid}:{port.pid}")
    print(f"Manufacturer: {port.manufacturer}")
    print(f"Product     : {port.product}")
    print(f"Serial Num  : {port.serial_number}")

print("\n==============================")
print(" DONE")
print("==============================\n")