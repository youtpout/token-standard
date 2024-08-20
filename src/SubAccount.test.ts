import { AccountUpdate, Field, Mina, PrivateKey, PublicKey, UInt64 } from 'o1js';
import { Deposit } from './Deposit';
import { TokenA } from './TokenA';
import { TokenB } from './TokenB';
import { DepositB } from './DepositB';
import { SubAccount } from './SubAccount';

/*
 * This file specifies how to test the `Add` example smart contract. It is safe to delete this file and replace
 * with your own tests.
 *
 * See https://docs.minaprotocol.com/zkapps for more info.
 */

let proofsEnabled = false;

describe('Deposit', () => {
  let deployerAccount: Mina.TestPublicKey,
    deployerKey: PrivateKey,
    senderAccount: Mina.TestPublicKey,
    senderKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: SubAccount;

  beforeAll(async () => {
    if (proofsEnabled) {
      const keyB = await SubAccount.compile();
    }
  });

  beforeEach(async () => {
    const Local = await Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    [deployerAccount, senderAccount] = Local.testAccounts;
    deployerKey = deployerAccount.key;
    senderKey = senderAccount.key;

    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new SubAccount(zkAppAddress);



    const txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1);
      await zkApp.deploy();
    });
    await txn.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  });

  it('add subaccount', async () => {

    let txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 2);
      await zkApp.add();
    });
    await txn.prove();
    console.log("add", txn.toPretty());
    await txn.sign([deployerKey]).send();
  });


});
