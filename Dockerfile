FROM node:9

RUN apt-get update && \
  apt-get install --assume-yes libudev-dev && \
  rm -rf /var/lib/apt/lists/*

RUN setcap cap_net_raw+eip $(readlink --canonicalize `which node`)
