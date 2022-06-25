const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const bodyparser = require('body-parser');
const stripe = require('stripe')('sk_test_51L0gwOCHgcol8ks1CaDSZ4HEn1uf4aiMvMel7eGpJtR4738nIZpfUouwuXC8GRkUVUAMRvRtgbhLI5LdnZ9aJ0vB00ZdHKwZoZ');
const uuid = require('uuid').v4

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nycpx.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        await client.connect();
        const itemCollection = client.db('panda_commerce').collection('items');
        const productCollection = client.db('panda_commerce').collection('products');
        const cartCollection = client.db('panda_commerce').collection('carts');
        const orderCollection = client.db('panda_commerce').collection('orders');
        const paymentCollection = client.db('panda_commerce').collection('payments');

        app.get('/item', async (req, res) => {
            const query = {};
            const cursor = itemCollection.find(query);
            const items = await cursor.toArray();
            res.send(items);
        });

        app.get('/product', async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            const query = {};
            const cursor = productCollection.find(query);
            let products;
            if (page || size) {
                products = await cursor.skip(page * size).limit(size).toArray();
            }
            else {
                products = await cursor.toArray();
            }

            res.send(products);
        });

        app.get('/productCount', async (req, res) => {
            const count = await productCollection.estimatedDocumentCount();
            res.send({ count });
        });

        app.post('/productByKeys', async (req, res) => {
            const keys = req.body;
            const ids = keys.map(id => ObjectId(id));
            const query = { _id: { $in: ids } };
            const cursor = productCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
            console.log(keys);
        });

        app.post('/cart', async (req, res) => {
            const cart = req.body;
            const query = { model: cart.model, user: cart.user };
            const exists = await cartCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, cart: exists })
            }
            const result = await cartCollection.insertOne(cart);
            return res.send({ success: true, result });
        });

        app.get('/cart', async (req, res) => {
            const user = req.query.user;
            const query = { user: user };
            const carts = await cartCollection.find(query).toArray();
            res.send(carts);
        });

        app.post('/order', async (req, res) => {
            const order = req.body;
            const query = { model: order.model, user: order.user };
            const exists = await orderCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, order: exists })
            }
            const orders = await orderCollection.insertOne(order);
            return res.send({ success: true, orders });
        });

        app.get('/order', async (req, res) => {
            const user = req.query.user;
            const query = { user: user };
            const orders = await orderCollection.find(query).toArray();
            res.send(orders);
        });

        app.post('/checkout', async (req, res) => {
            let error, status
            try {
                const { product, token } = req.body;
                const customer = await stripe.customers.create({
                    email: token.email,
                    source: token.id
                });

                const key = uuid();
                const charge = await stripe.charges.create(
                    {
                        amount: product.price * 100,
                        currency: "usd",
                        customer: customer.id,
                        receipt_email: token.email,
                        description: `Purchased the ${product.name}`,
                        shipping: {
                            name: token.card.name,
                            address: {
                                line1: token.card.address_line1,
                                line2: token.card.address_line2,
                                city: token.card.address_city,
                                country: token.card.address_country,
                                postal_code: token.card.address_zip,
                            },
                        },
                    },
                    {
                        key,
                    }
                );
                status = "success";

            }
            catch (error) {
                status = "failure";
            }
            res.json({ error, status });
        });


        app.delete('/order/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await orderCollection.deleteOne(query);
            res.send(result);
        });

        app.delete('/cart/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await cartCollection.deleteOne(query);
            res.send(result);
        });

        app.delete('/cart', async (req, res) => {
            const user = req.query.user;
            const query = { user: user };
            const result = await cartCollection.deleteMany(query);
            res.send(result);
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
