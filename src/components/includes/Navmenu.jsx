import React from 'react'
import { Nav, Navbar } from 'react-bootstrap';
import logo from '../../../assets/images/logo.png';
import logoCW from '../../../assets/images/logo_cryptowheels.png';
import CustomCss from "../../../css/custom.css";
import * as Icon from 'react-bootstrap-icons';
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { ethers } from 'ethers';
import CryptoWheels from '../../artifacts/contracts/MyNFT.sol/CryptoWheels.json';
import { create } from 'ipfs-http-client';
import { Buffer } from 'buffer';
// Import car json template
import data from '../../../json/car.json';
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

// auth for infura ipfs
const projectId = "2JVlWNoBt7obNfNCez9i4txG2sN";
const projectSecret = "8a4515934d69006beba5bc9c17696dee";
const authorization = "Basic " + btoa(projectId + ":" + projectSecret);
// create the connection to infura ipfs
const ipfs = create({ host: 'ipfs.infura.io', port: 5001, protocol: 'https', headers: { authorization } });

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

function Navmenu() {
  const [imageCID, setImageCID] = useState();
  const [minted, setMinted] = useState(false);
  const [address, setAddress] = useState();
  const [notAppliedNFTs, setNotAppliedNFTs] = useState([])
  const [appliedNFTs, setAppliedNFTs] = useState([])

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
    let carCIDb32 = await contract.getCarCID(carID);

    // Check if the user has not already minted is car
    if (carCIDb32 == 0) {
      //DO NOT ADD THE IMAGE AND THE METADATA BEFORE TRANSACTION IS COMPLETED (CRITICAL)
      

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
      });

      // Convert the new metadata CID to bytes32 in order to be correctly stored in the blockchain mapping
      let metadataURICar_b32 = hashToBytes32(metadataURICar);

      try {
        // Payment of minting car operation
        const result = await contractWithSigner.payToMintCar(account, metadataURICar, metadataURICar_b32, {
          from: account,
          value: ethers.utils.parseEther('0.05'),
        });
        await result.wait();
      } catch (error) {
        // If the transaction fails, unpin the car metadata
        ipfs.pin.rm(metadataURICar)
      }

      // Update the minted state
      const isMinted = await isCarMinted(account);
      setMinted(isMinted);

    } else {

      // Load metadata of the current user car
      let carCID = convertBytes32ToBytes58(carCIDb32);
      let metadataURICar = ipfs.cat(carCID);

      let jsonObject = await Uint8ArrayToJSON(metadataURICar);

      // Take the image CID of the car 
      let carImageCID = jsonObject.ImageCID;
      setImageCID(carImageCID);

      // Showing equipped items
      var headlightsCID = jsonObject.items.headlights;
      var spoilerCID = jsonObject.items.spoiler;
      var rimCID = jsonObject.items.rim;
      var wrapCID = jsonObject.items.wrap;
      var tinted_windowsCID = jsonObject.items.tinted_windows;

      let myAppliedItems = []
      // For each item: if the item is applied on the car show its metadata, else "standard item" string

      if (headlightsCID != "QmQ7aZ3RwkwQ8n5PHuxfvAQStUZDMqQMiaFptNJKq16SL8") {
        myAppliedItems.push(headlightsCID)
      }
      else {
      }
      if (spoilerCID != "QmXCN9eFs1u9pyJ82bPc3CpnUhZu6HR8LerqMQNjLErPLe") {
        myAppliedItems.push(spoilerCID)
      }
      else {
      }
      if (rimCID != "") {
        myAppliedItems.push(rimCID);
      }
      else {
      }
      if (wrapCID != "") {
        myAppliedItems.push(wrapCID);
      }
      else {
      }
      if (tinted_windowsCID != "") {
        myAppliedItems.push(tinted_windowsCID);
      }
      else {
      }

      // Get metadata CIDs of the user's items
      let CIDs = await contract.getMyItemsCIDs(account)
      CIDs = CIDs.map(cid => convertBytes32ToBytes58(cid))

      // Create the arrays of the metadata CIDs of applied and not applied items
      let myNotAppliedItems = [];
      for (let i = 0; i < CIDs.length; i++) {
        let notAppliedCID = CIDs[i]
        if (!myAppliedItems.includes(notAppliedCID)) {
          myNotAppliedItems.push(notAppliedCID);
        }
      }

      // Define item parameters object from metadata 
      const notAppliedItems = await Promise.all(myNotAppliedItems.map(cid => itemMapping(cid)))
      const appliedItems = await Promise.all(myAppliedItems.map(cid => itemMapping(cid)))

      // Update the states
      setNotAppliedNFTs(notAppliedItems);
      setAppliedNFTs(appliedItems);

    }
  }
  return (
    <Navbar style={{ fontSize: "1rem",background:"#0B0F3F", }} bg="" variant="dark" expand="sm">
        <NavLink to="/" style={{ fontSize: "1.5rem", marginLeft: "1rem" }} className="navbar-brand text-gold fw-bold">
            <img
                src={logoCW}
                width="30"
                height="30"
                className="d-inline-block me-1"
                alt="Cryptowheels Logo"
            />
            CryptoWheels
        </NavLink>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto">
          {minted ? (
              <NavLink style={{ marginLeft: "1rem" }} to="/unbox" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              <Icon.Gift className='me-2 nav-icon'></Icon.Gift>
              Unbox
            </NavLink>
          ) : (
            <div>
              
            </div>
          )}
            
            <NavLink style={{ marginLeft: "1rem" }} to="/garage" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              <Icon.CarFront className='me-2 nav-icon'></Icon.CarFront>
              Garage
            </NavLink>

            {minted ? (
              <NavLink style={{ marginLeft: "1rem" }} to="/marketplace" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              <Icon.Shop className='me-2 nav-icon'></Icon.Shop>
              Marketplace
            </NavLink>
          ) : (
            <div>
              
            </div>
          )}  
            
          </Nav>
        </Navbar.Collapse>
       
    </Navbar>
    
  )
}

export default Navmenu;