import { Field, SmartContract, state, State, method, PublicKey, UInt64, TokenContractV2, Account, AccountUpdate, Permissions, Provable, Bool } from 'o1js';
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
  @state(UInt64) reserve = State<UInt64>();

  init() {
    super.init();

    this.account.permissions.set({ ...Permissions.dummy() });
  }

  @method async deposit(address: PublicKey, amount: UInt64) {
    let tokenContract = new TokenA(address);

    // require signature on transfer, so don't need to request it now
    let sender = this.sender.getAndRequireSignature();

    await tokenContract.transfer(sender, this.address, amount);
  }

  @method async depositMina(amount: UInt64) {
    let sender = this.sender.getUnconstrained();
    let accountUser = AccountUpdate.createSigned(sender);

    // transfer token in to this pool
    await accountUser.send({ to: this.address, amount });

    const bal = this.account.balance.getAndRequireEquals();
    Provable.log("balance", bal);
    this.reserve.set(bal);


    this.self.body.preconditions.account.balance.value = { lower: UInt64.zero, upper: UInt64.MAXINT() };
    Provable.log("precondition", this.self.body.preconditions.account.balance.value.lower);
  }
}
