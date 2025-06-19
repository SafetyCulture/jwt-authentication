FROM 288761735648.dkr.ecr.us-east-1.amazonaws.com/safetyculture/node:22-builder-alpine-3.19 AS builder

ENV HOME /usr/src/app

WORKDIR $HOME

COPY [".jshintrc", ".npmignore", "package.json", "index.js", "index.d.ts", "$HOME/"]

ARG GITHUB_TOKEN
RUN printf "%s\n" "@safetyculture:registry=https://npm.pkg.github.com" "//npm.pkg.github.com/:_authToken=$GITHUB_TOKEN" > ".npmrc"
RUN echo "--- Node 22 - Install Dependencies" && npm install

COPY ["lib", "lib"]
COPY ["test", "test"]

RUN echo "--- Node 22 - Running Tests" && npm test
