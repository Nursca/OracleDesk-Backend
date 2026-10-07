import deployments from '../generated/deployments.testnet.json';
import { config } from './index';

/**
 * Contract ids for the network in STELLAR_NETWORK_PASSPHRASE. Defaults come
 * from the synced deployments file (src/generated/, see
 * scripts/sync-contracts.mjs); each one can be overridden by env.
 */
export const CONTRACTS = {
  marketCore: config.MARKET_CORE_CONTRACT_ID || deployments.contracts.market_core,
  treasury: config.TREASURY_CONTRACT_ID || deployments.contracts.treasury,
  resolver: config.RESOLVER_CONTRACT_ID || deployments.contracts.resolver,
  reasoningRegistry: config.REASONING_REGISTRY_CONTRACT_ID || deployments.contracts.reasoning_registry,
  usdc: config.USDC_CONTRACT_ID || deployments.contracts.usdc,
} as const;

export type ContractName = keyof typeof CONTRACTS;

/** Recipient of premium payments. See docs/api.md before changing the default. */
export const PAYMENTS_RECIPIENT = config.PAYMENTS_RECIPIENT || CONTRACTS.treasury;

/** The agent account the deployment registered in reasoning-registry. */
export const DEPLOYED_AGENT = deployments.agent;
