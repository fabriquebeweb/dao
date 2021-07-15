declare type id = number | string;
declare type callback = (...arg: any) => void;
declare type dataElement = {
    id?: id;
    _id?: id;
    [key: string]: any;
};
interface DAO {
    path: string;
    seed: (target: string, elements: dataElement[], callback?: callback) => void;
    create: (target: string, element: dataElement, callback?: callback) => void;
    getAll: (target: string, callback: callback) => void;
    getById: (target: string, id: id, callback: callback) => void;
    update: (target: string, element: dataElement, callback?: callback) => void;
    delete: (target: string, id: id, callback?: callback) => void;
}
