require('dotenv').config({ path : './env' })

class DAO {
    constructor (path) {
        this.path = path
        if (this.constructor === DAO) throw new TypeError('Abstract Classes cannot be instantiated')
    }

    /**
     * Cette méthode ouvre une connection entre l'objet et la BDD
     * @param {*} callback Traitement à effectuer après la connection à la BDD
     */
    #connect(callback) {}

    /**
     * Réinitialise une table/collection/clé
     * @param {*} target La table/collection/clé à réinitialiser
     * @param {*} elements Les éléments a insérer
     * @param {*} callback Traitement à effectuer sur le message d'erreur (facultatif)
     */
    seed(target, elements, callback) {}

    /**
     * Insère un élément dans une table/collection/clé
     * @param {*} target La table/collection/clé dans laquelle insérer l'élément
     * @param {*} element L'élément a insérer
     * @param {*} callback Traitement à effectuer sur le message d'erreur (facultatif)
     */
    create(target, element, callback) {}

    /**
     * Récupère tout les éléments d'une table/collection/clé
     * @param {*} target La table/collection/clé à récupérer
     * @param {*} callback Le traitement a effectuer sur la donnée
     */
    getAll(target, callback) {}

    /**
     * Récupère un élément d'une table/collection/clé par son ID
     * @param {*} target La table/collection/clé dans laquelle récuperer l'élément
     * @param {*} id L'ID de l'élément a récupérer
     * @param {*} callback Le traitement a effectuer sur l'élément
     */
    getById(target, id, callback) {}

    /**
     * Met à a jour un élément dans une table/collection/clé
     * @param {*} target La table/collection/clé de l'élément a mettre à jour
     * @param {*} element L'élément à mettre a jour
     * @param {*} callback Traitement à effectuer sur le message d'erreur (facultatif)
     */
    update(target, element, callback) {}

    /**
     * Supprime un élément d'une table/collection/clé
     * @param {*} target La table/collection/clé dans laquelle supprimer l'élément
     * @param {*} id L'ID de l'élément a a supprimer
     * @param {*} callback Traitement à effectuer sur le message d'erreur (facultatif)
     */
    delete(target, id, callback) {}
}

exports.MongoDB = class MongoDB extends DAO {
    #MongoDB

    constructor(path) {
        super(path)
        this.#MongoDB = require('mongodb').MongoClient
    }

    #connect(callback) {
        this.#MongoDB.connect(this.path, function(error, client) {
            const { ObjectId } = require('bson')
            if (error) throw error
            callback(client.db(), ObjectId)
            client.close()
        })
    }
    
    seed(target, elements, callback) {
        this.#connect(db => {
            db.collection(target).remove()
            elements.forEach((element) => {
                db.collection(target).insertOne(element, function(error, res){
                    if (error) throw error
                    if (callback) callback(res)
                })    
            })
        })
    }

    create(target, element, callback) {
        this.#connect(db => {
            db.collection(target).insertOne(element, function(error, res){
                if (error) throw error
                if (callback) callback(res)
            })
        })
    }

    getAll(target, callback) {
        this.#connect(db => {
            db.collection(target).find().toArray(function(error, docs) {
                if (error) throw error
                docs.forEach(doc => { doc.id = doc._id; delete doc._id })
                callback(docs)
            })
        })
    }

    getById(target, id, callback) {
        this.#connect((db, parse) => {
            db.collection(target).findOne({ "_id" : parse(id) }, function(error, doc) {
                if (error) throw error
                doc.id = doc._id; delete doc._id    
                callback(doc)
            })
        })
    }

    update(target, element, callback) {
        this.#connect((db, parse) => {
            element._id = element.id; delete element.id
            let query = { "_id" : parse(element._id)}
            let new_element = {}            
            new_element =  Object.assign(new_element, element)
            delete new_element["_id"]

            let new_values = {$set : new_element}
            
            db.collection(target).updateOne(query, new_values, function(error, res) {
                if(error) throw error
                if (callback) callback(res)
            })
        })
    }

    delete(target, id, callback){
        this.#connect((db, parse) => {
            db.collection(target).deleteOne({ "_id" : parse(id)}, function(error, res){
                if (error) throw error
                if (callback) callback(res)
            })
        })
    }
}

exports.SQLite = class SQLite extends DAO {
    #SQLite

    constructor(path) {
        super(path)
        this.#SQLite = require('sqlite3')
    }

    #connect(callback) {
        this.db = new this.#SQLite.Database(this.path)
        callback(this.db)
        this.db.close()
    }

    seed(target, elements) {
        this.#connect(db => {
            db.serialize(() => {
                db.run(
                    `DROP TABLE if exists ${target}`,
                    (error) => { if (error) throw error }
                )
    
                const attributes = new Array
                elements.forEach((element) => {
                    for (let attribute in element) if (!attributes.includes(attribute)) attributes.push(attribute)
                })
    
                const seed = ['']
                attributes.forEach(attribute => seed.push(`${attribute} TEXT`))

                db.run(
                    `CREATE TABLE if not exists ${target} (id INTEGER PRIMARY KEY AUTOINCREMENT${seed.join(',')})`,
                    (error) => { if (error) throw error }
                )
                
                elements.forEach((element) => {
                    let values = new Array
                    attributes.forEach(attribute => values.push(`'${JSON.stringify(element[attribute])}'`))
                    db.run(
                        `INSERT INTO ${target} (${attributes.join(',')}) values(${values.join(',')})`,
                        (error) => { if (error) throw error }
                    )
                })
            })    
        })
    }

    create(target, element) {
        this.#connect(db => {
            db.serialize(() => {
                const attributes = new Array
                for (let attribute in element) attributes.push(attribute)
    
                const values = new Array
                attributes.forEach(attribute => values.push(`'${JSON.stringify(element[attribute])}'`))
    
                db.run(
                    `INSERT INTO ${target} (${attributes.join(',')}) values(${values.join(',')})`,
                    (error) => { if (error) throw error }
                )
            })    
        })
    }

    getAll(target, callback) {
        this.#connect(db => {
            db.serialize(() => {
                db.all(`SELECT * FROM ${target}`, (error, results) => {
                    if (error) throw error
                    results.forEach(result => {
                        for (let attribute in result) result[attribute] = JSON.parse(result[attribute])
                    })
                    callback(results)
                })
            })
        })
    }

    getById(target, id, callback) {
        this.#connect(db => {
            db.serialize(() => {
                db.get(`SELECT * FROM ${target} WHERE id = ${id}`, (error, result) => {
                    if (error) throw error
                    for (let attribute in result) result[attribute] = JSON.parse(result[attribute])
                    callback(result)
                })
            })    
        })
    }

    update(target, element) {
        this.#connect(db => {
            db.serialize(() => {
                const update = new Array
                for (let attribute in element) update.push(`${attribute} = '${JSON.stringify(element[attribute])}'`)
                db.run(
                    `UPDATE ${target} SET ${update.join(', ')} WHERE id = ${element.id}`,
                    (error) => { if (error) throw error }
                )
            })    
        })
    }

    delete(target, id) {
        this.#connect(db => {
            db.serialize(() => {
                db.run(
                    `DELETE FROM ${target} WHERE id = ${id}`,
                    (error) => { if (error) throw error }
                )
            })
        })
    }
}

exports.Redis = class Redis extends DAO {
    #Redis

    constructor(path) {
        super(path)
        this.#Redis = require('redis')
    }

    #connect(callback) {
        this.db = this.#Redis.createClient(this.path)
        this.db.on('error', error => { throw error })
        callback(this.db)
        this.db.quit()
    }

    seed(target, elements) {
        this.#connect(db => {
            elements.forEach((element, i) => { element.id = i })
            db.set(target, JSON.stringify(elements))    
        })
    }

    create(target, element) {
        this.#connect(db => {
            db.get(target, (error, result) => {
                const elements = JSON.parse(result)
                element.id = Math.max(...elements.map(obj => obj.id)) + 1
                elements.push(element)

                this.#connect(db => db.set(target, JSON.stringify(elements)))
            })    
        })
    }

    getAll(target, callback) {
        this.#connect(db => {
            db.get(target, (error, result) => {
                callback(JSON.parse(result))
            })
        })
    }

    getById(target, id, callback) {
        this.#connect(db => {
            db.get(target, (error, result) => {
                callback(JSON.parse(result).find(obj => obj.id === id))
            })    
        })
    }

    update(target, element) {
        this.#connect(db => {
            db.get(target, (error, result) => {
                const elements = JSON.parse(result)
                let e = elements.find(obj => obj.id === element.id)
                elements[elements.indexOf(e)] = element
    
                this.#connect(db => db.set(target, JSON.stringify(elements)))
            })    
        })
    }

    delete(target, id) {
        this.#connect(db => {
            db.get(target, (error, result) => {
                const elements = JSON.parse(result)
                elements.splice(elements.indexOf(elements.find(obj => obj.id === id)), 1)
    
                this.#connect(db => db.set(target, JSON.stringify(elements)))
            })    
        })
    }
}
