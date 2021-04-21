require('dotenv').config({ path : './env' })

class DAO {
    constructor (db_path) {
        this.db_path = db_path
        if (this.constructor === DAO) {
            throw new TypeError('Une Classe abstraite ne peut pas être instanciée')
        }
    }

    /**
     * Cette méthode ouvre une connection entre l'objet et la BDD
     */
    #open() {}

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
     * Inssèrt un élément dans une table/collection
     * @param {*} target La table/collection dans laquelle insérer l'élément
     * @param {*} element L'élément a insérer
     * @param {*} callback Traitement à effectuer sur le message d'erreur (facultatif)
     */
    create(target, element, callback) {}

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
                seed.push((typeof elements[0][attr] === 'string') ? `${attr} TEXT` : `${attr} INTEGER`)
            })
            this.db.run(`CREATE TABLE if not exists ${target} (id INTEGER PRIMARY KEY AUTOINCREMENT,${seed.join(',')})`)
            
            elements.forEach((element) => {
                let values = new Array
                attributes.forEach((attr) => {
                    values.push((typeof element[attr] === 'string') ? `'${element[attr]}'` : `${element[attr]}`)
                })
                this.db.run(`INSERT INTO ${target} (${attributes.join(',')}) values(${values.join(',')})`)
            })
        })
        this.db.close()
    }

    create(target, element) {
        this.#open()
        this.db.serialize(() => {
            const attributes = new Array; const values = new Array
            for (let attr in element) attributes.push(attr)
            attributes.forEach((attr) => {
                values.push((typeof element[attr] === 'string') ? `'${element[attr]}'` : `${element[attr]}`)
            })
            this.db.run(`INSERT INTO ${target} (${attributes.join(',')}) values(${values.join(',')})`)
        })
        this.db.close()
    }

    getAll(target, callback) {
        this.#open()
        this.db.serialize(() => {
            this.db.all(`SELECT * FROM ${target}`, (err, result) => {
                callback(result)
            })
        })
        this.db.close()
    }

    getById(target, id, callback) {
        this.#open()
        this.db.serialize(() => {
            this.db.get(`SELECT * FROM ${target} WHERE id = ${id}`, (err, result) => {
                callback(result)
            })
        })
        this.db.close()
    }

    update(target, element) {
        this.#open()
        this.db.serialize(() => {
            const update = new Array
            for (const attribute in element) update.push((typeof element[attribute] === 'string') ? `${attribute} = '${element[attribute]}'` : `${attribute} = ${element[attribute]}`)
            console.log(`UPDATE ${target} SET ${update.join(', ')} WHERE id = ${element.id}`)
            this.db.run(`UPDATE ${target} SET ${update.join(', ')} WHERE id = ${element.id}`, err => {
                console.log(err)
            })
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