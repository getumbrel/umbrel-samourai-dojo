# Get Unspent

Note: Starting with Dojo 1.8.0, this API endpoint is deprecated. See the new [/wallet endpoint](./GET_wallet.md)

Request a list of unspent transaction outputs from a collection of HD accounts and/or loose addresses and/or pubkeys (derived in 3 formats P2PKH, P2WPKH/P2SH, P2WPKH Bech32).


## Behavior of the active parameter

If accounts passed to `?active` do not exist, they will be created with a relayed call to the [POST /xpub](./POST_xpub.md) mechanics if new or will be imported from external data sources.

If loose addresses passed to `?active` do not exist, they will be imported from external data sources.

If addresses derived from pubkeys passed to `?active` do not exist, they will be imported from external data sources.


## Declaration of new entities

Instruct the server that [BIP44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki) entities are new with `?new=xpub1|addr2|addr3` in the query parameters, and the server will skip importing for those entities.

SegWit support via [BIP49](https://github.com/bitcoin/bips/blob/master/bip-0049.mediawiki) is activated for new ypubs and new P2WPKH/P2SH loose addresses with `?bip49=xpub3|xpub4`.

SegWit support via [BIP84](https://github.com/bitcoin/bips/blob/master/bip-0084.mediawiki) is activated for new zpubs and new P2WPKH Bech32 loose addresses with `?bip84=xpub3|xpub4`.

Support of [BIP47](https://github.com/bitcoin/bips/blob/master/bip-0047.mediawiki) with addresses derived in 3 formats (P2PKH, P2WPKH/P2SH, P2WPKH Bech32) is activated for new pubkeys with `?pubkey=pubkey1|pubkey2`.


The `POST` version of unspent is identical, except the parameters are in the POST body.


```http request
GET /unspent?active=...&new=...&bip49=...&bip84=...&pubkey=...
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
GET /unspent?active=xpub0123456789&new=address2|address3&pubkey=pubkey4
GET /unspent?active=xpub0123456789|address1|address2|pubkey4
```

#### Success
Status code 200 with JSON response:
```json
{
  "unspent_outputs": [
    {
      "tx_hash": "abcdef",
      "tx_output_n": 2,
      "tx_version": 1,
      "tx_locktime": 0,
      "value": 100000000,
      "script": "abcdef",
      "addr": "1xAddress",
      "pubkey": "04Pubkey -or- inexistant attribute"
      "confirmations": 10000,
      "xpub": {
        "m": "xpub0123456789",
        "path": "M/0/5"
      }
    }
  ]
}
```

#### Failure
Status code 400 with JSON response:
```json
{
  "status": "error",
  "error": "<error message>"
}
```

## Notes
Unspent response is consumed by the wallet in the [APIFactory](https://code.samourai.io/wallet/samourai-wallet-android/-/blob/master/app/src/main/java/com/samourai/wallet/api/APIFactory.java)
