-- Stellar port (see docs/PORTING.md and docs/api.md).
--
-- Arc-era columns are dropped, not renamed: Arc addresses and tx hashes mean
-- nothing on Stellar, and the old reasoning_traces.sha256Hash hashed a
-- re-serialised object rather than the bytes pinned to IPFS, so carrying it
-- into traceHash would make unverifiable traces look verifiable.
--
-- market-core takes one collateral token, so EURC markets become USDC
-- before the enum value is removed (the cast below would fail otherwise).
UPDATE "markets" SET "settlementCurrency" = 'USDC' WHERE "settlementCurrency" = 'EURC';

-- AlterEnum
BEGIN;
CREATE TYPE "SettlementCurrency_new" AS ENUM ('USDC');
ALTER TABLE "public"."markets" ALTER COLUMN "settlementCurrency" DROP DEFAULT;
ALTER TABLE "markets" ALTER COLUMN "settlementCurrency" TYPE "SettlementCurrency_new" USING ("settlementCurrency"::text::"SettlementCurrency_new");
ALTER TYPE "SettlementCurrency" RENAME TO "SettlementCurrency_old";
ALTER TYPE "SettlementCurrency_new" RENAME TO "SettlementCurrency";
DROP TYPE "public"."SettlementCurrency_old";
ALTER TABLE "markets" ALTER COLUMN "settlementCurrency" SET DEFAULT 'USDC';
COMMIT;

-- DropIndex
DROP INDEX "markets_onChainAddress_key";

-- AlterTable
ALTER TABLE "copy_trades" ADD COLUMN     "amountRaw" TEXT;

-- AlterTable
ALTER TABLE "markets" DROP COLUMN "onChainAddress",
DROP COLUMN "txHash",
ADD COLUMN     "creationTxHash" TEXT,
ADD COLUMN     "metaUri" TEXT,
ADD COLUMN     "onChainMarketId" BIGINT,
ADD COLUMN     "questionHash" TEXT,
ADD COLUMN     "resolutionHash" TEXT,
ADD COLUMN     "resolutionSpec" JSONB,
ADD COLUMN     "seedAmountRaw" TEXT;

-- AlterTable
ALTER TABLE "payment_events" ADD COLUMN     "amountRaw" TEXT,
ADD COLUMN     "fromAddress" TEXT;

-- AlterTable
ALTER TABLE "reasoning_traces" DROP COLUMN "onChainTxHash",
DROP COLUMN "sha256Hash",
ADD COLUMN     "onChainTraceId" BIGINT,
ADD COLUMN     "publishTxHash" TEXT,
ADD COLUMN     "traceHash" TEXT;

-- DropTable
DROP TABLE "block_index";

-- CreateTable
CREATE TABLE "indexer_cursors" (
    "id" TEXT NOT NULL,
    "lastLedger" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "indexer_cursors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chain_events" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "contractName" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "ledger" INTEGER NOT NULL,
    "ledgerClosedAt" TIMESTAMP(3) NOT NULL,
    "txHash" TEXT NOT NULL,
    "params" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chain_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chain_events_contractName_eventName_idx" ON "chain_events"("contractName", "eventName");

-- CreateIndex
CREATE INDEX "chain_events_ledger_idx" ON "chain_events"("ledger");

-- CreateIndex
CREATE INDEX "chain_events_txHash_idx" ON "chain_events"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "markets_onChainMarketId_key" ON "markets"("onChainMarketId");

-- CreateIndex
CREATE UNIQUE INDEX "reasoning_traces_onChainTraceId_key" ON "reasoning_traces"("onChainTraceId");

