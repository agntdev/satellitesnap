-- Search history. Each row is one resolved target a client looked up.
-- There is no user auth, so rows are scoped by an opaque client id that the
-- frontend generates and stores locally.
CREATE TABLE IF NOT EXISTS searches (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  client_id   TEXT        NOT NULL,
  label       TEXT        NOT NULL,
  lat         DOUBLE PRECISION NOT NULL,
  lng         DOUBLE PRECISION NOT NULL,
  searched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS searches_client_recent_idx
  ON searches (client_id, searched_at DESC);
