import React from 'react';
import { ethers } from 'ethers';
import CryptoWheels from '../artifacts/contracts/MyNFT.sol/CryptoWheels.json';
import { Buffer } from 'buffer';
import { create } from 'ipfs-http-client';
import { } from 'react-bootstrap';

const contractAddress = '0x5fbdb2315678afecb367f032d93f642f64180aa3';
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

function Garage() {

  const myCar = async () => {
    const connection = contract.connect(signer);
    // address of current user
    const account = connection.address;
    
    let carCIDb32 = await contract.getCarCID(account);
    let carCID = convertBytes32ToBytes58(carCIDb32);
    console.log(carCID)

    if (carCID == 0) {
        
        const loadedData = JSON.stringify(data);
        const jsonObject = JSON.parse(loadedData);
        
        // upload of the json to ipfs and get of the hash
        let metadataURICar;
        await ipfs.add(Buffer.from(JSON.stringify(jsonObject))).then((response) => {
          //console.log(response.path); // Stampa l'hash del file caricato su IPFS
          metadataURICar = response.path;
        });

        let metadataURICar_b32 = hashToBytes32(metadataURICar);
        contract.setCarCID(account, metadataURICar_b32);

    } else {

        let metadataURICar = ipfs.get(carCID);
        //prendiamo il CID dal car.json
        const loadedData = JSON.stringify(metadataURICar);
        const jsonObject = JSON.parse(loadedData); 

        let carImageCID = jsonObject.ImageCID;
        console.log(carImageCID)
    }

  }


  return (
    <button className="btn btn-primary w-100" onClick={myCar}>
        YOUR CAR
    </button>
  );
}

export default Garage;