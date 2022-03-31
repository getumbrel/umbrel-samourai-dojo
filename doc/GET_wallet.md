# Get Wallet

Request details about a collection of HD accounts and/or loose addresses and/or pubkeys (derived in 3 formats P2PKH, P2WPKH/P2SH, P2WPKH Bech32) including a list of unspent transaction outputs.

This endpoint merges the deprecated /multiaddr and /unspent endpoints augmented with feerates info provided by the /fees endpoint.


## Behavior of the active parameter

If accounts passed to `?active` do not exist, they will be created with a relayed call to the [POST /xpub](./POST_xpub.md) mechanics if new or will be imported from external data sources.

If loose addresses passed to `?active` do not exist, they will be imported from external data sources.

If addresses derived from pubkeys passed to `?active` do not exist, they will be imported from external data sources.


## Declaration of new entities

Instruct the server that [BIP44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki) entities are new with `?new=xpub1|addr2|addr3` in the query parameters, and the server will skip importing for those entities.

SegWit support via [BIP49](https://github.com/bitcoin/bips/blob/master/bip-0049.mediawiki) is activated for new ypubs and new P2WPKH/P2SH loose addresses with `?bip49=xpub3|xpub4`.

SegWit support via [BIP84](https://github.com/bitcoin/bips/blob/master/bip-0084.mediawiki) is activated for new zpubs and new P2WPKH Bech32 loose addresses with `?bip84=xpub3|xpub4`.

Support of [BIP47](https://github.com/bitcoin/bips/blob/master/bip-0047.mediawiki) with addresses derived in 3 formats (P2PKH, P2WPKH/P2SH, P2WPKH Bech32) is activated for new pubkeys with `?pubkey=pubkey1|pubkey2`.


Note that loose addresses that are also part of one of the HD accounts requested will be ignored. Their balances and transactions are listed as part of the HD account result.

The `POST` version of `/wallet` is identical, except the parameters are in the POST body.


```http request
GET /wallet?active=...[&new=...][&bip49=...][&bip84=...][&pubkey=...]
```

## Parameters
* **active** - `string` - A pipe-separated list of extended public keys and/or loose addresses and/or pubkeys (`xpub1|address1|address2|pubkey1|...`)
* **new** - `string` - A pipe-separated list of **new** extended public keys to be derived via [BIP44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki) and/or new P2PKH loose addresses
* **bip49** - `string` - A pipe-separated list of **new** extended public keys to be derived via [BIP49](https://github.com/bitcoin/bips/blob/master/bip-0049.mediawiki) and/or new P2WPKH/P2SH loose addresses
* **bip84** - `string` - A pipe-separated list of **new** extended public keys to be derived via [BIP84](https://github.com/bitcoin/bips/blob/master/bip-0084.mediawiki) and/or new P2WPKH Bech32 loose addresses
* **pubkey** - `string` - A pipe-separated list of **new** public keys to be derived as P2PKH, P2WPKH/P2SH, P2WPKH Bech32 addresses
* **at** - `string` (optional) - Access Token (json web token). Required if authentication is activated. Alternatively, the access token can be passed through the `Authorization` HTTP header (with the `Bearer` scheme).

### Examples

```http request
GET /wallet?active=xpub0123456789&new=address2|address3&pubkey=pubkey4
GET /wallet?active=xpub0123456789|address1|address2
GET /wallet?bip49=xpub0123456789
GET /wallet?bip84=xpub0123456789
GET /wallet?pubkey=0312345678901
```

#### Success
Status code 200 with JSON response:
```json
{
  "wallet": {
    "final_balance": 100000000
  },
  "info": {
    "latest_block": {
      "height": 100000,
      "hash": "abcdef",
      "time": 1000000000
    },
    "fees": {
      "2": 181,
      "4": 150,
      "6": 150,
      "12": 111,
      "24": 62
    }
  },
  "addresses": [
    {
      "address": "xpubABCDEF -or- 1xAddress",
      "pubkey": "04Pubkey -or- inexistant attribute"
      "final_balance": 100000000,
      "account_index": 0,
      "change_index": 0,
      "n_tx": 0
    }
  ],
  "txs": [
    {
      "block_height": 100000,
      "hash": "abcdef",
      "version": 1,
      "locktime": 0,
      "result": -10000,
      "balance": 90000,
      "time": 1400000000,
      "inputs": [
        {
          "vin": 1,
          "prev_out": {
            "txid": "abcdef",
            "vout": 2,
            "value": 20000,
            "xpub": {
              "m": "xpubABCDEF",
              "path": "M/0/3"
            },
            "addr": "1xAddress",
            "pubkey": "04Pubkey"
          },
          "sequence": 4294967295
        }
      ],
      "out": [
        {
          "n": 2,
          "value": 10000,
          "addr": "1xAddress",
          "pubkey": "03Pubkey"
          "xpub": {
            "m": "xpubABCDEF",
            "path": "M/1/5"
          }
        }
      ]
    }
  ],
  "unspent_outputs": [
    {
      "tx_hash": "abcdef",
      "tx_output_n": 2,
      "tx_version": 1,
      "tx_locktime": 0,
      "value": 10000,
      "script": "abcdef",
      "addr": "1xAddress",
      "pubkey": "03Pubkey -or- inexistant attribute"
      "confirmations": 10000,
      "xpub": {
        "m": "xpubABCDEF",
        "path": "M/1/5"
      }
    }
  ]
}
```

**Notes**
* The transaction `inputs` and `out` arrays are for known addresses only and do not reflect the full input and output list of the transaction on the blockchain
* `result.addresses[i].n_tx` used by BIP47 logic to detemine unused index
* `result.txs[i].block_height` should not be present for unconfirmed transactions
* `result.txs[i].result` is the change in value for the "wallet" as defined by all entries on the `active` query parameter
* `result.txs[i].inputs[j].prev_out.addr` should be present for BIP47-related addresses but may be `null` if the previous output address is unknown
* `result.txs[i].out[j].addr` should be present for BIP47-related addresses


#### Failure
Status code 400 with JSON response:
```json
{
  "status": "error",
  "error": "<error message>"
}
```

## Notes
Wallet response is consumed by the wallet in the [APIFactory](https://code.samourai.io/wallet/samourai-wallet-android/-/blob/master/app/src/main/java/com/samourai/wallet/api/APIFactory.java)
