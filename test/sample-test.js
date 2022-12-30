const { expect } = require("chai");
const { ethers } = require("hardhat");
import { bs58 } from 'bs58';

describe("MyNFT", function () {
  it("Should mint and transfer an NFT to someone", async function () {
    const CryptoWheels = await ethers.getContractFactory("CryptoWheels");
    const cryptowheels = await CryptoWheels.deploy();
    await cryptowheels.deployed();

    const recipient = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
    const metadataURI = 'cid/test.png';

    let balance = await cryptowheels.balanceOf(recipient);
    expect(balance).to.equal(0);

    const newlyMintedToken = await cryptowheels.payToMint(recipient, metadataURI, { value: ethers.utils.parseEther('0.05') });

    // wait until the transaction is mined
    await newlyMintedToken.wait();

    balance = await cryptowheels.balanceOf(recipient)
    expect(balance).to.equal(1);

    //expect(await cryptowheels.isContentOwned(metadataURI)).to.equal(true);
    //const newlyMintedToken2 = await cryptowheels.payToMint(recipient, 'foo', { value: ethers.utils.parseEther('0.05') });

    console.log("TOKEN ID")
    const getTokenID = await cryptowheels.getNextID() 
    //await getTokenID.wait();
    console.log(getTokenID.toNumber());

    //getBytes32FromIpfsHash
    //getIpfsHashFromBytes32
    function getBytes32FromIpfsHash(ipfsListing) {
      return "0x"+bs58.decode(ipfsListing).slice(2).toString('hex')
    }
    
    // Return base58 encoded ipfs hash from bytes32 hex string,
    // E.g. "0x017dfd85d4f6cb4dcd715a88101f7b1f06cd1e009b2327a0809d01eb9c91f231"
    // --> "QmNSUYVKDSvPUnRLKmuxk9diJ6yS96r1TrAXzjTiBcCLAL"
    
    function getIpfsHashFromBytes32(bytes32Hex) {
      // Add our default ipfs values for first 2 bytes:
      // function:0x12=sha2, size:0x20=256 bits
      // and cut off leading "0x"
      const hashHex = "1220" + bytes32Hex.slice(2)
      const hashBytes = Buffer.from(hashHex, 'hex');
      const hashStr = bs58.encode(hashBytes)
      return hashStr
    }
    
    const b32fromhash = getBytes32FromIpfsHash('QmR8rWKq8LqPHweWYp7f4rwh2xeAJ617UijYUGU6CKXg8R'); 
    console.log(b32fromhash);
    const b58fromb32 = getIpfsHashFromBytes32(b32fromhash);
    console.log(b58fromb32);
  });
});
