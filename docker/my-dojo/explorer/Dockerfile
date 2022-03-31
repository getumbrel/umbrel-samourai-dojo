FROM    node:14-alpine AS builder

ENV     NODE_ENV             production

ENV     APP_DIR              /home/node/app

ENV     EXPLORER_URL         https://github.com/janoside/btc-rpc-explorer/archive
ENV     EXPLORER_VERSION     3.3.0

# Install netcat
RUN     set -ex && \
        apk --no-cache add gcc g++ make python3 git netcat-openbsd

# Download the source code and install it
RUN     set -ex && \
        mkdir "$APP_DIR" && \
        wget -qO explorer.tar.gz "$EXPLORER_URL/v$EXPLORER_VERSION.tar.gz" && \
        tar -xzvf explorer.tar.gz -C "$APP_DIR/" --strip-components 1 && \
        rm explorer.tar.gz && \
        cd "$APP_DIR" && \
        npm install --only=prod

FROM    node:14-alpine

ENV     NODE_ENV        production
ENV     APP_DIR         /home/node/app

RUN     set -ex && \
        apk --no-cache add bash

COPY    --from=builder $APP_DIR $APP_DIR

# Copy restart script
COPY    ./restart.sh "$APP_DIR/restart.sh"

RUN     chown node:node "$APP_DIR/restart.sh" && \
        chmod u+x "$APP_DIR/restart.sh" && \
        chmod g+x "$APP_DIR/restart.sh"

# Change ownership of all files
RUN     chown -R node:node "$APP_DIR"

EXPOSE  3002

USER    node
