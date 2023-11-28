// 1_deploy_contract.js
const DataIntegrityVerifier = artifacts.require("DataIntegrityVerifier");

module.exports = function (deployer) {
  deployer.deploy(DataIntegrityVerifier);
};
const BankingContract = artifacts.require("BankingContract");

module.exports = function (deployer) {
  deployer.deploy(BankingContract);
};