#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE SEQUENCE sample_sequence
    start 1
    increment 1;
  CREATE TABLE raw (
    sample bigint,
    id    smallint,
    addr  smallint,
    value smallint,
    date  timestamp
  );
  CREATE VIEW values AS SELECT sample,id,date,cast(value as float)*0.0140625+32 as value from raw;
  CREATE INDEX ON raw (id);

  CREATE OR REPLACE FUNCTION notify_new()
    RETURNS trigger AS
  \$BODY\$
      BEGIN
          PERFORM pg_notify('new', row_to_json(NEW)::text);
          RETURN NULL;
      END;
  \$BODY\$
    LANGUAGE plpgsql VOLATILE
    COST 100;

  CREATE TRIGGER notify_new
    AFTER INSERT
    ON "raw"
    FOR EACH ROW
    EXECUTE PROCEDURE notify_new();
EOSQL
