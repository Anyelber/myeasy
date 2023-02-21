require("dotenv").config();
const db = require("mysql");

let con = db.createConnection({
  host: process.env.MYEASY_HOST,
  user: process.env.MYEASY_USER,
  password: process.env.MYEASY_PASSWORD,
  database: process.env.MYEASY_DATABASE,
});

class MyEasy {
  andors = [];
  joins = [];
  camps = [];
  limit = "";
  dist = "";
  ob = "";

  constructor(_table, _fillable) {
    this.table = _table;
    this.fillable = _fillable;
  }

  distinct = () => {
    this.dist = "DISTINCT";
    return this;
  };

  get = () => {
    return new Promise((resolve, reject) => {
      let select = this.table + ".*";
      if (this.camps.length > 0) {
        select = this.camps.join(",");
      }

      let andorsWhere = "";

      if (this.andors.length >= 0) {
        andorsWhere = "WHERE";
      }

      this.query = `SELECT ${this.dist} ${select} FROM ${this.table}`;
      this.query += ` ${this.joins.join(" ")} ${andorsWhere} ${this.andors.join(
        "AND"
      )} ${this.ob} ${this.limit}`;

      con.query(this.query, this.params, (err, results) => {
        if (err) {
          reject(err);
        }
        resolve(results);
      });
    });
  };

  first = () => {
    return new Promise((resolve, reject) => {
      let select = this.table + ".*";
      if (this.camps.length > 0) {
        select = this.camps.join(",");
      }

      let andorsWhere = "";

      if (this.andors.length >= 0) {
        andorsWhere = "WHERE";
      }

      this.query = `SELECT ${this.dist} ${select} FROM ${this.table}`;
      this.query += ` ${this.joins.join(" ")} ${andorsWhere} ${this.andors.join(
        "AND"
      )} ${this.ob} LIMIT 1`;

      con.query(this.query, this.params, (err, results) => {
        if (err) {
          reject(err);
        }
        resolve(results);
      });
    });
  };

  count = () => {
    return new Promise((resolve, reject) => {
      let andorsWhere = "";

      if (this.andors.length >= 0) {
        andorsWhere = "WHERE";
      }
      let select = "count(*) as count";
      this.query = `SELECT ${this.dist} ${select} FROM ${this.table}`;
      this.query += ` ${this.joins.join(" ")} ${andorsWhere} ${this.andors.join(
        "AND"
      )} ${this.ob} ${this.limit}`;

      con.query(this.query, this.params, (err, results) => {
        if (err) {
          reject(err);
        }

        console.log(results);

        resolve(results["count"]);
      });
    });
  };

  create = (obj) => {
    return new Promise((resolve, reject) => {
      let cols = [];
      let vals = [];
      let signs = [];

      for (let col in obj) {
        cols.push(col);
        vals.push(obj[col]);
        signs.push("?");
      }

      this.params = vals;
      this.query = `INSERT INTO ${this.table} (${cols.join(
        ","
      )}) VALUES (${signs.join(",")})`;

      con.query(this.query, this.params, (err, results) => {
        if (err) {
          reject(err);
        }
        resolve(results);
      });
    });
  };

  update = (obj) => {
    return new Promise((resolve, reject) => {
      let cols = [];
      let vals = [];

      for (let col in obj) {
        cols.push(col + " = ?");
        vals.push(obj[col]);
      }

      this.params = vals;
      this.query = `UPDATE ${this.table} SET ${cols.join(",")} WHERE ${
        this.andors
      }`;

      con.query(this.query, this.params, (err, results) => {
        if (err) {
          reject(err);
        }
        resolve(results);
      });
    });
  };

  pluck = (row) => {
    return new Promise((resolve, reject) => {
      let result = [];
      let select = this.table + "." + row;
      this.query = `SELECT ${this.dist} ${select} FROM ${this.table}`;
      if (this.andors.length > 0) {
        this.query += ` ${this.joins.join(" ")} WHERE ${this.andors.join(
          "AND"
        )}`;
      } else {
        this.query += ` ${this.joins.join(" ")}`;
      }

      con.query(this.query, this.params, (err, results) => {
        if (err) {
          reject(err);
        }

        results.forEach((e) => {
          result.push(e[row]);
        });

        resolve(result);
      });
    });
  };

  where = (row, cond, val) => {
    let operators = ["=", "!=", "<", ">", ">=", "<="];
    if (operators.includes(cond)) {
      this.andors.push(`${row} ${cond} '${val}'`);
    } else {
      this.andors.push(`${row} = '${cond}'`);
    }
    return this;
  };

  whereIn = (row, array) => {
    this.andors.push(`${row} IN (${array.join(",")})`);
    return this;
  };

  whereNotIn = (row, array) => {
    this.andors.push(`${row} NOT IN (${array.join(",")})`);
    return this;
  };

  whereBetween = (row, array) => {
    this.andors.push(`${row} BETWEEN '${array[0]}' AND '${array[1]}'`);
    return this;
  };

  join = (table, tableRow1, cond, tableRow2) => {
    this.tableJoin = table;
    this.joins.push(`INNER JOIN ${table} ON ${tableRow1} ${cond} ${tableRow2}`);
    return this;
  };

  take = (cant) => {
    this.limit = `LIMIT ${cant}`;
    return this;
  };

  orderBy = (col, type) => {
    this.ob = `ORDER BY ${col} ${type}`;
    return this;
  };

  leftJoin = (table, tableRow1, cond, tableRow2) => {
    this.tableJoin = table;
    this.joins.push(`LEFT JOIN ${table} ON ${tableRow1} ${cond} ${tableRow2}`);
    return this;
  };

  rightJoin = (table, tableRow1, cond, tableRow2) => {
    this.tableJoin = table;
    this.joins.push(`RIGHT JOIN ${table} ON ${tableRow1} ${cond} ${tableRow2}`);
    return this;
  };

  select = (...camps) => {
    camps.forEach((e) => {
      this.camps.push(this.table + "." + e);
    });
    return this;
  };

  selectJoin = (...camps) => {
    camps.forEach((e) => {
      this.camps.push(this.tableJoin + "." + e);
    });
    return this;
  };

  hasOne = (model, col_model, col_this) => {
    return new Promise((resolve, reject) => {
      let mod = new model();

      let table = mod.getTable();

      this.first()
        .then((res) => {
          let query = `SELECT a.* FROM ${table} a, ${
            this.table
          } b WHERE ${this.andors.map((e) => `b.${e} AND`)} a.${col_model} = ${
            res[0][col_this]
          } LIMIT 1`;

          con.query(query, (err, result) => {
            if (err) {
              reject(err);
            }

            resolve(result);
          });
        })
        .catch((err) => {
          throw new Error(err);
        });
    });
  };

  hasMany = (model, col_model, col_this) => {
    return new Promise((resolve, reject) => {
      let mod = new model();

      let table = mod.getTable();

      this.first()
        .then((res) => {
          let query = `SELECT a.* FROM ${table} a, ${
            this.table
          } b WHERE ${this.andors.map((e) => `b.${e} AND`)} a.${col_model} = ${
            res[0][col_this]
          }`;

          con.query(query, (err, result) => {
            if (err) {
              reject(err);
            }

            resolve(result);
          });
        })
        .catch((err) => {
          throw new Error(err);
        });
    });
  };
}

module.exports = MyEasy;
