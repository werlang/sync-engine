const IORedis = require('ioredis');

class Stream {

    lastId = '0';

    constructor({ streamName, batchSize, redisCLient }) {
        this.streamName = streamName;
        this.batchSize = batchSize;
        this.redisCLient = redisCLient;
    }

    reset() {
        this.lastId = '0';
    }

    async getBatch() {
        const result = await this.redisCLient.connection.xread('BLOCK', this.redisCLient.timeout, 'COUNT', this.batchSize, 'STREAMS', this.streamName, this.lastId);

        if (!result) return false;

        
        const [stream, messages] = result[0];
        this.lastId = messages[messages.length - 1][0];

        return {
            stream,
            messages: messages.map(([id, data]) => ({ id, data: JSON.parse(data[1]) })),
        };
    }

    async ackMessage(stream, messageId) {
        await this.redisCLient.connection.xack(this.streamName, stream, messageId);
    }

}

class Redis {

    constructor(config) {
        this.config = config;
        this.timeout = config.timeout || 1000;
    }

    async connect() {
        if (this.connected) return true;
        this.connection = await new IORedis(this.config);
        this.connected = true;
        
        // Error handling
        this.connection.on('error', (err) => {
            console.error('Redis error:', err);
        });
        
        return true;
    }

    async createStream(streamName, batchSize) {
        if (!this.connected) await this.connect();

        this.streamList = this.streamList || {};
        if (this.streamList[streamName]) return this.streamList[streamName];

        this.streamList[streamName] = new Stream({
            streamName,
            batchSize,
            redisCLient: this,
        });
        return this.streamList[streamName];
    }
}

module.exports = Redis;
