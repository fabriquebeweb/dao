import { DAO, Callback, DataElement } from './dao'
import { Database } from 'sqlite3'

/**
 * SQLite DAO
 * @constructor ???
 * @seed Boot/Reboot a table and insert a list of elements
 * @getOne Retrieve one element from a table
 * @getAll Retrieve all elements from a table
 * @setOne Insert an element into a table
 * @setMany Insert a list of elements into a table
 * @updateOne Update one element from a table
 * @deleteOne Delete one element from a table
 * @deleteAll Delete all elements from a table
 */
export default class SQLite implements DAO
{

    // #db: any
    #path: string

    /**
     * ???
     * @param path Absolute/Relative Path to access the database ("../db.sqlite")
     */
    constructor(path: string)
    {
        this.#path = path
    }

    #connect(callback: Callback) : void
    {
        const db = new Database(this.#path)
        callback(db)
        db.close()
    }

    seed(target: string, elements: DataElement[], callback?: Callback) : void
    {
        this.#connect(db => {
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

    getOne(target: string, id: number|string, callback: Callback) : void
    {
        this.#connect(db => {
            db.serialize(() => {
                db.get(`SELECT * FROM ${target} WHERE id = ${id}`, (error: any, result: DataElement) => {
                    if (error) throw error
                    for (let attribute in result) result[attribute] = JSON.parse(result[attribute])
                    callback(result)
                })
            })    
        })
    }

    getAll(target: string, callback: Callback) : void
    {
        this.#connect(db => {
            db.serialize(() => {
                db.all(`SELECT * FROM ${target}`, (error: any, results: DataElement[]) => {
                    if (error) throw error
                    results.forEach(result => {
                        for (let attribute in result) result[attribute] = JSON.parse(result[attribute])
                    })
                    callback(results)
                })
            })
        })
    }

    setOne(target: string, element: DataElement, callback?: Callback) : void
    {
        this.#connect(db => {
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

    setMany(target: string, element: DataElement, callback?: Callback) : void
    {
        // this.#connect(db => {
        //     db.serialize(() => {
        //         const attributes = new Array
        //         for (let attribute in element) attributes.push(attribute)
    
        //         const values = new Array
        //         attributes.forEach(attribute => values.push(`'${JSON.stringify(element[attribute])}'`))
    
        //         db.run(
        //             `INSERT INTO ${target} (${attributes.join(',')}) VALUES (${values.join(',')})`,
        //             (error: any) => { if (error) throw error; if (callback) callback(error) }
        //         )
        //     })    
        // })
    }

    updateOne(target: string, element: DataElement, callback?: Callback) : void
    {
        this.#connect(db => {
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

    deleteOne(target: string, id: number|string, callback?: Callback) : void
    {
        this.#connect(db => {
            db.serialize(() => {
                db.run(
                    `DELETE FROM ${target} WHERE id = ${id}`,
                    (error: any) => { if (error) throw error; if (callback) callback(error) }
                )
            })
        })
    }

    deleteAll(target: string, callback?: Callback) : void
    {
        // this.#connect(db => {
        //     db.serialize(() => {
        //         db.run(
        //             `DELETE FROM ${target} WHERE id = ${id}`,
        //             (error: any) => { if (error) throw error; if (callback) callback(error) }
        //         )
        //     })
        // })
    }

}

export { SQLite, DAO, Callback, DataElement }