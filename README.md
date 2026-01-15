# REST Server

A REST API server for accessing St. Paul crime data using Node.js and Express.

## Overview

This project provides a RESTful API built with Express and SQLite3 that serves St. Paul crime incident data. The server supports CORS requests and provides endpoints for querying crime codes and related incident information.

## Features

- REST API endpoints for crime data queries
- SQLite3 database integration
- CORS support for cross-origin requests
- Express.js framework
- JSON request/response handling

## Prerequisites

- Node.js (v14 or later)
- npm

## Installation

1. Clone the repository:
```bash
git clone https://github.com/MarkDeSutter/webdev-rest
```

2. Navigate to the project directory:
```bash
cd webdev-rest
```

3. Install dependencies:
```bash
npm install
```

## Running the Server

Start the REST server:
```bash
node rest_server.mjs
```

The server will start on port 8000 and connect to the St. Paul crime database.

## API Endpoints

### GET /codes
Retrieves crime codes and their corresponding incident types.

**Query Parameters:**
- `code` (optional): Filter results by specific crime codes (comma-separated)

**Example:**
```
GET http://localhost:8000/codes
GET http://localhost:8000/codes?code=110,120
```

**Response:**
```json
[
  {
    "code": 110,
    "incident_type": "Homicide"
  },
  ...
]
```

## Database

The server uses SQLite3 with the St. Paul crime database (`db/stpaul_crime.sqlite3`). An original copy of the database is preserved in `db/Original_stpaul_crime.sqlite3`.

## CORS Configuration

The server is configured to accept requests from `http://localhost:8080` and supports the following HTTP methods:
- GET
- POST
- PUT
- DELETE

## Authors

- Mark DeSutter (desu5994@stthomas.edu)
- Jair Garces Vargas
- Ibrahima Ka

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Dependencies

- [Express](https://expressjs.com/) - Web application framework
- [sqlite3](https://github.com/mapbox/node-sqlite3) - SQLite3 database driver
