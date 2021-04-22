require('dotenv').config({ path : './env' })

class DAO {
    constructor (db_path) {
        this.db_path = db_path
        if (this.constructor === DAO) throw new TypeError('Une Classe abstraite ne peut pas être instanciée')
    }

    /**
     * Cette méthode ouvre une connection entre l'objet et la BDD
     * @param {*} callback Traitement à effectuer
     */
    #connect(callback) {}

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
            
            db.collection(target).updateOne(query, new_values, function(err,res) {
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
    constructor(db_path) {
        super(db_path)
        this.sqlite = require('sqlite3')
    }

    #open() {
        this.db = new this.sqlite.Database(this.db_path)
    }

    seed(target, elements) {
        this.#open()

        this.db.serialize(() => {
            this.db.run(`DROP TABLE if exists ${target}`)

            const attributes = new Array
            elements.forEach((element) => {
                for (let attr in element) if (!attributes.includes(attr)) attributes.push(attr)
            })

            const seed = new Array
            attributes.forEach((attr, i) => {
                seed.push(`${attr} TEXT`)
            })

            this.db.run(`CREATE TABLE if not exists ${target} (id INTEGER PRIMARY KEY AUTOINCREMENT,${seed.join(',')})`)
            
            elements.forEach((element) => {
                let values = new Array
                attributes.forEach((attr) => {
                    values.push(`'${JSON.stringify(element[attr])}'`)
                })

                this.db.run(`INSERT INTO ${target} (${attributes.join(',')}) values(${values.join(',')})`)
            })
        })

        this.db.close()
    }

    create(target, element) {
        this.#open()

        this.db.serialize(() => {
            const attributes = new Array
            for (let attr in element) attributes.push(attr)

            const values = new Array
            attributes.forEach((attr) => {
                values.push(`'${JSON.stringify(element[attr])}'`
                )
            })

            this.db.run(`INSERT INTO ${target} (${attributes.join(',')}) values(${values.join(',')})`)
        })

        this.db.close()
    }

    getAll(target, callback) {
        this.#open()

        this.db.serialize(() => {
            this.db.all(`SELECT * FROM ${target}`, (err, results) => {
                results.forEach((result) => {
                    for (let attr in result) result[attr] = JSON.parse(result[attr])
                })
                callback(results)
            })
        })

        this.db.close()
    }

    getById(target, id, callback) {
        this.#open()

        this.db.serialize(() => {
            this.db.get(`SELECT * FROM ${target} WHERE id = ${id}`, (err, result) => {
                for (let attr in result) result[attr] = JSON.parse(result[attr])
                callback(result)
            })
        })

        this.db.close()
    }

    update(target, element) {
        this.#open()

        this.db.serialize(() => {
            const update = new Array
            for (let attr in element) update.push(`${attr} = '${JSON.stringify(element[attr])}'`)

            this.db.run(`UPDATE ${target} SET ${update.join(', ')} WHERE id = ${element.id}`,)
        })

        this.db.close()
    }

    delete(target, id) {
        this.#open()

        this.db.serialize(() => {
            this.db.run(`DELETE FROM ${target} WHERE id = ${id}`)
        })

        this.db.close()
    }
}

exports.Redis = class Redis extends DAO {
    #Redis

    constructor(db_path) {
        super(db_path)
        this.#Redis = require('redis')
    }

    #connect(callback) {
        this.db = this.#Redis.createClient(this.db_path)
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
