# Sync Engine - Database Migration and Synchronization

Sync Engine is a tool designed for database migration and synchronization. It enables seamless and efficient data transfer between source and target databases, keeping them in sync with minimal downtime. This tool is inspired and uses the [Maxwell's Daemon tool](https://maxwells-daemon.io), which is a MySQL binlog processor.

## Features

- **Database Backup:** Create a backup of the source database to ensure data integrity during migration.
- **Real-time Synchronization:** Continuously synchronize data changes between source and target databases.
- **Efficient:** Minimize downtime and data loss by synchronizing in real-time.

## Getting Started

### Prerequisites

- Docker
- Mysql server running the source and target database.

### Installation

1. Create an environment file (`.env`) with your configuration:

```
# Source database configuration
MYSQL_SOURCE_HOST=<source_host>
MYSQL_SOURCE_USER=<source_user>
MYSQL_SOURCE_PASSWORD=<source_password>

# Target database configuration
MYSQL_TARGET_HOST=<target_host>
MYSQL_TARGET_USER=<target_user>
MYSQL_TARGET_PASSWORD=<target_password>

# Database will be the same for both source and target
MYSQL_DATABASE=<database>

# Docker's network name, in case the databases are running in a docker network
MYSQL_NETWORK=<network>

# true if you want to copy the source database to the target database. false will keep the target database as it is.
DB_BACKUP=<true|false>

# true if you want to synchronize the source database to the target database after the copy phase.
DB_SYNC=<true|false>
```

2. Build and run the containers using Docker Compose.

```bash
docker-compose up
```

This is what will happen:

- Maxwell tool will start saving to the redis server any write operations that happen in the source database.
- The source database will be dumped to a file.
- The target database will be created and the dump file will be imported.
- Then, the sync engine will start reading from the redis server and apply the changes to the target database. Any error message, such as duplicate key, will be logged to the console.
- The sync engine will keep running until you stop it.

## Migrating your database with zero downtime

1. Create the target MySQL server.
2. Write all config variables in the `.env` file.
3. Run the sync engine using Docker Compose.
4. Wait for the sync engine to finish the copy phase. It will take some time depending on the size of your database.
5. Watch the sync engine logs (`docker-compose logs -f app`) while it syncs all the changes that happened during the copy phase.
6. Switch your application to use the target database.
7. When the sync engine logs show enough time has passed without any changes, you can stop the sync engine and remove the containers.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Extending the tool

The tool is designed to be very simple and very easy to use by devs familiar with Docker. But it is in no way a complete solution. To be end-user friendly, a web interface could created abstracting the Docker and networking part. Get in touch if you are interested in extending the tool.