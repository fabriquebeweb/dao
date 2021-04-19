# UTILISATION
- Import de la librairie

`const DAO = require('./DAO')`

- Instantiation d'une nouvelle Base De Données

SQLite `const db = new DAO.SQLite()`

MongoDB `const db = new DAO.MongoDB()`

# CONVENTIONS
- 1 Feature = 1 Branche = 1 Merge Request
- Méthodes = camelCase
- Variable = snake_case
- Commit & Branches = EN
- Documentation = FR
- Requêtes SQL en majuscules