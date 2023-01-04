import WalletBalance from './WalletBalance';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import CryptoWheels from '../artifacts/contracts/MyNFT.sol/CryptoWheels.json';
import { Buffer } from 'buffer';
import { create } from 'ipfs-http-client';
import { } from 'react-bootstrap';
import data from '../../json/0.json';
import {
  HEADLIGHTS_COMMON_CID,
  HEADLIGHTS_LEGENDARY_CID,
  HEADLIGHTS_RARE_CID,
  RIM_COMMON_1_CID,
  RIM_COMMON_2_CID,
  RIM_COMMON_3_CID,
  RIM_LEGENDARY_CID,
  RIM_RARE_1_CID,
  RIM_RARE_2_CID,
  SPOILER_COMMON_1_CID,
  SPOILER_COMMON_2_CID,
  SPOILER_COMMON_3_CID,
  SPOILER_LEGENDARY_CID,
  SPOILER_RARE_1_CID,
  SPOILER_RARE_2_CID,
  TINTED_WINDOWS_LEGENDARY_CID,
  WRAP_COMMON_1_CID,
  WRAP_COMMON_2_CID,
  WRAP_COMMON_3_CID,
  WRAP_LEGENDARY_CID,
  WRAP_RARE_1_CID,
  WRAP_RARE_2_CID,
} from '../../unboxable_items_CID';

import { hashToBytes32, convertBytes32ToBytes58 } from './Garage';
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
      //const connection = contract.connect(signer);

      // address of current user
      //const addr = connection.address;
      const requestAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const addr = requestAccounts[0];

      unboxed_item_CID = unbox_item();
      let metadataURIItem = ipfs.cat(unboxed_item_CID);
      let jsonObject = await Uint8ArrayToJSON(metadataURIItem);
      // load and parse the template json of the nft 
      //const loadedData = JSON.stringify(data);
      //const jsonObject = JSON.parse(loadedData);

      // modify variable parameters of the json (minter, date, id)
      const current = new Date();
      const date = `${current.getDate()}-${current.getMonth() + 1}-${current.getFullYear()}`;
      jsonObject.minter = addr
      jsonObject.minting_date = date.toString();
      let nextID = await contract.getNextItemID()
      jsonObject.id = nextID.toNumber();

      // upload of the json to ipfs and get of the hash
      let metadataURI;
      await ipfs.add(Buffer.from(JSON.stringify(jsonObject))).then((response) => {
        //console.log(response.path); // Stampa l'hash del file caricato su IPFS
        metadataURI = response.path;
      });
      const result = await contract.payToMint(addr, metadataURI, hashToBytes32(metadataURI), {
        value: ethers.utils.parseEther('0.05'),
      });

      await result.wait();
      console.log(jsonObject)
      //DA RIMUOVERE E INSERIRE IN MYNFTS.JSX
      //const newnft = contract.fetchMyNFTs(addr)
      //console.log(newnft)
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

function extractItem(commonProbability, rareProbability) {
  // Generate a random number between 0 and 1
  const randomNumber = Math.random();

  // Check if the random number falls under the probability of extracting a common item
  if (randomNumber < commonProbability) {
    return 'common';
  }

  // Check if the random number falls under the probability of extracting a rare item
  if (randomNumber < commonProbability + rareProbability) {
    return 'rare';
  }

  // If the random number doesn't fall under the probability of a common or rare item, it must be a legendary item
  return 'legendary';
}

// Generate a random number between 2 and 10, including both 2 and 10
function generateRandomIntegerInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


function unbox_item() {

  //which rarity has been unboxed
  let rarity = extractItem(0.75, 0.22);
  let itemCategory;
  let itemNumber;
  switch (rarity) {
    case 'common':
      itemCategory = generateRandomIntegerInRange(1, 3); //1:spoiler 2:rim 3:wrap
      itemNumber = generateRandomIntegerInRange(1, 3);
      switch (itemCategory) {
        case 1:
          switch (itemNumber) {
            case 1: return SPOILER_COMMON_1_CID;
            case 2: return SPOILER_COMMON_2_CID;
            case 3: return SPOILER_COMMON_3_CID;
            default: break;
          }
          break;
        case 2:
          switch (itemNumber) {
            case 1: return RIM_COMMON_1_CID;
            case 2: return RIM_COMMON_2_CID;
            case 3: return RIM_COMMON_3_CID;
            default: break;
          }
          break;
        case 3:
          switch (itemNumber) {
            case 1: return WRAP_COMMON_1_CID;
            case 2: return WRAP_COMMON_2_CID;
            case 3: return WRAP_COMMON_3_CID;
            default: break;
          }
          break;
        default:
          break;
      }
      break;
    case 'rare':
      itemCategory = generateRandomIntegerInRange(1, 4); //1:spoiler 2:rim 3:wrap 4:headlights
      itemNumber = generateRandomIntegerInRange(1, 2);
      switch (itemCategory) {
        case 1:
          switch (itemNumber) {
            case 1: return SPOILER_RARE_1_CID;
            case 2: return SPOILER_RARE_2_CID;
            default: break;
          }
          break;
        case 2:
          switch (itemNumber) {
            case 1: return RIM_RARE_1_CID;
            case 2: return RIM_RARE_2_CID;
            default: break;
          }
          break;
        case 3:
          switch (itemNumber) {
            case 1: return WRAP_RARE_1_CID;
            case 2: return WRAP_RARE_2_CID;
            default: break;
          }
          break;
        case 4:
          return HEADLIGHTS_RARE_CID;
        default:
          break;
      }
      break;
    case 'legendary':
      itemCategory = generateRandomIntegerInRange(1, 5); //1:spoiler 2:rim 3:wrap 4:headlights 5:tinted_windows
      switch (itemCategory) {
        case 1:
          return SPOILER_LEGENDARY_CID;
        case 2:
          return RIM_LEGENDARY_CID;
        case 3:
          return WRAP_LEGENDARY_CID;
        case 4:
          return HEADLIGHTS_LEGENDARY_CID;
        case 5:
          return TINTED_WINDOWS_LEGENDARY_CID;
        default:
          break;
      }
      break;
    default:
      break;
  }
}

export default Unbox;
