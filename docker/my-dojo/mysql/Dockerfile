FROM    mariadb:10.5.12

# Copy mysql config
COPY    ./docker/my-dojo/mysql/mysql-low_mem.cnf /etc/mysql/conf.d/mysql-dojo.cnf

# Copy update-db script
COPY    ./docker/my-dojo/mysql/update-db.sh /update-db.sh

RUN     chmod u+x /update-db.sh && \
        chmod g+x /update-db.sh

# Copy content of mysql scripts into /docker-entrypoint-initdb.d
COPY    ./db-scripts/ /docker-entrypoint-initdb.d

# Remove template extension from SQL init schema
RUN     bash -c 'for f in /docker-entrypoint-initdb.d/*.tpl; do mv -- "$f" "${f%.tpl}"; done'
