require('dotenv').config({ path : './env' })

class DAO {
    #dbFile;

    constructor (dbPath) {
        this.#dbFile = dbPath;
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
    constructor(dbPath) {
        super(dbPath)
    }
}

exports.SQLite = class SQLite extends DAO {
    constructor(dbPath) {
        super(dbPath)
    }
}