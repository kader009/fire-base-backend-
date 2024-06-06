const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const app = express();
const port = 5000;

// Load environment variables from .env file
dotenv.config();

// Middleware
app.use(cors());
app.use(express.json());

// JWT Create Function
function createToken(user) {
  const token = jwt.sign({ email: user?.email }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
  return token;
}

// JWT Verify Function
function verifyToken(req, res, next) {
  const token = req.headers.authorization.split(' ')[1];
  // console.log(token);
  const verify = jwt.verify(token, process.env.JWT_SECRET)
  console.log(verify);
  if(!verify?.email){
    return res.send('you are not authorized')
  }
  req.user = verify.email;

    next();
  }
//   );
// }

const uri = process.env.MONGODB_LINK;

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

    app.patch('/shoes/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const updateData = req.body;
      delete updateData._id;

      const result = await shoeCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      res.send(result);
    });

    app.delete('/shoes/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const result = await shoeCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // User routes
    app.post('/user', async (req, res) => {
      const user = req.body;
      const token = createToken(user);
      console.log(token);

      const IsExit = await userCollection.findOne({ email: user.email });

      if (IsExit?._id) {
        return res.send({ status: 'success', message: 'login success', token });
      }

      await userCollection.insertOne(user);
      return res.send({ token });
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

    // Refresh Token Endpoint
    // app.post('/refresh-token', (req, res) => {
    //   const token = req.body.token;
    //   if (!token) {
    //     return res.status(401).send('Authorization token missing');
    //   }

    //   jwt.verify(
    //     token,
    //     'secret',
    //     { ignoreExpiration: true },
    //     (err, decoded) => {
    //       if (err) {
    //         return res.status(401).send('Invalid token');
    //       }

    //       const user = { email: decoded.email };
    //       const newToken = createToken(user);
    //       res.send({ token: newToken });
    //     }
    //   );
    // });

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
