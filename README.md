# DCD API - HTTP

![GitHub package.json version](https://img.shields.io/github/package-json/v/datacentricdesign/dcd-api-http)
![GitHub release (latest by date)](https://img.shields.io/github/v/release/datacentricdesign/dcd-api-http)
![Docker Build Status](https://img.shields.io/docker/build/datacentricdesign/dcd-api-http)

A NodeJS REST API for the Data-Centric Design Hub

## Developers

To effectively develop this API, first setup your dcd hub development environment as described here:
[https://github.com/datacentricdesign/dcd-hub/tree/develop](https://github.com/datacentricdesign/dcd-hub/tree/develop)

As part of the setup, you now have the clone of this dcd-api-http repository.

```bash
cd dcd-api-http
cp development.env .env
```

Install all dependencies with npm.

```bash
npm install
```

To switch from the dcd-api-http running on Docker to your version, first stop the container, then run your code.

```bash
docker-compose stop dcd-api-http
npm start
```

Note: if you struggle with the need for sudo and localadmin, use a local package:

```bash
mkdir ~/.npm-packages
```

Then:

```bash
npm config set prefix ~/.npm-packages
```

## Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

### Unreleased

#### Added

    * TODO: API / persons / <id> / tasks
    * TODO: API / persons / <id> / tasks / <id> / resources
