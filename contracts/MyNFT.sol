// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "hardhat/console.sol";

contract CryptoWheels is ERC721, ERC721URIStorage {
    using Counters for Counters.Counter;

    struct MarketItem {
        uint256 itemId;
        bytes32 imageCID;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
    }

    address payable contractOwner;
    Counters.Counter private _itemIdCounter;
    Counters.Counter private _itemsSelling;
    uint256 private contractNonce = 1;
    mapping(uint256 => address) public itemToOwner;
    mapping(address => uint256) public ownerToCar;
    mapping(uint256 => bytes32) public carToCID;
    mapping(uint256 => bytes32) public itemToCID;
    mapping(uint256 => MarketItem) public idToMarketItem;

    constructor() ERC721("CryptoWheels", "CW") {
        contractOwner = payable(msg.sender);
    }

    function _baseURI() internal pure override returns (string memory) {
        return "";
    }

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    function getContractNonce() public view returns (uint256) {
        return contractNonce;
    }

    function getCarCID(uint256 carID) public view returns (bytes32) {
        return carToCID[carID];
    }

    function getCarID(address addr) public view returns (uint256) {
        return ownerToCar[addr];
    }

    function setCarCID(uint256 carID, bytes32 carCID) public {
        require(msg.sender == contractOwner, "You cannot call this function!");
        carToCID[carID] = carCID;
        contractNonce = contractNonce + 1;
    }

    function getItemCID(uint256 itemID) public view returns (bytes32) {
        return itemToCID[itemID];
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function getNextItemID() public view returns (uint256) {
        return _itemIdCounter.current() + 1;
    }

    function createMarketItem(
        uint256 itemId,
        bytes32 imageCID,
        uint256 price,
        uint256 listingPrice //5% of the price
    ) public payable {
        require(price > 0, "Price must be greater than 0 ether");
        require(
            msg.value >= listingPrice,
            "Price must be equal to listing price"
        );
        require(itemToOwner[itemId] == msg.sender, "You cannot call this function");

        idToMarketItem[itemId] = MarketItem(
            itemId,
            imageCID,
            payable(msg.sender),
            payable(contractOwner),
            price,
            false
        );
        _transfer(msg.sender, contractOwner, itemId);
        itemToOwner[itemId] = contractOwner;
        _itemsSelling.increment();
    }

    function purchaseMarketItem(uint256 itemId) public payable {
        uint256 price = idToMarketItem[itemId].price;
        address seller = idToMarketItem[itemId].seller;
        require(
            msg.value == price * (1 ether),
            "Please submit the asking price in order to complete the purchase"
        );
        idToMarketItem[itemId].owner = payable(msg.sender);
        idToMarketItem[itemId].sold = true;
        _transfer(contractOwner, msg.sender, itemId);
        payable(seller).transfer(msg.value);
        itemToOwner[itemId] = msg.sender;
        _itemsSelling.decrement();
    }

    function removeMarketItem(uint256 itemId, address seller) public {
        require(
            idToMarketItem[itemId].seller == seller,
            "This is not the owner of the NFT"
        );
        _transfer(contractOwner, seller, itemId);
        itemToOwner[itemId] = seller;
        _itemsSelling.decrement();
        contractNonce = contractNonce + 1;
    }

    function payToMint(
        address recipient,
        string memory metadataURI, //json cid
        bytes32 itemMetadataURIb32
    ) public payable returns (uint256) {
        require(msg.value >= 0.1 ether, "Need to pay up!");
        require(ownerToCar[recipient]!=0, "You've not minted your car!");

        _itemIdCounter.increment();
        uint256 newItemId = _itemIdCounter.current();

        _mint(recipient, newItemId);
        _setTokenURI(newItemId, metadataURI);
        itemToOwner[newItemId] = recipient;
        itemToCID[newItemId] = itemMetadataURIb32;
        return newItemId;
    }

    function payToMintCar(
        address recipient,
        string memory stockCarMetadataURI,
        bytes32 stockCarMetadataURIb32
    ) public payable returns (uint256) {
        require(msg.value >= 0.05 ether, "Need to pay up!");
        require(ownerToCar[recipient]==0, "You've already minted your car!");

        _itemIdCounter.increment();
        uint256 newItemId = _itemIdCounter.current();

        _mint(recipient, newItemId);
        _setTokenURI(newItemId, stockCarMetadataURI);
        ownerToCar[recipient] = newItemId;
        carToCID[newItemId] = stockCarMetadataURIb32;

        return newItemId;
    }

    function payToApplyItem() public payable {
        require(msg.value >= 0.01 ether, "Need to pay up!");
    }

    /* Returns all unsold market items */
    function fetchMarketItems() public view returns (MarketItem[] memory) {
        uint256 currentIndex = 0;
        MarketItem[] memory items = new MarketItem[](_itemsSelling.current());
        for (uint256 i = 1; i <= _itemIdCounter.current(); i++) {
            if (itemToOwner[i] == contractOwner) {
                MarketItem storage currentItem = idToMarketItem[i];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    function fetchMyNFTItems(address adr)
        public
        view
        returns (uint256[] memory)
    {
        require(ownerToCar[adr] != 0, "You have to register to the game first");
        uint256 totalItemCount = _itemIdCounter.current();
        uint256 itemCount = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 1; i <= totalItemCount; i++) {
            if (itemToOwner[i] == adr) {
                itemCount += 1;
            }
        }
        uint256[] memory items = new uint256[](itemCount);
        for (uint256 i = 1; i <= totalItemCount; i++) {
            if (itemToOwner[i] == adr) {
                items[currentIndex] = i;
                currentIndex += 1;
            }
        }
        return items;
    }

    function getMyItemsCIDs(address adr)
        public
        view
        returns (bytes32[] memory)
    {
        require(ownerToCar[adr] != 0, "You have to register to the game first");
        uint256[] memory mynfts = fetchMyNFTItems(adr);
        uint256 dim = mynfts.length;
        bytes32[] memory ret = new bytes32[](dim);
        for (uint256 i = 0; i < dim; i++) {
            ret[i] = itemToCID[mynfts[i]];
        }
        return ret;
    }

    function count() public view returns (uint256) {
        return _itemIdCounter.current();
    }
}
