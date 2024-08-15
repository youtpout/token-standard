import { Field, SmartContract, state, State, method, PublicKey, UInt64, TokenContractV2 } from 'o1js';
import { TokenA } from './TokenA';

/**
 * Basic Example
 * See https://docs.minaprotocol.com/zkapps for more info.
 *
 * The Add contract initializes the state variable 'num' to be a Field(1) value by default when deployed.
 * When the 'update' method is called, the Add contract adds Field(2) to its 'num' contract state.
 *
 * This file is safe to delete and replace with your own contract.
 */
export class Deposit extends SmartContract {

  init() {
    super.init();
  }

  @method async deposit(address: PublicKey, amount: UInt64) {
    let tokenContract = new TokenA(address);

    // require signature on transfer, so don't need to request it now
    let sender = this.sender.getAndRequireSignature();

    await tokenContract.transfer(sender, this.address, amount);
  }
}
