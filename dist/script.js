"use strict";
exports.MongoDB = class MongoDB {
    constructor(path) {
        this.client = require('mongodb').MongoClient;
        this.path = path;
    }
    connect(callback) {
        this.client.connect(this.path, (error, client) => {
            const { ObjectId } = require('bson');
            if (error)
                throw error;
            callback(client.db(), ObjectId);
            client.close();
        });
    }
    seed(target, elements, callback) {
        this.connect(db => {
            db.collection(target).remove();
            elements.forEach((element) => {
                db.collection(target).insertOne(element, (error, res) => {
                    if (error)
                        throw error;
                    if (callback)
                        callback(res);
                });
            });
        });
    }
    create(target, element, callback) {
        this.connect(db => {
            db.collection(target).insertOne(element, (error, res) => {
                if (error)
                    throw error;
                if (callback)
                    callback(res);
            });
        });
    }
    getAll(target, callback) {
        this.connect(db => {
            db.collection(target).find().toArray((error, docs) => {
                if (error)
                    throw error;
                docs.forEach(doc => { doc.id = doc._id; delete doc._id; });
                callback(docs);
            });
        });
    }
    getById(target, id, callback) {
        this.connect((db, parse) => {
            db.collection(target).findOne({ "_id": parse(id) }, (error, doc) => {
                if (error)
                    throw error;
                doc.id = doc._id;
                delete doc._id;
                callback(doc);
            });
        });
    }
    update(target, element, callback) {
        this.connect((db, parse) => {
            element._id = element.id;
            delete element.id;
            let query = { "_id": parse(element._id) };
            let new_element = {};
            new_element = Object.assign(new_element, element);
            delete new_element["_id"];
            let new_values = { $set: new_element };
            db.collection(target).updateOne(query, new_values, (error, res) => {
                if (error)
                    throw error;
                if (callback)
                    callback(res);
            });
        });
    }
    delete(target, id, callback) {
        this.connect((db, parse) => {
            db.collection(target).deleteOne({ "_id": parse(id) }, function (error, res) {
                if (error)
                    throw error;
                if (callback)
                    callback(res);
            });
        });
    }
};
exports.MySQL = class MySQL {
    constructor(path) {
        this.client = require('mysql');
        this.path = path;
    }
    connect(callback) {
        this.db = this.client.createConnection(this.path);
        callback(this.db);
        this.db.end();
    }
    seed(target, elements, callback) {
        this.connect(db => {
            db.query(`DROP TABLE IF EXISTS ${target}`, (error) => { if (error)
                throw error; });
            const attributes = new Array;
            elements.forEach((element) => {
                for (let attribute in element)
                    if (!attributes.includes(attribute))
                        attributes.push(attribute);
            });
            const seed = [''];
            attributes.forEach(attribute => seed.push(`${attribute} TEXT`));
            db.query(`CREATE TABLE IF NOT EXISTS ${target} (id INTEGER AUTO_INCREMENT${seed.join(',')}, PRIMARY KEY (id))`, (error) => { if (error)
                throw error; });
            elements.forEach((element) => {
                let values = new Array;
                attributes.forEach((attribute) => values.push(`'${JSON.stringify(element[attribute])}'`));
                db.query(`INSERT INTO ${target} (${attributes.join(',')}) VALUES (${values.join(',')})`, (error) => { if (error)
                    throw error; });
            });
        });
    }
    create(target, element, callback) {
        this.connect(db => {
            const attributes = new Array;
            for (let attribute in element)
                attributes.push(attribute);
            const values = new Array;
            attributes.forEach(attribute => values.push(`'${JSON.stringify(element[attribute])}'`));
            db.query(`INSERT INTO ${target} (${attributes.join(',')}) VALUES (${values.join(',')})`, (error) => { if (error)
                throw error; });
        });
    }
    getAll(target, callback) {
        this.connect(db => {
            db.query(`SELECT * FROM ${target}`, (error, rows) => {
                if (error)
                    throw error;
                let results = JSON.parse(JSON.stringify(rows));
                results.forEach((result) => {
                    for (let attribute in result)
                        result[attribute] = JSON.parse(result[attribute]);
                });
                callback(results);
            });
        });
    }
    getById(target, id, callback) {
        this.connect(db => {
            db.query(`SELECT * FROM ${target} WHERE id = ${id} LIMIT 1`, (error, rows) => {
                if (error)
                    throw error;
                let result = JSON.parse(JSON.stringify(rows[0]));
                for (let attribute in result)
                    result[attribute] = JSON.parse(result[attribute]);
                callback(result);
            });
        });
    }
    update(target, element, callback) {
        this.connect(db => {
            const update = new Array;
            for (let attribute in element)
                update.push(`${attribute} = '${JSON.stringify(element[attribute])}'`);
            db.query(`UPDATE ${target} SET ${update.join(', ')} WHERE id = ${element.id}`, (error) => { if (error)
                throw error; });
        });
    }
    delete(target, id, callback) {
        this.connect(db => {
            db.query(`DELETE FROM ${target} WHERE id = ${id}`, (error) => { if (error)
                throw error; });
        });
    }
};
exports.SQLite = class SQLite {
    constructor(path) {
        this.client = require('sqlite3');
        this.path = path;
    }
    connect(callback) {
        this.db = new this.client.Database(this.path);
        callback(this.db);
        this.db.close();
    }
    seed(target, elements, callback) {
        this.connect(db => {
            db.serialize(() => {
                db.run(`DROP TABLE IF EXISTS ${target}`, (error) => { if (error)
                    throw error; });
                const attributes = new Array;
                elements.forEach((element) => {
                    for (let attribute in element)
                        if (!attributes.includes(attribute))
                            attributes.push(attribute);
                });
                const seed = [''];
                attributes.forEach(attribute => seed.push(`${attribute} TEXT`));
                db.run(`CREATE TABLE IF NOT EXISTS ${target} (id INTEGER PRIMARY KEY AUTOINCREMENT${seed.join(',')})`, (error) => { if (error)
                    throw error; });
                elements.forEach((element) => {
                    let values = new Array;
                    attributes.forEach(attribute => values.push(`'${JSON.stringify(element[attribute])}'`));
                    db.run(`INSERT INTO ${target} (${attributes.join(',')}) VALUES (${values.join(',')})`, (error) => { if (error)
                        throw error; });
                });
            });
        });
    }
    create(target, element, callback) {
        this.connect(db => {
            db.serialize(() => {
                const attributes = new Array;
                for (let attribute in element)
                    attributes.push(attribute);
                const values = new Array;
                attributes.forEach(attribute => values.push(`'${JSON.stringify(element[attribute])}'`));
                db.run(`INSERT INTO ${target} (${attributes.join(',')}) VALUES (${values.join(',')})`, (error) => { if (error)
                    throw error; });
            });
        });
    }
    getAll(target, callback) {
        this.connect(db => {
            db.serialize(() => {
                db.all(`SELECT * FROM ${target}`, (error, results) => {
                    if (error)
                        throw error;
                    results.forEach(result => {
                        for (let attribute in result)
                            result[attribute] = JSON.parse(result[attribute]);
                    });
                    callback(results);
                });
            });
        });
    }
    getById(target, id, callback) {
        this.connect(db => {
            db.serialize(() => {
                db.get(`SELECT * FROM ${target} WHERE id = ${id}`, (error, result) => {
                    if (error)
                        throw error;
                    for (let attribute in result)
                        result[attribute] = JSON.parse(result[attribute]);
                    callback(result);
                });
            });
        });
    }
    update(target, element, callback) {
        this.connect(db => {
            db.serialize(() => {
                const update = new Array;
                for (let attribute in element)
                    update.push(`${attribute} = '${JSON.stringify(element[attribute])}'`);
                db.run(`UPDATE ${target} SET ${update.join(', ')} WHERE id = ${element.id}`, (error) => { if (error)
                    throw error; });
            });
        });
    }
    delete(target, id, callback) {
        this.connect(db => {
            db.serialize(() => {
                db.run(`DELETE FROM ${target} WHERE id = ${id}`, (error) => { if (error)
                    throw error; });
            });
        });
    }
};
exports.Redis = class Redis {
    constructor(path) {
        this.client = require('redis');
        this.path = path;
    }
    connect(callback) {
        this.db = this.client.createClient(this.path);
        this.db.on('error', (error) => { throw error; });
        callback(this.db);
        this.db.quit();
    }
    seed(target, elements, callback) {
        this.connect(db => {
            elements.forEach((element, i) => { element.id = i; });
            db.set(target, JSON.stringify(elements));
        });
    }
    create(target, element, callback) {
        this.connect(db => {
            db.get(target, (error, result) => {
                if (error)
                    throw error;
                const elements = JSON.parse(result);
                element.id = Math.max(...elements.map((obj) => obj.id)) + 1;
                elements.push(element);
                this.connect(db => db.set(target, JSON.stringify(elements)));
            });
        });
    }
    getAll(target, callback) {
        this.connect(db => {
            db.get(target, (error, result) => {
                if (error)
                    throw error;
                callback(JSON.parse(result));
            });
        });
    }
    getById(target, id, callback) {
        this.connect(db => {
            db.get(target, (error, result) => {
                if (error)
                    throw error;
                callback(JSON.parse(result).find((obj) => obj.id === id));
            });
        });
    }
    update(target, element, callback) {
        this.connect(db => {
            db.get(target, (error, result) => {
                if (error)
                    throw error;
                const elements = JSON.parse(result);
                let e = elements.find((obj) => obj.id === element.id);
                elements[elements.indexOf(e)] = element;
                this.connect(db => db.set(target, JSON.stringify(elements)));
            });
        });
    }
    delete(target, id, callback) {
        this.connect(db => {
            db.get(target, (error, result) => {
                if (error)
                    throw error;
                const elements = JSON.parse(result);
                elements.splice(elements.indexOf(elements.find((obj) => obj.id === id)), 1);
                this.connect(db => db.set(target, JSON.stringify(elements)));
            });
        });
    }
};
