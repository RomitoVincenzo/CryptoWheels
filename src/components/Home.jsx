import WalletBalance from './WalletBalance';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import CryptoWheels from '../artifacts/contracts/MyNFT.sol/CryptoWheels.json';

const contractAddress = '0x5fbdb2315678afecb367f032d93f642f64180aa3';

const provider = new ethers.providers.Web3Provider(window.ethereum);

// get the end user
const signer = provider.getSigner();

// get the smart contract
const contract = new ethers.Contract(contractAddress, CryptoWheels.abi, signer);

const projectId = "2JVlWNoBt7obNfNCez9i4txG2sN";
const projectSecret = "8a4515934d69006beba5bc9c17696dee";
const authorization = "Basic " + btoa(projectId + ":" + projectSecret);
import fs from 'fs';
import { create } from 'ipfs-http-client';
const ipfs = create({ host: 'ipfs.infura.io', port: 5001, protocol: 'https', headers: { authorization } });

function Home() {

  return (
    <div>
      <WalletBalance />

      <h1>MINT A NFT</h1>
      <div className="container">
        <div className="row">
              <div className="col-sm">
                <NFTMint />
              </div>
        </div>
      </div>
    </div>
  );
}

function NFTMint() {
  //const contentId = 'Qmdbpbpy7fA99UkgusTiLhMWzyd3aETeCFrz7NpYaNi6zY';
  const metadataURI = `https://crypto-wheels.infura-ipfs.io/ipfs/QmR8rWKq8LqPHweWYp7f4rwh2xeAJ617UijYUGU6CKXg8R`;
  //const imageURI = `https://gateway.pinata.cloud/ipfs/${contentId}/${tokenId}.png`;
  //   const imageURI = `img/${tokenId}.png`;

  const mintToken = async () => {
    const connection = contract.connect(signer);
    const addr = connection.address;

    let jsonString = fs.readFileSync('json/0.json', 'utf8');
    let jsonObject = JSON.parse(jsonString);

    const current = new Date();
    const date = `${current.getDate()}-${current.getMonth()+1}-${current.getFullYear()}`;

    jsonObject.minter = addr
    jsonObject.minting_date = date.toString();
    jsonObject.id = await contract.getNextID();
    
    //const file = {'file': 'json/0.json'}
    //response = requests.post('https://ipfs.infura.io:5001/api/v0/add', files=file, auth=('2JVlWNoBt7obNfNCez9i4txG2sN','8a4515934d69006beba5bc9c17696dee'))
    
    ipfs.add(Buffer.from(JSON.stringify(jsonObject))).then((response) => {
      console.log(response[0].hash); // Stampa l'hash del file caricato su IPFS
    });

    console.log("FANCULO -------------------------------")
    
    const result = await contract.payToMint(addr, metadataURI, {
      value: ethers.utils.parseEther('0.05'),
    });

    await result.wait();
    const newnft = contract.fetchMyNFTs(addr)
    console.log(newnft)
  };

  return (
    <div className="card" style={{ width: '18rem' }}>
      <img className="card-img-top" src={'img/placeholder.png'}></img>
      <div className="card-body">
        <h5 className="card-title">MINT</h5>
          <button className="btn btn-primary" onClick={mintToken}>
            Mint
          </button>
      </div>
    </div>
  );
}

export default Home;
