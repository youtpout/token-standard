import { Field, SmartContract, state, Permissions, State, method, TokenContract, PublicKey, AccountUpdateForest, DeployArgs, UInt64, TokenContractV2, AccountUpdate } from 'o1js';

/**
 * A minimal fungible token
 */
export class TokenB extends TokenContractV2 {

    init() {
        super.init();

        const sender = this.sender.getUnconstrained();

        // mint to deployer
        this.internal.mint({
            address: sender,
            amount: UInt64.from(500_000 * 10 * 9),
        });


        this.account.tokenSymbol.set("TB");
    }

    @method async approveBase(forest: AccountUpdateForest) {
        this.checkZeroBalanceChange(forest);
    }

    @method async mintTo(to: PublicKey, amount: UInt64) {
        this.internal.mint({ address: to, amount });
    }
}
