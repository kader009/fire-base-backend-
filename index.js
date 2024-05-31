const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
const app = express();
const dotenv = require('dotenv');
const port = 5000;

// Load environment variables from .env file
dotenv.config();


// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.MONGODB_NAME}:${process.env.MONGODB_PASSWORD}@cluster0.mxhsli3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const ProductDb = client.db('productDB');
    const shoeCollection = ProductDb.collection('shoeCollection');

    app.post('/shoes', async (req, res) => {
      const shoesData = req.body;
      const result = await shoeCollection.insertOne(shoesData);
      console.log(result);
      res.send(result);
    });

    app.get('/shoes', async (req, res) => {
      const shoes = await shoeCollection.find({}).toArray();
      res.send(shoes);
    });

    app.get('/shoes/:id', async (req, res) => {
      const id = req.params.id;
      const shoes = await shoeCollection.findOne({ _id: new ObjectId(id) });
      res.send(shoes);
    });

    app.patch('/shoes/:id', async (req, res) => {
      const id = req.params.id;
      const updateData = req.body;

      // Remove _id from updateData if it exists
      delete updateData._id;

      const result = await shoeCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      res.send(result);
    });

    app.delete('/shoes/:id', async (req, res) => {
      const id = req.params.id;
      const result = await shoeCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Shoes Server!');
});

app.listen(port, () => {
  console.log(`Shoes Server app listening on port ${port}`);
});
