# Release Notes


## Releases ##

- [v1.12.1](#1_12_1)
- [v1.12.0](#1_12_0)
- [v1.11.0](#1_11_0)
- [v1.10.1](#1_10_1)
- [v1.10.0](#1_10_0)
- [v1.9.0](#1_9_0)
- [v1.8.1](#1_8_1)
- [v1.8.0](#1_8_0)
- [v1.7.0](#1_7_0)
- [v1.6.0](#1_6_0)
- [v1.5.0](#1_5_0)
- [v1.4.1](#1_4_1)
- [v1.4.0](#1_4_0)
- [v1.3.0](#1_3_0)
- [v1.2.0](#1_2_0)
- [v1.1.0](#1_1_0)

<a name="1_12_1"/>

## Samourai Dojo v1.12.1 ##

### Change log ###

#### Bug fixes ####
- [#mr254](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/254) added missing container dependencies for zeromq build
- [#mr255](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/255) fixed imports/rescans not being processed correctly

#### Credits ####
- pajasevi
- Taylor Helsper

<a name="1_12_0"/>

## Samourai Dojo v1.12.0 ##

### Notable changes ###

#### Upgrade of bitcoind to v22.0 ####

Upgrade to Bitcoin Core v22.0

#### Upgrade of Tor to v0.4.6.7 ####

Upgrade to Tor v0.4.6.7 which removes support for outdated v2 onion services

#### Upgrade of BTC-RPC Explorer to v3.2.0 ####

Upgrade to BTC-RPC Explorer v3.2.0

#### Stability improvements ####

Dojo stability has been improved by raising RPC timeout value and fixing uncaught promise rejections.
Stability issues have been encountered on non-standard installations which contain LND.

### Change log ###

#### Features ####
- [#mr252](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/252) updated Tor to 0.4.6.7
- [#mr249](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/249) updated Nginx to 1.21.3
- [#mr247](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/247) updated Bitcoin Core to 22.0
- [#mr246](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/246) updated BTC-RPC Explorer to 3.2.0
- [#mr248](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/248) added uacomment to identify Dojo bitcoind nodes on the network

#### Bug fixes ####
- [#mr251](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/251) raised RPC timeout value, fixed uncaught promise rejections

#### Credits ####
- pajasevi
- Ketominer

<a name="1_11_0"/>

## Samourai Dojo v1.11.0 ##

## Breaking ##
- Dojo now requires Node.js v14

#### Features ####

- [#mr242](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/242) postmix decoy change addresses
- [#mr241](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/241) update ZeroMQ and Node.js
- [#mr240](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/240) update Node.js dependencies
- [#mr239](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/239) update Tor and remove v2 onion addresses
- [#mr238](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/238) use RPC auth instead of basic auth
- other minor improvements

#### Bug fixes ####

- [#mr237](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/237) fix tracker initialization
- [commit 3ee4ecc6](https://code.samourai.io/dojo/samourai-dojo/-/commit/3ee4ecc645dc88632f4e7bfd00fafe602bcaef13) fix importing from local_bitcoind
- other minor fixes

<a name="1_10_1"/>

## Samourai Dojo v1.10.1 ##

#### Bug fixes ####

- [#mr236](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/236) fix auth errors
- [#mr237](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/237) fix zmq block notifications

#### Security ####

- [#mr235](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/235) apply middleware in correct order

#### Credits ###

- pajasevi
- lukechilds
- kenshin-samourai
- zeroleak


<a name="1_10_0"/>

## Samourai Dojo v1.10.0 ##


### Notable changes ###


#### Performances optimization ####

This release provides faster IBD, synchronization and rescans thanks to the optimization of multiple components of Dojo (Tracker, Importer, etc)


#### Export of XPUB activity ####

The Maintenance Tool now allows to export the activity history of a XPUB in CSV format


#### Upgrade of bitcoind to v0.21.1 ####

Upgrade to Bitcoin Core v0.21.1


#### Upgrade of whirlpool to v0.10.11 ####

Upgrade to whirlpool-cli 0.10.11


#### Upgrade of explorer to v3.1.1 ####

Upgrade to btc-rpc-explorer 3.1.1


#### Upgrade of tor to v0.4.4.8 ####

Upgrade to Tor v0.4.4.8


#### Upgrade of indexer to v0.5.0 ####

Upgrade to addrindexrs v0.5.0



### Change log ###


#### MyDojo ####

- [#mr199](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/199) manage linux uids and gids as dojo system parameters
- [#mr200](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/200) manage ip addresses of containers as dojo system parameters
- [#mr201](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/201) disable rescan-lookahead field if data source is third_party_explorer
- [#mr202](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/202) reference db container by its ip address
- [#mr203](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/203) add export of xpub history in csv format
- [#mr204](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/204) upgrade whirlpool to whirlpool cli v0 10 10
- [#mr206](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/206) add support of config profiles for mysql
- [#mr207](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/207) upgrade tor to tor 0.4.4.8
- [#mr208](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/208) improve performances of blocks processing by the tracker
- [#mr209](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/209) improve performances of api
- [#mr210](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/210) better seriesCall
- [#mr211](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/211) add support of rest api provided by addrindexrs
- [#mr212](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/212) minor optimizations
- [#mr214](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/214) upgrade explorer to btc rpc explorer 3.0.0
- [#mr215](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/215) handle Error in sendError method
- [#mr217](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/217) optimize tracker (parallel processing of blocks)
- [#mr218](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/218) optimize derivation of addresses
- [#mr219](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/219) optimize remote importer
- [#mr221](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/221) implement util.splitList() with slice() instead of splice()
- [#mr222](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/222) determine bitcoin network based on config file instead of cli argument
- [#mr223](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/223) upgrade bitcoind to bitcoin core 0.21.1
- [#mr224](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/224) switch to buster-slim and alpine images
- [#mr226](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/226) upgrade btc-rpc-explorer to v3.1.1
- [#mr227](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/227) switch from express to tiny-http
- [#mr228](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/228) set NODE_ENV to production for optimization purposes
- [#mr232](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/232) upgrade whirlpool to whirlpool-cli v0.10.11


#### Bug fixes ####

- [#mr220](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/220) switch tx isolation mode to read-committed


#### Security ####

- [#mr216](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/216) upgrade node packages
- [#mr229](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/229) update node dependencies


#### Documentation ####

- [#mr225](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/225) update docker_advanced_setups.md - fix typo


#### Credits ###

- flatcloud0b3
- kenshin-samourai
- LaurentMT
- MrHash
- pajasevi



<a name="1_9_0"/>

## Samourai Dojo v1.9.0 ##


### Notable changes ###


#### Maintenance Tool: multiple UX improvements ####

*Status screen*

The status screen now displays information related to the Dojo database and to the data source used by Dojo for its imports and rescans. This screen provides a high level view of the state of the Dojo instance, that can be shared for support.

*XPUB Tool*

- Progress made is now displayed during an import or a rescan.
- New feature allowing to delete a XPUB tracked by Dojo.
- Improved management of timeouts by the authentication system.


#### Dojo Shell Script: improvements ####

- Script automatically stops if build fails during install/upgrade operation.
- Script returns a not null exit code if build fails or if install/upgrade operation is cancelled.
- Dojo is automatically stopped if an upgrade operation is launched with Dojo up and running.
- A cleanup of old Dojo versions is automatically processed at the end of successful upgrade operations.


#### New configuration options ####

Addition of two new configuration options:

- BITCOIND_LISTEN_MODE (in docker-bitcoind.conf): When set to `off`, the fullnode will refuse incoming connections. Default = `on`.
- WHIRLPOOL_COORDINATOR_ONION (in docker-whirlpool.conf): When set to `on`, whirlpool-cli will contact the coordinator through its onion address. When set to `off`, clearnet address will be used (through Tor). Default = `on`.


#### Extended support Tor hidden services ####

Dojo now provides a v2 and v3 hidden service for:

- Dojo Maintenance Tool and API
- Whirlpool CLI
- Bitcoind
- Explorer

Tor v3 onion addresses are recommended but v2 addresses can be used in the case of new attacks disrupting v3 hidden services.

These onion addresses can be retrieved thanks to the `onion` command of the Dojo Shell Script

'''
# Display Tor v3 onion addresses (default)
> ./dojo.h onion

# Display Tor v3 onion addresses
> ./dojo.h onion v3

# Display Tor v2 onion addresses
> ./dojo.h onion v2
'''


#### Upgrade of bitcoind to v0.21.0 ####

Upgrade to Bitcoin Core v0.21.0


#### Upgrade of whirlpool to v0.10.9 ####

Upgrade to whirlpool-cli 0.10.9


#### Upgrade of explorer to v2.1.0 ####

Upgrade to btc-rpc-explorer 2.1.0


#### Upgrade of tor to v0.4.4.7 ####

Tor 0.4.4.7 fixes and mitigates multiple issues, including one that made v3 onion services more susceptible to denial-of-service attacks.


#### Upgrade of indexer to v0.4.0 ####

Upgrade to addrindexrs v0.4.0


### Change log ###


#### MyDojo ####

- [#mr165](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/165) improve dmt ux
- [#mr166](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/166) add new configuration property BITCOIND_LISTEN_MODE
- [#mr167](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/167) upgrade explorer to btc-rpc-explorer 2.0.2
- [#mr168](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/168) add new getChaintipHeight() method to remote importer and data sources
- [#mr170](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/170) add indexer info to /status endpoint
- [#mr171](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/171) add db and indexer blocks to status screen of dmt
- [#mr172](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/172) upgrade indexer to addrindexrs 0.4.0
- [#mr174](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/174) upgrade whirlpool to whirlpool-cli 0.10.9
- [#mr175](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/175) track and display progress of import/rescan
- [#mr178](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/178) improve dojo shell script
- [#mr179](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/179) update samourai logo
- [#mr181](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/181) add support of xpub deletion from the dmt
- [#mr182](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/182) upgrade bitcoin container with bitcoin core 0.21.0
- [#mr183](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/183) upgrade explorer to btc-rpc-explorer 2.1.0
- [#mr184](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/184) upgrade tor to v0.4.4.6
- [#mr186](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/186) upgrade tor to v0.4.4.6
- [#mr188](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/188) return exit code 2 if install or upgrade is cancelled
- [#mr190](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/190) add new WHIRLPOOL_COORDINATOR_ONION config option
- [#mr191](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/191) add v2 onion addresses for explorer and whirlpool
- [#mr192](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/192) return exit code 1 instead of 2 for aborted install & upgrade
- [#mr193](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/193) reactivate tor v2 hidden service for bitcoind
- [#mr194](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/194) upgrade tor to v0.4.4.7
- [#mr195](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/195) bump block height defining ibd mode
- [9fe22a35](https://code.samourai.io/dojo/samourai-dojo/-/commit/9fe22a356625e0c1aeb18691d617af9118990c84) update .gitignore


#### Bug fixes ####

- [#mr176](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/176) check that jqxhr['responseJSON']['error'] is a string
- [#mr177](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/177) prevent restart of bitcoin container if bitcoind fails
- [#mr185](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/185) build addrindexrs with --locked argument
- [#mr189](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/189) return a 0 feerate if bitcoind doesn't return an estimate


#### Security ####

- [#mr173](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/173) replace request-promise-native by axios


#### Documentation ####

- [#mr180](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/180) add a detailed installation and upgrade guide for ubuntu


#### Credits ###

- BTCxZelko
- flatcloud0b3
- kenshin-samourai
- LaurentMT
- likewhoa


<a name="1_8_1"/>

## Samourai Dojo v1.8.1 ##

### Notable changes ###

#### Upgrade of tor to v0.4.5.4-rc ####

Upgrade to Tor v0.4.5.4-rc for a fix mitigating attacks on Tor v3 hidden services

### Change log ###

#### Security ####

- [320f8cbf](https://code.samourai.io/dojo/samourai-dojo/-/commit/320f8cbfbe5b6a1e59f5154110216758ed08b9dc) upgrade tor to v0.4.5.4


<a name="1_8_0"/>

## Samourai Dojo v1.8.0 ##


### Notable changes ###


#### New version of the Maintenance Tool ####

This release introduces a new version of Dojo Maintenance Tool (DMT).

The DMT has been revamped in order to provide a more user-friendly experience.


#### New configuration property BITCOIND_RPC_WORK_QUEUE ####

This new configuration property added to docker-bitcoind.conf allows to set a custom max depth for the RPC work queue of the full node.

Increasing the value set for this property may help users running Dojo on slower devices when recurring "work queue depth exceeded" errors appear in the logs.


#### New configuration property BITCOIND_SHUTDOWN_DELAY ####

This new configuration property added to docker-bitcoind.conf allows to set a custom delay before Dojo forces the shutdown of its full node (default delay is 180 seconds).

Increasing the value set for this property may help users running Dojo on slower devices requiring a longer delay for a clean shutdown of the full node.


#### Automatic fallback to a mirror of the Tor archive ####

If Dojo fails to contact the Tor servers (archive.torproject.org) during an installation or an upgrade, it will automatically try to download Tor source code from a mirror hosted by the EFF (tor.eff.org).


#### Upgrade of bitcoind to v0.20.1 ####

Upgrade to Bitcoin Core v0.20.1


#### New /wallet API endpoint ####

This new API endpoint combines the results previously returned by the /multiaddr, /unspent and /fees endpoints. See this [doc](https://github.com/Samourai-Wallet/samourai-dojo/blob/master/doc/GET_wallet.md) for more details.

Starting with this version, the /multiaddr and /unspent endpoints are marked as deprecated.


### Change log ###


#### MyDojo ####

- [#mr151](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/151) add new /wallet api endpoint
- [#mr153](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/153) add new BITCOIND_RPC_WORK_QUEUE parameter to docker-bitcoind.conf.tpl
- [#mr154](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/154) add new /xpub/impot/status endpoint
- [#mr155](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/155) upgrade bitcoind to bitcoin core 0.20.1
- [#mr156](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/156) automatic fallback to mirror of tor archive
- [#mr157](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/157) add new config property BITCOIND_SHUTDOWN_DELAY
- [#mr160](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/160) new version of the maintenance tool
- [#mr161](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/161) improve the xpub tools screen
- [#mr162](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/162) rework response returned by dojo.sh onion
- [#mr163](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/163) improve presentation of response returned by dojo.sh onion
- [a548bce6](https://code.samourai.io/dojo/samourai-dojo/-/commit/a548bce6dea78297f21368c1e04ee1a021f1f524) bump dojo version in index-example.js


#### Bug fixes ####

- [#mr158](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/158) fix parsing of message in notification service
- [dbf61217](https://code.samourai.io/dojo/samourai-dojo/-/commit/dbf6121779385f19e99167298ac8a6bf3411422a) fix presentation of message returned by dojo.sh onion
- [5d960071](https://code.samourai.io/dojo/samourai-dojo/-/commit/5d960071cb4832a348e1883057be3d35c7ff747e) update presentation of response returned by dojo.sh onion


#### Security ####

- [#mr152](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/152) update nodejs modules
- [#mr159](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/159) update version of minimist and helmet


#### Credits ###

- Crazyk031
- kenshin-samourai
- LaurentMT
- RockyRococo
- sarath
- SatoshiThreepwood
- zeroleak


<a name="1_7_0"/>

## Samourai Dojo v1.7.0 ##


### Notable changes ###


#### New optional strict_mode_vouts added to PushTx endpoints ####

A new optional "strict mode" is added to the /pushtx and /pushtx/schedule endpoints of the API.

This strict mode enforces a few additional checks on a selected subset of the outputs of a transaction before it's pushed on the P2P network or before it's scheduled for a delayed push.

See this [doc](https://code.samourai.io/dojo/samourai-dojo/-/blob/develop/doc/POST_pushtx.md) for detailed information.


#### Upgrade of whirlpool to v0.10.8 ####

Upgrade to [whirlpool-cli](https://code.samourai.io/whirlpool/whirlpool-client-cli) v0.10.8

A new config parameter `WHIRLPOOL_RESYNC` is added to docker-whirlpool.conf. When set to `on`, mix counters are resynchronized on startup of whirlpool-cli.


### Change log ###


#### MyDojo ####

- [#mr142](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/142) add setup of explorer in keys.index.js
- [#mr143](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/143) update doc and package.json with url of new repository
- [#mr144](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/144) switch addrindexrs repo to gitlab
- [#mr145](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/145) explicitely set algo used for jwt signatures
- [#mr146](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/146) upgrade whirlpool to whirlpool-cli 0.10.7
- [#mr147](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/147) add new optional strict_mode_vouts to pushtx endpoints
- [#mr148](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/148) status code pushtx endpoints
- [#mr149](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/149) upgrade whirlpool to whirlpool-cli 0.10.8


#### Credits ###

- kenshin-samourai
- zeroleak


<a name="1_6_0"/>

## Samourai Dojo v1.6.0 ##


### Notable changes ###


#### Whirlpool CLI ####

This version of Dojo introduces the support of an optional Whirlpool client ([whirlpool-client-cli](https://code.samourai.io/whirlpool/whirlpool-client-cli)) running inside MyDojo.

This option provides several benefits:
- all communications between the Whirlpool client and Dojo's API are internal to Docker,
- Whirlpool client exposes its API as a Tor hidden service. All communications between Whirlpool GUI and the Whirlpool client are moade over Tor.

See this [documentation](https://github.com/Samourai-Wallet/samourai-dojo/blob/master/doc/DOCKER_advanced_setups.md#local_whirlpool) for the detailed procedure allowing to configure and install the Whirlpool client.


#### Unified logs system ####

Starting with this version, logs of all containers are managed with the log system provided by Docker.

Logs of all NodeJS submodules (API, Tracker, PushTx, PushTx Orchestrator) are merged into a single stream.

The -d option of `dojo.sh logs` command is deprecated.

See this [documentation](https://github.com/Samourai-Wallet/samourai-dojo/blob/master/doc/DOCKER_setup.md#shell_script) for a list of logs available through the `dojo.sh` command.


#### Upgrade of bitcoind to v0.20.0 ####

Upgrade to Bitcoin Core v0.20.0


#### Upgrade of Tor to v0.4.2.7 ####

Upgrade to [Tor](https://www.torproject.org/) v0.4.2.7


#### Upgrade of BTC RPC Explorer to v2.0.0 ####

Upgrade to [btc-rpc-explorer](https://github.com/janoside/btc-rpc-explorer) v2.0.0


#### Upgrade of addrindexrs to v0.3.0 ####

Upgrade to [addrindexrs](https://github.com/Samourai-Wallet/addrindexrs) v0.3.0


### Change log ###


#### MyDojo ####

- [#128](https://github.com/Samourai-Wallet/samourai-dojo/pull/128) drop unneeded reversebuffer util method
- [#142](https://github.com/Samourai-Wallet/samourai-dojo/pull/142) modify results returned by dojo.sh onion
- [#143](https://github.com/Samourai-Wallet/samourai-dojo/pull/143) improve display of dojo version
- [#144](https://github.com/Samourai-Wallet/samourai-dojo/pull/144) add dynamic switch of startup mode
- [#147](https://github.com/Samourai-Wallet/samourai-dojo/pull/147) increase control over ports exposed by dojo
- [#148](https://github.com/Samourai-Wallet/samourai-dojo/pull/148) upgrade explorer to btc-rpc-explorer 2.0.0
- [#149](https://github.com/Samourai-Wallet/samourai-dojo/pull/149) upgrade tor to v0.4.2.7
- [#152](https://github.com/Samourai-Wallet/samourai-dojo/pull/152) add new optional whirlpool container
- [#154](https://github.com/Samourai-Wallet/samourai-dojo/pull/154) manage all logs with docker log system
- [#156](https://github.com/Samourai-Wallet/samourai-dojo/pull/156) upgrade indexer to addrindexrs v0.2.0
- [#157](https://github.com/Samourai-Wallet/samourai-dojo/pull/157) clean-up of log files
- [#158](https://github.com/Samourai-Wallet/samourai-dojo/pull/158) misc improvements in bitcoind rpc transactions class
- [#159](https://github.com/Samourai-Wallet/samourai-dojo/pull/159) upgrade indexer to rust 1.42.0 slim buster
- [#160](https://github.com/Samourai-Wallet/samourai-dojo/pull/160) upgrade bitcoind to bitcoin core 0.20.0
- [#mr141](https://code.samourai.io/dojo/samourai-dojo/-/merge_requests/141) added more header to allow proper cors
- [#163](https://github.com/Samourai-Wallet/samourai-dojo/pull/163) upgrade indexer to addrindexrs 0.3.0
- [#164](https://github.com/Samourai-Wallet/samourai-dojo/pull/164) upgrade whirlpool to whirlpool-cli 0.10.6


#### Bug fixes ####

- [4ee1f66](https://github.com/Samourai-Wallet/samourai-dojo/commit/4ee1f666b04f5096eae021f2ffb8b94d7323b7da) fix dojo version in index-example.js
- [37c4ac6](https://github.com/Samourai-Wallet/samourai-dojo/commit/37c4ac65d50ea849625c20a53fe260af386cc2f5) add missing quote breaking pushtx-rest-api.js script
- [#150](https://github.com/Samourai-Wallet/samourai-dojo/pull/150) define a floor for tracker normal mode
- [#153](https://github.com/Samourai-Wallet/samourai-dojo/pull/153) fix typo in install scripts causing a copy error when installing or upgrading
- [#155](https://github.com/Samourai-Wallet/samourai-dojo/pull/155) fix typo: laucnhed -> launched
- [#161](https://github.com/Samourai-Wallet/samourai-dojo/pull/161) trap docker & bash messages displayed on dojo.sh stop
- [#162](https://github.com/Samourai-Wallet/samourai-dojo/pull/162) fix path of sha256sums.asc


#### Documentation ####

- [#139](https://github.com/Samourai-Wallet/samourai-dojo/pull/139) update synology documentation
- [#146](https://github.com/Samourai-Wallet/samourai-dojo/pull/146) fix misleading docs for post_pushtx


#### Credits ###

- anwfr
- BTCxZelko
- dergigi
- kenshin-samourai
- LaurentMT
- lukechilds
- mikispag
- pajasevi
- zeroleak


<a name="1_5_0"/>

## Samourai Dojo v1.5.0 ##


### Notable changes ###


#### Local indexer of Bitcoin addresses ####

Previous versions of Dojo provided the choice between 2 data sources for import and rescan operations, the local bitcoind and OXT. This version introduces a new optional Docker container running a local indexer ([addrindexrs](https://github.com/Samourai-Wallet/addrindexrs)) that can be used as an alternative to the 2 existing options.

The local indexer provides private, fast and exhaustive imports and rescans.

Warning: The local indexer requires around 120GB of additionnal disk space during its installation, and around 60GB after the compaction of its database.

See this [documentation](https://github.com/Samourai-Wallet/samourai-dojo/blob/master/doc/DOCKER_advanced_setups.md#local_indexer) for the detailed procedure allowing to configure and install the indexer.


#### Local Electrum server used as data source for imports/rescans ####

This version of Dojo introduces the support of a local external Electrum server (ElectrumX or Electrs) as the data source of imports and rescans. This option provides the same benefits as the new local indexer to users running an Electrum server.

See this [documentation](https://github.com/Samourai-Wallet/samourai-dojo/blob/master/doc/DOCKER_advanced_setups.md#local_electrum) for the detailed procedure allowing to configure your Electrum server as the data source of imports and rescans.


#### Improved performances of Dojo upgrades ####

By default, the upgrade process will try to reuse the image layers cached by Docker in order to reduce the duration of upgrades.

A new option for the upgrade command allows to force a complete rebuild of all the containers (equivalemt to the former default behavior of the upgrade process).

```
> ./dojo.sh upgrade --nocache
```


#### Additional controls before installation ####

A few controls and confirmations were added to the installation process in order to avoid multiple calls leading to problems with database credentials. Additionally, a full uninstallation is forced before a new installation is allowed.


#### Upgrade of bitcoind to v0.19.1 ####

Upgrade to Bitcoin Core v0.19.1


### Change log ###


#### MyDojo ####

- [#118](https://github.com/Samourai-Wallet/samourai-dojo/pull/118) add support of local indexers as the data source of imports and rescans
- [#119](https://github.com/Samourai-Wallet/samourai-dojo/pull/119) improve performances of dojo upgrades
- [#120](https://github.com/Samourai-Wallet/samourai-dojo/pull/120) upgrade btc-rpc-explorer to v1.1.8
- [#121](https://github.com/Samourai-Wallet/samourai-dojo/pull/121) add controls and confirmations before reinstalls and uninstalls
- [#124](https://github.com/Samourai-Wallet/samourai-dojo/pull/124) upgrade bitcoin v0.19.1
- [#125](https://github.com/Samourai-Wallet/samourai-dojo/pull/125) improve support of --auto option in dojo.sh
- [#127](https://github.com/Samourai-Wallet/samourai-dojo/pull/127) upgrade btc-rpc-explorer to v1.1.9
- [#129](https://github.com/Samourai-Wallet/samourai-dojo/pull/129) fix mydojo buster


#### Bug fixes ####

- [#115](https://github.com/Samourai-Wallet/samourai-dojo/pull/115) backport of fix implemented in 1.4.1
- [#131](https://github.com/Samourai-Wallet/samourai-dojo/pull/131) fix issue 130


#### Security ####

- [#126](https://github.com/Samourai-Wallet/samourai-dojo/pull/126) upgrade nodejs packages


#### Documentation ####

- [#137](https://github.com/Samourai-Wallet/samourai-dojo/pull/137) improved instructions related to config files


#### Credits ###

- BTCxZelko
- Crazyk031
- GuerraMoneta
- kenshin-samourai
- LaurentMT


<a name="1_4_1"/>

## Samourai Dojo v1.4.1 ##


### Notable changes ###


#### Prevents a hang of Dojo on shutdown ####

Since v1.4.0, some users that Dojo is hanging during its shutdown. This release provides a fix for the users affected by this problem.


#### Prevents automatic restarts of bitcoind container ####

This release removes automatic restarts of the bitcoind container when bitcoind has exited with an error.


### Change log ###

#### Bug fixes ####

- [0ff045d](https://github.com/Samourai-Wallet/samourai-dojo/commit/0ff045d1495807902e9fd7dcfbd2fdb4dc21c608) keep bitcoind container up if bitcoind exits with an error
- [bd43526](https://github.com/Samourai-Wallet/samourai-dojo/commit/bd43526bca1f36a1ada07ad799c87b11a897e873) fix for dojo hanging on shutdown
- [3ee85db](https://github.com/Samourai-Wallet/samourai-dojo/commit/3ee85db3bf69f4312204e502c98d414a4180dc53) force kill of docker exec used for testing bitcoind shutdown if command hangs more than 12s


#### Misc. ####

- [21925f7](https://github.com/Samourai-Wallet/samourai-dojo/commit/21925f7c321974ef7eb55c1ad897a5e02ef52bee) bump versions of dojo and bitcoind container
- [08342e3](https://github.com/Samourai-Wallet/samourai-dojo/commit/08342e3995c473b589bb2a517e5bc30cf5f7dc9a) add trace in stop() function of dojo.sh


### Credits ###

- BTCxZelko
- Crazyk031
- GuerraMoneta
- kenshin-samourai
- LaurentMT
- mj


<a name="1_4_0"/>

## Samourai Dojo v1.4.0 ##


### Notable changes ###


#### Local block explorer ####

This release adds a new docker container hosting a local block explorer ([BTC RPC Explorer](https://github.com/janoside/btc-rpc-explorer)).

Access to the block explorer is secured by a password defined in /docker/my-dojo/conf/docker-explorer.conf (see `EXPLORER_KEY` configuration parameter).

*Upgrade procedure*

```
# Stop your Dojo

# Download the Dojo archive for this release

# Override the content of your <dojo_dir> with the content of the Dojo archive

# Edit <dojo_dir>/docker/my-dojo/conf/docker-explorer.conf.tpl and set the value of `EXPLORER_KEY` with a custom password.

# Launch the upgrade of your Dojo with: dojo.sh upgrade
```

This local block explorer is available as a Tor hidden service. Its static onion address can be retrieved with the command

```
dojo.sh onion
```


#### Autostart of Dojo ####

Starting with this release, Dojo is automatically launched when the docker daemon starts.


### Change log ###

#### MyDojo ####

- [#101](https://github.com/Samourai-Wallet/samourai-dojo/pull/101) add --auto and --nolog options to install and upgrade commands
- [#102](https://github.com/Samourai-Wallet/samourai-dojo/pull/102) improve performances of transactions imports
- [#107](https://github.com/Samourai-Wallet/samourai-dojo/pull/107) add optional block explorer
- [#108](https://github.com/Samourai-Wallet/samourai-dojo/pull/108) switch restart policies of containers to always
- [#109](https://github.com/Samourai-Wallet/samourai-dojo/pull/109) use port 80 of keyservers
- [#110](https://github.com/Samourai-Wallet/samourai-dojo/pull/110) replace keyserver
- [#111](https://github.com/Samourai-Wallet/samourai-dojo/pull/111) enable autostart of dojo
- [#113](https://github.com/Samourai-Wallet/samourai-dojo/pull/113) check if dojo is running (start and stop commands)


#### Bug fixes ####

- [#100](https://github.com/Samourai-Wallet/samourai-dojo/pull/100) fix issue caused by sed -i on osx


#### Documentation ####

- [#99](https://github.com/Samourai-Wallet/samourai-dojo/pull/99) doc: installation of dojo on synology
- [b12d24d](https://github.com/Samourai-Wallet/samourai-dojo/commit/b12d24d088a95023a8e1c9e8a1b1c4b40491d4a7) update readme


### Credits ###

- anwfr
- jochemin
- kenshin-samourai
- LaurentMT


<a name="1_3_0"/>

## Samourai Dojo v1.3.0 ##


### Notable changes ###


#### Update of configuration parameters ####

Configuration parameter ```NODE_IMPORT_FROM_BITCOIND``` is replaced by ```NODE_ACTIVE_INDEXER```.

The supported values for the new parameter are:
- ```local_bitcoind``` (equivalent to former ```NODE_IMPORT_FROM_BITCOIND=active```)
- ```third_party_explorer``` (equivalent to former ```NODE_IMPORT_FROM_BITCOIND=inactive```)

**Upgrade of Dojo to v1.3.0 automatically sets the parameter to the default value** ```local_bitcoind```.


#### Installation of Tor from source code archives ####

Previous versions of Dojo used the git repository operated by the Tor Project during the build of the Tor container. Starting with this version, Dojo will download an archive of the source code.

Users living in countries blocking the access to resources provided by the Tor Project can easily switch to a mirror site by editing this [line](https://github.com/Samourai-Wallet/samourai-dojo/blob/develop/docker/my-dojo/tor/Dockerfile#L4) before installing or upgrading their Dojo.

The default source used by Dojo is the archive provided by the [Tor Project](https://archive.torproject.org/tor-package-archive).


#### Add support of Tor bridges ####

The Tor container now supports the configuration of Tor bridges. For some users, it may be appropriate to configure Tor bridges in order to circumvent a local censorship of the Tor network. See [this section](https://github.com/Samourai-Wallet/samourai-dojo/blob/develop/doc/DOCKER_advanced_setups.md#tor_bridges) of the documentation for the activation of Tor bridges on your Dojo.


#### Add Blocks rescan feature to the maintenance tool ####

This version introduces a new "Blocks Rescan" feature accessible from the Maintenance Tool.

"Blocks Rescan" allows to rescan a range of blocks for all the addresses currently tracked by your Dojo (loose addresses or addresses derived for your xpubs). This feature comes in handy when the block confirming a missing transaction is known by the user.


#### Add Esplora as the new external data source for testnet ####

The testnet version of Dojo now relies on the Esplora API as its external data source for imports and rescans.

Previously used API (BTC.COM and Insight) have been removed.

Default URL used for the Esplora API is https://blockstream.info/testnet. A local Esplora instance can be used by editing this [line](https://github.com/Samourai-Wallet/samourai-dojo/blob/develop/docker/my-dojo/.env#L44).


#### Remove support of HTTPS by NodeJS ####

Support of HTTPS by the NodeJS server has been removed.


#### Upgrade of bitcoind to v0.19.0.1 ####

Upgrade to Bitcoin Core v0.19.0.1.


#### Update bitcoinjs to v5.1.4 ####

The bitcoinjs library has been updated to v5.1.4.


### Change log ###

#### MyDojo ####

- [#71](https://github.com/Samourai-Wallet/samourai-dojo/pull/71) update to use latest bitcoinjs
- [#74](https://github.com/Samourai-Wallet/samourai-dojo/pull/74) adding bridge support to tor-container
- [#80](https://github.com/Samourai-Wallet/samourai-dojo/pull/80) add support of blocks rescans in the maintenance tool
- [#83](https://github.com/Samourai-Wallet/samourai-dojo/pull/83) removed unused support of https by nodejs apps
- [#84](https://github.com/Samourai-Wallet/samourai-dojo/pull/84) install tor from source code archive
- [#85](https://github.com/Samourai-Wallet/samourai-dojo/pull/85) add esplora as a data source for testnet imports and rescans
- [#90](https://github.com/Samourai-Wallet/samourai-dojo/pull/90) update the remote importer
- [#91](https://github.com/Samourai-Wallet/samourai-dojo/pull/91) improve the tracking of loose addresses
- [#93](https://github.com/Samourai-Wallet/samourai-dojo/pull/93) increase timeouts defined in docker-compose files (for raspi hardwares)
- [#93](https://github.com/Samourai-Wallet/samourai-dojo/pull/93) upgrade bitcoind to bitcoin core 0.19.0.1


#### Bug fixes ####

- [#73](https://github.com/Samourai-Wallet/samourai-dojo/pull/73) remove unhandled promise error
- [#79](https://github.com/Samourai-Wallet/samourai-dojo/pull/79) retry to send sql requests on detection of a lock
- [#94](https://github.com/Samourai-Wallet/samourai-dojo/pull/94) improve the transaction cache implemented for bitcoind rpc client


#### Documentation ####

- [b5dd967](https://github.com/Samourai-Wallet/samourai-dojo/commit/b5dd9673c159b469fb19f43c33a0c0dd21b2fe5a) update api doc (see #75)
- [16926a8](https://github.com/Samourai-Wallet/samourai-dojo/commit/16926a86fb637fb06510d1418474f62d3570cfd3) update docker doc


#### Misc ####

- [#76](https://github.com/Samourai-Wallet/samourai-dojo/pull/76) pin versions in package-lock.json


### Credits ###

- junderw
- kenshin-samourai
- LaurentMT
- nickodev


<a name="1_2_0"/>

## Samourai Dojo v1.2.0 ##


### Notable changes ###


#### Support of testnet ####

Support of testnet has been added to MyDojo.

See this [doc](./doc/https://github.com/Samourai-Wallet/samourai-dojo/blob/develop/doc/DOCKER_advanced_setups.md#support-of-testnet) for more details.


#### Upgrade of bitcoind to v0.18.1 ####

Upgrade to Bitcoin Core v0.18.1.


#### Fix for issue #59 ####

Fix a bug introduced by Dojo v1.1 when bitcoind is exposed to external apps.

See [issue #59](https://github.com/Samourai-Wallet/samourai-dojo/issues/59).


### Change log ###

#### MyDojo ####

- [#46](https://github.com/Samourai-Wallet/samourai-dojo/pull/46) add testnet support to my-dojo
- [#49](https://github.com/Samourai-Wallet/samourai-dojo/pull/49) add support of auth token passed through the authorization http header
- [#54](https://github.com/Samourai-Wallet/samourai-dojo/pull/54) remove /dump/heap endpoint and dependency on heapdump package
- [#55](https://github.com/Samourai-Wallet/samourai-dojo/pull/55) upgrade bitcoind to bitcoin core 0.18.1
- [#60](https://github.com/Samourai-Wallet/samourai-dojo/pull/55) fix for #59 (dojo with exposed bitcoind ports doesn't start)


#### Documentation ####

- [#50](https://github.com/Samourai-Wallet/samourai-dojo/pull/50) consolidated Mac Instructions
- [#58](https://github.com/Samourai-Wallet/samourai-dojo/pull/58) add instructions to resolve pairing failure


### Credits ###

- dergigi
- kenshin-samourai
- LaurentMT
- Mark Engelberg
- PuraVida
- pxsocs


<a name="1_1_0"/>

## Samourai Dojo v1.1.0 ##


### Notable changes ###


#### Upgrade mechanism ####

An upgrade mechanism for MyDojo has been added.

See this [doc](./doc/DOCKER_setup.md#upgrade) for more details.


#### Optional support of an external bitcoin full node ####

Optional support of an existing Bitcoin full node running outside of Docker has been added.

This setup can be configured thanks to new options defined in ./docker/my-dojo/conf/docker-bitcoind.conf. When this option is activated, the install command skips the installation of bitcoind in Docker.

Note: The Bitcoin full node installed by MyDojo is configured for taking care of your privacy at a network level. You may lose the benefits provided by the default setup if your external full node isn't properly configured. Use at your own risk.

See this [doc](./doc/DOCKER_advanced_setups.md#external_bitcoind) for more details.


#### Optional support of external apps ####

New options defined in ./docker/my-dojo/conf/docker-bitcoind.conf allow to expose the RPC API and ZMQ notifications provided by the full node of MyDojo to applications runnnig outside of Docker.

Note: Exposing the full node of MyDojo to external applications may damage your privacy. Use at your own risk.

See this [doc](./doc/DOCKER_advanced_setups.md#exposed_rpc_zmq) for more details.


#### Optional support of a static onion address for the full node ####

A new option defined in ./docker/my-dojo/conf/docker-bitcoind.conf allows to keep a static onion address for your full node.

By default, MyDojo generates a new onion address at each startup. We recommend to keep this default setup for better privacy.

See this [doc](./doc/DOCKER_advanced_setups.md#static_onion) for more details.


#### Clean-up of Docker images ####

A new "clean" command has been added to Dojo shell script for deleting old Docker images of MyDojo.

This command allows to free disk space on the Docker host.


#### Documentation ####

Added a new [doc](./doc/DOCKER_advanced_setups.md) for advanced setups.

Added a new [doc](./doc/DOCKER_mac_setup.MD) for MacOS users.


### Change log ###

#### MyDojo ####

- [#1](https://github.com/Samourai-Wallet/samourai-dojo/pull/1) my-dojo upgrade mechanism
- [#7](https://github.com/Samourai-Wallet/samourai-dojo/pull/7) support of inbound connections through Tor
- [#8](https://github.com/Samourai-Wallet/samourai-dojo/pull/8) add config option exposing the rpc api and zmq notifications to external apps
- [#10](https://github.com/Samourai-Wallet/samourai-dojo/pull/10) add an option allowing to run dojo on top of an external bitcoind
- [#11](https://github.com/Samourai-Wallet/samourai-dojo/pull/11) clean-up
- [#12](https://github.com/Samourai-Wallet/samourai-dojo/pull/12) extend support of external apps
- [#15](https://github.com/Samourai-Wallet/samourai-dojo/pull/15) fix issue introduced by #10
- [#19](https://github.com/Samourai-Wallet/samourai-dojo/pull/19) fix bitcoind port in torrc
- [#20](https://github.com/Samourai-Wallet/samourai-dojo/pull/20) increase nginx timeout
- [#25](https://github.com/Samourai-Wallet/samourai-dojo/pull/25) force the tracker to derive next indices if a hole is detected
- [#27](https://github.com/Samourai-Wallet/samourai-dojo/pull/27) rework external loop of Orchestrator
- [#28](https://github.com/Samourai-Wallet/samourai-dojo/pull/28) rework RemoteImporter
- [#32](https://github.com/Samourai-Wallet/samourai-dojo/pull/32) change the conditions switching the startup mode of the tracker
- [#33](https://github.com/Samourai-Wallet/samourai-dojo/pull/33) check authentication with admin key
- [#37](https://github.com/Samourai-Wallet/samourai-dojo/pull/37) automatic redirect of onion address to maintenance tool
- [#38](https://github.com/Samourai-Wallet/samourai-dojo/pull/38) dojo shutdown - replace sleep with static delay by docker wait


#### Security ####

- [#5](https://github.com/Samourai-Wallet/samourai-dojo/pull/5) mydojo - install nodejs
- [#6](https://github.com/Samourai-Wallet/samourai-dojo/pull/6) remove deprecated "new Buffer" in favor of "Buffer.from"
- [#41](https://github.com/Samourai-Wallet/samourai-dojo/pull/41) update nodejs packages


#### Documentation ####

- [#13](https://github.com/Samourai-Wallet/samourai-dojo/pull/13) included Mac instructions
- [92097d8](https://github.com/Samourai-Wallet/samourai-dojo/commit/92097d8ec7f9488ce0318c452356994315f4be72) doc
- [de4c9b5](https://github.com/Samourai-Wallet/samourai-dojo/commit/de4c9b5e5078b673c7b199503d48e7ceca328285) doc - minor updates
- [fead0bb](https://github.com/Samourai-Wallet/samourai-dojo/commit/fead0bb4b2b6174e637f5cb8c57edd9b55c3a1c7) doc - add link to MacOS install doc
- [#42](https://github.com/Samourai-Wallet/samourai-dojo/pull/42) fix few typos, add backticks for config values
- [#43](https://github.com/Samourai-Wallet/samourai-dojo/pull/43) add missing `d` in `docker-bitcoind.conf`


#### Misc ####

- [a382e42](https://github.com/Samourai-Wallet/samourai-dojo/commit/a382e42469b884d2eda9fa6f5a3c8ce93a7cd39a) add sql scripts and config files to gitignore


### Credits ###

- 05nelsonm
- clarkmoody
- dergigi
- hkjn
- kenshin-samourai
- LaurentMT
- michel-foucault
- pxsocs
- Technifocal
