FROM    debian:buster-slim AS builder


#################################################################
# INSTALL BITCOIN
#################################################################
ENV     BITCOIN_VERSION     22.0
ENV     BITCOIN_URL         https://bitcoincore.org/bin/bitcoin-core-22.0
ENV     BITCOIN_FILE_AMD64  bitcoin-22.0-x86_64-linux-gnu.tar.gz
ENV     BITCOIN_FILE_ARM64  bitcoin-22.0-aarch64-linux-gnu.tar.gz
ENV     BITCOIN_FILE_PPCLE  bitcoin-22.0-powerpc64le-linux-gnu.tar.gz
ENV     BITCOIN_SHASUMS     SHA256SUMS
ENV     BITCOIN_SHASUMS_ASC SHA256SUMS.asc

# Bitcoin keys (all)
ENV     KEYS 71A3B16735405025D447E8F274810B012346C9A6 01EA5486DE18A882D4C2684590C8019E36C2E964 0CCBAAFD76A2ECE2CCD3141DE2FFD5B1D88CA97D 152812300785C96444D3334D17565732E08E5E41 0AD83877C1F0CD1EE9BD660AD7CC770B81FD22A8 590B7292695AFFA5B672CBB2E13FC145CD3F4304 28F5900B1BB5D1A4B6B6D1A9ED357015286A333D CFB16E21C950F67FA95E558F2EEB9F5CC09526C1 6E01EEC9656903B0542B8F1003DB6322267C373B D1DBF2C4B96F2DEBF4C16654410108112E7EA81F 9D3CC86A72F8494342EA5FD10A41BDC3F4FAFF1C 74E2DEF5D77260B98BC19438099BAD163C70FBFA 637DB1E23370F84AFF88CCE03152347D07DA627C 82921A4B88FD454B7EB8CE3C796C4109063D4EAF
# keys to fetch from ubuntu keyserver
ENV     KEYS1 71A3B16735405025D447E8F274810B012346C9A6 01EA5486DE18A882D4C2684590C8019E36C2E964 0CCBAAFD76A2ECE2CCD3141DE2FFD5B1D88CA97D 152812300785C96444D3334D17565732E08E5E41 0AD83877C1F0CD1EE9BD660AD7CC770B81FD22A8 590B7292695AFFA5B672CBB2E13FC145CD3F4304 28F5900B1BB5D1A4B6B6D1A9ED357015286A333D CFB16E21C950F67FA95E558F2EEB9F5CC09526C1 6E01EEC9656903B0542B8F1003DB6322267C373B D1DBF2C4B96F2DEBF4C16654410108112E7EA81F 9D3CC86A72F8494342EA5FD10A41BDC3F4FAFF1C 74E2DEF5D77260B98BC19438099BAD163C70FBFA
# keys to fetch from keys.openpgp.org
ENV     KEYS2 637DB1E23370F84AFF88CCE03152347D07DA627C 82921A4B88FD454B7EB8CE3C796C4109063D4EAF


RUN     set -ex && \
        apt-get update && \
        apt-get install -qq --no-install-recommends ca-certificates dirmngr gosu gpg gpg-agent wget && \
        rm -rf /var/lib/apt/lists/*

# Build and install bitcoin binaries
RUN     set -ex && \
        cd /tmp && \
        arch="$(dpkg --print-architecture)"; arch="${arch##*-}"; \
        case "$arch" in \
          'amd64') \
            FILE="$BITCOIN_FILE_AMD64"; \
            ;; \
          'arm64') \
            FILE="$BITCOIN_FILE_ARM64"; \
            ;; \
          'ppc64el') \
          	FILE="$BITCOIN_FILE_PPCLE"; \
          	;; \
          *) echo >&2 "error: unsupported architecture '$arch' (likely packaging update needed)"; exit 1 ;; \
        esac; \
        gpg --batch --keyserver hkps://keyserver.ubuntu.com:443 --recv-keys $KEYS1 && \
        gpg --batch --keyserver hkps://keys.openpgp.org:443 --recv-keys $KEYS2 && \
        gpg --list-keys | tail -n +3 | tee /tmp/keys.txt && \
        gpg --list-keys $KEYS | diff - /tmp/keys.txt && \
        wget -qO "$BITCOIN_SHASUMS" "$BITCOIN_URL/$BITCOIN_SHASUMS" && \
        wget -qO "$BITCOIN_SHASUMS_ASC" "$BITCOIN_URL/$BITCOIN_SHASUMS_ASC" && \
        wget -qO "$FILE" "$BITCOIN_URL/$FILE" && \
        gpg --batch --verify "$BITCOIN_SHASUMS_ASC" "$BITCOIN_SHASUMS" && \
        sha256sum --ignore-missing --check "$BITCOIN_SHASUMS" && \
        tar -xzvf "$FILE" -C /usr/local --strip-components=1 --exclude=*-qt && \
        rm -rf /tmp/*

FROM    debian:buster-slim

ENV     BITCOIN_HOME        /home/bitcoin

ARG     BITCOIND_LINUX_UID
ARG     BITCOIND_LINUX_GID
ARG     TOR_LINUX_GID

COPY    --from=builder /usr/local/ /usr/local/

RUN     set -ex && \
        apt-get update && \
        apt-get install -qq --no-install-recommends python3

# Create groups bitcoin & tor
# Create user bitcoin and add it to groups
RUN     addgroup --system -gid ${BITCOIND_LINUX_GID} bitcoin && \
        addgroup --system -gid ${TOR_LINUX_GID} tor && \
        adduser --system --ingroup bitcoin -uid ${BITCOIND_LINUX_UID} bitcoin && \
        usermod -a -G tor bitcoin

# Create data directory
RUN     mkdir "$BITCOIN_HOME/.bitcoin" && \
        chown -h bitcoin:bitcoin "$BITCOIN_HOME/.bitcoin"

# Copy restart script
COPY    ./restart.sh /restart.sh
RUN     chown bitcoin:bitcoin /restart.sh && \
        chmod 777 /restart.sh

# Copy wait-for-it script
COPY    ./wait-for-it.sh /wait-for-it.sh

RUN     chown bitcoin:bitcoin /wait-for-it.sh && \
        chmod u+x /wait-for-it.sh && \
        chmod g+x /wait-for-it.sh

# Copy rpcauth.py script
COPY    ./rpcauth.py /rpcauth.py

RUN     chown bitcoin:bitcoin /rpcauth.py && \
        chmod u+x /rpcauth.py && \
        chmod g+x /rpcauth.py

EXPOSE  8333 9501 9502 28256

USER    bitcoin
