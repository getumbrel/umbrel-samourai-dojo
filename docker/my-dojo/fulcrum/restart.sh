#!/bin/bash
set -e

fulcrum_options=(
  --datadir "$INDEXER_HOME/.fulcrum/db"
  --bitcoind "$BITCOIND_IP:$BITCOIND_RPC_PORT"
  --rpcuser "$BITCOIND_RPC_USER"
  --rpcpassword "$BITCOIND_RPC_PASSWORD"
)

cd "$INDEXER_HOME"/.fulcrum
./Fulcrum "${fulcrum_options[@]}" /etc/fulcrum.conf
