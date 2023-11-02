const backup = require("./modules/backup");
const sync = require("./modules/sync");

const flags = {
    dbBackup: process.env.DB_BACKUP === 'true',
    dbSync: process.env.DB_SYNC === 'true',
};

const args = process.argv.slice(2);

// build object with --db-backup=bool and --db-sync=bool to {dbBackup: bool, dbSync: bool}
// this will override the env variables
args.forEach(arg => {
    if (arg.startsWith('--')) {
        arg = arg.split('=');
        if (arg.length === 1) {
            arg.push('true');
        }
        const flagName = arg[0].replace(/^--/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        flags[flagName] = arg[1] !== 'false';
    }
});
// console.log(flags)

if (!flags.dbBackup && !flags.dbSync) {
    console.log('No flags set.');
    console.log('Usage: node app.js --db-backup=[true|false] --db-sync=[true|false]');
    console.log('You can also set the environment variables DB_BACKUP and DB_SYNC to true or false');
    process.exit(0);
}

async function main(){
    if (flags.dbBackup) {
        console.log('Running DB Backup');
        await backup.run();
    }
    if (flags.dbSync) {
        console.log('Running DB Sync');
        await sync.run();
    }
}
main()
.then(() => process.exit(0))
.catch(error => {
    console.error(error);
    process.exit(1);
});