import * as path from 'node:path';
import * as url from 'node:url';

import { default as express } from 'express';
import { default as sqlite3 } from 'sqlite3';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const db_filename = path.join(__dirname, 'db', 'stpaul_crime.sqlite3');

const port = 8000;

let app = express();
app.use(express.json());

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
    if('code' in req.query){
        db.all('SELECT * FROM Codes WHERE code IN (' + req.query.code + ')', (err, rows) => {
            if(err){
                res.status(500).type('txt').send('SQL Error');
            }
            else{
                let codes = getValues(rows, ['code', 'incident_type']);
                res.status(200).type('json').send({codes}); // <-- you will need to change this
                }
        });
    }
    else{
        db.all('SELECT * FROM Codes', (err, rows) => {
            if(err){
                res.status(500).type('txt').send('SQL Error');
            }
            else{
                let codes = getValues(rows, ['code', 'incident_type']);
                res.status(200).type('json').send({codes}); // <-- you will need to change this
            }
        });
    }
    
});

// GET request handler for neighborhoods
app.get('/neighborhoods', (req, res) => {
    if('id' in req.query){
        db.all('SELECT * FROM Neighborhoods WHERE neighborhood_number IN (' + req.query.id + ')', (err, rows) => {
            if(err){
                res.status(500).type('txt').send('SQL Error');
            }
            else{
                let neighborhoods = getValues(rows, ['neighborhood_number', 'neighborhood_name']);
                res.status(200).type('json').send({neighborhoods}); // <-- you will need to change this
            }
        });
    }
    else{
        db.all('SELECT * FROM Neighborhoods', (err, rows) => {
            if(err){
                res.status(500).type('txt').send('SQL Error');
            }
            else{
                let neighborhoods = getValues(rows, ['neighborhood_number', 'neighborhood_name']);
                res.status(200).type('json').send({neighborhoods}); // <-- you will need to change this
            }
        });
    }
});

// GET request handler for crime incidents
app.get('/incidents', (req, res) => {
    console.log(req.query); // query object (key-value pairs after the ? in the url)
    
    res.status(200).type('json').send({}); // <-- you will need to change this
});

// PUT request handler for new crime incident
app.put('/new-incident', (req, res) => {
    console.log(req.body); // uploaded data
    
    res.status(200).type('txt').send('OK'); // <-- you may need to change this
});

// DELETE request handler for new crime incident
app.delete('/remove-incident', (req, res) => {
    console.log(req.body); // uploaded data
    
    res.status(200).type('txt').send('OK'); // <-- you may need to change this
});

/********************************************************************
 ***   START SERVER                                               *** 
 ********************************************************************/
// Start server - listen for client connections
app.listen(port, () => {
    console.log('Now listening on port ' + port);
});
