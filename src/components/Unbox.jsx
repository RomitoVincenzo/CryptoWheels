import WalletBalance from './WalletBalance';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import CryptoWheels from '../artifacts/contracts/MyNFT.sol/CryptoWheels.json';
import { Buffer } from 'buffer';
import { create } from 'ipfs-http-client';
import { } from 'react-bootstrap';
import data from '../../json/0.json';

const contractAddress = '0x5fbdb2315678afecb367f032d93f642f64180aa3';

const provider = new ethers.providers.Web3Provider(window.ethereum);

// get the end user
const signer = provider.getSigner();

// get the smart contract
const contract = new ethers.Contract(contractAddress, CryptoWheels.abi, signer);

// auth for infura ipfs
const projectId = "2JVlWNoBt7obNfNCez9i4txG2sN";
const projectSecret = "8a4515934d69006beba5bc9c17696dee";
const authorization = "Basic " + btoa(projectId + ":" + projectSecret);
// create the connection to infura ipfs
const ipfs = create({ host: 'ipfs.infura.io', port: 5001, protocol: 'https', headers: { authorization } });


function Unbox() {
  return (
    <div>
      <WalletBalance />
      <h1 style={{ textAlign: "center" }}>UNBOX YOUR NFT</h1>
      <div className="container" style={{ display: "flex", justifyContent: "center" }}>
        <div className="row" style={{ margin: "auto" }}>
          <div className="col-sm" style={{ margin: "auto" }}>
            <NFTMint />
          </div>
        </div>
      </div>
    </div>
  );
}

function NFTMint() {

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const mintToken = async () => {

    setLoading(true);

    try {
      // connection to the contract
      const connection = contract.connect(signer);

      // address of current user
      const addr = connection.address;

      // load and parse the template json of the nft 
      const loadedData = JSON.stringify(data);
      const jsonObject = JSON.parse(loadedData);

      // modify variable parameters of the json (minter, date, id)
      const current = new Date();
      const date = `${current.getDate()}-${current.getMonth() + 1}-${current.getFullYear()}`;
      jsonObject.minter = addr
      jsonObject.minting_date = date.toString();
      let nextID = await contract.getNextID()
      jsonObject.id = nextID.toNumber();

      // upload of the json to ipfs and get of the hash
      let metadataURI;
      await ipfs.add(Buffer.from(JSON.stringify(jsonObject))).then((response) => {
        //console.log(response.path); // Stampa l'hash del file caricato su IPFS
        metadataURI = response.path;
      });

      const result = await contract.payToMint(addr, metadataURI, {
        value: ethers.utils.parseEther('0.05'),
      });

      await result.wait();

      //DA RIMUOVERE E INSERIRE IN MYNFTS.JSX
      const newnft = contract.fetchMyNFTs(addr)
      console.log(newnft)
      //............................

      setSuccess(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ width: '18rem' }}>
      <img className="card-img-top" src={'img/placeholder.png'}></img>
      <div className="card-body text-center">
        {loading ? (
          <>
            <div className="spinner-border" role="status">
              <span className="sr-only"></span>
            </div>
            <p>Minting...</p>
          </>
        ) : (
          <button className="btn btn-primary w-100" onClick={mintToken}>
            MINT
          </button>
        )}
        {success && (
          <p className="mt-2 text-success">
            NFT Creato! Scopri il tuo NFT nella sezione MyNFTs
          </p>
        )}
      </div>
    </div>
  );
}

export default Unbox;
