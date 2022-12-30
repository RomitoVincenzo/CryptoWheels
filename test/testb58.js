import { ethers } from "ethers";

function hashToBytes32(hash) {
    const result = ethers.utils
    .hexlify(
        ethers.utils.base58
            .decode(hash)
            .slice(2)
    );
    return result;
  }

function convertBytes32ToBytes58(bytes32) {
    const result = ethers.utils.base58.encode(
        Buffer.from("1220" + bytes32.slice(2), "hex")
    );
    return result;
}

const b32fromhash = hashToBytes32('QmR8rWKq8LqPHweWYp7f4rwh2xeAJ617UijYUGU6CKXg8R'); 
console.log(b32fromhash);
const b58fromb32 = convertBytes32ToBytes58(b32fromhash);
console.log(b58fromb32);