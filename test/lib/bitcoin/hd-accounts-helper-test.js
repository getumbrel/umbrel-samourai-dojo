/*!
 * test/lib/bitcoin/hd-accounts-helper.js
 * Copyright © 2019 – Katana Cryptographic Ltd. All Rights Reserved.
 */


import assert from 'assert'
import hdaHelper from '../../../lib/bitcoin/hd-accounts-helper.js'


/**
 * Test vectors
 */

const XPUB = 'tpubDDDAe7GgFT4fzEzKwWVA4BWo8fiJXQeGEYDTexzo2w6CK1iDoLPYkpEisXo623ieF79GQ3xpcEVN1vcQhX2sysyL8o1XqzBmQb9JReTxQ7w'
const YPUB = 'upub5ELkCsSF68UnAZE7zF9CDztvHeBJiAAhwa4VxEFzZ1CfQRbpy93mkBbUZsqYVpoeEHFwY3fGh9bfftH79ZwbhjUEUBAxQj551TMxVyny4UX'
const ZPUB = 'vpub5ZB1WY7AEp2G1rREpbvpS5zRTcKkenACrgaijd9sw1aYTXR4DoDLNFFcb5o8VjTZdvNkHXFq9oxDZAtfsGMcVy9qLWsNzdtZHBRbtXe87LB'

const POSTMIX_ZPUB = 'vpub5Y6cjg7GbwSLRu33XB76n3EoJZscmYSVEToLSMqD6ugAcm4rof8E9yvDiaFfhGEuyL95P9VD4A9W3JrBTZhzWSXiRyYvWFnUBAZc67X32wh'

const BIP44_VECTORS = [
    [0, 0, 'mmZ5FRccGAkwfKme4JkrsmurnimDLdfmNL'],
    [0, 1, 'n3yomLicyrSULiNWFKHsK8erntSpJZEPV6'],
    [0, 2, 'mvVYLwjmMuYVWbuTyB9UE6LWah9tevLrrE'],
    [0, 3, 'n1CrG3NpdTiFWh8KgsnAGUgn6aEF8xvYY2'],
    [0, 4, 'mw3JvPz3wdUVrmTD6WugHgahk97QWnD61L'],

    [1, 0, 'miYMfmg3F3QpBJ48oVzvSi4NVgi93ykJ1L'],
    [1, 1, 'mvEnHm9ZFcdnBa5wNfiJ6yVViex8wReDJJ'],
    [1, 2, 'muSWDErhMRUHb6nSQqnVLp3TctqsKjKY4G'],
    [1, 3, 'mhxsuiLirgVeRT9Nb9iUVrmCTgNDc1tcNa'],
    [1, 4, 'mtj8CDwFPa4cfyK9cgfSCaXvDxdszgFFVU']
]

const BIP49_VECTORS = [
    [0, 0, '2NCmqrb5eXMYZUxdnY4Dr8h3FKqH6JmWCco'],
    [0, 1, '2NCxTGKxDsv9gyC2wjBev85WHP1GN8LCKfR'],
    [0, 2, '2N7vmdwgKjVxkivSou6F8Zaj37SxH7jASaC'],
    [0, 3, '2NBeYshMWNj5jiMBuk9mfywY2853QKgDJ9k'],
    [0, 4, '2MutR6UcnThCUmFJVUrT2z265pNGQcj6DV3'],

    [1, 0, '2MvSusqGmAB5MNz66dVLndV8AVKBvhidCdS'],
    [1, 1, '2MxCqx15GTdW8wDXAVSsxnmHTjoqQLEEzQt'],
    [1, 2, '2N7megh7h2CiCcGWcXax266BtjxZy5Hovrf'],
    [1, 3, '2N8CrDFMsFA7Gs9phdA7xpm3RrDgvk719ro'],
    [1, 4, '2Msi1iNCJcxsxX5ENiVzzqWw8GuCJG8zfmV']
]

const BIP84_VECTORS = [
    [0, 0, 'tb1qggmkgcrk5zdwm8wlh2nzqv5k7xunv3tqk6w9p0'],
    [0, 1, 'tb1q7enwpjlzuc3taq69mkpyqmkwn8d5mtrvmvzl9m'],
    [0, 2, 'tb1q53zh56awxvk824msyxhfjtlwg4fwd3s2s5wygh'],
    [0, 3, 'tb1q6l6lm298eq5qkwntl42lv2x0vw6yny50ugnuef'],
    [0, 4, 'tb1q4fre2as0az62am5eaj30tupv92crqd8yjpu67w'],

    [1, 0, 'tb1qyykyu2y9lx6qt2y6j3nur88ssnpuapnug9zuv4'],
    [1, 1, 'tb1q59awztrl7dfn7l38a8uvgrkstrw4lf4fwmz2kt'],
    [1, 2, 'tb1qnza9973gp8f7rm9k9yc327zwdvz9wl9sa3yvp7'],
    [1, 3, 'tb1qrttk0uzx656uupg9w8f39ec6e6c8wwcts4fanj'],
    [1, 4, 'tb1qjrnw8u2pvspm6hq3aa83ff93wevq2zyxqczewy']
]

const POSTMIX_VECTORS = [
    [1, 0, 'tb1qv3laps2vues6nh9fkxpds3wxd0cttd9jnr0772'],
    [1, 1, 'tb1qz538rwwchv2unf97g4pugv3wjwxxjaypnwz8sk'],
    [1, 2, 'tb1qdm3hfvw3knzujxx24g05e30kpe7vk0ez3dk0h8'],
    [1, 3, 'tb1qxn4jgg5hgl3eggvt4alvraladpwq9pj30fy5ze'],
    [1, 4, 'tb1qw2ghyxhqv5ysyehq9p9xwux4zqaf0mcwm29agh'],

    [1, 0, 'mpgLz1YXDU9buy7Zn8w9w9mJtrGghiXotH'],
    [1, 1, 'mhShkJxHHgzJd2WcqeaKL4spqBMe1wcaK5'],
    [1, 2, 'mqdH74foDiN8hV2mmFSHnceCm7vgErd4A2'],
    [1, 3, 'mkLm7vUy1rij3YicskkQJxGovnGDG6G2oj'],
    [1, 4, 'mqxjZfjdSdUmecTVALzhoQBPFRNvLViMBr'],

    [1, 0, '2N5UxwLfWexxHDm5MKHoyitRLWEK8x25tiA'],
    [1, 1, '2N8wnnGoJujWGrM5YLs1nC1TFuszx2vJVA9'],
    [1, 2, '2NA6Ja6PM6YMuQpSQdeWofKRV9pcBbz4aii'],
    [1, 3, '2NFLd63BqGzh5BtfxobuU4dpoThg9sxMPth'],
    [1, 4, '2NEeziC2dc3nbf9k3fyUWBzLWbn4MTrR2mm']

]

const HD_TYPES_VECTORS = [
    // unlocked
    [0, hdaHelper.BIP44, false],
    [1, hdaHelper.BIP49, false],
    [2, hdaHelper.BIP84, false],
    // locked
    [128, hdaHelper.BIP44, true],
    [129, hdaHelper.BIP49, true],
    [130, hdaHelper.BIP84, true],
]


describe('HdAccountsHelper', () => {

    describe('isXpub()', () => {
        it('should successfully detect a XPUB', () => {
            assert(hdaHelper.isXpub(XPUB))
            assert(!hdaHelper.isXpub(YPUB))
            assert(!hdaHelper.isXpub(ZPUB))
        })

        it('should successfully detect a YPUB', () => {
            assert(!hdaHelper.isYpub(XPUB))
            assert(hdaHelper.isYpub(YPUB))
            assert(!hdaHelper.isYpub(ZPUB))
        })

        it('should successfully detect a ZPUB', () => {
            assert(!hdaHelper.isZpub(XPUB))
            assert(!hdaHelper.isZpub(YPUB))
            assert(hdaHelper.isZpub(ZPUB))
        })
    })


    describe('isValid()', () => {
        it('should successfully validate a valid XPUB', () => {
            assert(hdaHelper.isValid(XPUB))
        })

        it('should successfully validate a valid YPUB', () => {
            assert(hdaHelper.isValid(YPUB))
        })

        it('should successfully validate a valid ZPUB', () => {
            assert(hdaHelper.isValid(ZPUB))
        })
    })


    describe('classify()', () => {
        it('should successfully classify the code stored in db', () => {
            for (const v of HD_TYPES_VECTORS) {
                const ret = hdaHelper.classify(v[0])
                assert.strictEqual(ret.type, v[1])
                assert.strictEqual(ret.locked, v[2])
            }
        })
    })


    describe('makeType()', () => {
        it('should successfully compute the code stored in db', () => {
            for (const v of HD_TYPES_VECTORS) {
                const ret = hdaHelper.makeType(v[1], v[2])
                assert.strictEqual(ret, v[0])
            }
        })
    })


    describe('deriveAddresses()', () => {
        it('should successfully derive addresses with BIP44', async () => {
            for (const v of BIP44_VECTORS) {
                const addresses = await hdaHelper.deriveAddresses(XPUB, v[0], [v[1]], hdaHelper.BIP44)
                assert.strictEqual(addresses[0].address, v[2])
            }
        })

        it('should successfully derive addresses with BIP49', async () => {
            for (const v of BIP49_VECTORS) {
                const addresses = await hdaHelper.deriveAddresses(XPUB, v[0], [v[1]], hdaHelper.BIP49)
                assert.strictEqual(addresses[0].address, v[2])
            }
        })

        it('should successfully derive addresses with BIP84', async () => {
            for (const v of BIP84_VECTORS) {
                const addresses = await hdaHelper.deriveAddresses(XPUB, v[0], [v[1]], hdaHelper.BIP84)
                assert.strictEqual(addresses[0].address, v[2])
            }
        })

        it('should successfully derive additional change address types for postmix account', async () => {
            const addresses = await hdaHelper.deriveAddresses(POSTMIX_ZPUB, 1, [0, 1, 2, 3, 4], hdaHelper.BIP84)

            for (const vector of POSTMIX_VECTORS) {
                assert(addresses.find((addr) => addr.index === vector[1]))
                assert(addresses.find((addr) => addr.address === vector[2]))
            }
        })
    })


    describe('xlatXPUB()', () => {
        it('should successfully translate XPUB in YPUB', () => {
            const xpubXlated = hdaHelper.xlatXPUB(XPUB)
            assert.strictEqual(xpubXlated, XPUB)
        })

        it('should successfully translate YPUB in XPUB', () => {
            const ypubXlated = hdaHelper.xlatXPUB(YPUB)
            assert.strictEqual(ypubXlated, XPUB)
        })

        it('should successfully translate ZPUB in XPUB', () => {
            const zpubXlated = hdaHelper.xlatXPUB(ZPUB)
            assert.strictEqual(zpubXlated, XPUB)
        })
    })

})
