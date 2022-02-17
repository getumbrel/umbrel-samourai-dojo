FROM    debian:buster-slim AS builder

ENV     WHIRLPOOL_DIR                 /usr/local/whirlpool-cli

# Install prerequisites
RUN     set -ex && \
        apt-get update && \
        apt-get install -y libevent-dev zlib1g-dev libssl-dev gcc make automake ca-certificates autoconf musl-dev coreutils gpg wget

# Install Tor
ENV     WHIRLPOOL_TOR_URL             https://dist.torproject.org
ENV     WHIRLPOOL_TOR_MIRROR_URL      https://tor.eff.org/dist
ENV     WHIRLPOOL_TOR_VERSION         0.4.6.9
ENV     WHIRLPOOL_TOR_GPG_KS_URI      hkps://keyserver.ubuntu.com:443
ENV     WHIRLPOOL_TOR_GPG_KEY1        0xEB5A896A28988BF5
ENV     WHIRLPOOL_TOR_GPG_KEY2        0xC218525819F78451
ENV     WHIRLPOOL_TOR_GPG_KEY3        0x21194EBB165733EA
ENV     WHIRLPOOL_TOR_GPG_KEY4        0x6AFEE6D49E92B601

RUN     set -ex && \
        mkdir -p /usr/local/src/ && \
        cd /usr/local/src && \
        res=0; \
        wget -qO "tor-$WHIRLPOOL_TOR_VERSION.tar.gz" "$WHIRLPOOL_TOR_URL/tor-$WHIRLPOOL_TOR_VERSION.tar.gz" || res=$?; \
        if [ $res -gt 0 ]; then \
          wget -qO "tor-$WHIRLPOOL_TOR_VERSION.tar.gz" "$WHIRLPOOL_TOR_MIRROR_URL/tor-$WHIRLPOOL_TOR_VERSION.tar.gz"; \
        fi && \
        res=0; \
        wget -qO "tor-$WHIRLPOOL_TOR_VERSION.tar.gz.asc" "$WHIRLPOOL_TOR_URL/tor-$WHIRLPOOL_TOR_VERSION.tar.gz.asc" || res=$?; \
        if [ $res -gt 0 ]; then \
          wget -qO "tor-$WHIRLPOOL_TOR_VERSION.tar.gz.asc" "$WHIRLPOOL_TOR_MIRROR_URL/tor-$WHIRLPOOL_TOR_VERSION.tar.gz.asc" ; \
        fi && \
        gpg --batch --keyserver "$WHIRLPOOL_TOR_GPG_KS_URI" --recv-keys $WHIRLPOOL_TOR_GPG_KEY1 $WHIRLPOOL_TOR_GPG_KEY2 $WHIRLPOOL_TOR_GPG_KEY3 $WHIRLPOOL_TOR_GPG_KEY4 && \
        gpg --verify "tor-$WHIRLPOOL_TOR_VERSION.tar.gz.asc" && \
        tar -xzvf "tor-$WHIRLPOOL_TOR_VERSION.tar.gz" -C /usr/local/src && \
        cd "/usr/local/src/tor-$WHIRLPOOL_TOR_VERSION" && \
        ./configure \
            --disable-asciidoc \
            --sysconfdir=/etc \
            --disable-unittests && \
        make && make install && \
        cd .. && \
        rm -rf "tor-$WHIRLPOOL_TOR_VERSION" && \
        rm "tor-$WHIRLPOOL_TOR_VERSION.tar.gz" && \
        rm "tor-$WHIRLPOOL_TOR_VERSION.tar.gz.asc"

# Install whirlpool-cli
ENV     WHIRLPOOL_URL                 https://code.samourai.io/whirlpool/whirlpool-client-cli/uploads
ENV     WHIRLPOOL_VERSION             0.10.13
ENV     WHIRLPOOL_VERSION_HASH        c1bb32bac6d4b377f625c996387375c2
ENV     WHIRLPOOL_JAR                 "whirlpool-client-cli-$WHIRLPOOL_VERSION-run.jar"
ENV     WHIRLPOOL_SHA256              78894b934716988eddb8da6db9c6734a3ded416fe68434bedb730f71ded7649d


RUN     set -ex && \
        mkdir -p "$WHIRLPOOL_DIR" && \
        cd "$WHIRLPOOL_DIR" && \
        echo "$WHIRLPOOL_SHA256 *$WHIRLPOOL_JAR" > WHIRLPOOL_CHECKSUMS && \
        wget -qO "$WHIRLPOOL_JAR" "$WHIRLPOOL_URL/$WHIRLPOOL_VERSION_HASH/$WHIRLPOOL_JAR" && \
        sha256sum -c WHIRLPOOL_CHECKSUMS 2>&1 | grep OK && \
        mv "$WHIRLPOOL_JAR" whirlpool-client-cli-run.jar

FROM    debian:buster-slim

ENV     TOR_HOME        /var/lib/tor
ENV     TOR_BIN         /usr/local/bin/tor
ENV     TOR_CONF        /etc/tor
ENV     TOR_MAN         /usr/local/share/man

ENV     WHIRLPOOL_HOME  /home/whirlpool
ENV     WHIRLPOOL_DIR   /usr/local/whirlpool-cli

ARG     WHIRLPOOL_LINUX_UID
ARG     WHIRLPOOL_LINUX_GID

RUN     mkdir -p /usr/share/man/man1

RUN     set -ex && \
        apt-get update && \
        apt-get install -qqy default-jdk libevent-dev

RUN     addgroup --system -gid ${WHIRLPOOL_LINUX_GID} whirlpool && \
        adduser --system --ingroup whirlpool -uid ${WHIRLPOOL_LINUX_UID} whirlpool

COPY    --from=builder $TOR_BIN $TOR_BIN
COPY    --from=builder $TOR_CONF $TOR_CONF
COPY    --from=builder $TOR_MAN $TOR_MAN
COPY    --from=builder $WHIRLPOOL_DIR $WHIRLPOOL_DIR

RUN     chown -Rv whirlpool:whirlpool "$WHIRLPOOL_DIR" && \
        chmod -R 750 "$WHIRLPOOL_DIR"

RUN     mkdir -p "$WHIRLPOOL_HOME/.whirlpool-cli" && \
        chown -Rv whirlpool:whirlpool "$WHIRLPOOL_HOME" && \
        chmod -R 750 "$WHIRLPOOL_HOME"

# Copy restart script
COPY    ./restart.sh /restart.sh

RUN     chown whirlpool:whirlpool /restart.sh && \
        chmod u+x /restart.sh && \
        chmod g+x /restart.sh

# Expose HTTP API port
EXPOSE  8898

# Switch to user whirlpool
USER    whirlpool
