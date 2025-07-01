const express = require('express');
const { Kafka } = require('kafkajs');

const PORT = process.env.PORT || 8082;
const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');

const kafka = new Kafka({ brokers: KAFKA_BROKERS });
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'cinemaabyss-group' });

const app = express();
app.use(express.json());

const TOPICS = {
    movie: "movie-events",
    user: "user-events",
    payment: "payment-events"
};

// ←——— ВНИМАНИЕ! Вот этот путь ждёт постман!!! ———→
app.get('/api/events/health', (req, res) => {
    res.status(200).json({ status: true });
});

['movie', 'user', 'payment'].forEach(type => {
    app.post(`/api/events/${type}`, async (req, res) => {
        const payload = { type, data: req.body, timestamp: Date.now() };
        try {
            await producer.send({
                topic: TOPICS[type],
                messages: [{ key: type, value: JSON.stringify(payload) }]
            });
            console.log(`Produced EVENT (${type}): ${JSON.stringify(payload)}`);
            res.status(201).json({ status: "success", payload });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });
});

const run = async () => {
    await producer.connect();
    await consumer.connect();
    await Promise.all(Object.values(TOPICS).map(topic => consumer.subscribe({ topic, fromBeginning: true })));
    consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const val = message.value.toString();
            console.log(`Consumed EVENT [${topic}]:`, val);
        }
    });
    app.listen(PORT, () => console.log(`Events service listening on :${PORT}`));
};

run().catch(e => {
    console.error("Kafka error!", e);
    process.exit(1);
});
