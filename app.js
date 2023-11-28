const { MongoClient, ObjectId } = require('mongodb');
const { Web3 } = require('web3');
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
require('dotenv').config();

let db;
let recordId;
let newWithdrawAmount;

const mongoURL = 'mongodb://localhost:27017/bankingData';
const dbName = 'bankingData';
const web3 = new Web3('http://localhost:7545');
const { abi } = require('./build/contracts/BankingContract.json');
const contractAddress = '0xf1666c88bA7ba6a57378EE2C25c3B6545D9DEBf5';
const contract = new web3.eth.Contract(abi, contractAddress);

const client = new MongoClient(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect()
  .then(() => {
    console.log('Connected to MongoDB');
    db = client.db(dbName);
    if (db) {
      const usersCollection = db.collection('bankingData');
      usersCollection.createIndex({ accountNo: 1 }, { unique: true });
    } else {
      console.log("dberror");
    }

    const app = express();
    app.set('view engine', 'ejs');
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(express.static('public'));

    app.get('/', (req, res) => {
      res.render('index');
    });

    app.post('/create-banking-record', async (req, res) => {
      const { username, password, accountNo, balance } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);

      const newRecord = {
        username: username,
        password: hashedPassword,
        accountNo: accountNo,
        balance: balance,
        dataHash: '',
      };

      const usersCollection = db.collection('bankingData');
      const existingAccount = await usersCollection.findOne({ accountNo: accountNo });

      if (existingAccount) {
        res.status(400).send('An account with this number already exists.');
      } else {
        const result = await usersCollection.insertOne(newRecord);

        try {
          const existingAccount = await usersCollection.findOne({ accountNo: accountNo });

          if (existingAccount) {
            recordId = existingAccount._id;
            const dataHash = calculateHash({accountNo,username,balance});
            await usersCollection.updateOne({ _id: recordId }, { $set: { dataHash: dataHash } });

            const currentWithdrawAmount = parseFloat(existingAccount.balance);
            const withdraw = parseFloat(balance);
            newWithdrawAmount = parseFloat(currentWithdrawAmount + withdraw);

            const accounts = await web3.eth.getAccounts();
            const gas = await contract.methods.storeRecord(parseInt(recordId), username, hashedPassword, accountNo, balance).estimateGas();
            const result = await contract.methods.storeRecord(parseInt(recordId), username, hashedPassword, accountNo, balance)
              .send({ from: accounts[0], gas });

            console.log('Transaction receipt:', result);
            res.send('New banking record created successfully!');
          }

        } catch (error) {
          console.error('Error creating new record:', error);
          res.status(500).send('Error creating new record');
        }
      }
    });

    app.get('/banking-records', async (req, res) => {
      try {
        const accountNo = req.query.accountNo;

        if (!accountNo) {
          return res.status(400).send('Account number (accountNo) is required in the query parameters.');
        }

        const usersCollection = db.collection('bankingData');
        const records = await usersCollection.find({ accountNo: accountNo }).toArray();

        if (records.length === 0) {
          return res.status(404).send('No records found for the provided account number.');
        }
        const hashFields = {
          accountNo: records[0].accountNo,
          username : records[0].username,
          balance: records[0].balance
        };
        const dataHash = calculateHash(hashFields);

        if (dataHash !== records[0].dataHash) {
          return res.status(500).send('Data has been tampered with!');
        }

        res.json(records);
      } catch (error) {
        console.error('Error retrieving banking records:', error);
        res.status(500).send('Error retrieving banking records');
      }
    });

    app.post('/update-banking-record/:id', async (req, res) => {
      const { accountNo, balance } = req.body;
      db = client.db(dbName);
      try {
        const usersCollection = db.collection('bankingData');
        const existingAccount = await usersCollection.findOne({ accountNo: accountNo });

        if (existingAccount) {
          recordId = existingAccount._id;
          const currentWithdrawAmount = parseFloat(existingAccount.balance);
          const withdraw = parseFloat(balance);
          newWithdrawAmount = (currentWithdrawAmount + withdraw).toString();
        }

        const updatedRecord = await usersCollection.findOneAndUpdate(
          { _id: recordId },
          { $set: { accountNo: accountNo, balance: newWithdrawAmount } },
          { returnOriginal: false }
        );

        const dataHash = calculateHash(updatedRecord);
        await usersCollection.updateOne({ _id: recordId }, { $set: { dataHash: dataHash } });

        const senderAddress = '0x4b70153AAB738F56c3410bb0Acc5Ba357F6F6c01';
        const privateKey = '0x6c2d6a91f5641d0c1b296ac3642d9c206189eb6e55e900517c448fb9858c834c';
        const transactionData = contract.methods.updateRecord(parseInt(recordId), existingAccount.username, existingAccount.password, accountNo, newWithdrawAmount).encodeABI();

        const transaction = {
          from: senderAddress,
          to: '0xf1666c88bA7ba6a57378EE2C25c3B6545D9DEBf5',
          value: web3.utils.toWei('0', 'ether'),
          data: transactionData,
        };

        web3.eth.accounts.wallet.add(privateKey);
        const receipt = await web3.eth.sendTransaction(transaction);

        console.log('Transaction receipt:', receipt);

        res.send('Banking record updated successfully!');
      } catch (error) {
        console.error('Error updating record:', error);
        res.status(500).send('Error updating record');
      }
    });

    app.delete('/delete-banking-record/:id', async (req, res) => {
      const recordId = req.params.id;

      const usersCollection = db.collection('bankingData');
      const result = await usersCollection.deleteOne({ accountNo: recordId });

      res.send('Banking record deleted successfully!');
    });

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  });

function calculateHash(data) {
  const dataString = JSON.stringify(data) || '';
  const hash = crypto.createHash('sha256').update(dataString).digest('hex');
  return hash;
}
