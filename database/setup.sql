
DROP TABLE IF EXISTS users;

CREATE TABLE users(
   id             INTEGER PRIMARY KEY AUTOINCREMENT,
   username       TEXT NOT NULL UNIQUE,
   password       TEXT NOT NULL UNIQUE
);

DROP TABLE IF EXISTS TierLists;

CREATE TABLE TierLists(
   author         TEXT,
   data           TEXT NOT NULL,
   title          TEXT,
   thumbnail      TEXT 
);

