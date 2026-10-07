/**
 * Verifies a premium payment on-chain: a successful SEP-41 `transfer` on the
 * USDC contract, from the logged-in user, to PAYMENTS_RECIPIENT, for at least
 * the tier price. There is no bypass: if this can't prove the payment, the
 * payment grants nothing. Tests inject a fake RPC client.
 */
import { Address, rpc, scValToNative, xdr } from '@stellar/stellar-sdk';
import { AppError } from '../middlewares/error.middleware';
import { rpcServer } from './stellar/clients';

export interface TransactionReader {
  getTransaction(hash: string): Promise<rpc.Api.GetTransactionResponse>;
}

let reader: TransactionReader = rpcServer;
export function setTransactionReader(next: TransactionReader): TransactionReader {
  const prev = reader;
  reader = next;
  return prev;
}

export interface VerifiedTransfer {
  txHash: string;
  from: string;
  to: string;
  amount: bigint;
  ledger: number;
}

export interface ExpectedTransfer {
  txHash: string;
  token: string;
  from: string;
  to: string;
  minAmount: bigint;
}

const fail = (code: string, message: string, details?: Record<string, unknown>) =>
  new AppError(402, code, message, details);

function innerTransaction(envelope: xdr.TransactionEnvelope): xdr.Transaction {
  switch (envelope.switch().name) {
    case 'envelopeTypeTx':
      return envelope.v1().tx();
    case 'envelopeTypeTxFeeBump':
      return envelope.feeBump().tx().innerTx().v1().tx();
    default:
      throw fail('PAYMENT_WRONG_TOKEN', 'Unsupported transaction envelope');
  }
}

export async function verifyUsdcTransfer(expected: ExpectedTransfer): Promise<VerifiedTransfer> {
  if (!/^[0-9a-f]{64}$/.test(expected.txHash)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'txHash must be a 64-character lowercase hex Stellar transaction hash');
  }

  let response: rpc.Api.GetTransactionResponse;
  try {
    response = await reader.getTransaction(expected.txHash);
  } catch (err) {
    throw new AppError(502, 'CHAIN_READ_FAILED', 'Could not reach Stellar RPC to verify the payment', {
      cause: err instanceof Error ? err.message : String(err),
    });
  }

  if (response.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
    throw fail('PAYMENT_NOT_FOUND', 'Payment transaction not found. If you just paid, wait a few seconds and retry.');
  }
  if (response.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
    throw fail('PAYMENT_FAILED', 'The payment transaction failed on-chain');
  }

  const tx = innerTransaction(response.envelopeXdr);
  const ops = tx.operations();
  if (ops.length !== 1 || ops[0].body().switch().name !== 'invokeHostFunction') {
    throw fail('PAYMENT_WRONG_TOKEN', 'The transaction is not a token transfer');
  }
  const fn = ops[0].body().invokeHostFunctionOp().hostFunction();
  if (fn.switch().name !== 'hostFunctionTypeInvokeContract') {
    throw fail('PAYMENT_WRONG_TOKEN', 'The transaction is not a token transfer');
  }
  const call = fn.invokeContract();
  const contract = Address.fromScAddress(call.contractAddress()).toString();
  const method = call.functionName().toString();
  const args = call.args();
  if (contract !== expected.token || method !== 'transfer' || args.length !== 3) {
    throw fail('PAYMENT_WRONG_TOKEN', 'The transaction is not a USDC transfer', { contract, method });
  }

  const from = Address.fromScVal(args[0]).toString();
  const to = Address.fromScVal(args[1]).toString();
  const amount = scValToNative(args[2]) as bigint;

  if (from !== expected.from) {
    throw fail('PAYMENT_WRONG_SENDER', 'The payment was not sent from your connected wallet');
  }
  if (to !== expected.to) {
    throw fail('PAYMENT_WRONG_RECIPIENT', 'The payment was sent to the wrong recipient');
  }
  if (typeof amount !== 'bigint' || amount < expected.minAmount) {
    throw fail('PAYMENT_INSUFFICIENT', 'The payment is less than the price', {
      paidRaw: String(amount),
      requiredRaw: expected.minAmount.toString(),
    });
  }

  return { txHash: expected.txHash, from, to, amount, ledger: response.ledger };
}
