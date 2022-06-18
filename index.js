const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nycpx.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        await client.connect();
        const shoeCollection = client.db('panda_commerce').collection('shoes');
        const jacketCollection = client.db('panda_commerce').collection('jackets');
        const bagCollection = client.db('panda_commerce').collection('bags');

        app.get('/shoe', async (req, res) => {
            const query = {};
            const cursor = shoeCollection.find(query);
            const shoes = await cursor.toArray();
            res.send(shoes);
        });

        app.get('/jacket', async (req, res) => {
            const query = {};
            const cursor = jacketCollection.find(query);
            const jackets = await cursor.toArray();
            res.send(jackets);
        });

        app.get('/bag', async (req, res) => {
            const query = {};
            const cursor = bagCollection.find(query);
            const bags = await cursor.toArray();
            res.send(bags);
        });

    }

    finally {

    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Server is running');
});

app.listen(port, () => {
    console.log('server is listening to port', port)
})
