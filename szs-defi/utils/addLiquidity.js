import { Contract, utils } from "ethers";
import {
  EXCHANGE_CONTRACT_ABI,
  EXCHANGE_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../constants";

/**
 * addLiquidity helps add liquidity to the exchange,
 * If the user is adding initial liquidity, user decides the ether and ZC tokens he wants to add
 * to the exchange. If we he adding the liquidity after the initial liquidity has already been added
 * then we calculate the zeeCards tokens he can add, given the eth he wants to add by keeping the ratios
 * constant
 */
export const addLiquidity = async (
  signer,
  addZCAmountWei,
  addEtherAmountWei
) => {
  try {
    // create a new instance of the token contract
    const tokenContract = new Contract(
      TOKEN_CONTRACT_ADDRESS,
      TOKEN_CONTRACT_ABI,
      signer
    );
    // create a new instance of the exchange contract
    const exchangeContract = new Contract(
      EXCHANGE_CONTRACT_ADDRESS,
      EXCHANGE_CONTRACT_ABI,
      signer
    );
    // Because ZC tokens are an ERC20, user would need to give the contract allowance
    // to take the required number ZC tokens out of his contract
    let tx = await tokenContract.approve(
      EXCHANGE_CONTRACT_ADDRESS,
      addZCAmountWei.toString()
    );
    await tx.wait();
    // After the contract has the approval, add the ether and ZC tokens in the liquidity
    tx = await exchangeContract.addLiquidity(addZCAmountWei, {
      value: addEtherAmountWei,
    });
    await tx.wait();
  } catch (err) {
    console.error(err);
  }
};

/**
 * calculateZC calculates the ZC tokens that need to be added to the liquidity
 * given `_addEtherAmountWei` amount of ether
 */
export const calculateZC = async (
  _addEther = "0",
  etherBalanceContract,
  zcTokenReserve
) => {
  // `_addEther` is a string, we need to convert it to a Bignumber before we can do our calculations
  // We do that using the `parseEther` function from `ethers.js`
  const _addEtherAmountWei = utils.parseEther(_addEther);
  // Ratio needs to be maintained when we add liquiidty.
  // We need to let the user know who a specific amount of ether how many `ZC` tokens
  // he can add so that the price impact is not large
  // The ratio we follow is (Amount of zeeCard tokens to be added)/(zeeCard tokens balance) = (Ether that would be added)/ (Eth reseve in the contract)
  // So by maths we get (Amount of zeeCard tokens to be added) = (Ether that would be added*rypto Dev tokens balance)/ (Eth reseve in the contract)
  const zeeCardsTokenAmount = _addEtherAmountWei
    .mul(zcTokenReserve)
    .div(etherBalanceContract);
  return zeeCardsTokenAmount;
};
