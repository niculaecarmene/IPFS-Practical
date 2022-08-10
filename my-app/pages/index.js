import {Contract, providers, utils} from "ethers";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import Head from "next/head";
import { NFT_CONTRACT_ABI, NFT_CONTRACT_ADDRESS } from "../constants";
import styles from "../styles/Home.module.css";

export default function Home() {

  const [walletConnect, setWalletConnect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenIdsMinted, setTokenIdsMinted] = useState("0");
  const web3ModalRef = useRef();

  /** BEGIN - UTILS - functions */
  const connectWallet = async() => {
    try {
      if (!walletConnect) {
        await getProviderOrSigner();
        setWalletConnect(true);
      }
    } catch(err) {
      console.error(err);
    }
  }

  const getProviderOrSigner = async (needSigner = false) => {
    // Connect to Metamask
    // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // If user is not connected to the Mumbai network, let them know and throw an error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 80001) {
      window.alert("Change the network to Mumbai");
      throw new Error("Change network to Mumbai");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  /** END - UTILS - functions */

  /** BEGIN - MAIN - functions */
  // publicMint: Mint an NFT
  const publicMint = async() => {
    try {
      console.log("call publicMint");
      //since we need to pay for the NFT even for gas only, we need a signer
      const signer = await getProviderOrSigner(true);

      // Create a new instance of the Contract with a Signer, which allows
      // update methods
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer);
      // call the mint from the contract to mint the LW3Punks
      const tx = await nftContract.mint({
        // value signifies the cost of one LW3Punks which is "0.01" eth.
        // We are parsing `0.01` string to ether using the utils library from ethers.js
        value: utils.parseEther("0.01"),
      });
      setLoading(true);
      await tx.wait();
      setLoading(false);
      window.alert("You successfully minted a LW3Punk!");
    } catch(err) {
      console.error(err);
    }
  }

  /**
   * getTokenIdsMinted: gets the number of tokenIds that have been minted
   */
   const getTokenIdsMinted = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = await getProviderOrSigner();
      // We connect to the Contract using a Provider, so we will only
      // have read-only access to the Contract
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider);
      // call the tokenIds from the contract
      const _tokenIds = await nftContract.tokenIds();
      console.log("tokenIds", _tokenIds);
      //_tokenIds is a `Big Number`. We need to convert the Big Number to a string
      setTokenIdsMinted(_tokenIds.toString());
    } catch (err) {
      console.error(err);
    }
  };

  /** END - MAIN - functions */

  // useEffects are used to react to changes in state of the website
  // The array at the end of function call represents what state changes will trigger this effect
  // In this case, whenever the value of `walletConnected` changes - this effect will be called
useEffect (() => {
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    if (!walletConnect) {
      // Assign the Web3Modal class to the reference object by setting it's `current` value
      // The `current` value is persisted throughout as long as this page is open
      web3ModalRef.current = new Web3Modal({
        network: "mumbai",
        providerOptions: {},
        disableInjectedProvider: false,
      });

      connectWallet();

      getTokenIdsMinted();

      // set an interval to get the number of token Ids minted every 5 seconds
      setInterval(async function () {
        await getTokenIdsMinted();
      }, 5 * 1000);
    }
  }, [walletConnect]);

/*
  renderButton: Returns a button based on the state of the dapp
*/
const renderButton = () => {
  // If wallet is not connected, return a button which allows them to connect their wallet
  if (!walletConnect) {
    return (
      <button className={styles.button} onClick={connectWallet}>Connect your wallet!</button>
    );
  }

  // If we are currently waiting for something, return a loading button
  if (loading) {
    return (
      <button className={styles.button}>Loading...</button>
    );
  }

  return (
    <button className={styles.button} onClick={publicMint}>Public Mint</button>
  );
}

return (
  <div>
    <Head>
      <title>LW3Punks</title>
      <meta name="description" content="LW3Punks-Dapp" />
      <link rel="icon" href="/favicon.ico" />
    </Head>
    <div className={styles.main}>
      <div>
        <h1 className={styles.h1}>Welcome to LW3Punks!</h1>
        <div className={styles.description}>
            Its an NFT collection for LearnWeb3 students.
        </div>
        <div className={styles.description}>
          {tokenIdsMinted}/10 have been minted!
        </div>
        {renderButton()}
      </div>

      <footer className={styles.footer}>Made with &#10084; by LW3Punks</footer>
    </div>
  </div>
);

}