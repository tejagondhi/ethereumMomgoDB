var HashStore = artifacts.require("./HashStorage.sol");

module.exports = function(deployer) {
  deployer.deploy(HashStore);
};