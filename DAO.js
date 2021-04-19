require('dotenv').config({ path : './env' })

class DAO {
    constructor () {
    }
}

exports.MongoDB = class MongoDB extends DAO {
    constructor() {
        super()
    }
}

exports.SQLite = class SQLite extends DAO {
    constructor() {
        super()
    }
}