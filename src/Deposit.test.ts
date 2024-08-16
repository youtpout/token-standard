import { AccountUpdate, Field, Mina, PrivateKey, PublicKey, UInt64 } from 'o1js';
import { Deposit } from './Deposit';
import { TokenA } from './TokenA';
import { TokenB } from './TokenB';
import { DepositB } from './DepositB';

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
    zkApp: Deposit,
    zkAppAddressB: PublicKey,
    zkAppPrivateKeyB: PrivateKey,
    zkAppB: DepositB,
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
      const keyB = await DepositB.compile();
      const keyA = await Deposit.compile();
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

    zkAppPrivateKeyB = PrivateKey.random();
    zkAppAddressB = zkAppPrivateKeyB.toPublicKey();
    zkAppB = new DepositB(zkAppAddressB);

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
      AccountUpdate.fundNewAccount(deployerAccount, 8);
      await zkApp.deploy();
      await zkAppB.deploy();
      await zkToken0.deploy();
      await zkToken1.deploy();
      await zkToken3.deploy();
    });
    await txn.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey, zkAppPrivateKey, zkToken0PrivateKey, zkToken1PrivateKey, zkToken3PrivateKey, zkAppPrivateKeyB]).send();
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


  it('deposit Mina', async () => {
    let amtToken = UInt64.from(50 * 10 ** 9);

    const txn = await Mina.transaction(deployerAccount, async () => {
      await zkApp.depositMina(amtToken);
    });
    await txn.prove();
    console.log("txn", txn.toPretty());


    const txn2 = await Mina.transaction(senderAccount, async () => {
      await zkApp.depositMina(amtToken);
    });
    await txn2.prove();
    console.log("txn2", txn2.toPretty());
    await txn2.sign([senderKey]).send();

    await txn.sign([deployerKey, zkAppPrivateKey]).send();

    const balanceToken = Mina.getBalance(zkAppAddress);
    expect(balanceToken.value).toEqual(amtToken.mul(2).value);

    const txn3 = await Mina.transaction(deployerAccount, async () => {
      await zkApp.depositMina(amtToken);
    });
    console.log("txn3", txn3.toPretty());
    await txn3.prove();
    await txn3.sign([deployerKey]).send();

    const balanceToken2 = Mina.getBalance(zkAppAddress);
    expect(balanceToken2.value).toEqual(amtToken.mul(3).value);
  });

  it('deposit token A failed on contract B', async () => {
    let amtToken = UInt64.from(50 * 10 ** 9);

    let txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1);
      await zkAppB.deposit(zkToken0Address, amtToken);
    });
    await txn.prove();
    await txn.sign([deployerKey]).send();

    const balanceToken = Mina.getBalance(zkAppAddressB, zkToken0.deriveTokenId());
    expect(balanceToken.value).toEqual(amtToken.value);
  });

  it('deposit token B failed on contract A', async () => {
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

  it('deposit token B success on contract B', async () => {
    let amtToken = UInt64.from(50 * 10 ** 9);

    let txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1);
      await zkAppB.deposit(zkToken1Address, amtToken);
    });
    // proof failed with token B
    await txn.prove();
    await txn.sign([deployerKey]).send();

    const balanceToken = Mina.getBalance(zkAppAddressB, zkToken1.deriveTokenId());
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
