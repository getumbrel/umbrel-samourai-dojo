FROM    rust:1.42.0-slim-buster AS builder

ENV     INDEXER_VERSION     0.5.0
ENV     INDEXER_URL         https://code.samourai.io/dojo/addrindexrs.git

RUN     apt-get update && \
        apt-get install -y clang cmake git

# Install addrindexrs
RUN     mkdir /tmp/addrindexrs && \
        cd /tmp/addrindexrs && \
        git clone "$INDEXER_URL" "/tmp/addrindexrs" && \
        git checkout "tags/v$INDEXER_VERSION"

RUN     cd /tmp/addrindexrs && \
        cargo install --locked --path .

FROM    debian:buster-slim

ENV     INDEXER_HOME        /home/indexer

ARG     INDEXER_LINUX_GID
ARG     INDEXER_LINUX_UID

COPY    --from=builder /usr/local/cargo/bin/addrindexrs /usr/bin/addrindexrs

# Create group and user indexer
RUN     addgroup --system -gid ${INDEXER_LINUX_GID} indexer && \
        adduser --system --ingroup indexer -uid ${INDEXER_LINUX_UID} indexer

# Create data directory
RUN     mkdir "$INDEXER_HOME/addrindexrs" && \
        chown -h indexer:indexer "$INDEXER_HOME/addrindexrs"

# Copy restart script
COPY    ./restart.sh /restart.sh
RUN     chown indexer:indexer /restart.sh && \
        chmod 777 /restart.sh

USER    indexer

EXPOSE  50001
EXPOSE  8080

STOPSIGNAL SIGINT
