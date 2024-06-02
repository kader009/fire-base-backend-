const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const port = 5000;

// Load environment variables from .env file
dotenv.config();

// middleware
app.use(cors());
app.use(express.json());

// jwt create function

function createToken(user) {
  const token = jwt.sign(
    {
      email: user?.email,
    },
    'secret',
    { expiresIn: '1h' }
  );
  return token;
}

// jwt verify function
function verifyToken(req, res, next) {
  const token = req.headers.authorization.split(' ')[1];
  console.log(token);
  // const verify = jwt.verify(token, 'secret');
  // if (!verify?.email) {
  //   return res.send('You are not authorized');
  // }
  // req.user = verify.email;
  next();
}

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
    const userDb = client.db('userDB');
    const shoeCollection = ProductDb.collection('shoeCollection');
    const userCollection = userDb.collection('userCollection');

    app.post('/shoes', verifyToken, async (req, res) => {
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

    // user routes

    app.post('/user', verifyToken, async (req, res) => {
      const user = req.body;
      const token = createToken(user);
      // console.log(token);

      const IsExit = await userCollection.findOne({ email: user?.email });

      if (IsExit?._id) {
        return res.send({ status: 'success', message: 'login success', token });
      }

      await userCollection.insertOne(user);
      res.send({ token });
    });

    app.get('/user/get/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const result = await userCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.get('/user/:email', async (req, res) => {
      const email = req.params.email;
      const result = await userCollection.findOne({ email });
      res.send(result);
    });

    app.patch('/user/:email', async (req, res) => {
      const email = req.params.email;
      const updateData = req.body;
      const result = await userCollection.updateOne(
        { email },
        { $set: updateData },
        { upsert: true }
      );
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
