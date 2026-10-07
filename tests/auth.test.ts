import test from 'node:test';
import assert from 'node:assert/strict';
import { Keypair, TransactionBuilder } from '@stellar/stellar-sdk';
import { setupTestEnv } from './helpers/env';

setupTestEnv();

async function setup() {
  const auth = await import('../src/services/auth.service');
  const { prisma } = await import('../src/lib/prisma');
  (prisma.user.upsert as any) = async ({ where }: any) => ({ id: 'user-1', walletAddress: where.walletAddress });
  auth.setChallengeStore(new auth.MemoryChallengeStore());
  const { config } = await import('../src/config');
  return { auth, config };
}

function sign(challengeXdr: string, passphrase: string, ...signers: Keypair[]): string {
  const tx = TransactionBuilder.fromXDR(challengeXdr, passphrase);
  for (const kp of signers) tx.sign(kp);
  return tx.toXDR();
}

const code = (p: Promise<unknown>) => p.then(() => 'ok', (e: any) => e.code ?? e.message);

test('challenge → sign → verify issues a JWT for that address', async () => {
  const { auth, config } = await setup();
  const user = Keypair.random();
  const ch = await auth.createChallenge(user.publicKey());
  assert.equal(ch.networkPassphrase, config.STELLAR_NETWORK_PASSPHRASE);
  const result = await auth.verifyChallenge(user.publicKey(), sign(ch.transaction, ch.networkPassphrase, user));
  assert.equal(result.walletAddress, user.publicKey());
  assert.ok(result.token.split('.').length === 3);
});

test('rejects invalid and EVM addresses', async () => {
  const { auth } = await setup();
  assert.equal(await code(auth.createChallenge('0x0000000000000000000000000000000000000001')), 'INVALID_ADDRESS');
  assert.equal(await code(auth.createChallenge('GABC')), 'INVALID_ADDRESS');
  assert.equal(await code(auth.createChallenge(undefined)), 'INVALID_ADDRESS');
  // A secret seed is not an address.
  assert.equal(await code(auth.createChallenge(Keypair.random().secret())), 'INVALID_ADDRESS');
});

test('a challenge works once', async () => {
  const { auth } = await setup();
  const user = Keypair.random();
  const ch = await auth.createChallenge(user.publicKey());
  const signed = sign(ch.transaction, ch.networkPassphrase, user);
  assert.equal(await code(auth.verifyChallenge(user.publicKey(), signed)), 'ok');
  assert.equal(await code(auth.verifyChallenge(user.publicKey(), signed)), 'CHALLENGE_NOT_FOUND');
});

test('wrong signer, missing signature and address swap are rejected', async () => {
  const { auth } = await setup();
  const user = Keypair.random();
  const attacker = Keypair.random();

  let ch = await auth.createChallenge(user.publicKey());
  assert.equal(await code(auth.verifyChallenge(user.publicKey(), sign(ch.transaction, ch.networkPassphrase, attacker))), 'CHALLENGE_SIGNATURE_INVALID');

  ch = await auth.createChallenge(user.publicKey());
  assert.equal(await code(auth.verifyChallenge(user.publicKey(), ch.transaction)), 'CHALLENGE_SIGNATURE_INVALID');

  // Attacker signs their own challenge but claims the victim's address.
  ch = await auth.createChallenge(attacker.publicKey());
  assert.equal(await code(auth.verifyChallenge(user.publicKey(), sign(ch.transaction, ch.networkPassphrase, attacker))), 'CHALLENGE_SIGNATURE_INVALID');
});

test('a challenge not issued by this server is rejected', async () => {
  const { auth, config } = await setup();
  const { WebAuth } = await import('@stellar/stellar-sdk');
  const user = Keypair.random();
  const forged = WebAuth.buildChallengeTx(Keypair.random(), user.publicKey(), config.AUTH_HOME_DOMAIN, 300,
    config.STELLAR_NETWORK_PASSPHRASE, config.AUTH_WEB_AUTH_DOMAIN);
  assert.equal(await code(auth.verifyChallenge(user.publicKey(), sign(forged, config.STELLAR_NETWORK_PASSPHRASE, user))), 'INVALID_CHALLENGE');
});

test('an expired challenge is rejected', async () => {
  const { auth } = await setup();
  const user = Keypair.random();
  const ch = await auth.createChallenge(user.publicKey());
  const signed = sign(ch.transaction, ch.networkPassphrase, user);
  const realNow = Date.now;
  Date.now = () => realNow() + (auth.CHALLENGE_TTL_SECONDS + 1) * 1000;
  try {
    assert.equal(await code(auth.verifyChallenge(user.publicKey(), signed)), 'CHALLENGE_EXPIRED');
  } finally {
    Date.now = realNow;
  }
});
