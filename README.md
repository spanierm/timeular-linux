# timeular-linux
(experimental) Use your ZEI° on Linux.


## Usage in Ubuntu 17.10

### Install required packages

```bash
sudo apt install libudev-dev
npm install
sudo npm start
```

### Usage without root

Cf. [https://github.com/sandeepmistry/noble#running-on-linux](https://github.com/sandeepmistry/noble#running-on-linux).

```bash
sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)
getcap $(eval readlink -f `which node`)
```


## Usage with Docker

```bash
docker-compose run --rm npm install
docker-compose run --rm npm start
```


## Information about Bluetooth Low Energy

GATT Services: [https://www.bluetooth.com/specifications/gatt/services](https://www.bluetooth.com/specifications/gatt/services)

GATT Characteristics: [https://www.bluetooth.com/specifications/gatt/characteristics](https://www.bluetooth.com/specifications/gatt/characteristics)
