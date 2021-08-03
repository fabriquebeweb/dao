import { DAO, Callback, DataElement, Connector } from './dao'
import { createClient, RedisClient } from 'redis'

/**
 * Redis DAO
 * @constructor ???
 * @seed Boot/Reboot a key and insert a list of elements
 * @getOne Retrieve one element from a key
 * @getAll Retrieve all elements from a key
 * @setOne Insert an element into a key
 * @setMany Insert a list of elements into a key
 * @updateOne Update one element from a key
 * @deleteOne Delete one element from a key
 * @deleteAll Delete all elements from a key
 */
export default class Redis implements DAO
{

    #db: RedisClient

    /**
     * ???
     * @param obj URI/Object to the database : "driver://user.pwd@host:port/db?params" / { driver, user, pwd, host, port, db, params }
     */
    constructor(path: string)
    {
        this.#db = createClient(path)
    }

    #connect(callback: Callback) : void
    {
        callback(this.#db)
        this.#db.quit()
    }

    seed(target: string, elements: DataElement[], callback?: Callback)
    {
        this.#connect(db => {
            db.on('error', (error: any) => { if (callback) callback(error); throw error })
            elements.forEach((element, i) => { element.id = i })
            db.set(target, JSON.stringify(elements))
        })
    }

    getOne(target: string, id: number|string, callback: Callback) : void
    {
        this.#connect(db => {
            db.get(target, (error: any, result: any) => {
                if (error) throw error; if (callback) callback(error)
                callback(JSON.parse(result).find((obj: any) => obj.id === id))
            })    
        })
    }

    getAll(target: string, callback: Callback) : void
    {
        this.#connect(db => {
            db.get(target, (error: any, result: any) => {
                if (error) throw error; if (callback) callback(error)
                callback(JSON.parse(result))
            })
        })
    }

    setOne(target: string, element: DataElement, callback?: Callback)
    {
        this.#connect(db => {
            db.get(target, (error: any, result: any) => {
                if (error) throw error; if (callback) callback(error)
                const elements = JSON.parse(result)
                element.id = Math.max(...elements.map((obj: any) => obj.id)) + 1
                elements.push(element)

                this.#connect(db => {
                    db.on('error', (error: any) => { if (callback) callback(error); throw error })
                    db.set(target, JSON.stringify(elements))
                })
            })    
        })
    }

    setMany(target: string, element: DataElement, callback?: Callback)
    {
        // this.#connect(db => {
        //     db.get(target, (error: any, result: any) => {
        //         if (error) throw error; if (callback) callback(error)
        //         const elements = JSON.parse(result)
        //         element.id = Math.max(...elements.map((obj: any) => obj.id)) + 1
        //         elements.push(element)

        //         this.#connect(db => {
        //             db.on('error', (error: any) => { if (callback) callback(error); throw error })
        //             db.set(target, JSON.stringify(elements))
        //         })
        //     })    
        // })
    }

    updateOne(target: string, element: DataElement, callback?: Callback)
    {
        this.#connect(db => {
            db.get(target, (error: any, result: any) => {
                if (error) throw error; if (callback) callback(error)
                const elements = JSON.parse(result)
                let e = elements.find((obj: any) => obj.id === element.id)
                elements[elements.indexOf(e)] = element
    
                this.#connect(db => {
                    db.on('error', (error: any) => { if (callback) callback(error); throw error })
                    db.set(target, JSON.stringify(elements))
                })
            })    
        })
    }

    deleteOne(target: string, id: number|string, callback?: Callback)
    {
        this.#connect(db => {
            db.get(target, (error: any, result: any) => {
                if (error) throw error; if (callback) callback(error)
                const elements = JSON.parse(result)
                elements.splice(elements.indexOf(elements.find((obj: any) => obj.id === id)), 1)
    
                this.#connect(db => {
                    db.on('error', (error: any) => { if (callback) callback(error); throw error })
                    db.set(target, JSON.stringify(elements))
                })
            })    
        })
    }

    deleteAll(target: string, callback?: Callback)
    {
        // this.#connect(db => {
        //     db.get(target, (error: any, result: any) => {
        //         if (error) throw error; if (callback) callback(error)
        //         const elements = JSON.parse(result)
        //         elements.splice(elements.indexOf(elements.find((obj: any) => obj.id === id)), 1)
    
        //         this.#connect(db => {
        //             db.on('error', (error: any) => { if (callback) callback(error); throw error })
        //             db.set(target, JSON.stringify(elements))
        //         })
        //     })    
        // })
    }

}

export { Redis, DAO, Callback, DataElement, Connector }