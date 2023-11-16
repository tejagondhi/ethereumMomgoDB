// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract HashStorage {

    mapping(string => bytes32) private hashStore;


    event HashStored(string indexed accountNumber, bytes32 hash);


    function storeHash(string memory _accountNumber, bytes32 _hash) public {

        hashStore[_accountNumber] = _hash;


        emit HashStored(_accountNumber, _hash);
    }


    function retrieveHash(string memory _accountNumber) public view returns (bytes32) {

        return hashStore[_accountNumber];
    }
}
