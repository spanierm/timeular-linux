FROM node

RUN apt-get update
RUN apt-get install -y libudev-dev
