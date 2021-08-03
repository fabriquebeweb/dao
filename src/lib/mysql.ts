import { DAO, Callback, DataElement, Connector, ConnectorParams } from './dao'
import { ConnectionConfig, createConnection } from 'mysql'

/**
 * MySQL DAO
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
export default class MySQL implements DAO
{

    #db: string
    #uri: string
    #connector: ConnectionConfig

    /**
     * ???
     * @param obj Database Connector object : { driver, user, password, host, port?, database, { params? } }
     */
    constructor(obj: Connector)
    {
        if (!this.#check(obj)) throw new Error('CONNECTION ERROR: Wrong or missing Parameters')
        delete obj.params
        this.#connector = obj as ConnectionConfig
        this.#uri = this.#parse(obj)
        this.#db = obj.database
    }

    #connect(callback: Callback) : void
    {
        const db = createConnection(this.#connector)
        db.connect()
        callback(db)
        db.end()
    }

    seed(target: string, elements: DataElement[], callback?: Callback) : void
    {
        this.#connect(db => {
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

    getOne(target: string, id: number|string, callback: Callback) : void
    {
        this.#connect(db => {
            db.query(`SELECT * FROM ${target} WHERE id = ${id} LIMIT 1`, (error: any, rows: any) => {
                if (error) throw error
                let result = JSON.parse(JSON.stringify(rows[0]))
                for (let attribute in result) result[attribute] = JSON.parse(result[attribute])
                callback(result)
            })
        })
    }
    
    getAll(target: string, callback: Callback) : void
    {
        this.#connect(db => {
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

    setOne(target: string, element: DataElement, callback?: Callback)
    {
        this.#connect(db => {
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

    setMany(target: string, element: DataElement, callback?: Callback)
    {
        // this.#connect(db => {
        //     const attributes = new Array
        //     for (let attribute in element) attributes.push(attribute)

        //     const values = new Array
        //     attributes.forEach(attribute => values.push(`'${JSON.stringify(element[attribute])}'`))

        //     db.query(
        //         `INSERT INTO ${target} (${attributes.join(',')}) VALUES (${values.join(',')})`,
        //         (error: any, res: any) => { if (error) throw error; if (callback) callback(res) }
        //     )
        // })
    }

    updateOne(target: string, element: DataElement, callback?: Callback)
    {
        this.#connect(db => {
            const update = new Array
            for (let attribute in element) update.push(`${attribute} = '${JSON.stringify(element[attribute])}'`)
            db.query(
                `UPDATE ${target} SET ${update.join(', ')} WHERE id = ${element.id}`,
                (error: any, res: any) => { if (error) throw error; if (callback) callback(res) }
            )
        })
    }

    deleteOne(target: string, id: number|string, callback?: Callback)
    {
        this.#connect(db => {
            db.query(
                `DELETE FROM ${target} WHERE id = ${id}`,
                (error: any, res: any) => { if (error) throw error; if (callback) callback(res) }
            )
        })
    }

    deleteAll(target: string, callback?: Callback)
    {
        // this.#connect(db => {
        //     db.query(
        //         `DELETE FROM ${target} WHERE id = ${id}`,
        //         (error: any, res: any) => { if (error) throw error; if (callback) callback(res) }
        //     )
        // })
    }

    #check(obj: Connector) : boolean
    {
        return (obj.driver && obj.user && obj.password && obj.host && obj.database) ? true : false
    }

    #parse(obj: Connector) : string
    {
        const port: string = (obj.port) ? `:${obj.port}` : ''
        const params: string = (obj.params) ? `?${this.#params(obj.params)}` : ''

        return `${ obj.driver }://${ obj.user }:${ obj.password }@${ obj.host }${ port }/${ obj.database }${ params }`
    }

    #params(obj: ConnectorParams) : string
    {
        return Object.keys(obj).map(key => (obj) ? `${key}=${obj[key]}` : '').join('&')
    }

}

export { MySQL, DAO, Callback, DataElement, Connector, ConnectorParams }