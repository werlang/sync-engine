const Database = require('../core/database');
const Redis = require('../core/redis');

const sync = {

    lastId: '0',
    messagesRead: 0,
    messageInterval: null,
    errorList: [],
    lastMessageTime: 0,

    connect: async function() {
        try {
            this.db = await new Database({
                host: process.env.MYSQL_TARGET_HOST,
                user: process.env.MYSQL_TARGET_USER,
                password: process.env.MYSQL_TARGET_PASSWORD,
                database: process.env.MYSQL_DATABASE,
            });
            console.log('Connected to MySQL instances');
        } catch (err) {
            console.error('MySQL error:', err);
        }

        try {
            this.redisClient = await new Redis({ host: 'redis' });
            console.log('Connected to Redis');
        }
        catch (err) {
            console.error('Redis error:', err);
        }

    },

    run: async function () {
        await this.connect();

        await this.db.setKeyChecks(false);
        await this.processStream();
        await this.db.setKeyChecks(true);
    },
    
    // Process the stream
    processStream: async function() {
        const streamName = 'maxwell';
        const batchSize = 100;

        // check if interval already exists
        if (!this.messageInterval) {
            this.messageInterval = setInterval(() => {
                const seconds = Math.floor((Date.now() - this.lastMessageTime) / 1000);
                console.log(`Processed ${ this.messagesRead } messages. ${ seconds } seconds without new messages.`);
            }, 1000);
        }

        // console.log(`Processing new batch...`);
        try {
            const stream = await this.redisClient.createStream(streamName, batchSize);
            const batch = await stream.getBatch();
    
            if (batch !== false) {
                this.lastMessageTime = Date.now();

                for (const message of batch.messages) {
                    // Process the message data as needed
                    // console.log(`Received message with ID ${message.id}: ${JSON.stringify(message.data)}`);
                    try {
                        await this.processMessage(message.data);
                    }
                    catch (error) {
                        console.log(error.message)
                        this.errorList.push(error.message);
                    }
        
                    // Acknowledge the message
                    await stream.ackMessage(batch.stream, message.id);
                }
    
                this.messagesRead += batch.messages.length;
            }

            // Process the next batch
            await this.processStream();
        }
        catch (error) {
            console.error('Error processing stream messages:', error);
        }
    },

    // Process the message
    processMessage: async function({ database, table, data, type }) {
        try {
            // Handle standard messages (INSERT, UPDATE, DELETE)
            if (type === 'insert') {
                await this.db.insert({ database, table, data });
                // console.log('Inserted data:', { table, data });
            }
            else if (type === 'update') {
                await this.db.update({ database, table, where: { id: data.id }, data });
                // console.log('Updated data:', { table, data });
            }
            else if (type === 'delete') {
                await this.db.delete({ database, table, where: { id: data.id } });
                // console.log('Deleted data:', { table, data });
            }
            else {
                // Handle unknown message types (if needed)
                console.log(`Received unknown message type: ${ type }`);
            }
        }
        catch (error) {
            // console.error('Error processing message:', error);
            throw error;
        }
    },

};

module.exports = sync;