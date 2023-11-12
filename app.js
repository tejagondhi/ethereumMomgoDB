const { MongoClient, ObjectId } = require('mongodb');
const { Web3 } = require('web3');
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const app = express();
const bcrypt = require('bcrypt');
// dotenv.config(); // Load environment variables from .env
require('dotenv').config();

// const dotenv = require('dotenv');
let db; // Declare db variable
let recordId;
let newWithdrawAmount;

// MongoDB configuration
const mongoURL = 'mongodb://localhost:27017/bankingData';
const dbName = 'bankingData';

//const mongoURL = 'mongodb://localhost:27017/bankingData'; // Replace with your MongoDB connection URL

if (!mongoURL || !mongoURL.startsWith('mongodb://')) {
  console.error('Invalid or undefined MongoDB connection URL. Please check your .env file.');
  process.exit(1);
}

// Initialize MongoDB connection using MongoClient
const client = new MongoClient(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect()
  .then(() => {
    console.log('Connected to MongoDB');
    db = client.db(dbName);
    if (db) {
      const usersCollection = db.collection('bankingData'); // Replace 'bankingData' with the correct collection name
      usersCollection.createIndex({ accountNo: 1 }, { unique: true });
    }
    else {
      console.log("dberror");
    }
    // Serve the form page
    app.get('/', (req, res) => {
      res.render('index');
    });

    // Handle form submission
    // Define a route to create a new banking record (Create)
    app.post('/create-banking-record', async (req, res) => {
      const { username, password, accountNo, balance } = req.body;

      // Hash the password securely
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create a new banking record
      const newRecord = {
        username: username,
        password: hashedPassword,
        accountNo: accountNo,
        balance: balance
      };
      db = client.db(dbName);
      if (db) {
        const usersCollection = db.collection('bankingData'); // Replace 'bankingData' with the correct collection name
        const existingAccount = await usersCollection.findOne({ accountNo: accountNo });
        if (existingAccount) {
          // An account with the same number already exists, handle the error
          res.status(400).send('An account with this number already exists.');
        } else {

          // Insert the new record into MongoDB
          const usersCollection = db.collection('bankingData');
          const result = await usersCollection.insertOne(newRecord);

          res.send('New banking record created successfully!');
          // Get a reference to the form
          // const clearFormScript = `
          // <script>
          //     document.getElementById("createRecordForm").reset();
          // </script>
          // `;

          // Listen for the form submission
          // createRecordForm.addEventListener("submit", function (event) {
          //   event.preventDefault(); // Prevent the default form submission

          //   // Clear input fields
          //   createRecordForm.reset();
          // });
        }
      }
      else {
        console.log("dberror");
      }
    });

    // Define a route to retrieve banking records (Read)
    app.get('/banking-records', async (req, res) => {
      const usersCollection = db.collection('bankingData');
      const records = await usersCollection.find({}).toArray();

      // Send the retrieved records as a response (you may want to render this data in a view)
      res.json(records);
    });

    app.post('/update-banking-record/:id', async (req, res) => {
      //const recordId = req.body._id;
      const { accountNo, balance } = req.body;
      db = client.db(dbName);
      try {
        const usersCollection = db.collection('bankingData');
        const existingAccount = await usersCollection.findOne({ accountNo: accountNo });
        if (existingAccount) {
          recordId = existingAccount._id;
          const currentWithdrawAmount = parseFloat(existingAccount.balance);
          const withdraw = parseFloat(balance);
          newWithdrawAmount = parseFloat(currentWithdrawAmount + withdraw);
        }
        const updatedRecord = await usersCollection.findOneAndUpdate(
          { _id: new ObjectId(recordId) }, // Use new ObjectId()
          { $set: { accountNo: accountNo, balance: newWithdrawAmount } },
          { returnOriginal: false }
        );
        // Now, interact with the Ganache Ethereum blockchain to store the transaction hash
        const senderAddress = '0x666C48339df091F2Ad01499B66618493f37edCb4'; // Replace with your Ethereum address
        const privateKey = '0xf6650a24c08a3b324371ba74cdffbdc7b3521996a89b8c1fb42e49dd339ed787'; // Replace with your private key

        // Create a transaction to store the transaction hash
        const transaction = {
          from: senderAddress,
          to: '0x0951Eb266b33cF11C64b7d8a12a08A561aE512b1', // Replace with the target address
          value: web3.utils.toWei('0', 'ether'), // Value in Wei
          data : '0x' // Replace with your transaction data
        };

        // Sign and send the transaction
        web3.eth.accounts.wallet.add(privateKey);
        const receipt = await web3.eth.sendTransaction(transaction);

        console.log('Transaction receipt:', receipt);

        res.send('Banking record updated successfully!');
      } catch (error) {
        // Handle errors appropriately
        console.error('Error updating record:', error);
        res.status(500).send('Error updating record');
      }

    });


    // Define a route to delete a banking record (Delete)
    app.delete('/delete-banking-record/:id', async (req, res) => {
      const recordId = req.params.id;

      // Delete the specified banking record
      const usersCollection = db.collection('bankingData');
      const result = await usersCollection.deleteOne({ _id: ObjectId(recordId) });

      res.send('Banking record deleted successfully!');
    });


    const port = process.env.PORT || 3002;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  });


// Ethereum configuration
const web3 = new Web3('http://127.0.0.1:7545');

// EJS and body-parser middleware
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Serve the form page
app.get('/', (req, res) => {
  res.render('index');
});

// Handle form submission
app.post('/submit', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const accountNo = req.body.accountNo;
  const amount = req.body.balance;


  // Hash the password securely
  const hashedPassword = await bcrypt.hash(password, 10);

  // Store user data in MongoDB
  const userData = {
    username: username,
    password: hashedPassword,
    accountNo: accountNo,
    deporwith: amount
  };


  // const db = await initMongoDB();

  if (db) {
    // Now, you can safely use the db object for MongoDB interactions
    const usersCollection = db.collection('bankingData'); // Replace 'users' with the correct collection name
    usersCollection.insertOne(userData, (err, result) => {
      if (err) {
        console.error('Error storing data in MongoDB:', err);
        res.status(500).send('Error storing data');
      } else {
        console.log('User data stored in MongoDB:', result.ops[0]);
        // Now, interact with the Ethereum blockchain to store the hash (as described in previous responses).

        res.send('Data submitted successfully!'); // You can customize this response.
      }
    });

    // Rest of your MongoDB interaction code
  } else {
    res.status(500).send('MongoDB connection error');
  }

  res.send('Form submitted successfully');

});

const port = process.env.PORT || 3003;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

