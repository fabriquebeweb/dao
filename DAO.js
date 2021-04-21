const { ObjectID } = require('bson')

require('dotenv').config({ path : './env' })

class DAO {
    #db_file

    constructor (db_path) {
        this.#db_file = db_path
    }

    /**
     * Cette méthode ouvre une connection entre l'objet et la BDD
     */
    #openDB(){

    }

    /**
     * Cette méthode ferme la connection entre l'objet et la BDD
     */
    #closeDB(){

    }

    /**
     * Récupère tout les éléments d'une table/collection
     * @param {*} target La table/collection à récupérer
     * @param {*} callback Le traitement a effectuer sur la donnée
     */
    getAll(target, callback){

    }

    /**
     * Récupère un élément d'une table/collection par son ID
     * @param {*} target La table/collection dans laquelle récuperer l'élément
     * @param {*} id L'ID de l'élément a récupérer
     * @param {*} callback Le traitement a effectuer sur l'élément
     */
    getById(target, id, callback){

    }

    /**
     * Inssèrt un élément dans une table/collection
     * @param {*} target La table/collection dans laquelle insérer l'élément
     * @param {*} element L'élément a insérer
     * @param {*} callback Traitement à effectuer sur le message d'erreur (facultatif)
     */
    create(target, element, callback){

    }

    /**
     * Met à a jour un élément dans une table/collection
     * @param {*} target La table/collection de l'élément a mettre à jour
     * @param {*} element L'élément à mettre a jour
     * @param {*} callback Traitement à effectuer sur le message d'erreur (facultatif)
     */
    update(target, element, callback){

    }

    /**
     * Supprime un élément d'une table/collection
     * @param {*} target La table/collection dans laquelle supprimer l'élément
     * @param {*} id L'id de l'élément a a supprimer
     * @param {*} callback Traitement à effectuer sur le message d'erreur (facultatif)
     */
    delete(target, id, callback){

    }
}

exports.MongoDB = class MongoDB extends DAO {
    #MongoClient
    #db_file

    constructor(db_path) {
        super(db_path)
        this.#db_file = db_path
        this.#MongoClient = require('mongodb').MongoClient
    }

    getAll(target, callback){
        let mc = this.#MongoClient;
        let db_path = this.#db_file;

        mc.connect(db_path, function(err, client) {
        let db = client.db();

        db.collection(target).find().toArray(function(err,docs){
            callback(docs);
        });
        
        client.close();
        })
    }

    getById(target, id, callback){
        let mc = this.#MongoClient;
        let db_path = this.#db_file;

        mc.connect(db_path, function(err, client) {
           let db = client.db();

           db.collection(target).findOne({ "_id" : ObjectID(id) }, function(err, doc) {
            callback(doc);
           })

           client.close();
        })
    }

    create(target, element, callback){
        let mc = this.#MongoClient;
        let db_path = this.#db_file;

        mc.connect(db_path, function(err, client) {
           let db = client.db();

           db.collection(target).insertOne(element);

           client.close();
        })
    }

    update(target, element, callback){

    }

    delete(target, id, callback){
        let mc = this.#MongoClient;
        let db_path = this.#db_file;

        mc.connect(db_path, function(err, client) {
            let db = client.db();
            db.collection(target).deleteOne({ "_id" : ObjectID(id) }, function (err, collection) {
            });
            client.close();
        })
    }
}


exports.SQLite = class SQLite extends DAO {
    constructor(db_path) {
        super(db_path)
        this.sqlite = require('sqlite3').verbose()
    }

    openDB() {
        this.db = new sqlite.Database(':memory:')
    }
}
