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
    const privateKeyContract = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    const walletContract = new ethers.Wallet(privateKeyContract, provider);
    const contractToContract = new ethers.Contract(contractAddress, CryptoWheels.abi, walletContract);
    let currentContractNonce = contractToContract.getContractNonce()
    let removeTransaction = await contractToContract.removeMarketItem(itemId, address, {
      nonce: currentContractNonce
    });
    await removeTransaction.wait();

    // Reload the items
    await loadListedNFTs();
  }

  return (
    <div style={{background:"#F6F6F6"}}>
      <Navmenu></Navmenu>
      <div className="container py-5 vh-100">
      <h1 className='fw-bold'> My Listed Items</h1>
        <div className="row mt-4">
            {
              myListedNFTs.map((nft, i) => (
                <div key={i} className="col-3 my-2 overflow-hidden ">
                  <div className="box p-3 hoverable">
                    <div className="text-center">
                      <img src={`https://crypto-wheels.infura-ipfs.io/ipfs/${nft.imageCID}`} className="img-thumbnail" />
                    </div>
                    <div className="py-3 overflow-hidden">
                      <div className="row">
                        <div className="col-6">
                          <p className="fw-bolder fs-3 text-app"> ID # {nft.itemId}</p>
                        </div>
                        <div className="col-6">
                          <p className="fw-bold fst-italic fs-3 text-success text-end"> {nft.price} ETH</p>
                        </div>
                      </div>
                      
                      {/* <p className="font-bold"> Seller - {nft.seller}</p> */}
                      
                      <button className="btn btn-danger col-12" onClick={() => removeItem(nft.itemId)}>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            }
        </div>
        <h1 className='fw-bold mt-4'> Marketplace Items</h1>
        <div className="row  mt-4">
              {
                listedNFTs.map((nft, i) => (
                  <div key={i} className="col-3 my-2 overflow-hidden ">
                    <div className="hoverable box p-3">
                    <div className="text-center">
                      <img src={`https://crypto-wheels.infura-ipfs.io/ipfs/${nft.imageCID}`} className="img-thumbnail" />
                    </div>
                    <div className="py-3 overflow-hidden">
                      <div className="row">
                        <div className="col-6">
                          <p className="fw-bolder fs-3 text-app"> ID # {nft.itemId}</p>
                        </div>
                        <div className="col-6">
                          <p className="fw-bold fst-italic fs-3 text-success text-end"> {nft.price} ETH</p>
                        </div>
                      </div>
                      <button className="btn btn-primary col-12" onClick={() => purchaseItem(nft.itemId, nft.price)}>
                        Purchase
                      </button>
                    </div>
                    </div>
                  </div>
                ))
              }
        </div>
      </div>
      
    </div>
  )
}

export default Marketplace;