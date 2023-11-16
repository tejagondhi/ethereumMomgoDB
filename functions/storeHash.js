const { createContractInstance } = require("./connection");

async function storeHash(accountNo,hash){
    const {instance,accounts} = await createContractInstance();

    const response = await instance.methods.storeHash(accountNo,hash).send({from:accounts[0]});

    console.log("Response:" , res);
}

module.exports = {storeHash};