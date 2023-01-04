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

import axios from 'axios';

const fetchComposite = async (cidArray) => {
  try {
    console.log(cidArray);
    axios.defaults.headers.post['Content-Type'] = 'application/json';
    // Invia una richiesta HTTP POST al backend con l'array di CID come corpo della richiesta
    let response = await axios.post('http://localhost:3001/create-composite', cidArray);
    // Riceve il composite in formato JPEG come risposta
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
  //const [mergedImageCID, setMergedImageCID] = useState();

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
    console.log(carID)
    let carCIDb32 = await contract.getCarCID(carID);
    console.log(carCIDb32)

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

      const result = await contractWithSigner.payToMintCar(account, metadataURICar, metadataURICar_b32, {
        from: account,
        value: ethers.utils.parseEther('0.05'),
      });
      await result.wait();

      console.log(await contract.fetchMyNFTItems(account));
      
      const isMinted = await isCarMinted(account);
      setMinted(isMinted);

    } else {

      console.log("ELSE")

      let carCID = convertBytes32ToBytes58(carCIDb32);
      let metadataURICar = ipfs.cat(carCID);

      let jsonObject = await Uint8ArrayToJSON(metadataURICar);

      console.log(jsonObject)

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
    const result = await contractWithSigner.payToApplyItem({
      from: address,
      value: ethers.utils.parseEther('0.05'),
    });
    console.log(result)
    await result.wait();

    // Prendersi l'imageCID itemImageCID = json.ImageURI
    let itemMetadataURI = ipfs.cat(itemMetadataCID);
    let jsonObjectItem = await Uint8ArrayToJSON(itemMetadataURI);
    //let itemImageCID = jsonObjectItem.imageCID; 
    let itemType = jsonObjectItem.type;

        // Prendiamo il json della macchina attuale 
    let carID = await contract.getCarID(address);
    let carCIDb32 = await contract.getCarCID(carID);
    let carCID = convertBytes32ToBytes58(carCIDb32);
    let metadataURICar = ipfs.cat(carCID);
    let jsonObjectCar = await Uint8ArrayToJSON(metadataURICar);

    // Sostuiamo il valore corrente del json con quello nuovo
    jsonObjectCar.items[itemType] = itemMetadataCID;
    
    // Prendiamo i json degli item applicati e non applicati
    var headlightsCID = jsonObjectCar.items.headlights;
    var spoilerCID = jsonObjectCar.items.spoiler;
    var rimCID = jsonObjectCar.items.rim;
    var wrapCID = jsonObjectCar.items.wrap;
    var tinted_windowsCID = jsonObjectCar.items.tinted_windows;

    // Se un item è applicato aggiungo il CID della sua immagine alla lista listItemsImageCIDs

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
    // Merge dell'immagine - prendo tutti gli imageCid della lista e li mergio componendo le url    

    // Caricamento dell'immagine su IPFS
    
    //let mergedImageCID;
    let imageBase64 = await fetchComposite(listItemsImageCIDs)
    //imageBase64 = "data:image/png;base64," + imageBase64;

    //let imageBuffer = Buffer.from(imageBase64, 'base64');
    //let mergedImageCID = await uploadCompositeToIPFS(composite)
    
    let mergedImageCID; 
    await ipfs.add(Buffer.from(imageBase64, 'base64')).then((response) => {
      //console.log(response.path); // Stampa l'hash del file caricato su IPFS
      mergedImageCID = response.path;
      console.log(mergedImageCID);      
    });

    //setMergedImageCID(mergedImageCID);

    //INSERIRE UNPIN DELL IMMAGINE DA INFURA ------------------------- IMPORTANTE!!!

    // Aggiornare il json della macchina per mettere il CID del pezzo in items
    jsonObjectCar.ImageCID = mergedImageCID;

    // Caricamento del json 
    let mergedCarMetadataCID;
    await ipfs.add(Buffer.from(JSON.stringify(jsonObjectCar))).then((response) => {
      //console.log(response.path); // Stampa l'hash del file caricato su IPFS
      mergedCarMetadataCID = response.path;
      console.log(mergedCarMetadataCID);
    });

    // Aggiorniamo il CID del json della macchina aggiornata sul mapping della blockchain 

    // Instanziamo il wallet usando la chiave privata dell'indirizzo del contratto 
    // SetCarCID deve essere chiamata dal contratto stesso e non deve essere pagata dall'utente

    const privateKeyContract = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    const walletContract = new ethers.Wallet(privateKeyContract, provider);

    // Crea un contratto
    const contractToContract = new ethers.Contract(contractAddress, CryptoWheels.abi, walletContract);
    
    let transaction = await contractToContract.setCarCID(jsonObjectCar.id, hashToBytes32(mergedCarMetadataCID));
    await transaction.wait();

    // Chiamata a myCar per aggiornare gli stati
    await myCar();
    
    // Reload della pagina per ricaricare l'immagine
    //window.location.reload(false);

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
          <button className="btn btn-primary w-50" onClick={() => applyItem('QmV2M9ug64uux3Vv8cWnC25bhZ8RfQtE68PwRkvjA2B1By')}>
            MONTA PEZZO
          </button>   
        </div>
      )}
    </div>
  );

}
export default Garage;