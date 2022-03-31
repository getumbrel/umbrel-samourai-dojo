#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

# Source a file
source_file() {
  if [ -f $1 ]; then
    source $1
  elif [ -f "$1.tpl" ]; then
    source "$1.tpl"
  else
    echo "Unable to find file $1"
  fi
}

# Source config files
source_file "$DIR/conf/docker-whirlpool.conf"
source_file "$DIR/conf/docker-indexer.conf"
source_file "$DIR/conf/docker-bitcoind.conf"
source_file "$DIR/conf/docker-explorer.conf"
source_file "$DIR/conf/docker-common.conf"
source_file "$DIR/conf/docker-tor.conf"
source_file "$DIR/.env"

# Export some variables for compose
export BITCOIND_RPC_EXTERNAL_IP
export TOR_SOCKS_PORT

# Select YAML files
select_yaml_files() {
  yamlFiles="-f $DIR/docker-compose.yaml"

  if [ "$BITCOIND_INSTALL" == "on" ]; then
    yamlFiles="$yamlFiles -f $DIR/overrides/bitcoind.install.yaml"

    if [ "$BITCOIND_RPC_EXTERNAL" == "on" ]; then
      yamlFiles="$yamlFiles -f $DIR/overrides/bitcoind.rpc.expose.yaml"
    fi
  fi

  if [ "$EXPLORER_INSTALL" == "on" ]; then
    yamlFiles="$yamlFiles -f $DIR/overrides/explorer.install.yaml"
  fi

  if [ "$INDEXER_INSTALL" == "on" ]; then
    if [ "$INDEXER_TYPE" == "addrindexrs" ]; then
      yamlFiles="$yamlFiles -f $DIR/overrides/indexer.install.yaml"
    elif [ "$INDEXER_TYPE" == "fulcrum" ]; then
      yamlFiles="$yamlFiles -f $DIR/overrides/fulcrum.install.yaml"
    fi
  fi

  if [ "$WHIRLPOOL_INSTALL" == "on" ]; then
    yamlFiles="$yamlFiles -f $DIR/overrides/whirlpool.install.yaml"
  fi

  # Return yamlFiles
  echo "$yamlFiles"
}

# Docker build
docker_build() {
  yamlFiles=$(select_yaml_files)
  eval "docker-compose $yamlFiles build --parallel $@"
}

# Docker up
docker_up() {
  yamlFiles=$(select_yaml_files)
  eval "docker-compose $yamlFiles up $@ -d"
}

# Start
start() {
  # Check if dojo is running (check the db container)
  isRunning=$(docker inspect --format="{{.State.Running}}" db 2> /dev/null)

  if [ $? -eq 1 ] || [ "$isRunning" == "false" ]; then
    echo "Starting Dojo. Please wait."
    docker_up --remove-orphans
  else
    echo "Dojo is already running."
  fi
}

# Stop
stop() {
  echo "Preparing shutdown of Dojo. Please wait."
  # Check if dojo is running (check the db container)
  isRunning=$(docker inspect --format="{{.State.Running}}" db 2> /dev/null)
  if [ $? -eq 1 ] || [ "$isRunning" == "false" ]; then
    echo "Dojo is already stopped."
    exit
  fi
  # Shutdown the bitcoin daemon
  if [ "$BITCOIND_INSTALL" == "on" ]; then
    # Renewal of bitcoind onion address
    if [ "$BITCOIND_LISTEN_MODE" == "on" ]; then
      if [ "$BITCOIND_EPHEMERAL_HS" = "on" ]; then
        $( docker exec -it tor rm -rf /var/lib/tor/hsv3bitcoind ) &> /dev/null
      fi
    fi
    # Stop the bitcoin daemon
    $( docker exec -it bitcoind  bitcoin-cli \
      -rpcconnect=bitcoind \
      --rpcport=28256 \
      --rpcuser="$BITCOIND_RPC_USER" \
      --rpcpassword="$BITCOIND_RPC_PASSWORD" \
      stop ) &> /dev/null
    # Check if the bitcoin daemon is still up
    # wait 3mn max
    i="0"
    nbIters=$(( $BITCOIND_SHUTDOWN_DELAY / 10 ))
    while [ $i -lt $nbIters ]
    do
      echo "Waiting for shutdown of Bitcoin server."
      # Check if bitcoind rpc api is responding
      $( timeout -k 12 10 docker exec -it bitcoind  bitcoin-cli \
        -rpcconnect=bitcoind \
        --rpcport=28256 \
        --rpcuser="$BITCOIND_RPC_USER" \
        --rpcpassword="$BITCOIND_RPC_PASSWORD" \
        getblockchaininfo &> /dev/null ) &> /dev/null
      # rpc api is down
      if [[ $? > 0 ]]; then
        echo "Bitcoin server stopped."
        break
      fi
      i=$[$i+1]
    done
    # Bitcoin daemon is still up
    # => force close
    if [ $i -eq $nbIters ]; then
      echo "Force shutdown of Bitcoin server."
    fi
  fi
  # Stop docker containers
  yamlFiles=$(select_yaml_files)
  eval "docker-compose $yamlFiles stop"
}

# Restart dojo
restart() {
  stop
  docker_up
}

# Install
install() {
  source "$DIR/install/install-scripts.sh"

  launchInstall=1
  auto=1
  noLog=1

  # Extract install options from arguments
  if [ $# -gt 0 ]; then
    for option in $@
    do
      case "$option" in
        --auto )    auto=0 ;;
        --nolog )   noLog=0 ;;
        * )         break ;;
      esac
    done
  fi

  # Confirmation
  if [ $auto -eq 0 ]; then
    launchInstall=0
  else
    get_confirmation
    launchInstall=$?
  fi

  # Detection of past install
  if [ $launchInstall -eq 0 ]; then
    pastInstallsfound=$(docker image ls | grep samouraiwallet/dojo-db | wc -l)
    if [ $pastInstallsfound -ne 0 ]; then
      # Past installation found. Ask confirmation for reinstall
      echo -e "\nWarning: Found traces of a previous installation of Dojo on this machine."
      echo "A new installation requires to remove these elements first."
      if [ $auto -eq 0 ]; then
        launchReinstall=0
      else
        get_confirmation_reinstall
        launchReinstall=$?
      fi

      if [ $launchReinstall -eq 0 ]; then
        echo ""
        # Uninstall
        if [ $auto -eq 0 ]; then
          uninstall --auto
          launchReinstall=$?
        else
          uninstall
          launchReinstall=$?
        fi
      fi

      if [ $launchReinstall -eq 1 ]; then
        launchInstall=1
        echo -e "\nInstallation was cancelled."
      fi
    fi
  fi

  # Installation
  if [ $launchInstall -eq 0 ]; then
    # Initialize the config files
    init_config_files
    # Build and start Dojo
    docker_build --no-cache
    docker_up --remove-orphans
    buildResult=$?
    if [ $buildResult -eq 0 ]; then
      # Display the logs
      if [ $noLog -eq 1 ]; then
        logs "" 0
      fi
    else
      # Return an error
      echo -e "\nInstallation of Dojo failed. See the above error message."
      exit $buildResult
    fi
  else
    exit 1
  fi
}

# Delete everything
uninstall() {
  source "$DIR/install/uninstall-scripts.sh"

  auto=1

  # Extract install options from arguments
  if [ $# -gt 0 ]; then
    for option in $@
    do
      case "$option" in
        --auto )    auto=0 ;;
        * )         break ;;
      esac
    done
  fi

  # Confirmation
  if [ $auto -eq 0 ]; then
    launchUninstall=0
  else
    get_confirmation
    launchUninstall=$?
  fi

  if [ $launchUninstall -eq 0 ]; then
    yamlFiles=$(select_yaml_files)
    eval "docker-compose $yamlFiles down --rmi all"
    docker volume prune -f
    return 0
  else
    return 1
  fi
}

# Clean-up (remove old docker images)
del_images_for() {
  # $1: image name
  # $2: most recent version of the image (do not delete this one)
  docker image ls | grep "$1" | sed "s/ \+/,/g" | cut -d"," -f2 | while read -r version ; do
    if [ "$2" != "$version" ]; then
      docker image rm -f "$1:$version"
    fi
  done
}

clean() {
  del_images_for samouraiwallet/dojo-db "$DOJO_DB_VERSION_TAG"
  del_images_for samouraiwallet/dojo-bitcoind "$DOJO_BITCOIND_VERSION_TAG"
  del_images_for samouraiwallet/dojo-explorer "$DOJO_EXPLORER_VERSION_TAG"
  del_images_for samouraiwallet/dojo-nodejs "$DOJO_NODEJS_VERSION_TAG"
  del_images_for samouraiwallet/dojo-nginx "$DOJO_NGINX_VERSION_TAG"
  del_images_for samouraiwallet/dojo-tor "$DOJO_TOR_VERSION_TAG"
  del_images_for samouraiwallet/dojo-indexer "$DOJO_INDEXER_VERSION_TAG"
  del_images_for samouraiwallet/dojo-fulcrum "$DOJO_FULCRUM_VERSION_TAG"
  del_images_for samouraiwallet/dojo-whirlpool "$DOJO_WHIRLPOOL_VERSION_TAG"
  docker container prune -f
  docker volume prune -f
  docker image prune -f
}

# Upgrade
upgrade() {
  source "$DIR/install/upgrade-scripts.sh"

  launchUpgrade=1
  auto=1
  noLog=1
  noCache=1

  # Extract upgrade options from arguments
  if [ $# -gt 0 ]; then
    for option in $@
    do
      case "$option" in
        --auto )      auto=0 ;;
        --nolog )     noLog=0 ;;
        --nocache )   noCache=0 ;;
        * )           break ;;
      esac
    done
  fi

  # Confirmation
  if [ $auto -eq 0 ]; then
    launchUpgrade=0
  else
    get_confirmation
    launchUpgrade=$?
  fi

  # Upgrade Dojo
  if [ $launchUpgrade -eq 0 ]; then
    # Select yaml files
    yamlFiles=$(select_yaml_files)
    # Check if dojo is running (check the db container)
    isRunning=$(docker inspect --format="{{.State.Running}}" db 2> /dev/null)
    if [ $? -eq 1 ] || [ "$isRunning" == "false" ]; then
      echo -e "\nChecked that Dojo isn't running."
    else
      echo " "
      stop
    fi
    # Update config files
    echo -e "\nPreparing the upgrade of Dojo.\n"
    update_config_files
    # Cleanup
    cleanup
    # Load env vars for compose files
    source_file "$DIR/conf/docker-bitcoind.conf"
    export BITCOIND_RPC_EXTERNAL_IP
    source_file "$DIR/conf/docker-tor.conf"
    export TOR_SOCKS_PORT
    # Rebuild the images (with or without cache)
    if [ $noCache -eq 0 ]; then
      echo -e "\nDeleting Dojo containers and images."
      eval "docker-compose $yamlFiles down --rmi all"
    fi
    echo -e "\nStarting the upgrade of Dojo.\n"
    if [ $noCache -eq 0 ]; then
      docker_build --no-cache
    else
      docker_build
    fi
    docker_up --remove-orphans
    buildResult=$?
    if [ $buildResult -eq 0 ]; then
      # Post start clean-up
      clean
      post_start_cleanup
      # Update the database
      update_dojo_db
      # Display the logs
      if [ $noLog -eq 1 ]; then
        logs "" 0
      fi
    else
      # Return an error
      echo -e "\nUpgrade of Dojo failed. See the above error message."
      exit $buildResult
    fi
  else
    exit 1
  fi
}

# Display the onion addresses
onion() {
  echo " "
  echo "WARNING: Do not share these onion addresses with anyone!"
  echo "         To allow another person to use this Dojo with their Samourai Wallet,"
  echo "         you should share the QRCodes provided by the Maintenance Tool."
  echo " "

  # V3 onion addresses
  V3_ADDR=$( docker exec -it tor cat /var/lib/tor/hsv3dojo/hostname )
  echo "Dojo API and Maintenance Tool = $V3_ADDR"
  echo " "

  if [ "$EXPLORER_INSTALL" == "on" ]; then
    V3_ADDR_EXPLORER=$( docker exec -it tor cat /var/lib/tor/hsv3explorer/hostname )
    echo "Block Explorer = $V3_ADDR_EXPLORER"
    echo " "
  fi

  if [ "$WHIRLPOOL_INSTALL" == "on" ]; then
    V3_ADDR_WHIRLPOOL=$( docker exec -it tor cat /var/lib/tor/hsv3whirlpool/hostname )
    echo "Your private Whirlpool client (do not share) = $V3_ADDR_WHIRLPOOL"
    echo " "
  fi

  if [ "$BITCOIND_INSTALL" == "on" ]; then
    if [ "$BITCOIND_LISTEN_MODE" == "on" ]; then
      V3_ADDR_BTCD=$( docker exec -it tor cat /var/lib/tor/hsv3bitcoind/hostname )
      echo "Your local bitcoind (do not share) = $V3_ADDR_BTCD"
      echo " "
    fi
  fi

  if [ "$INDEXER_INSTALL" == "on" ]; then
    if [ "$INDEXER_TYPE" == "fulcrum" ]; then
      V3_ADDR_FULCRUM=$( docker exec -it tor cat /var/lib/tor/hsv3fulcrum/hostname )
      echo "Fulcrum hidden service address = $V3_ADDR_FULCRUM"
      echo " "
    fi
  fi
}

# Display the version of this dojo
version() {
  echo "Dojo v$DOJO_VERSION_TAG"
}

# Interact with whirlpool-cli
whirlpool() {
  if [ "$WHIRLPOOL_INSTALL" == "off" ]; then
    echo -e "Command not supported for your setup.\nCause: Your Dojo is not running a whirlpool client"
  fi

  case $1 in
    apikey )
      API_KEY=$( docker exec -it whirlpool cat /home/whirlpool/.whirlpool-cli/whirlpool-cli-config.properties | grep cli.apiKey= | cut -c 12-)
      echo "$API_KEY"
      ;;
    reset )
      eval "docker exec -it whirlpool rm -f /home/whirlpool/.whirlpool-cli/*.json"
      eval "docker exec -it whirlpool rm -f /home/whirlpool/.whirlpool-cli/whirlpool-cli-config.properties"
      yamlFiles=$(select_yaml_files)
      eval "docker-compose $yamlFiles restart whirlpool"
      ;;
    * )
      echo -e "Unkonwn action for the whirlpool command"
      ;;
  esac
}

# Display logs
display_logs() {
  yamlFiles=$(select_yaml_files)
  if [ $2 -eq 0 ]; then
    docker-compose $yamlFiles logs --tail=50 --follow $1
  else
    docker-compose $yamlFiles logs --tail=$2 $1
  fi
}

logs() {
  source_file "$DIR/conf/docker-bitcoind.conf"
  source_file "$DIR/conf/docker-indexer.conf"
  source_file "$DIR/conf/docker-explorer.conf"
  source_file "$DIR/conf/docker-whirlpool.conf"
  source_file "$DIR/conf/docker-common.conf"

  case $1 in
    db | tor | nginx | node )
      display_logs $1 $2
      ;;
    bitcoind )
      if [ "$BITCOIND_INSTALL" == "on" ]; then
        display_logs $1 $2
      else
        echo -e "Command not supported for your setup.\nCause: Your Dojo is using an external bitcoind"
      fi
      ;;
    indexer )
      if [ "$INDEXER_INSTALL" == "on" ] && [ "$INDEXER_TYPE" == "addrindexrs" ]; then
        display_logs $1 $2
      else
        echo -e "Command not supported for your setup.\nCause: Your Dojo is not running the internal indexer"
      fi
      ;;
    fulcrum )
      if [ "$INDEXER_INSTALL" == "on" ] && [ "$INDEXER_TYPE" == "fulcrum" ]; then
        display_logs $1 $2
      else
        echo -e "Command not supported for your setup.\nCause: Your Dojo is not running the Fulcrum indexer"
      fi
      ;;
    explorer )
      if [ "$EXPLORER_INSTALL" == "on" ]; then
        display_logs $1 $2
      else
        echo -e "Command not supported for your setup.\nCause: Your Dojo is not running the internal block explorer"
      fi
      ;;
    whirlpool )
      if [ "$WHIRLPOOL_INSTALL" == "on" ]; then
        display_logs $1 $2
      else
        echo -e "Command not supported for your setup.\nCause: Your Dojo is not running a whirlpool client"
      fi
      ;;
    * )
      services="nginx node tor db"
      if [ "$BITCOIND_INSTALL" == "on" ]; then
        services="$services bitcoind"
      fi
      if [ "$EXPLORER_INSTALL" == "on" ]; then
        services="$services explorer"
      fi
      if [ "$INDEXER_INSTALL" == "on" ]; then
        if [ "$INDEXER_TYPE" == "addrindexrs" ]; then
          services="$services indexer"
        elif [ "$INDEXER_TYPE" == "fulcrum" ]; then
          services="$services fulcrum"
        fi
      fi
      if [ "$WHIRLPOOL_INSTALL" == "on" ]; then
        services="$services whirlpool"
      fi
      display_logs "$services" $2
      ;;
  esac
}

# Display the help
help() {
  echo "Usage: dojo.sh command [module] [options]"
  echo "Interact with your dojo."
  echo " "
  echo "Available commands:"
  echo " "
  echo "  help                          Display this help message."
  echo " "
  echo "  bitcoin-cli                   Launch a bitcoin-cli console allowing to interact with your full node through its RPC API."
  echo " "
  echo "  clean                         Free disk space by deleting docker dangling images and images of previous versions."
  echo " "
  echo "  install                       Install your dojo."
  echo " "
  echo "                                Available options:"
  echo "                                  --nolog     : do not display the logs after Dojo has been launched."
  echo " "
  echo "  logs [module] [options]       Display the logs of your dojo."
  echo "                                  By default, the command displays the live logs. Use CTRL+C to stop the logs."
  echo "                                  Use the -n option to display past logs."
  echo " "
  echo "                                Available modules:"
  echo "                                  dojo.sh logs                : display the logs of all the Docker containers"
  echo "                                  dojo.sh logs bitcoind       : display the logs of bitcoind"
  echo "                                  dojo.sh logs db             : display the logs of the MySQL database"
  echo "                                  dojo.sh logs tor            : display the logs of tor"
  echo "                                  dojo.sh logs nginx          : display the logs of nginx"
  echo "                                  dojo.sh logs indexer        : display the logs of the internal indexer"
  echo "                                  dojo.sh logs fulcrum        : display the logs of the Fulcrum indexer"
  echo "                                  dojo.sh logs node           : display the logs of NodeJS modules (API, Tracker, PushTx API, Orchestrator)"
  echo "                                  dojo.sh logs explorer       : display the logs of the Explorer"
  echo "                                  dojo.sh logs whirlpool      : display the logs of the Whirlpool client"
  echo " "
  echo "                                Available options:"
  echo "                                  -n [VALUE]                  : display the last VALUE lines"
  echo " "
  echo "  onion                         Display the Tor onion addresses allowing your wallet to access your dojo."
  echo " "
  echo "  restart                       Restart your dojo."
  echo " "
  echo "  start                         Start your dojo."
  echo " "
  echo "  stop                          Stop your dojo."
  echo " "
  echo "  uninstall                     Delete your dojo. Be careful! This command will also remove all data."
  echo " "
  echo "  upgrade [options]             Upgrade your dojo."
  echo " "
  echo "                                Available options:"
  echo "                                  --nolog     : do not display the logs after Dojo has been restarted."
  echo "                                  --nocache   : rebuild the docker containers without reusing the cached layers."
  echo " "
  echo "  version                       Display the version of dojo"
  echo " "
  echo "  whirlpool [action]            Interact with the internal whirlpool-cli mdule."
  echo " "
  echo "                                Available actions:"
  echo "                                  apikey : display the API key generated by whirlpool-cli."
  echo "                                  reset  : reset the whirlpool-cli instance (delete configuration file)."
}


#
# Parse options to the dojo command
#
while getopts ":h" opt; do
  case ${opt} in
    h )
      help
      exit 0
      ;;
   \? )
     echo "Invalid Option: -$OPTARG" 1>&2
     exit 1
     ;;
  esac
done

shift $((OPTIND -1))


subcommand=$1; shift

case "$subcommand" in
  bitcoin-cli )
    if [ "$BITCOIND_INSTALL" == "on" ]; then
      docker exec -it bitcoind bitcoin-cli \
        -rpcconnect=bitcoind \
        --rpcport=28256 \
        --rpcuser="$BITCOIND_RPC_USER" \
        --rpcpassword="$BITCOIND_RPC_PASSWORD" \
        $1 $2 $3 $4 $5
      else
        echo -e "Command not supported for your setup.\nCause: Your Dojo is using an external bitcoind"
      fi
    ;;
  help )
    help
    ;;
  clean )
    clean
    ;;
  install )
    install "$@"
    ;;
  logs )
    module=$1; shift
    numlines=0

    # Process package options
    while getopts ":n:" opt; do
      case ${opt} in
        n )
          numlines=$OPTARG
          ;;
        \? )
          echo "Invalid Option: -$OPTARG" 1>&2
          exit 1
          ;;
        : )
          echo "Invalid Option: -$OPTARG requires an argument" 1>&2
          exit 1
          ;;
      esac
    done
    shift $((OPTIND -1))

    logs "$module" $numlines
    ;;
  onion )
    onion
    ;;
  restart )
    restart
    ;;
  start )
    start
    ;;
  stop )
    stop
    ;;
  uninstall )
    uninstall "$@"
    ;;
  upgrade )
    upgrade "$@"
    ;;
  version )
    version
    ;;
  whirlpool )
    whirlpool "$@"
    ;;
esac
