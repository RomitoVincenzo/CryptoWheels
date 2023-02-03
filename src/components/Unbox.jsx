import WalletBalance from './WalletBalance';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import CryptoWheels from '../artifacts/contracts/MyNFT.sol/CryptoWheels.json';
import { Buffer } from 'buffer';
import { create } from 'ipfs-http-client';
import { } from 'react-bootstrap';
import Modal from 'react-awesome-modal';


import { hashToBytes32, convertBytes32ToBytes58 } from './Garage';
import axios from 'axios';
const contractAddress = '0x5fbdb2315678afecb367f032d93f642f64180aa3';
const carBodyImageCID = 'QmVz6CoMLu6iFy87T1fmHRPbX5iF3zuWMetD7DLMAAamWm';
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

const fetchUnboxedItem = async () => {
  try {
    // Send an HTTP POST Request to the backend with the CID Array as body
    const response = await axios.get('http://localhost:3001/unbox-item');
    return response.data;
  } catch (error) {
    console.error(error);
  }
};

function Unbox() {
  return (
    <div style={{ background: "#FCFCFC" }} className="">
      <WalletBalance />
      <h1 style={{ textAlign: "center" }} className="my-4">UNBOX YOUR CAR ITEM</h1>
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
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [unboxedCID, setUnboxedCID] = useState("")
  const [unboxedType, setUnboxedType] = useState("")
  const [unboxedRarity, setUnboxedRarity] = useState("")

  const mintToken = async () => {

    setLoading(true);
    let metadataURI;
    try {
      // connection to the contract
      //const connection = contract.connect(signer);

      // address of current user
      //const addr = connection.address;
      const requestAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const addr = requestAccounts[0];

      //const loadedData = JSON.stringify(unbox_item());
      const loadedData = JSON.stringify(await fetchUnboxedItem());
      const jsonObject = JSON.parse(loadedData);

      // modify variable parameters of the json (minter, date, id)
      const current = new Date();
      const date = `${current.getDate()}-${current.getMonth() + 1}-${current.getFullYear()}`;
      jsonObject.minter = addr
      jsonObject.minting_date = date.toString();
      let nextID = await contract.getNextItemID()
      jsonObject.id = nextID.toNumber();

      // upload of the json to ipfs and get of the hash
      await ipfs.add(Buffer.from(JSON.stringify(jsonObject))).then((response) => {
        metadataURI = response.path;
      });
      const result = await contract.payToMint(addr, metadataURI, hashToBytes32(metadataURI), {
        value: ethers.utils.parseEther('0.1'),
      });

      await result.wait();

      setUnboxedCID(jsonObject.imageCID)
      setUnboxedType(jsonObject.type)
      setUnboxedRarity(jsonObject.rarity)
      setSuccess(true);
      setIsModalVisible(true)

    } catch (error) {
      console.error(error);
      setSuccess(false);
      const cid = ipfs.pin.rm(metadataURI);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card box p-3" style={{ width: '18rem' }}>
      <img className="card-img-top" src={'img/mint.png'}></img>
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

          <Modal visible={isModalVisible} width="400" height="460" effect="fadeInUp" onClickAway={() => setIsModalVisible(false)}>

            <div className="box">
              <div className="text-center">
                <img src={`https://crypto-wheels.infura-ipfs.io/ipfs/${unboxedCID}`} className="rounded img-thumbnail" />
              </div>
              <div className="py-3 overflow-hidden">
                <ul className="list-group">
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    Type
                    <span className="badge bg-app text-white px-3 fs-6">{unboxedType}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    Rarity
                    <span className="badge bg-app text-white px-3 fs-6">{unboxedRarity}</span>
                  </li>
                </ul>
              </div>
              <a href="javascript:void(0);" style={{ color: '#76b5c5', fontSize: '25px', fontWeight: 'bold' }} onClick={() => setIsModalVisible(false)}>Close</a>
            </div>

          </Modal>

        )}
      </div>
    </div>
  );
}

export default Unbox;