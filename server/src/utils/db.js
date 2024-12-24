import {MongoClient} from "mongodb";


export class DBConnection {
    constructor() {
        this.connected = false;
        this.client = new MongoClient("mongodb+srv://BackEnd:N6fJjUYDXp8Bgppl@oatext.vcy18.mongodb.net/?retryWrites=true&w=majority&appName=OAText");
    }

    async connect() {
        if (this.connected) {
            console.warn("Already connected!");
        } else {
            await this.client.connect();
            this.db = this.client.db("OAText");
            this.connected = true;
        }
    }

    async disconnect() {
        await this.client.close();
        this.connected = false;
    }

    async assertConnect() {
        if (!this.connected) {
            console.warn("Not Connected!");
            await this.connect();
        }
    }

    async execute(func) {
        // await this.connect();
        await this.assertConnect();
        try {
            return await func();
        } catch (error) {
            console.error(error);
        } finally {
            // await this.disconnect();
        }
    }

    async post(type, data) {
        return await this.execute(async () => {
            const result = await this.db.collection(type).insertOne(data);
            return result.insertedId;
        });
    }

    async get(type, query) {
        return await this.execute(async () => {
            return await this.db.collection(type).findOne(query);
        });
    }

    async search(type, searchTerm) {
        return await this.execute(async () => {
            return await this.db.collection(type).find({ $text: { $search: `"${searchTerm}"` } });
        });
    }

    async put(type, query, newData) {
        return await this.execute(async () => {
            const result = await this.db.collection(type).updateOne(query, { $set: newData}, {upsert: true});
            return result.upsertedId;
        });
    }

    async count(type) {
        return await this.execute(async () => {
            return await this.db.collection(type).count();
        });
    }
}


async function test() {
    console.time('DBConnection');
    const db = new DBConnection();
    await db.connect();
    console.timeEnd('DBConnection');
    console.time('get');

    console.log(await db.get("users", {id: 0}))
    console.log(await db.get("users", {id: 0}))
    console.log(await db.get("users", {id: 0}))
    console.log(await db.put("users", {id: 1}, {password: "hello world", nameLast: "Wan"}))
    console.log(await db.count("users"))
    console.timeEnd('get');
}

// await test();