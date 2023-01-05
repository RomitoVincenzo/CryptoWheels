import React from 'react';
import { ethers } from 'ethers';
import CryptoWheels from '../artifacts/contracts/MyNFT.sol/CryptoWheels.json';
import { Buffer } from 'buffer';
import { create } from 'ipfs-http-client';
import { } from 'react-bootstrap';
import { useEffect, useState } from 'react';

const contractAddress = '0x5fbdb2315678afecb367f032d93f642f64180aa3';

// Provider, User Signer and Contract definition
const provider = new ethers.providers.Web3Provider(window.ethereum);
// get the end user
const signer = provider.getSigner();
// get the smart contract
const contract = new ethers.Contract(contractAddress, CryptoWheels.abi, provider);
// Contract with user signer 
const contractWithSigner = contract.connect(signer);

import data from '../../json/car.json';

// auth for infura ipfs
const projectId = "2JVlWNoBt7obNfNCez9i4txG2sN";
const projectSecret = "8a4515934d69006beba5bc9c17696dee";
const authorization = "Basic " + btoa(projectId + ":" + projectSecret);
// create the connection to infura ipfs
const ipfs = create({ host: 'ipfs.infura.io', port: 5001, protocol: 'https', headers: { authorization } });

// Json decoding function
async function Uint8ArrayToJSON(Uint8Array) {
  let decoder = new TextDecoder()
  let data = ''
  for await (const chunk of Uint8Array) {
    data += decoder.decode(chunk, { stream: true })
  }

  return JSON.parse(data)
}

// Function to convert a CID IPFS hash type to a bytes32 type (used to set values in contract mappings)
export function hashToBytes32(hash) {
  const result = ethers.utils
    .hexlify(
      ethers.utils.base58
        .decode(hash)
        .slice(2)
    );
  return result;
}

// Function to convert a bytes32 (used in contract mappings) type in an CID IPFS hash type (bytes58) 
export function convertBytes32ToBytes58(bytes32) {
  const result = ethers.utils.base58.encode(
    Buffer.from("1220" + bytes32.slice(2), "hex")
  );
  return result;
}

// Function that check from the contract if the user has its car already minted
async function isCarMinted(account) {
  let carID = await contract.getCarID(account);
  let carCIDb32 = await contract.getCarCID(carID);
  if (carCIDb32 == 0) {
    return false;
  }
  else {
    return true;
  }
}

// Function that call the endpoint "create-composite" of the BE to get the merged image
// Return a base64 encoded image (to be uploaded on IPFS)

import axios from 'axios';
const fetchComposite = async (cidArray) => {
  try {
    console.log(cidArray);
    axios.defaults.headers.post['Content-Type'] = 'application/json';
    // Send an HTTP POST Request to the backend with the CID Array as body
    let response = await axios.post('http://localhost:3001/create-composite', cidArray);

    let compositeBase64 = response.data;
    return compositeBase64;
  } catch (error) {
    console.error(error);
  }
};

function Garage() {

  const [imageCID, setImageCID] = useState();
  const [minted, setMinted] = useState(false);
  const [address, setAddress] = useState();

  // Effect needed in order to update the page when the car is minted (end of myCar:if-condition)
  useEffect(() => {
    async function checkMinted() {
      const requestAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = requestAccounts[0];
      const isMinted = await isCarMinted(account);
      setMinted(isMinted);
    }
    checkMinted();
  }, [minted]);

  // Effect needed in order to run myCar function even if the car is already minted
  // (If the car is not already minted, myCar function will be launched by the onClick event of the button)
  useEffect(() => {
    if (minted) {
      myCar();
    }
  }, [minted]);

  const myCar = async () => {

    // Take the current user account
    const requestAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const account = requestAccounts[0];
    setAddress(account);

    // Get from the contract the current Car CID (in bytes32 format) of the user
    let carID = await contract.getCarID(account);
    console.log(carID)
    let carCIDb32 = await contract.getCarCID(carID);
    console.log(carCIDb32)

    // Check if the user has not already minted is car
    if (carCIDb32 == 0) {
      //DO NOT ADD THE IMAGE BEFORE TRANSACTION IS COMPLETED (CRITICAL)
      console.log("IF");

      // Take stock car metadata and create the JsonObject in order to modify it
      const loadedData = JSON.stringify(data);
      const jsonObject = JSON.parse(loadedData);
      // Insert the account value as owner
      jsonObject.owner = account;
      // Get the next nft id from the contract and insert as id in metadata
      let nextID = await contract.getNextItemID()
      jsonObject.id = nextID.toNumber();
      // Insert the current date of minting
      const current = new Date();
      const date = `${current.getDate()}-${current.getMonth() + 1}-${current.getFullYear()}`;
      jsonObject.minting_date = date.toString();
      // Upload of the json to ipfs and get of the hash
      let metadataURICar;
      await ipfs.add(Buffer.from(JSON.stringify(jsonObject))).then((response) => {
        metadataURICar = response.path;
        console.log(metadataURICar);
      });

      // Convert the new metadata CID to bytes32 in order to be correctly stored in the blockchain mapping
      let metadataURICar_b32 = hashToBytes32(metadataURICar);

      // Payment of minting car operation
      const result = await contractWithSigner.payToMintCar(account, metadataURICar, metadataURICar_b32, {
        from: account,
        value: ethers.utils.parseEther('0.05'),
      });
      await result.wait();

      // Update the minted state
      const isMinted = await isCarMinted(account);
      setMinted(isMinted);

    } else {

      console.log("ELSE")

      // Load metadata of the current user car
      let carCID = convertBytes32ToBytes58(carCIDb32);
      let metadataURICar = ipfs.cat(carCID);

      let jsonObject = await Uint8ArrayToJSON(metadataURICar);

      console.log(jsonObject)

      // Take the image CID of the car 
      let carImageCID = jsonObject.ImageCID;
      console.log(carImageCID);
      setImageCID(carImageCID);

      console.log("The items you have on your car:");

      // Showing equipped items
      var headlightsCID = jsonObject.items.headlights;
      var spoilerCID = jsonObject.items.spoiler;
      var rimCID = jsonObject.items.rim;
      var wrapCID = jsonObject.items.wrap;
      var tinted_windowsCID = jsonObject.items.tinted_windows;

      // For each item: if the item is applied on the car show its metadata, else "standard item" string

      let metadataURIheadlights = ipfs.cat(headlightsCID);
      if (headlightsCID != "") {
        console.log(Uint8ArrayToJSON(metadataURIheadlights))
      }
      else {
        console.log("Standard headlights")
      }
      let metadataURIspoiler = ipfs.cat(spoilerCID);
      if (spoilerCID != "") {
        console.log(Uint8ArrayToJSON(metadataURIspoiler))
      }
      else {
        console.log("Standard spoiler")
      }
      let metadataURIrim = ipfs.cat(rimCID);
      if (rimCID != "") {
        console.log(Uint8ArrayToJSON(metadataURIrim))
      }
      else {
        console.log("Standard rim")
      }
      let metadataURIwrap = ipfs.cat(wrapCID);
      if (wrapCID != "") {
        console.log(Uint8ArrayToJSON(metadataURIwrap))
      }
      else {
        console.log("Standard wrap")
      }
      let metadataURItinted_windows = ipfs.cat(tinted_windowsCID);
      if (tinted_windowsCID != "") {
        console.log(Uint8ArrayToJSON(metadataURItinted_windows))
      }
      else {
        console.log("No tinted windows")
      }

      // Get metadata CIDs of the user's items
      const CIDs = await contract.getMyItemsCIDs(account)
      console.log(CIDs)
      for (let i = 0; i < CIDs.length; i++) {
        console.log(convertBytes32ToBytes58(CIDs[i]))
      }

      // Create the arrays of the metadata CIDs of applied and not applied items
      let myAppliedItems = [spoilerCID, rimCID, wrapCID, tinted_windowsCID, headlightsCID];
      let myNotAppliedItems = [];
      for (let i = 0; i < CIDs.length; i++) {
        let notAppliedCID = convertBytes32ToBytes58(CIDs[i])
        if (!notAppliedCID.includes(myAppliedItems)) {
          myNotAppliedItems.push(notAppliedCID);
        }
      }
      console.log(myAppliedItems)
      console.log(myNotAppliedItems)

    }
  }

  const applyItem = async (itemMetadataCID) => {

    // Transaction payment of the item application
    const result = await contractWithSigner.payToApplyItem({
      from: address,
      value: ethers.utils.parseEther('0.05'),
    });
    console.log(result)
    await result.wait();

    // Take the input item metadata
    let itemMetadataURI = ipfs.cat(itemMetadataCID);
    let jsonObjectItem = await Uint8ArrayToJSON(itemMetadataURI);
    // Discover the item type to be applied
    let itemType = jsonObjectItem.type;

    // Take the current metadata of the user car
    let carID = await contract.getCarID(address);
    let carCIDb32 = await contract.getCarCID(carID);
    let carCID = convertBytes32ToBytes58(carCIDb32);
    let metadataURICar = ipfs.cat(carCID);
    let jsonObjectCar = await Uint8ArrayToJSON(metadataURICar);

    // Substitute the current metadata CID of the specific type with the new one in the car metadata
    jsonObjectCar.items[itemType] = itemMetadataCID;

    // Take the metadata CID of the applied and not applied items of the car
    var headlightsCID = jsonObjectCar.items.headlights;
    var spoilerCID = jsonObjectCar.items.spoiler;
    var rimCID = jsonObjectCar.items.rim;
    var wrapCID = jsonObjectCar.items.wrap;
    var tinted_windowsCID = jsonObjectCar.items.tinted_windows;

    // If an item is applied, push its image CID in the listItemsImageCIDs array

    let listItemsImageCIDs = [];

    let metadataURIheadlights = ipfs.cat(headlightsCID);
    if (headlightsCID != "") {
      let json = await Uint8ArrayToJSON(metadataURIheadlights);
      listItemsImageCIDs.push(json.imageCID)
    }

    let metadataURIspoiler = ipfs.cat(spoilerCID);
    if (spoilerCID != "") {
      let json = await Uint8ArrayToJSON(metadataURIspoiler);
      listItemsImageCIDs.push(json.imageCID)
    }

    let metadataURIrim = ipfs.cat(rimCID);
    if (rimCID != "") {
      let json = await Uint8ArrayToJSON(metadataURIrim);
      listItemsImageCIDs.push(json.imageCID)
    }

    let metadataURIwrap = ipfs.cat(wrapCID);
    if (wrapCID != "") {
      let json = await Uint8ArrayToJSON(metadataURIwrap);
      listItemsImageCIDs.push(json.imageCID)
    }

    let metadataURItinted_windows = ipfs.cat(tinted_windowsCID);
    if (tinted_windowsCID != "") {
      let json = await Uint8ArrayToJSON(metadataURItinted_windows);
      listItemsImageCIDs.push(json.imageCID)
    }

    console.log(listItemsImageCIDs);

    // Merge of the image - Pass the image CIDs array to the fetchComposite function 
    // (it will call the CryptoWheels-ImageComposition BE) 

    let imageBase64 = await fetchComposite(listItemsImageCIDs)

    // Upload of the new merged image to IPFS

    let mergedImageCID;
    await ipfs.add(Buffer.from(imageBase64, 'base64')).then((response) => {
      mergedImageCID = response.path;
      console.log(mergedImageCID);
    });

    // Unpin of old image from IPFS, except for stock car image CID 
    let stockCarImageCID = "QmVz6CoMLu6iFy87T1fmHRPbX5iF3zuWMetD7DLMAAamWm";
    if (jsonObjectCar.ImageCID != stockCarImageCID) {
      ipfs.pin.rm(jsonObjectCar.ImageCID);
    }

    // Update the current metadata of the car to subsitute the image CID with the new merged one
    jsonObjectCar.ImageCID = mergedImageCID;

    // Upload of the updated car metadata to IPFS  
    let mergedCarMetadataCID;
    await ipfs.add(Buffer.from(JSON.stringify(jsonObjectCar))).then((response) => {
      mergedCarMetadataCID = response.path;
      console.log(mergedCarMetadataCID);
    });

    // Unpin of old metadata CID of the car from IPFS
    ipfs.pin.rm(carCID);


    // Update the metadata CID of the car on the respective blockchain mapping

    // Create a Wallet using the private key of the contract address
    // SetCarCID function must be called and authorized from the contract address itself (not by the user)

    const privateKeyContract = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    const walletContract = new ethers.Wallet(privateKeyContract, provider);

    // Create the contract
    const contractToContract = new ethers.Contract(contractAddress, CryptoWheels.abi, walletContract);

    // Call the setCarCID updating function of the contract
    let transaction = await contractToContract.setCarCID(jsonObjectCar.id, hashToBytes32(mergedCarMetadataCID));
    await transaction.wait();

    // Call myCar function to update states and graphic components
    await myCar();

  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {!minted ? (
        <button className="btn btn-primary w-50" onClick={myCar}>
          START PLAY BUILDING YOUR CAR
        </button>
      ) : (
        <div>
          <img src={`https://crypto-wheels.infura-ipfs.io/ipfs/${imageCID}`} alt="Immagine" />
          <button className="btn btn-primary w-50" onClick={() => applyItem('QmTGojj7cQyzkbnqUrA9PonT1ME3KzdgkU5eG4GYL7sAby')}>
            MONTA PEZZO
          </button>
        </div>
      )}
    </div>
  );

}
export default Garage;