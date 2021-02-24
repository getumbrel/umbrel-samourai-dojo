#########################################
# CONFIGURATION OF WHIRLPOOL CONTAINER
#########################################

# Install and run an instance of whirlpool-cli inside Docker
# Value: on | off
WHIRLPOOL_INSTALL=off

# Resynchronize mix counters on startup (startup will be slower)
# Value: on | off
WHIRLPOOL_RESYNC=off

# Contact coordinator through its onion address or clearnet address
# Set to on for onion address, set to off for clearnet address
# Value: on | off
WHIRLPOOL_COORDINATOR_ONION=on

#
# EXPERT SETTINGS
#

# Activate debug logs
# Value: on | off
WHIRLPOOL_DEBUG=off

# Activate more debug logs
# Value: on | off
WHIRLPOOL_DEBUG_CLIENT=off
