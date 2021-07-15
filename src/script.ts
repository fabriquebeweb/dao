type id = number | string
type callback = (...arg: any) => void
type dataElement = { id?: id, _id?: id, [key: string]: any}

interface DAO {
    path: string

    /**
     * Réinitialise une table/collection/clé
     * @param {*} target La table/collection/clé à réinitialiser
     * @param {*} elements Les éléments a insérer
     * @param {*} callback Traitement à effectuer sur le message d'erreur (facultatif)
     */
    seed: (target: string, elements: dataElement[], callback?: callback) => void

    /**
     * Insère un élément dans une table/collection/clé
     * @param {*} target La table/collection/clé dans laquelle insérer l'élément
     * @param {*} element L'élément a insérer
     * @param {*} callback Traitement à effectuer sur le message d'erreur (facultatif)
     */
    create: (target: string, element: dataElement, callback?: callback) => void

    /**
     * Récupère tout les éléments d'une table/collection/clé
     * @param {*} target La table/collection/clé à récupérer
     * @param {*} callback Le traitement a effectuer sur la donnée
     */
    getAll: (target: string, callback: callback) => void

    /**
     * Récupère un élément d'une table/collection/clé par son ID
     * @param {*} target La table/collection/clé dans laquelle récuperer l'élément
     * @param {*} id L'ID de l'élément a récupérer
     * @param {*} callback Le traitement a effectuer sur l'élément
     */
    getById: (target: string, id: id, callback: callback) => void

    /**
     * Met à a jour un élément dans une table/collection/clé
     * @param {*} target La table/collection/clé de l'élément a mettre à jour
     * @param {*} element L'élément à mettre a jour
     * @param {*} callback Traitement à effectuer sur le message d'erreur (facultatif)
     */
    update: (target: string, element: dataElement, callback?: callback) => void

    /**
     * Supprime un élément d'une table/collection/clé
     * @param {*} target La table/collection/clé dans laquelle supprimer l'élément
     * @param {*} id L'ID de l'élément a a supprimer
     * @param {*} callback Traitement à effectuer sur le message d'erreur (facultatif)
     */
    delete: (target: string, id: id, callback?: callback) => void
}

exports.MongoDB = class MongoDB implements DAO {
    private client: any
    path: string

    constructor(path: string) {
        this.client = require('mongodb').MongoClient
        this.path = path
    }

    private connect(callback: callback) : void {
        this.client.connect(this.path, (error: any, client: any) => {
            const { ObjectId } = require('bson')
            if (error) throw error
            callback(client.db(), ObjectId)
            client.close()
        })
    }
    
    seed(target: string, elements: dataElement[], callback?: callback) : void {
        this.connect(db => {
            db.collection(target).remove()
            elements.forEach((element) => {
                db.collection(target).insertOne(element, (error: any, res: any) => {
                    if (error) throw error
                    if (callback) callback(res)
                })    
            })
        })
    }

    create(target: string, element: dataElement, callback?: callback) : void {
        this.connect(db => {
            db.collection(target).insertOne(element, (error: any, res: any) => {
                if (error) throw error
                if (callback) callback(res)
            })
        })
    }

    getAll(target: string, callback: callback) : void {
        this.connect(db => {
            db.collection(target).find().toArray((error: any, docs: dataElement[]) => {
                if (error) throw error
                docs.forEach(doc => { doc.id = doc._id; delete doc._id })
                callback(docs)
            })
        })
    }

    getById(target: string, id: id, callback: callback) : void {
        this.connect((db, parse) => {
            db.collection(target).findOne({ "_id" : parse(id) }, (error: any, doc: dataElement) => {
                if (error) throw error
                doc.id = doc._id; delete doc._id    
                callback(doc)
            })
        })
    }

    update(target: string, element: dataElement, callback?: callback) : void {
        this.connect((db, parse) => {
            element._id = element.id; delete element.id
            let query = { "_id" : parse(element._id)}
            let new_element: dataElement = {}            
            new_element = Object.assign(new_element, element)
            delete new_element["_id"]

            let new_values = {$set : new_element}
            
            db.collection(target).updateOne(query, new_values, (error: any, res: any) => {
                if(error) throw error
                if (callback) callback(res)
            })
        })
    }

    delete(target: string, id: id, callback?: callback){
        this.connect((db, parse) => {
            db.collection(target).deleteOne({ "_id" : parse(id)}, (error: any, res: any) => {
                if (error) throw error
                if (callback) callback(res)
            })
        })
    }
}

exports.MySQL = class MySQL implements DAO {
    private client: any
    private db: any
    path: string

    constructor(path: string) {
        this.client = require('mysql')
        this.path = path
    }

    private connect(callback: callback) : void {
        this.db = this.client.createConnection(this.path)
        callback(this.db)
        this.db.end()
    }

    seed(target: string, elements: dataElement[], callback?: callback) : void {
        this.connect(db => {
            db.query(
                `DROP TABLE IF EXISTS ${target}`,
                (error: any, res: any) => { if (error) throw error; if (callback) callback(res) }
            )

            const attributes = new Array
            elements.forEach((element) => {
                for (let attribute in element) if (!attributes.includes(attribute)) attributes.push(attribute)
            })

            const seed = ['']
            attributes.forEach(attribute => seed.push(`${attribute} TEXT`))

            db.query(
                `CREATE TABLE IF NOT EXISTS ${target} (id INTEGER AUTO_INCREMENT${seed.join(',')}, PRIMARY KEY (id))`,
                (error: any, res: any) => { if (error) throw error; if (callback) callback(res) }
            )
            
            elements.forEach((element) => {
                let values = new Array
                attributes.forEach((attribute: number) => values.push(`'${JSON.stringify(element[attribute])}'`))
                db.query(
                    `INSERT INTO ${target} (${attributes.join(',')}) VALUES (${values.join(',')})`,
                    (error: any, res: any) => { if (error) throw error; if (callback) callback(res) }
                )
            })
        })
    }

    create(target: string, element: dataElement, callback?: callback) {
        this.connect(db => {
            const attributes = new Array
            for (let attribute in element) attributes.push(attribute)

            const values = new Array
            attributes.forEach(attribute => values.push(`'${JSON.stringify(element[attribute])}'`))

            db.query(
                `INSERT INTO ${target} (${attributes.join(',')}) VALUES (${values.join(',')})`,
                (error: any, res: any) => { if (error) throw error; if (callback) callback(res) }
            )
        })
    }

    getAll(target: string, callback: callback) : void {
        this.connect(db => {
            db.query(`SELECT * FROM ${target}`, (error: any, rows: any) => {
                if (error) throw error
                let results = JSON.parse(JSON.stringify(rows))
                results.forEach((result: any) => {
                    for (let attribute in result) result[attribute] = JSON.parse(result[attribute])
                })
                callback(results)
            })
        })
    }

    getById(target: string, id: id, callback: callback) : void {
        this.connect(db => {
            db.query(`SELECT * FROM ${target} WHERE id = ${id} LIMIT 1`, (error: any, rows: any) => {
                if (error) throw error
                let result = JSON.parse(JSON.stringify(rows[0]))
                for (let attribute in result) result[attribute] = JSON.parse(result[attribute])
                callback(result)
            })
        })
    }

    update(target: string, element: dataElement, callback?: callback) {
        this.connect(db => {
            const update = new Array
            for (let attribute in element) update.push(`${attribute} = '${JSON.stringify(element[attribute])}'`)
            db.query(
                `UPDATE ${target} SET ${update.join(', ')} WHERE id = ${element.id}`,
                (error: any, res: any) => { if (error) throw error; if (callback) callback(res) }
            )
        })
    }

    delete(target: string, id: id, callback?: callback) {
        this.connect(db => {
            db.query(
                `DELETE FROM ${target} WHERE id = ${id}`,
                (error: any, res: any) => { if (error) throw error; if (callback) callback(res) }
            )
        })
    }
}

exports.SQLite = class SQLite implements DAO {
    private client: any
    private db: any
    path: string

    constructor(path: string) {
        this.client = require('sqlite3')
        this.path = path
    }

    connect(callback: callback) : void {
        this.db = new this.client.Database(this.path)
        callback(this.db)
        this.db.close()
    }

    seed(target: string, elements: dataElement[], callback?: callback) {
        this.connect(db => {
            db.serialize(() => {
                db.run(
                    `DROP TABLE IF EXISTS ${target}`,
                    (error: any) => { if (error) throw error; if (callback) callback(error) }
                )
    
                const attributes = new Array
                elements.forEach((element) => {
                    for (let attribute in element) if (!attributes.includes(attribute)) attributes.push(attribute)
                })
    
                const seed = ['']
                attributes.forEach(attribute => seed.push(`${attribute} TEXT`))

                db.run(
                    `CREATE TABLE IF NOT EXISTS ${target} (id INTEGER PRIMARY KEY AUTOINCREMENT${seed.join(',')})`,
                    (error: any) => { if (error) throw error; if (callback) callback(error) }
                )
                
                elements.forEach((element) => {
                    let values = new Array
                    attributes.forEach(attribute => values.push(`'${JSON.stringify(element[attribute])}'`))
                    db.run(
                        `INSERT INTO ${target} (${attributes.join(',')}) VALUES (${values.join(',')})`,
                        (error: any) => { if (error) throw error; if (callback) callback(error) }
                    )
                })
            })
        })
    }

    create(target: string, element: dataElement, callback?: callback) {
        this.connect(db => {
            db.serialize(() => {
                const attributes = new Array
                for (let attribute in element) attributes.push(attribute)
    
                const values = new Array
                attributes.forEach(attribute => values.push(`'${JSON.stringify(element[attribute])}'`))
    
                db.run(
                    `INSERT INTO ${target} (${attributes.join(',')}) VALUES (${values.join(',')})`,
                    (error: any) => { if (error) throw error; if (callback) callback(error) }
                )
            })    
        })
    }

    getAll(target: string, callback: callback) : void {
        this.connect(db => {
            db.serialize(() => {
                db.all(`SELECT * FROM ${target}`, (error: any, results: dataElement[]) => {
                    if (error) throw error
                    results.forEach(result => {
                        for (let attribute in result) result[attribute] = JSON.parse(result[attribute])
                    })
                    callback(results)
                })
            })
        })
    }

    getById(target: string, id: id, callback: callback) : void {
        this.connect(db => {
            db.serialize(() => {
                db.get(`SELECT * FROM ${target} WHERE id = ${id}`, (error: any, result: dataElement) => {
                    if (error) throw error
                    for (let attribute in result) result[attribute] = JSON.parse(result[attribute])
                    callback(result)
                })
            })    
        })
    }

    update(target: string, element: dataElement, callback?: callback) {
        this.connect(db => {
            db.serialize(() => {
                const update = new Array
                for (let attribute in element) update.push(`${attribute} = '${JSON.stringify(element[attribute])}'`)
                db.run(
                    `UPDATE ${target} SET ${update.join(', ')} WHERE id = ${element.id}`,
                    (error: any) => { if (error) throw error; if (callback) callback(error) }
                )
            })    
        })
    }

    delete(target: string, id: id, callback?: callback) {
        this.connect(db => {
            db.serialize(() => {
                db.run(
                    `DELETE FROM ${target} WHERE id = ${id}`,
                    (error: any) => { if (error) throw error; if (callback) callback(error) }
                )
            })
        })
    }
}

exports.Redis = class Redis implements DAO {
    private client: any
    private db: any
    path: string

    constructor(path: string) {
        this.client = require('redis')
        this.path = path
    }

    connect(callback: callback) : void {
        this.db = this.client.createClient(this.path)
        callback(this.db)
        this.db.quit()
    }

    seed(target: string, elements: dataElement[], callback?: callback) {
        this.connect(db => {
            db.on('error', (error: any) => { if (callback) callback(error); throw error })
            elements.forEach((element, i) => { element.id = i })
            db.set(target, JSON.stringify(elements))
        })
    }

    create(target: string, element: dataElement, callback?: callback) {
        this.connect(db => {
            db.get(target, (error: any, result: any) => {
                if (error) throw error; if (callback) callback(error)
                const elements = JSON.parse(result)
                element.id = Math.max(...elements.map((obj: any) => obj.id)) + 1
                elements.push(element)

                this.connect(db => {
                    db.on('error', (error: any) => { if (callback) callback(error); throw error })
                    db.set(target, JSON.stringify(elements))
                })
            })    
        })
    }

    getAll(target: string, callback: callback) : void {
        this.connect(db => {
            db.get(target, (error: any, result: any) => {
                if (error) throw error; if (callback) callback(error)
                callback(JSON.parse(result))
            })
        })
    }

    getById(target: string, id: id, callback: callback) : void {
        this.connect(db => {
            db.get(target, (error: any, result: any) => {
                if (error) throw error; if (callback) callback(error)
                callback(JSON.parse(result).find((obj: any) => obj.id === id))
            })    
        })
    }

    update(target: string, element: dataElement, callback?: callback) {
        this.connect(db => {
            db.get(target, (error: any, result: any) => {
                if (error) throw error; if (callback) callback(error)
                const elements = JSON.parse(result)
                let e = elements.find((obj: any) => obj.id === element.id)
                elements[elements.indexOf(e)] = element
    
                this.connect(db => {
                    db.on('error', (error: any) => { if (callback) callback(error); throw error })
                    db.set(target, JSON.stringify(elements))
                })
            })    
        })
    }

    delete(target: string, id: id, callback?: callback) {
        this.connect(db => {
            db.get(target, (error: any, result: any) => {
                if (error) throw error; if (callback) callback(error)
                const elements = JSON.parse(result)
                elements.splice(elements.indexOf(elements.find((obj: any) => obj.id === id)), 1)
    
                this.connect(db => {
                    db.on('error', (error: any) => { if (callback) callback(error); throw error })
                    db.set(target, JSON.stringify(elements))
                })
            })    
        })
    }
}
