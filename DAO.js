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
    #MongoClient

    constructor(db_path) {
        super(db_path)
        this.#MongoClient = require('mongodb').MongoClient
    }

    create(target, element, callback) {
        
        this.#MongoClient.connect(this.db_path, function(err, client) {
           if (err) throw err
           let db = client.db()

           db.collection(target).insertOne(element,function(err,res){
            if (err) throw err
            if (callback) callback(res)
           })

           client.close()
        })
    }

    getAll(target, callback) {
        
        this.#MongoClient.connect(this.db_path, function(err, client) {
            if (err) throw err
            let db = client.db()

            db.collection(target).find().toArray(function(err,docs) {
                if (err) throw err
                callback(docs)
            })
        
            client.close()
        })
    }

    getById(target, id, callback) {
        let { ObjectId } = require('bson');

        this.#MongoClient.connect(this.db_path, function(err, client) {
            if (err) throw err
           let db = client.db()

           db.collection(target).findOne({ "_id" : ObjectId(id) }, function(err, doc) {
            if (err) throw err
            callback(doc)
           })

           client.close()
        })
    }

    update(target,element,callback) {
        let {ObjectId} = require('bson')

        this.#MongoClient.connect(this.db_path, function(err, client) {
            if (err) throw err
            let db = client.db()
    
            let query = { "_id" : ObjectId(element._id)}
            let new_element = {}            
            new_element =  Object.assign(new_element, element)
            delete new_element["_id"]

            let new_values = {$set : new_element}
            
            db.collection(target).updateOne(query, new_values, function(err, res) {
                if(err) throw err
                if (callback) callback(res)
            })
    
           client.close()
        })
    }

    delete(target, id, callback){
        let { ObjectId } = require('bson');

        this.#MongoClient.connect(this.db_path, function(err, client) {
            if (err) throw err
            let db = client.db();
            db.collection(target).deleteOne({ "_id" : ObjectId(id)}, function(err,res){
                if (err) throw err
                if (callback) callback(res)
            })
            client.close();
        })
    }
}


exports.SQLite = class SQLite extends DAO {
    #SQLite

    constructor(db_path) {
        super(db_path)
        this.#SQLite = require('sqlite3')
    }

    #open() {
        this.db = new this.#SQLite.Database(this.db_path)
    }

    seed(target, elements) {
        this.#open()

        this.db.serialize(() => {
            this.db.run(
                `DROP TABLE if exists ${target}`,
                (error) => { if (error) throw error }
            )

            const attributes = new Array
            elements.forEach((element) => {
                for (let attribute in element) if (!attributes.includes(attribute)) attributes.push(attribute)
            })

            const seed = ['']
            attributes.forEach(attribute => seed.push(`${attribute} TEXT`))

            this.db.run(
                `CREATE TABLE if not exists ${target} (id INTEGER PRIMARY KEY AUTOINCREMENT${seed.join(',')})`,
                (error) => { if (error) throw error }
            )
            
            elements.forEach((element) => {
                let values = new Array
                attributes.forEach(attribute => values.push(`'${JSON.stringify(element[attribute])}'`))

                this.db.run(
                    `INSERT INTO ${target} (${attributes.join(',')}) values(${values.join(',')})`,
                    (error) => { if (error) throw error }
                )
            })
        })

        this.db.close()
    }

    create(target, element) {
        this.#open()

        this.db.serialize(() => {
            const attributes = new Array
            for (let attribute in element) attributes.push(attribute)

            const values = new Array
            attributes.forEach(attribute => values.push(`'${JSON.stringify(element[attribute])}'`))

            this.db.run(
                `INSERT INTO ${target} (${attributes.join(',')}) values(${values.join(',')})`,
                (error) => { if (error) throw error }
            )
        })

        this.db.close()
    }

    getAll(target, callback) {
        this.#open()

        this.db.serialize(() => {
            this.db.all(`SELECT * FROM ${target}`, (error, results) => {
                if (error) throw error
                results.forEach(result => {
                    for (let attribute in result) result[attribute] = JSON.parse(result[attribute])
                })
                callback(results)
            })
        })

        this.db.close()
    }

    getById(target, id, callback) {
        this.#open()

        this.db.serialize(() => {
            this.db.get(`SELECT * FROM ${target} WHERE id = ${id}`, (error, result) => {
                if (error) throw error
                for (let attribute in result) result[attribute] = JSON.parse(result[attribute])
                callback(result)
            })
        })

        this.db.close()
    }

    update(target, element) {
        this.#open()

        this.db.serialize(() => {
            const update = new Array
            for (let attribute in element) update.push(`${attribute} = '${JSON.stringify(element[attribute])}'`)

            this.db.run(
                `UPDATE ${target} SET ${update.join(', ')} WHERE id = ${element.id}`,
                (error) => { if (error) throw error }
            )
        })

        this.db.close()
    }

    delete(target, id) {
        this.#open()

        this.db.serialize(() => {
            this.db.run(
                `DELETE FROM ${target} WHERE id = ${id}`,
                (error) => { if (error) throw error }
            )
        })

        this.db.close()
    }
}
