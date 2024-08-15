import { AccountUpdate, Field, Mina, PrivateKey, PublicKey, UInt64 } from 'o1js';
import { Deposit } from './Deposit';
import { TokenA } from './TokenA';
import { TokenB } from './TokenB';

/*
 * This file specifies how to test the `Add` example smart contract. It is safe to delete this file and replace
 * with your own tests.
 *
 * See https://docs.minaprotocol.com/zkapps for more info.
 */

let proofsEnabled = true;

describe('Deposit', () => {
  let deployerAccount: Mina.TestPublicKey,
    deployerKey: PrivateKey,
    senderAccount: Mina.TestPublicKey,
    senderKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: Deposit,
    zkToken0Address: PublicKey,
    zkToken0PrivateKey: PrivateKey,
    zkToken0: TokenA,
    zkToken1Address: PublicKey,
    zkToken1PrivateKey: PrivateKey,
    zkToken1: TokenB,
    zkToken3Address: PublicKey,
    zkToken3PrivateKey: PrivateKey,
    zkToken3: TokenA;

  beforeAll(async () => {
    if (proofsEnabled) {
      await Deposit.compile();
      await TokenA.compile();
      await TokenB.compile();
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
    zkApp = new Deposit(zkAppAddress);

    zkToken0PrivateKey = PrivateKey.random();
    zkToken0Address = zkToken0PrivateKey.toPublicKey();
    zkToken0 = new TokenA(zkToken0Address);

    zkToken1PrivateKey = PrivateKey.random();
    zkToken1Address = zkToken1PrivateKey.toPublicKey();
    zkToken1 = new TokenB(zkToken1Address);

    zkToken3PrivateKey = PrivateKey.random();
    zkToken3Address = zkToken3PrivateKey.toPublicKey();
    zkToken3 = new TokenA(zkToken3Address);


    const txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 7);
      await zkApp.deploy();
      await zkToken0.deploy();
      await zkToken1.deploy();
      await zkToken3.deploy();
    });
    await txn.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey, zkAppPrivateKey, zkToken0PrivateKey, zkToken1PrivateKey, zkToken3PrivateKey]).send();
  });

  it('deposit token A', async () => {
    let amtToken = UInt64.from(50 * 10 ** 9);

    let txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1);
      await zkApp.deposit(zkToken0Address, amtToken);
    });
    await txn.prove();
    await txn.sign([deployerKey]).send();

    const balanceToken = Mina.getBalance(zkAppAddress, zkToken0.deriveTokenId());
    expect(balanceToken.value).toEqual(amtToken.value);
  });

  it('deposit token B', async () => {
    let amtToken = UInt64.from(50 * 10 ** 9);

    let txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1);
      await zkApp.deposit(zkToken1Address, amtToken);
    });
    // proof failed with token B
    await txn.prove();
    await txn.sign([deployerKey]).send();

    const balanceToken = Mina.getBalance(zkAppAddress, zkToken1.deriveTokenId());
    expect(balanceToken.value).toEqual(amtToken.value);
  });

  it('deposit token A bis', async () => {
    let amtToken = UInt64.from(50 * 10 ** 9);

    let txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1);
      await zkApp.deposit(zkToken3Address, amtToken);
    });
    await txn.prove();
    await txn.sign([deployerKey]).send();

    const balanceToken = Mina.getBalance(zkAppAddress, zkToken3.deriveTokenId());
    expect(balanceToken.value).toEqual(amtToken.value);
  });
});
