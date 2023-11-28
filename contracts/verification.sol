// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BankingContract {
    struct Record {
        string username;
        string password;
        string accountNo;
        uint balance;
    }

    event RecordHash(uint256 indexed recordId, bytes32 dataHash);
    mapping(uint => Record) public records;
    mapping(uint => bytes32) public recordHashes;
    event RecordStored(uint indexed accountId, string username, string accountNo, uint balance);
    //event allEvents(uint indexed accountId, string username, string accountNo, uint balance);
    event RecordUpdated(uint indexed recordId,string username,string accountNo,uint balance);


    function storeRecord(uint256 recordId, string memory username, string memory password, string memory accountNo, uint balance) public {
    //require(records[accountId].balance == 0, "Record already exists");
    
    records[recordId] = Record(username, password, accountNo, balance);
    recordHashes[recordId] = keccak256(abi.encodePacked(username, password, accountNo, balance));
    // Retrieve the record
    Record storage record = records[recordId];
    // Perform update logic
    // For example, update the username and password
    record.username = username;
    record.password = password;
    // Add other update logic here...
    // Calculate the data hash
    bytes32 calculatedDataHash = keccak256(
    abi.encodePacked(recordId, record.username, record.password, record.balance)
    );
    // Emit the event
    emit RecordHash(recordId, calculatedDataHash);
    emit RecordUpdated(recordId, username, accountNo, balance);
    }


    function updateRecord(uint256 recordId, string memory newUsername, string memory newPassword, string memory newAccountNo, uint newBalance) public {
        //require(records[accountId].balance > 0, "Record does not exist");

        records[recordId] = Record(newUsername,newPassword,newAccountNo,newBalance);

        recordHashes[recordId] = keccak256(abi.encodePacked(newUsername, newPassword, newAccountNo, newBalance));
        // Retrieve the record
        Record storage record = records[recordId];
        // Perform update logic
        // For example, update the username and password
        record.username = newUsername;
        record.password = newPassword;
        // Add other update logic here...

        // Calculate the data hash
        bytes32 calculatedDataHash = keccak256(
            abi.encodePacked(recordId, newUsername, newPassword, newBalance)
        );

        // Emit the event
        //triggerEventManually();
        emit RecordHash(recordId, calculatedDataHash);
        emit RecordUpdated(recordId, newUsername, newAccountNo, newBalance);

    }

    function getRecordHash(uint accountId) public view returns (bytes32) {
        return recordHashes[accountId];
    }

    function triggerEventManually() public {
    emit RecordUpdated(123, "DummyUsername", "DummyAccountNo", 100);
}
}
