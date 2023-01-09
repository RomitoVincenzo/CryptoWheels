import React from 'react';
import { ethers } from 'ethers';
import CryptoWheels from '../artifacts/contracts/MyNFT.sol/CryptoWheels.json';
import { Buffer } from 'buffer';
import { create } from 'ipfs-http-client';
import { } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import Navmenu from './includes/Navmenu';
import '../../additional_modules/PurePopup/purePopup.js'
import '../../additional_modules/PurePopup/purePopup.css'

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

export function convertBytes32ToBytes58(bytes32) {
  const result = ethers.utils.base58.encode(
    Buffer.from("1220" + bytes32.slice(2), "hex")
  );
  return result;
}

function Marketplace() {

  // States configuration
  const [listedNFTs, setListedNFTs] = useState([])
  const [myListedNFTs, setMyListedNFTs] = useState([])
  const [address, setAddress] = useState();

  // Effect needed to start NFTs load function when the page is load
  useEffect(() => {
    loadListedNFTs()
  }, [])

  // Market Item construction from Market Item Object of the contract
  const listedNFTsMapping = async (i) => {
    let item = {
      itemId: i.itemId.toNumber(),
      imageCID: convertBytes32ToBytes58(i.imageCID),
      seller: i.seller,
      owner: i.owner,
      price: i.price.toNumber(),
      sold: i.sold
    }
    return item
  }

  const loadListedNFTs = async () => {

    const requestAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const account = requestAccounts[0];
    setAddress(account);

    // Get from the contract all the Market Items
    let fetch = await contractWithSigner.fetchMarketItems();
    const nfts = await Promise.all(fetch.map(item => listedNFTsMapping(item)))

    let addressListedItems = []
    let listedItems = []

    // For each Market Item: 
    // if it is listed by the current user add to addressListedItems array
    // otherwise to the general listedItems array 

    nfts.forEach(async (marketItem) => {
      console.log(marketItem.seller.toLowerCase())
      if (marketItem.seller.toLowerCase() == account.toString()) {
        addressListedItems.push(marketItem)
      } else {
        listedItems.push(marketItem)
      }
    })

    // Update the states
    setListedNFTs(listedItems);
    setMyListedNFTs(addressListedItems)

  }

  const purchaseItem = async (itemId, price) => {
    // Call the contract function to purchase the item
    const purchaseTransaction = await contractWithSigner.purchaseMarketItem(itemId, {
      from: address,
      value: ethers.utils.parseEther(price.toString()),
    });
    await purchaseTransaction.wait();

    // Reload the items
    await loadListedNFTs();
  }

  const removeItem = async (itemId) => {
    // Call the contract function to purchase the item
    const removeTransaction = await contractWithSigner.removeMarketItem(itemId, {
      from: address,
    });
    await removeTransaction.wait();

    // Reload the items
    await loadListedNFTs();
  }

  return (
    <div>
      <Navmenu></Navmenu>
      <h1> MY LISTED ITEMS</h1>
      <div className="flex justify-center">
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {
              myListedNFTs.map((nft, i) => (
                <div key={i} className="border shadow rounded-xl overflow-hidden">
                  <img src={`https://crypto-wheels.infura-ipfs.io/ipfs/${nft.imageCID}`} width="500" className="rounded" />
                  <div className="p-4 bg-black">
                    <p className="text-2xl font-bold text-white"> ID - {nft.itemId}</p>
                    <p className="text-2xl font-bold text-white"> Seller - {nft.seller}</p>
                    <p className="text-2xl font-bold text-white"> PRICE - {nft.price}</p>
                    <button className="mt-4 w-full bg-pink-500 text-white font-bold py-2 px-12 rounded" onClick={() => removeItem(nft.itemId)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
      <h1> LOADED MARKETPLACE ITEMS</h1>
      <div className="flex justify-center">
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {
              listedNFTs.map((nft, i) => (
                <div key={i} className="border shadow rounded-xl overflow-hidden">
                  <img src={`https://crypto-wheels.infura-ipfs.io/ipfs/${nft.imageCID}`} width="500" className="rounded" />
                  <div className="p-4 bg-black">
                    <p className="text-2xl font-bold text-white"> ID - {nft.itemId}</p>
                    <p className="text-2xl font-bold text-white"> Seller - {nft.seller}</p>
                    <p className="text-2xl font-bold text-white"> PRICE - {nft.price}</p>
                    <button className="mt-4 w-full bg-pink-500 text-white font-bold py-2 px-12 rounded" onClick={() => purchaseItem(nft.itemId, nft.price)}>
                      Purchase
                    </button>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  )
}

export default Marketplace;