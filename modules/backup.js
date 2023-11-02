const { exec } = require('child_process');

const schema = {

    source: {
        host: process.env.MYSQL_SOURCE_HOST,
        user: process.env.MYSQL_SOURCE_USER,
        password: process.env.MYSQL_SOURCE_PASSWORD,
        database: process.env.MYSQL_DATABASE,
    },

    target: {
        host: process.env.MYSQL_TARGET_HOST,
        user: process.env.MYSQL_TARGET_USER,
        password: process.env.MYSQL_TARGET_PASSWORD,
        database: process.env.MYSQL_DATABASE,
    },

    // run mysql dump on source database
    export: function({ host, user, password, database }) {
        return new Promise((resolve, reject) => {
            const command = `mysqldump -h"${ host }" -u"${ user }" -p"${ password }" "${ database }" > backup.sql`;

            console.log('Exporting database...');
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Export failed: ${error.message}`);
                    reject(error);
                } else {
                    console.log('Export complete');
                    resolve();
                }
            });
        });
    },
    // import mysql dump into target database
    import: function({ host, user, password, database }) {
        return new Promise((resolve, reject) => {
            const command = `mysql -h"${ host }" -u"${ user }" -p"${ password }" "${ database }" < backup.sql`;

            console.log('Importing database...');
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Import failed: ${error.message}`);
                    reject(error);
                } else {
                    console.log('Import complete');
                    resolve();
                }
            });
        });
    },
    run: async function() {
        await this.export(this.source);
        await this.import(this.target);

        // remove backup file
        exec('rm backup.sql');
    },
}

module.exports = schema;