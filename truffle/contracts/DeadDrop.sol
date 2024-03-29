// SPDX-License-Identifier: Unlicensed
pragma solidity 0.8.9;

contract DeadDrop {
  // Start chat with someone
  event ShareSeed(address indexed from, string from_seed, address indexed to, string to_seed);
  // Send a message
  event SendMessage(address from, string totp, uint256 timestamp, string message);

  function shareSeed(address to, string memory from_seed, string memory to_seed) public {
    // this function share with to the initial seed for startChat
    emit ShareSeed(msg.sender, from_seed, to, to_seed);
  }

  function sendMessage(string memory totp, uint256 timestamp, string memory message) public {
    // this function send the message to to
    emit SendMessage(msg.sender, totp, timestamp, message);
  }
}
