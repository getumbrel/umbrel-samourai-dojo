#########################################
# CONFIGURATION OF MYSQL CONTAINER
#########################################

# Password of MySql root account
# Warning: This option must not be modified after the first installation
# Type: alphanumeric
MYSQL_ROOT_PASSWORD=rootpassword

# User account used for db access
# Warning: This option must not be modified after the first installation
# Type: alphanumeric
MYSQL_USER=samourai

# Password of of user account
# Warning: This option must not be modified after the first installation
# Type: alphanumeric
MYSQL_PASSWORD=password

# MySQL configuration profile
#   default = default configuration parameters
#   low_mem = configuration minimizing the RAM consumed by the database
# Values: default | low_mem
MYSQL_CONF_PROFILE=default