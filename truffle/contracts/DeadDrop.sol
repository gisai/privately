// SPDX-License-Identifier: Unlicensed
pragma solidity 0.8.9;

contract DeadDrop {
  // Start chat with someone
  event ShareSeed(address to, string seed);
  // Send a message
  event SendMessage(string to, string message);

  mapping(address => string) public publicKeys;

  function shareSeed(address to, string memory seed) public {
    // this function share with to the initial seed for startChat
    emit ShareSeed(to, seed);
  }

  function sendMessage(string memory to, string memory message) public {
    // this function send the message to to
    emit SendMessage(to, message);
  }

  function setPublicKey(address my_address, string memory publicKey) public {
    publicKeys[my_address] = publicKey;
  }

  function getPublicKey(address dest_address) public view returns(string memory publicKey) {
    publicKey = publicKeys[dest_address];
  }
}
