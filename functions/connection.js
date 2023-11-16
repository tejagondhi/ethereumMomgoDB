//Eth configuration
var Web3 = require('web3');
const providers = new Web3.providers.HttpProvider('http://localhost:8545') //Todo change http and port
var Web3 = new Web3(providers);
const StoreHash = require('../build/contracts/HashStorage.json');

//connection
async function createInstance(){
  accounts = await Web3.eth.getAccounts();
  const networkId = await Web3.eth.net.getId();
  const {address} = StoreHash.networks[networkId];

  var instance = await new Web3.eth.contract(
    StoreHash.abi,
    address
  )

  return {instance,accounts};

}

module.exports = {createInstance};