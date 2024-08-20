import { Field, SmartContract, state, Permissions, Bool, State, method, PublicKey, UInt64, TokenContractV2, AccountUpdate, TokenId, TransactionVersion, Provable, AccountUpdateForest } from 'o1js';
import { TokenB } from './TokenB';
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
export class SubAccount extends TokenContractV2 {

    init() {
        super.init();
    }

    @method async approveBase(forest: AccountUpdateForest) {
        this.checkZeroBalanceChange(forest);
    }

    @method async add() {
        let receiver = this.sender.getUnconstrained();
        let accountReceiver = AccountUpdate.default(receiver);
        let token = new TokenA(receiver);
        let tokenId = TokenId.derive(this.address, token.tokenId);

        let newAccount = AccountUpdate.create(this.address, tokenId);
        let newAccount2 = AccountUpdate.create(receiver, this.deriveTokenId());

        this.approve(newAccount);
        this.approve(newAccount2);

    }
}
