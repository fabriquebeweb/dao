require('dotenv').config({ path : './env' })

class DAO {
    constructor (db_path) {
        this.db_path = db_path
        if (this.constructor === DAO) throw new TypeError('Une Classe abstraite ne peut pas être instanciée')
    }

    /**
     * Cette méthode ouvre une connection entre l'objet et la BDD
     */
    #open() {}

    /**
     * Inssèrt un élément dans une table/collection
     * @param {*} target La table/collection dans laquelle insérer l'élément
     * @param {*} element L'élément a insérer
     * @param {*} callback Traitement à effectuer sur le message d'erreur (facultatif)
     */
    create(target, element, callback) {}

    /**
     * Récupère tout les éléments d'une table/collection
     * @param {*} target La table/collection à récupérer
     * @param {*} callback Le traitement a effectuer sur la donnée
     */
    getAll(target, callback) {}

    /**
     * Récupère un élément d'une table/collection par son ID
     * @param {*} target La table/collection dans laquelle récuperer l'élément
     * @param {*} id L'ID de l'élément a récupérer
     * @param {*} callback Le traitement a effectuer sur l'élément
     */
    getById(target, id, callback) {}

    /**
     * Met à a jour un élément dans une table/collection
     * @param {*} target La table/collection de l'élément a mettre à jour
     * @param {*} element L'élément à mettre a jour
     * @param {*} callback Traitement à effectuer sur le message d'erreur (facultatif)
     */
    update(target, element, callback) {}

    /**
     * Supprime un élément d'une table/collection
     * @param {*} target La table/collection dans laquelle supprimer l'élément
     * @param {*} id L'id de l'élément a a supprimer
     * @param {*} callback Traitement à effectuer sur le message d'erreur (facultatif)
     */
    delete(target, id, callback) {}
}

exports.MongoDB = class MongoDB extends DAO {
    #MongoDB

    constructor(db_path) {
        super(db_path)
        this.#MongoDB = require('mongodb').MongoClient
    }

    #connect(callback) {
        this.#MongoDB.connect(this.db_path, function(error, client) {
            if (error) throw error
            callback(client.db())
            client.close()
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
                callback(docs)
            })
        })
    }

    getById(target, id, callback) {
        let { ObjectId } = require('bson');

        this.#connect(db => {
            db.collection(target).findOne({ "_id" : ObjectId(id) }, function(error, doc) {
                if (error) throw error
                callback(doc)
            })
        })
    }

    update(target,element,callback) {
        let { ObjectId } = require('bson')

        this.#connect(db => {
            let query = { "_id" : ObjectId(element._id)}
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
        let { ObjectId } = require('bson');

        this.#connect(db => {
            db.collection(target).deleteOne({ "_id" : ObjectId(id)}, function(error, res){
                if (error) throw error
                if (callback) callback(res)
            })
        })
    }
}


exports.SQLite = class SQLite extends DAO {
    #SQLite

    constructor(db_path) {
        super(db_path)
        this.#SQLite = require('sqlite3')
    }

    #connect(callback) {
        this.db = new this.#SQLite.Database(this.db_path)
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
