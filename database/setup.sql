
DROP TABLE IF EXISTS queue;

CREATE TABLE users(
   id             INTEGER PRIMARY KEY AUTOINCREMENT,
   username       TEXT NOT NULL UNIQUE,
   password       TEXT NOT NULL UNIQUE
);


