
const mysql = require('mysql2/promise');

class Database {

    connected = false;

    constructor(config) {
        this.config = config;
    }

    async connect() {
        if (this.connected) return true;
        try {
            this.connection = await mysql.createConnection(this.config);
            this.connected = true;
            return true;
        } catch (error) {
            console.error('Error connecting to database:', error);
            return false;
        }
    }

    async insert({ database, table, data }) {
        if (!this.connected) await this.connect();

        database = database || this.config.database;
        const columns = Object.keys(data);
        const placeholders = columns.map(() => '?');
        const values = Object.values(data);
        
        try {
            const result = await this.connection.execute(`INSERT INTO ${database}.${table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`, values);
            return result.insertId;
        } catch (error) {
            // console.error('Error inserting data:', error);
            throw error;
        }
    }

    async select({ database, table, where, limit, offset, orderBy, fields }) {
        if (!this.connected) await this.connect();

        database = database || this.config.database;
        const limitClause = limit ? `LIMIT ${limit}` : '';
        const offsetClause = offset ? `OFFSET ${offset}` : '';
        const orderByClause = orderBy ? `ORDER BY ${orderBy}` : '';
        const fieldsClause = fields ? fields.join(', ') : '*';

        // format key-value into where clause
        let whereClause = '';
        let whereValues = [];
        if (where) {
            const whereKeys = Object.keys(where);
            whereValues = Object.values(where);
            const whereConditions = whereKeys.map(key => `${key} = ?`);
            whereClause = `WHERE ${whereConditions.join(' AND ')}`;
        }

        const query = `SELECT ${fieldsClause} FROM ${database}.${table} ${whereClause} ${orderByClause} ${limitClause} ${offsetClause}`;
        try {
            const [ rows ] = await this.connection.execute(query, whereValues);
            return rows;
        } catch (error) {
            // console.error('Error selecting data:', error);
            throw error;
        }
    }

    async update({ database, table, where, data }) {
        if (!this.connected) await this.connect();

        database = database || this.config.database;
        const columns = Object.keys(data);
        const placeholders = columns.map(key => `${key} = ?`);
        const values = Object.values(data);
        const whereKeys = Object.keys(where);
        const whereValues = Object.values(where);
        const whereConditions = whereKeys.map(key => `${key} = ?`);
        const query = `UPDATE ${database}.${table} SET ${placeholders.join(', ')} WHERE ${whereConditions.join(' AND ')}`;
        try {
            const result = await this.connection.execute(query, [...values, ...whereValues]);
            return result.affectedRows;
        } catch (error) {
            // console.error('Error updating data:', error);
            throw error;
        }
    }

    async delete({ database, table, where }) {
        if (!this.connected) await this.connect();

        database = database || this.config.database;
        const whereKeys = Object.keys(where);
        const whereValues = Object.values(where);
        const whereConditions = whereKeys.map(key => `${key} = ?`);
        const query = `DELETE FROM ${database}.${table} WHERE ${whereConditions.join(' AND ')}`;
        try {
            const result = await this.connection.execute(query, whereValues);
            return result.affectedRows;
        } catch (error) {
            // console.error('Error deleting data:', error);
            throw error;
        }
    }

    async setKeyChecks(enabled) {
        if (!this.connected) await this.connect();

        const value = enabled ? 1 : 0;
        try {
            await this.connection.execute(`SET FOREIGN_KEY_CHECKS = ${value}`);
            return true;
        } catch (error) {
            console.error('Error setting key checks:', error);
            throw error;
        }
    }

}

module.exports = Database;