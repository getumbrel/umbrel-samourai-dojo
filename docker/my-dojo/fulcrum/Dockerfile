FROM    debian:buster-slim AS builder

ENV     INDEXER_VERSION       1.6.0
ENV     INDEXER_URL           https://github.com/cculianu/Fulcrum/releases/download
ENV     INDEXER_BUILD_AMD64   x86_64-linux
ENV     INDEXER_BUILD_ARM64   arm64-linux
ENV     INDEXER_SHASUMS       ${INDEXER_FILE}.sha256sum
ENV     INDEXER_ASC           ${INDEXER_FILE}.asc
ENV     INDEXER_FILES         /var/fulcrum

RUN     apt-get update && \
        apt-get install -y wget curl gpg gpg-agent

# Create data directory
RUN     mkdir $INDEXER_FILES

# Install fulcrum
RUN     set -ex && \
        arch="$(dpkg --print-architecture)"; arch="${arch##*-}"; \
        case "$arch" in \
          'amd64') \
            INDEXER_FILE="Fulcrum-$INDEXER_VERSION-$INDEXER_BUILD_AMD64.tar.gz"; \
            ;; \
          'arm64') \
            INDEXER_FILE="Fulcrum-${INDEXER_VERSION}-${INDEXER_BUILD_ARM64}.tar.gz"; \
            ;; \
          *) echo >&2 "error: unsupported architecture '$arch' (likely packaging update needed)"; exit 1 ;; \
        esac; \
        INDEXER_SHASUMS="$INDEXER_FILE.sha256sum"; \
        INDEXER_ASC="$INDEXER_FILE.asc"; \
        wget -qO $INDEXER_FILE "$INDEXER_URL/v$INDEXER_VERSION/$INDEXER_FILE" && \
        wget -qO ${INDEXER_FILE}.sha256sum "$INDEXER_URL/v$INDEXER_VERSION/$INDEXER_SHASUMS" && \
        wget -qO ${INDEXER_FILE}.asc "$INDEXER_URL/v$INDEXER_VERSION/$INDEXER_ASC" && \
        curl https://raw.githubusercontent.com/Electron-Cash/keys-n-hashes/master/pubkeys/calinkey.txt | gpg --import && \
        gpg --verify ${INDEXER_FILE}.asc && \
        sha256sum -c ${INDEXER_FILE}.sha256sum && \
        tar -xzvf ${INDEXER_FILE} -C "$INDEXER_FILES" --strip-components 1 && \
        rm ${INDEXER_FILE} ${INDEXER_FILE}.sha256sum ${INDEXER_FILE}.asc

FROM    debian:buster-slim

ENV     INDEXER_FILES         /var/fulcrum
ENV     INDEXER_HOME          /home/fulcrum

ARG     FULCRUM_LINUX_GID
ARG     FULCRUM_LINUX_UID

# Create group and user indexer
RUN     addgroup --system -gid ${FULCRUM_LINUX_GID} fulcrum && \
        adduser --system --ingroup fulcrum -uid ${FULCRUM_LINUX_UID} fulcrum

# Create data directory
RUN     mkdir "$INDEXER_HOME/.fulcrum" && \
        mkdir "$INDEXER_HOME/.fulcrum/db" && \
        chown -h fulcrum:fulcrum "$INDEXER_HOME/.fulcrum" && \
        chown -h fulcrum:fulcrum "$INDEXER_HOME/.fulcrum/db"

COPY    --from=builder "$INDEXER_FILES" "$INDEXER_HOME/.fulcrum"

# Copy restart script
COPY    ./restart.sh /restart.sh
RUN     chown fulcrum:fulcrum /restart.sh && \
        chmod 777 /restart.sh

# Copy fulcrum.conf
COPY    ./fulcrum.conf /etc/fulcrum.conf
RUN     chown fulcrum:fulcrum /etc/fulcrum.conf && \
        chmod 777 /etc/fulcrum.conf

# Copy wait-for-it script
COPY    ./wait-for-it.sh /wait-for-it.sh
RUN     chown fulcrum:fulcrum /wait-for-it.sh && \
        chmod u+x /wait-for-it.sh && \
        chmod g+x /wait-for-it.sh

USER    fulcrum

EXPOSE  50001

STOPSIGNAL SIGINT
