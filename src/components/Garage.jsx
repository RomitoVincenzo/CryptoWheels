import React from 'react';
import { ethers } from 'ethers';
import CryptoWheels from '../artifacts/contracts/MyNFT.sol/CryptoWheels.json';
import { Buffer } from 'buffer';
import { create } from 'ipfs-http-client';
import { } from 'react-bootstrap';
import { useEffect, useState } from 'react';


const contractAddress = '0x5fbdb2315678afecb367f032d93f642f64180aa3';
//const provider = new ethers.providers.Web3Provider(window.ethereum);
// get the end user
//const signer = provider.getSigner(contractAddress);

//const provider = new ethers.providers.JsonRpcProvider();
//
//// The provider also allows signing transactions to
//// send ether and pay to change state within the blockchain.
//// For this, we need the account signer...
//const signer = provider.getSigner()
//
//// get the smart contract
//const contract = new ethers.Contract(contractAddress, CryptoWheels.abi, signer);

const provider = new ethers.providers.Web3Provider(window.ethereum);

// get the end user
const signer = provider.getSigner();

// get the smart contract
const contract = new ethers.Contract(contractAddress, CryptoWheels.abi, signer);

import data from '../../json/car.json';

// auth for infura ipfs
const projectId = "2JVlWNoBt7obNfNCez9i4txG2sN";
const projectSecret = "8a4515934d69006beba5bc9c17696dee";
const authorization = "Basic " + btoa(projectId + ":" + projectSecret);
// create the connection to infura ipfs
const ipfs = create({ host: 'ipfs.infura.io', port: 5001, protocol: 'https', headers: { authorization } });

async function Uint8ArrayToJSON(Uint8Array) {
  let decoder = new TextDecoder()
  let data = ''
  for await (const chunk of Uint8Array) {
    data += decoder.decode(chunk, { stream: true })
  }

  return JSON.parse(data)
}

export function hashToBytes32(hash) {
  const result = ethers.utils
    .hexlify(
      ethers.utils.base58
        .decode(hash)
        .slice(2)
    );
  return result;
}

export function convertBytes32ToBytes58(bytes32) {
  const result = ethers.utils.base58.encode(
    Buffer.from("1220" + bytes32.slice(2), "hex")
  );
  return result;
}

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

function Garage() {

  const [imageCID, setImageCID] = useState();
  const [minted, setMinted] = useState(false);
  const [address, setAddress] = useState();

  // Effect necessario per far si che la pagina sia aggiornata quando la macchina viene mintata (fine if) 
  useEffect(() => {
    async function checkMinted() {
      const requestAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = requestAccounts[0];
      const isMinted = await isCarMinted(account);
      setMinted(isMinted);
    }
    checkMinted();
  }, [minted]);

  // Effetto necessario per far si che se la macchina è stata mintata venga comunque lanciata la funzione myCar 
  // (nel caso in cui la macchina non è mintata, myCar viene chiamata con il click del bottone)
  useEffect(() => {
    if (minted) {
      myCar();
    }
  }, [minted]);
  
  const myCar = async () => {

    const requestAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const account = requestAccounts[0];
    setAddress(account);

    let carID = await contract.getCarID(account);
    let carCIDb32 = await contract.getCarCID(carID);

    if (carCIDb32 == 0) {
      //DO NOT ADD THE IMAGE BEFORE TRANSACTION IS COMPLETED (CRITICAL)
      console.log("IF");
      const loadedData = JSON.stringify(data);
      const jsonObject = JSON.parse(loadedData);
      jsonObject.owner = account;
      let nextID = await contract.getNextItemID()
      jsonObject.id = nextID.toNumber();
      const current = new Date();
      const date = `${current.getDate()}-${current.getMonth() + 1}-${current.getFullYear()}`;
      jsonObject.minting_date = date.toString();
      // upload of the json to ipfs and get of the hash
      let metadataURICar;
      await ipfs.add(Buffer.from(JSON.stringify(jsonObject))).then((response) => {
        //console.log(response.path); // Stampa l'hash del file caricato su IPFS
        metadataURICar = response.path;
        console.log(metadataURICar);
      });

      let metadataURICar_b32 = hashToBytes32(metadataURICar);

      const result = await contract.payToMintCar(account, metadataURICar, metadataURICar_b32, {
        value: ethers.utils.parseEther('0.05'),
      });
      await result.wait();

      console.log(await contract.fetchMyNFTItems(account));
      
      const isMinted = await isCarMinted(account);
      setMinted(isMinted);

    } else {

      let carCID = convertBytes32ToBytes58(carCIDb32);
      let metadataURICar = ipfs.cat(carCID);

      let jsonObject = await Uint8ArrayToJSON(metadataURICar);

      let carImageCID = jsonObject.ImageCID;
      console.log(carImageCID);
      setImageCID(carImageCID);

      console.log("The items you have on your car:");

      //showing equipped items
      var headlightsCID = jsonObject.items.headlights;
      var spoilerCID = jsonObject.items.spoiler;
      var rimCID = jsonObject.items.rim;
      var wrapCID = jsonObject.items.wrap;
      var tinted_windowsCID = jsonObject.items.tinted_windows;
      let metadataURIheadlights = ipfs.cat(headlightsCID);
      
      if (headlightsCID != "") {
        console.log(Uint8ArrayToJSON(metadataURIheadlights))
        //show image
      }
      else {
        console.log("Standard headlights")
      }
      let metadataURIspoiler = ipfs.cat(spoilerCID);
      if (spoilerCID != "") {
        console.log(Uint8ArrayToJSON(metadataURIspoiler))
        //show image
      }
      else {
        console.log("Standard spoiler")
      }
      let metadataURIrim = ipfs.cat(rimCID);
      if (rimCID != "") {
        console.log(Uint8ArrayToJSON(metadataURIrim))
        //show image
      }
      else {
        console.log("Standard rim")
      }
      let metadataURIwrap = ipfs.cat(wrapCID);
      if (wrapCID != "") {
        console.log(Uint8ArrayToJSON(metadataURIwrap))
        //show image
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
      
      const CIDs = await contract.getItemToCID(account)
      console.log(CIDs)
      for (let i = 0; i < CIDs.length; i++) {
        console.log(convertBytes32ToBytes58(CIDs[i]))
      }

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
  
    // Transazione pagamento dell'applicazione 
    const result = await contract.payToMintCar({
      value: ethers.utils.parseEther('0.05'),
    });
    await result.wait();

    // Prendersi l'imageCID itemImageCID = json.ImageURI
    let itemMetadataURI = ipfs.cat(itemMetadataCID);
    let jsonObjectItem = await Uint8ArrayToJSON(itemMetadataURI);
    let itemImageCID = jsonObjectItem.imageCID; 
    let itemType = jsonObjectItem.type;

    // Prendiamo il json della macchina attuale 
    let carID = await contract.getCarID(address);
    let carCIDb32 = await contract.getCarCID(carID);
    let carCID = convertBytes32ToBytes58(carCIDb32);
    let metadataURICar = ipfs.cat(carCID);
    let jsonObjectCar = await Uint8ArrayToJSON(metadataURICar);

    //let newJson = jsonObjectCar.items.${itemType}

    // Merge dell'immagine (da zero, )

    // Prendiamo item applicati e non applicati 
    
    let myAppliedItems = [spoilerCID, rimCID, wrapCID, tinted_windowsCID, headlightsCID]; 
    

    // Caricamento dell'immagine su IPFS
    // Aggiornare il json della macchina per mettere il CID del pezzo in items
    // e l'immagine della nuova macchina
    // Caricamento del json 
    // Transazione con aggiornamento del mapping carToCID (setCarCid)
    // Chiamata a myCar per aggiornare le componenti grafiche

  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {!minted ? (
        <button className="btn btn-primary w-50" onClick={myCar}>
          START PLAY BUILDING YOUR CAR
        </button>
      ) : (
        <img src={`https://crypto-wheels.infura-ipfs.io/ipfs/${imageCID}`} alt="Immagine" />
      )}
    </div>
  );

}
export default Garage;