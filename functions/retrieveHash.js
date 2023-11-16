const { createContractInstance } = require("./connection");

async function retrieveHash(accountNo){
    const {instance,accounts} = await createContractInstance();

    const response = await instance.methods.retrieveHash(accountNo).call({from:accounts[0]});

    return response
}

module.exports = {retrieveHash};