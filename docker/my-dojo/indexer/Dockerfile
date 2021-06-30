FROM    rust:1.42.0-slim-buster

ENV     INDEXER_HOME        /home/indexer
ENV     INDEXER_VERSION     0.5.0
ENV     INDEXER_URL         https://code.samourai.io/dojo/addrindexrs.git

ARG     INDEXER_LINUX_GID
ARG     INDEXER_LINUX_UID

RUN     apt-get update && \
        apt-get install -y clang cmake git && \
        apt-get install -y libsnappy-dev

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

# Copy wait-for-it script
COPY    ./wait-for-it.sh /wait-for-it.sh
RUN     chown indexer:indexer /wait-for-it.sh && \
        chmod u+x /wait-for-it.sh && \
        chmod g+x /wait-for-it.sh

USER    indexer

# Install addrindexrs
RUN     cd "$INDEXER_HOME" && \
        git clone "$INDEXER_URL" "$INDEXER_HOME/addrindexrs" && \
        cd addrindexrs && \
        git checkout "tags/v$INDEXER_VERSION"

RUN     cd "$INDEXER_HOME/addrindexrs" && \
        cargo install --locked --path .

EXPOSE  50001
EXPOSE  8080

STOPSIGNAL SIGINT
