import { ObjectId } from 'mongodb'

/**
 * DAO Interface
 * @seed Boot/Reboot a table, collection, or key and insert a list of elements
 * @getOne Retrieve one element from a table, collection, or key
 * @getAll Retrieve all elements from a table, collection, or key
 * @setOne Insert an element into a table, collection, or key
 * @setMany Insert a list of elements into a table, collection, or key
 * @updateOne Update one element from a table, collection, or key
 * @deleteOne Delete one element from a table, collection, or key
 * @deleteAll Delete all elements from a table, collection, or key
 */
export interface DAO
{

    /**
     * Boot/Reboot a table, collection, or key and insert a list of elements
     * @param target Name of the target table, collection, or key
     * @param elements List of elements to insert
     * @param callback Process to execute on response (optional)
     */
    seed: (target: string, elements: DataElement[], callback?: Callback) => void

    /**
     * Retrieve one element from a table, collection, or key
     * @param target Name of the target table, collection, or key
     * @param id Target element's ID
     * @param callback Process to execute on response's element or error
     */
    getOne: (target: string, id: number|string, callback: Callback) => void

    /**
     * Retrieve all elements from a table, collection, or key
     * @param target Name of the target table, collection, or key
     * @param callback Process to execute on response's list of elements or error
     */
    getAll: (target: string, callback: Callback) => void

    /**
     * Insert an element into a table, collection, or key
     * @param target Name of the target table, collection, or key
     * @param element Element to insert
     * @param callback Process to execute on response (optional)
     */
    setOne: (target: string, element: DataElement, callback?: Callback) => void

     /**
     * Insert a list of elements into a table, collection, or key
     * @param target Name of the target table, collection, or key
     * @param elements List of elements to insert
     * @param callback Process to execute on response (optional)
     */
    setMany: (target: string, elements: DataElement[], callback?: Callback) => void

    /**
     * Update one element from a table, collection, or key
     * @param target Name of the target table, collection, or key
     * @param element Updated element
     * @param callback Process to execute on response (optional)
     */
    updateOne: (target: string, element: DataElement, callback?: Callback) => void

    /**
     * Delete one element from a table, collection, or key
     * @param target Name of the target table, collection, or key
     * @param id Target element's ID
     * @param callback Process to execute on response (optional)
     */
    deleteOne: (target: string, id: number|string, callback?: Callback) => void

    /**
     * Delete all elements from a table, collection, or key
     * @param target Name of the target table, collection, or key
     * @param callback Process to execute on response (optional)
     */
    deleteAll: (target: string, callback?: Callback) => void

}

/** Standard DAO Connector type */
export type Connector = {
    driver: string,
    user: string,
    password: string,
    host: string,
    port?: number|string,
    database: string,
    params?: ConnectorParams
}

/** Standard DAO Connector parameters type */
export type ConnectorParams = {
    [key: string]: any
}

/** Standard DAO DataElement type */
export type DataElement = {
    id?: number|string,
    _id?: ObjectId|string,
    [key: string]: any
}

/** Standard DAO Callback type */
export type Callback = (...arg: any) => void

// export { DAO, Callback, DataElement, Connection }