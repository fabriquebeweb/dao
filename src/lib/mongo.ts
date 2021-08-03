import { DAO, Callback, DataElement, Connector, ConnectorParams } from './dao'
import { MongoClient } from 'mongodb'
import { ObjectID } from 'bson'

/**
 * MongoDB DAO
 * @constructor ???
 * @seed Boot/Reboot a collection and insert a list of elements
 * @getOne Retrieve one element from a collection
 * @getAll Retrieve all elements from a collection
 * @setOne Insert an element into a collection
 * @setMany Insert a list of elements into a collection
 * @updateOne Update one element from a collection
 * @deleteOne Delete one element from a collection
 * @deleteAll Delete all elements from a collection
 */
export default class Mongo implements DAO
{

    #db: string
    #uri: string

    /**
     * ???
     * @param obj Database Connector object : { driver, user, password, host, port?, database, { params? } }
     */
    constructor(obj: Connector)
    {
        if (!this.#check(obj)) throw new Error('CONNECTION ERROR: Wrong or missing Parameters')
        this.#uri = this.#parse(obj)
        this.#db = obj.database
    }

    async #connect(callback: Callback) : Promise<void>
    {
        const client = await MongoClient.connect(this.#uri)
        await callback(client.db(this.#db))
        client.close()
    }
    
    seed(target: string, elements: DataElement[], callback?: Callback) : void
    {
        this.#connect(async db => {
            const resultDel = await db.collection(target).deleteMany({ })
            const resultSet = await db.collection(target).insertMany(elements)
            if (callback) callback((resultDel && resultSet) ? true : false)
        })
    }

    getOne(target: string, id: number|string, callback: Callback) : void
    {
        this.#connect(async db => {
            const element = await db.collection(target).findOne({ _id : new ObjectID(id) })
            callback(this.#sanitize(element))
        })
    }

    getAll(target: string, callback: Callback) : void
    {
        this.#connect(async db => {
            const elements = await db.collection(target).find().toArray()
            callback(elements.map(this.#sanitize))
        })
    }

    setOne(target: string, element: DataElement, callback?: Callback) : void
    {
        this.#connect(async db => {
            const result = await db.collection(target).insertOne(element)
            if (callback) callback(result.acknowledged)
        })
    }

    setMany(target: string, elements: DataElement[], callback?: Callback) : void
    {
        this.#connect(async db => {
            const result = await db.collection(target).insertMany(elements)
            if (callback) callback(result.insertedCount)
        })
    }

    updateOne(target: string, element: DataElement, callback?: Callback) : void
    {
        this.#connect(async db => {
            const result = await db.collection(target).replaceOne({ _id : new ObjectID(element.id)}, this.#sanitize(element))
            if (callback) callback(result.acknowledged)
        })
    }

    deleteOne(target: string, id: number|string, callback?: Callback) : void
    {
        this.#connect(async db => {
            const result = await db.collection(target).deleteOne({ _id : new ObjectID(id)})
            if (callback) callback(result.acknowledged)
        })
    }

    deleteAll(target: string, callback?: Callback) : void
    {
        this.#connect(async db => {
            const result = await db.collection(target).deleteMany({ })
            if (callback) callback(result.deletedCount)
        })
    }

    #sanitize(element: DataElement) : DataElement
    {
        if (element._id) { element.id = element._id.toString(); delete element._id } 
        else if (element.id) { element._id = new ObjectID(element.id); delete element.id }
        return element
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

export { Mongo, DAO, Callback, DataElement, Connector, ConnectorParams }