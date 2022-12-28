// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract CryptoWheels is ERC721, ERC721URIStorage {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;
    address payable contractOwner;

    mapping(string => uint8) existingURIs;
    mapping(uint256 => address) private idToOwner;

    /*event MarketItemCreated (
      uint256 indexed tokenId,
      address owner
    );*/

    constructor() ERC721("CryptoWheels", "CW") {
        contractOwner = payable(msg.sender);
    }

    function _baseURI() internal pure override returns (string memory) {
        return "";
    }

    /*function safeMint(address to, string memory uri) public onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        existingURIs[uri] = 1;
    }*/

    // The following functions are overrides required by Solidity.

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function isContentOwned(string memory uri) public view returns (bool) {
        return existingURIs[uri] == 1;
    }

    function payToMint(
        address recipient,
        string memory metadataURI //json cid
    ) public payable returns (uint256) {
        require(existingURIs[metadataURI] != 1, "NFT already minted!");
        require(msg.value >= 0.05 ether, "Need to pay up!");

        uint256 newItemId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        existingURIs[metadataURI] = 1;

        _mint(recipient, newItemId);
        _setTokenURI(newItemId, metadataURI);
        idToOwner[newItemId] = recipient;

        return newItemId;
    }

    function fetchMyNFTs(address adr) public view returns (uint256[] memory) {
        uint256 totalItemCount = _tokenIdCounter.current();
        uint256 itemCount = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idToOwner[i] == adr) {
                itemCount += 1;
            }
        }
        uint256[] memory items = new uint256[](totalItemCount);
        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idToOwner[i] == adr) {
                uint256 currentId = i;
                items[currentIndex] = currentId;
                currentIndex += 1;
            }
        }
        return items;
    }

    function count() public view returns (uint256) {
        //added by fireship
        return _tokenIdCounter.current();
    }
}
