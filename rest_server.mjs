import * as path from 'node:path';
import * as url from 'node:url';

import { default as express } from 'express';
import { default as sqlite3 } from 'sqlite3';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const db_filename = path.join(__dirname, 'db', 'stpaul_crime.sqlite3');

const port = 8000;

let app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080'); // Allow requests from this origin
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); // Allow these methods
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Allow these headers
  next();
});

/********************************************************************
 ***   DATABASE FUNCTIONS                                         *** 
 ********************************************************************/
// Open SQLite3 database (in read-write mode)
let db = new sqlite3.Database(db_filename, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.log('Error opening ' + path.basename(db_filename));
    }
    else {
        console.log('Now connected to ' + path.basename(db_filename));
    }
});

// Create Promise for SQLite3 database SELECT query
function dbSelect(query, params) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(rows);
            }
        });
    });
}

// Create Promise for SQLite3 database INSERT or DELETE query
function dbRun(query, params) {
    return new Promise((resolve, reject) => {
        db.run(query, params, (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}

/********************************************************************
 ***   REST REQUEST HANDLERS                                      *** 
 ********************************************************************/

/**
 * Builds an array of javascript object with the given attributes
 *
 * @param [] rows stores all rows given from database
 * @param [] attributes store all attributes of the tables, eg codes would give code and incident types
 * @returns [] with all javascript objects
 */
function getValues(rows, attributes){
    let values = [];
    for(let i = 0; i < rows.length; i++){
        let object = {};
        for(let j = 0; j < attributes.length; j++){
            object[attributes[j]] = rows[i][attributes[j]];
        }
        values.push(object);
    }
    return values
}
// GET request handler for crime codes
app.get('/codes', (req, res) => {
    let query = 'SELECT * FROM Codes';
    if('code' in req.query){
        query = 'SELECT * FROM Codes WHERE code IN (' + req.query.code + ')'
    }
    db.all(query, (err, rows) => {
        if(err){
            res.status(500).type('txt').send('SQL Error');
        }
        else{
            let codes = getValues(rows, ['code', 'incident_type']);
            res.status(200).type('json').send(codes); // <-- you will need to change this
            }
    });
});

// GET request handler for neighborhoods
app.get('/neighborhoods', (req, res) => {
    let query = 'SELECT * FROM Neighborhoods';
    if('id' in req.query){
        query = 'SELECT * FROM Neighborhoods WHERE neighborhood_number IN (' + req.query.id + ')';
    }
    db.all(query, (err, rows) => {
        if(err){
            res.status(500).type('txt').send('SQL Error');
        }
        else{
            let neighborhoods = getValues(rows, ['neighborhood_number', 'neighborhood_name']);
             res.status(200).type('json').send(neighborhoods); // <-- you will need to change this
        }
    });
});

// GET request handler for crime incidents
app.get('/incidents', (req, res) => {
    let query = "SELECT * from Incidents";
    let params = [];

    //start
    if(req.query.start_date) {
        params.push("date_time >= '" + req.query.start_date + "'");
    }
    //end
    if(req.query.end_date) {
        params.push("date_time <= '" + req.query.end_date + "'");
    }
    //code
    if(req.query.code) {
        params.push("code IN (" + req.query.code + ")");
    }
    //grid
    if(req.query.grid) {
        params.push("police_grid IN (" + req.query.grid + ")");
    }
    //neighborhood
    if(req.query.neighborhood) {
        params.push("neighborhood_number IN (" + req.query.neighborhood + ")");
    }


    if (params.length >0) {
        query += " WHERE " + params.join(" AND ");
    }


    //limit
    query += " ORDER BY date_time DESC";
    if(req.query.limit) {
        query += " LIMIT " + req.query.limit;
    }
    else {
        query += " LIMIT 1000";
    }


    //console.log(query);

    let incidents = []
    db.all(query, (err, rows) => {
        if (err) {
            console.log(err);
            res.status(500).type('txt').send('SQL error');
        }
        else {
            for(let row of rows){
                incidents.push({
                    case_number: row.case_number,
                    date: row.date_time.substring(0, 10),      // YYYY-MM-DD
                    time: row.date_time.substring(11, 19),     // HH:MM:SS

                    code: row.code,
                    incident: row.incident,
                    police_grid: row.police_grid,
                    neighborhood_number: row.neighborhood_number,
                    block: row.block
                });
            }
            console.log(rows);
            res.status(200).type('json').send(incidents);
        }
    });
    
});

// PUT request handler for new crime incident
app.put('/new-incident', async (req, res) => {
    console.log(req.body);

    let{
        case_number,
        date,
        time,
        code,
        incident,
        police_grid,
        neighborhood_number,
        block
    } = req.body;

    // Validate required fields
    if (!case_number || !date || !time || !code || !incident || !police_grid || !neighborhood_number || !block) {
        return res.status(500).type('txt').send('Missing required field');
    }

    try {
        // check for duplicate case_number
        let rows = await dbSelect(
            "SELECT case_number FROM Incidents WHERE case_number = ?",
            [case_number]
        );

        if (rows.length > 0) {
            return res.status(500).type('txt').send("Error: case number already exists");
        }

        // Insert new incident
        await dbRun(
            `INSERT INTO Incidents 
            (case_number, date_time, code, incident, police_grid, neighborhood_number, block)
            VALUES (?, datetime(? || ' ' || ?), ?, ?, ?, ?, ?)`,
            [
                case_number,
                date,
                time,
                code,
                incident,
                police_grid,
                neighborhood_number,
                block
            ]
        );

        res.status(200).type('txt').send('success');
    }
    catch (err) {
        console.log(err);
        res.status(500).type('txt').send('SQL Error');
    }
});


// DELETE request handler for new crime incident
app.delete('/remove-incident', async (req, res) => {
    console.log(req.body);

    let { case_number } = req.body;

    if (!case_number) {
        return res.status(500).type('txt').send('Missing case_number');
    }

    try {
        // Check if case_number exists
        let rows = await dbSelect(
            "SELECT case_number FROM Incidents WHERE case_number = ?",
            [case_number]
        );

        if (rows.length === 0) {
            return res.status(500).type('txt').send('Error: case number does not exist');
        }

        // Delete it
        await dbRun(
            "DELETE FROM Incidents WHERE case_number = ?",
            [case_number]
        );

        res.status(200).type('txt').send('success');
    }
    catch (err) {
        console.log(err);
        res.status(500).type('txt').send('SQL Error');
    }
});


/********************************************************************
 ***   START SERVER                                               *** 
 ********************************************************************/
// Start server - listen for client connections
app.listen(port, () => {
    console.log('Now listening on port ' + port);
});