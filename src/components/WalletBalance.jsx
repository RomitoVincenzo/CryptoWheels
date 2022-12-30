import { useState } from 'react';
import { ethers } from 'ethers';
import CryptoWheels from '../artifacts/contracts/MyNFT.sol/CryptoWheels.json';

const contractAddress = '0x5fbdb2315678afecb367f032d93f642f64180aa3';
const provider = new ethers.providers.Web3Provider(window.ethereum);
// get the end user
const signer = provider.getSigner();
// get the smart contract
const contract = new ethers.Contract(contractAddress, CryptoWheels.abi, signer);

function WalletBalance() {

    const connection = contract.connect(signer);
    // address of current user
    const account = connection.address;

    const [balance, setBalance] = useState();

    const getBalance = async () => {
        const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const balance = await provider.getBalance(account);
        setBalance(ethers.utils.formatEther(balance));
    };
  
    return (
      <div className="card text-center">
        <div className="card-body">
          <h5 className="card-title">Your Address: {account}</h5>
          <h5 className="card-title">Your Balance: {balance}</h5>
          <button className="btn btn-success" onClick={() => getBalance()}>
            Show My Balance
          </button>
        </div>
      </div>
    );
  };
  
  export default WalletBalance;