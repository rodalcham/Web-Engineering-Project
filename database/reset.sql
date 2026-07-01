-- reset.sql
-- Drops and recreates the database.
-- Run this when you want a clean database.

DROP DATABASE IF EXISTS fitshare_db;

CREATE DATABASE fitshare_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE fitshare_db;
