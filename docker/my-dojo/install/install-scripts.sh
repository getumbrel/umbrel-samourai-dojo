#!/bin/bash

if [ -f ./conf/docker-bitcoind.conf ]; then
  source ./conf/docker-bitcoind.conf
else
  source ./conf/docker-bitcoind.conf.tpl
fi

if [ -f ./conf/docker-mysql.conf ]; then
  source ./conf/docker-mysql.conf
else
  source ./conf/docker-mysql.conf.tpl
fi

if [ -f ./conf/docker-explorer.conf ]; then
  source ./conf/docker-explorer.conf
else
  source ./conf/docker-explorer.conf.tpl
fi

if [ -f ./conf/docker-whirlpool.conf ]; then
  source ./conf/docker-whirlpool.conf
else
  source ./conf/docker-whirlpool.conf.tpl
fi

if [ -f ./conf/docker-common.conf ]; then
  source ./conf/docker-common.conf
else
  source ./conf/docker-common.conf.tpl
fi

if [ -f ./conf/docker-indexer.conf ]; then
  source ./conf/docker-indexer.conf
else
  source ./conf/docker-indexer.conf.tpl
fi


# Confirm installation
get_confirmation() {
  while true; do
    echo "This operation is going to install Dojo v$DOJO_VERSION_TAG for $COMMON_BTC_NETWORK on your computer."
    read -p "Do you wish to continue? [y/n]" yn
    case $yn in
      [Yy]* ) return 0;;
      [Nn]* ) echo "Installation was cancelled."; return 1;;
      * ) echo "Please answer yes or no.";;
    esac
  done
}

# Confirm reinstallation
get_confirmation_reinstall() {
  while true; do
    read -p "Do you really wish to reinstall Dojo on your computer? [y/n]" yn
    case $yn in
      [Yy]* ) return 0;;
      [Nn]* ) echo "Reinstallation was cancelled."; return 1;;
      * ) echo "Please answer yes or no.";;
    esac
  done
}

# Initialize configuration files from templates
init_config_files() {
  # Initialize db scripts
  cp ../../db-scripts/1_db.sql.tpl ../../db-scripts/1_db.sql
  echo "Initialized 1_db.sql"

  if [ -f ../../db-scripts/2_update.sql ]; then
    rm ../../db-scripts/2_update.sql
    echo "Deleted 2_update.sql"
  fi

  # Initialize config files for MyDojo
  cp ./conf/docker-common.conf.tpl ./conf/docker-common.conf
  echo "Initialized docker-common.conf"

  cp ./conf/docker-bitcoind.conf.tpl ./conf/docker-bitcoind.conf
  echo "Initialized docker-bitcoind.conf"

  cp ./conf/docker-mysql.conf.tpl ./conf/docker-mysql.conf
  echo "Initialized docker-mysql.conf"

  cp ./conf/docker-node.conf.tpl ./conf/docker-node.conf
  echo "Initialized docker-node.conf"

  cp ./conf/docker-explorer.conf.tpl ./conf/docker-explorer.conf
  echo "Initialized docker-explorer.conf"

  cp ./conf/docker-tor.conf.tpl ./conf/docker-tor.conf
  echo "Initialized docker-tor.conf"

  cp ./conf/docker-indexer.conf.tpl ./conf/docker-indexer.conf
  echo "Initialized docker-indexer.conf"

  cp ./conf/docker-whirlpool.conf.tpl ./conf/docker-whirlpool.conf
  echo "Initialized docker-whirlpool.conf"

  if [ "$EXPLORER_INSTALL" == "on" ]; then
    cp ./nginx/explorer.conf ./nginx/dojo-explorer.conf
  else
    cp /dev/null ./nginx/dojo-explorer.conf
  fi
  echo "Initialized dojo-explorer.conf (nginx)"

  if [ "$WHIRLPOOL_INSTALL" == "on" ]; then
    cp ./nginx/whirlpool.conf ./nginx/dojo-whirlpool.conf
  else
    cp /dev/null ./nginx/dojo-whirlpool.conf
  fi
  echo "Initialized dojo-whirlpool.conf (nginx)"

  # Initialize config files for nginx and the maintenance tool
  if [ "$COMMON_BTC_NETWORK" == "testnet" ]; then
    cp ./nginx/testnet.conf ./nginx/dojo.conf
    echo "Initialized dojo.conf (nginx)"
    cp ../../static/admin/conf/index-testnet.js ../../static/admin/conf/index.js
    echo "Initialized index.js (admin module)"
  else
    cp ./nginx/mainnet.conf ./nginx/dojo.conf
    echo "Initialized dojo.conf (nginx)"
    cp ../../static/admin/conf/index-mainnet.js ../../static/admin/conf/index.js
    echo "Initialized index.js (admin module)"
  fi

  # Initialize config files for mysql
  if [ "$MYSQL_CONF_PROFILE" == "low_mem" ]; then
    cp ./mysql/mysql-low_mem.cnf ./mysql/mysql-dojo.cnf
  else
    cp ./mysql/mysql-default.cnf ./mysql/mysql-dojo.cnf
  fi
  echo "Initialized mysql-dojo.cnf (mysql)"
}
