# timeular-linux
(experimental) Use your ZEI° on Linux.


## Usage in Ubuntu 17.10 or 18.04

### Install required packages

```bash
sudo apt install libudev-dev
npm install
npm test
sudo npm start
```

### Usage without root permissions

Cf. [https://github.com/sandeepmistry/noble#running-on-linux](https://github.com/sandeepmistry/noble#running-on-linux).

```bash
sudo setcap cap_net_raw+eip $(readlink --canonicalize `which node`)
getcap $(readlink --canonicalize `which node`)
```


## Usage with Docker

```bash
docker-compose up --build --force-recreate --no-start
docker-compose run --rm --user ${UID} npm install
docker-compose run --rm --user ${UID} npm test
docker-compose run --rm --user ${UID} npm start
```


## Information about Bluetooth Low Energy

GATT Services: [https://www.bluetooth.com/specifications/gatt/services](https://www.bluetooth.com/specifications/gatt/services)

GATT Characteristics: [https://www.bluetooth.com/specifications/gatt/characteristics](https://www.bluetooth.com/specifications/gatt/characteristics)
