/*!
 * lib/util.js
 * Copyright © 2019 – Katana Cryptographic Ltd. All Rights Reserved.
 */
'use strict'

/**
 * @class Util
 * @description Class providing utility functions as static methods
 */
class Util {

  /**
   * Constructor
   * @constructor
   */
  constructor() {}

  /**
   * @description Serialize a series of asynchronous calls to a function over a list of objects
   * @param {Array<any>} list
   * @param {function} fn
   * @returns {Promise<Array<any>>}
   */
  static async seriesCall(list, fn) {
    const results = []

    for (const item of list) {
      results.push(await fn(item));
    }

    return results;
  }

  /**
   * @description Execute parallel asynchronous calls to a function over a list of objects
   * @param {Array<any>} list
   * @param {function} fn
   * @returns {Promise<Array<any>>}
   */
  static parallelCall(list, fn) {
    const operations = list.map(item => { return fn(item) })
    return Promise.all(operations)
  }

  /**
   * @description Delay the call to a function
   * @param {number} ms
   * @returns {Promise<void>}
   */
  static delay(ms) {
    return new Promise(resolve => {
      setTimeout(() => resolve(), ms)
    })
  }

  /**
   * @description Splits a list into a list of lists each with maximum length LIMIT
   * @param {Array<any>} list
   * @param {number} limit
   * @returns {Array<Array<any>>}
   */
  static splitList(list, limit) {
    const lists = []
    for (let i=0; i < list.length; i += limit)
      lists.push(list.slice(i, i+limit))
    return lists
  }

  /**
   * @description Check if a string is a valid hex value
   * @param {string} hash
   * @returns {boolean}
   */
  static isHashStr(hash) {
    const hexRegExp = new RegExp(/^[0-9a-f]*$/, 'i')
    return (typeof hash !== "string") ? false : hexRegExp.test(hash)
  }

  /**
   * @description Check if a string is a well formed 256 bits hash
   * @param {string} hash
   * @returns {boolean}
   */
  static is256Hash(hash) {
    return Util.isHashStr(hash) && hash.length === 64
  }


  /**
   * @description Sum an array of values
   * @param {Array<number>} arr
   * @returns {number}
   */
  static sum(arr) {
    return arr.reduce((memo, val) => { return memo + val }, 0)
  }

  /**
   * @description Mean of an array of values
   * @param {Array<number>} arr
   * @returns {number}
   */
  static mean(arr) {
    if (arr.length === 0)
      return NaN
    return sum(arr) / arr.length
  }

  /**
   * @description Compare 2 values (asc order)
   * @param {number} a
   * @param {number} b
   * @returns {number}
   */
  static cmpAsc(a, b) {
    return a - b
  }

  /**
   * @description Compare 2 values (desc order)
   * @param {number} a
   * @param {number} b
   * @returns {number}
   */
  static cmpDesc(a,b) {
    return b - a
  }

  /**
   * @description Median of an array of values
   * @param {Array<number>} arr
   * @param {boolean=} sorted
   * @returns {number}
   */
  static median(arr, sorted) {
    if (arr.length === 0) return NaN
    if (arr.length === 1) return arr[0]

    if (!sorted)
      arr.sort(Util.cmpAsc)

    const midpoint = Math.floor(arr.length / 2)

    if (arr.length % 2) {
      // Odd-length array
      return arr[midpoint]
    } else {
      // Even-length array
      return (arr[midpoint-1] + arr[midpoint]) /  2.0
    }
  }

  /**
   * @description Median Absolute Deviation of an array of values
   * @param {Array<number>} arr
   * @param {boolean=} sorted
   * @returns {number}
   */
  static mad(arr, sorted) {
    const med = Util.median(arr, sorted)
    // Deviations from the median
    const dev = []
    for (let val of arr)
      dev.push(Math.abs(val - med))
    return Util.median(dev)
  }

  /**
   * @description Quartiles of an array of values
   * @param {Array<number>} arr
   * @param {boolean=} sorted
   * @returns {Array<number>}
   */
  static quartiles(arr, sorted) {
    const q = [NaN,NaN,NaN]

    if (arr.length < 3) return q

    if (!sorted)
      arr.sort(Util.cmpAsc)

    // Set median
    q[1] = Util.median(arr, true)

    const midpoint = Math.floor(arr.length / 2)

    if (arr.length % 2) {
      // Odd-length array
      const mod4 = arr.length % 4
      const n = Math.floor(arr.length / 4)

      if (mod4 === 1) {
        q[0] = (arr[n-1] + 3 * arr[n]) / 4
        q[2] = (3 * arr[3*n] + arr[3*n+1]) / 4
      } else if (mod4 === 3) {
        q[0] = (3 * arr[n] + arr[n+1]) / 4
        q[2] = (arr[3*n+1] + 3 * arr[3*n+2]) / 4
      }

    } else {
      // Even-length array. Slices are already sorted
      q[0] = Util.median(arr.slice(0, midpoint), true)
      q[2] = Util.median(arr.slice(midpoint), true)
    }

    return q
  }

  /**
   * @description Obtain the value of the PCT-th percentile, where PCT on [0,100]
   * @param {Array<number>} arr
   * @param {number} pct
   * @param {boolean=} sorted
   * @returns {number}
   */
  static percentile(arr, pct, sorted) {
    if (arr.length < 2) return NaN

    if (!sorted)
      arr.sort(Util.cmpAsc)

    const N = arr.length
    const p = pct/100.0

    let x // target rank

    if (p <= 1 / (N + 1)) {
      x = 1
    } else if (p < N / (N + 1)) {
      x = p * (N + 1)
    } else {
      x = N
    }

    // "Floor-x"
    const fx = Math.floor(x) - 1

    // "Mod-x"
    const mx = x % 1

    if (fx + 1 >= N) {
      return arr[fx]
    } else {
      // Linear interpolation between two array values
      return arr[fx] + mx * (arr[fx+1] - arr[fx])
    }
  }

  /**
   * @description Convert bytes to MB
   * @param {number} bytes
   * @returns {number}
   */
  static toMb(bytes) {
    return +(bytes / Util.MB).toFixed(0)
  }

  /**
   * @description Convert a date to a unix timestamp
   * @returns {number}
   */
  static unix() {
    return (Date.now() / 1000) | 0
  }

  /**
   * @description Convert a value to a padded string (10 chars)
   * @param {number} v
   * @returns {string}
   */
  static pad10(v) {
    return (v < 10) ? `0${v}` : `${v}`
  }

  /**
   * @description Convert a value to a padded string (100 chars)
   * @param {number} v
   * @returns {string}
   */
  static pad100(v) {
    if (v < 10) return `00${v}`
    if (v < 100) return `0${v}`
    return `${v}`
  }

  /**
   * @description Convert a value to a padded string (1000 chars)
   * @param {number} v
   * @returns {string}
   */
  static pad1000(v) {
    if (v < 10) return `000${v}`
    if (v < 100) return `00${v}`
    if (v < 1000) return `0${v}`
    return `${v}`
  }

  /**
   * @description Left pad
   * @param {number} number
   * @param {number} places
   * @param {string=} fill
   * @returns {string}
   */
  static leftPad(number, places, fill) {
    number = Math.round(number)
    places = Math.round(places)
    fill = fill || ' '

    if (number < 0) return number

    const mag = (number > 0) ? (Math.floor(Math.log10(number)) + 1) : 1
    const parts = []

    for(let i=0; i < (places - mag); i++) {
      parts.push(fill)
    }

    parts.push(number)
    return parts.join('')
  }

  /**
   * @description Display a time period, in seconds, as DDD:HH:MM:SS[.MS]
   * @param {number} period
   * @param {number} milliseconds
   * @returns {string}
   */
  static timePeriod(period, milliseconds) {
    milliseconds = !!milliseconds

    const whole = Math.floor(period)
    const ms = 1000*(period - whole)
    const s = whole % 60
    const m = (whole >= 60) ? Math.floor(whole / 60) % 60 : 0
    const h = (whole >= 3600) ? Math.floor(whole / 3600) % 24 : 0
    const d = (whole >= 86400) ? Math.floor(whole / 86400) : 0

    const parts = [Util.pad10(h), Util.pad10(m), Util.pad10(s)]

    if (d > 0)
      parts.splice(0, 0, Util.pad100(d))

    const str = parts.join(':')

    if (milliseconds) {
      return str + '.' + Util.pad100(ms)
    } else {
      return str
    }
  }

  /**
   * @description Generate array of sequential numbers from start to stop
   * @param {number} start
   * @param {number} stop
   * @param {number=} step
   * @returns {number[]}
   */
  static range(start, stop, step = 1) {
    return Array(Math.ceil((stop - start) / step))
        .fill(start)
        .map((x, y) => x + y * step)
  }

}

/**
 * 1Mb in bytes
 */
Util.MB = 1024*1024


module.exports = Util
