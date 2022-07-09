#!/bin/bash
set -e

indexer_options=(
  -vvvv
  --index-batch-size="$INDEXER_BATCH_SIZE"
  --jsonrpc-import
  --db-dir="/home/indexer/db"
  --indexer-rpc-addr="$NET_DOJO_INDEXER_IPV4:50001"
  --indexer-http-addr="$NET_DOJO_INDEXER_IPV4:8080"
  --daemon-rpc-addr="$BITCOIND_IP:$BITCOIND_RPC_PORT"
  --cookie="$BITCOIND_RPC_USER:$BITCOIND_RPC_PASSWORD"
  --txid-limit="$INDEXER_TXID_LIMIT"
  --blocktxids-cache-size-mb="$INDEXER_BLK_TXIDS_CACHE_SIZE_MB"
)

if [ "$COMMON_BTC_NETWORK" == "testnet" ]; then
  indexer_options+=(--network="testnet")
else
  indexer_options+=(--network="mainnet")
fi

exec addrindexrs "${indexer_options[@]}"
