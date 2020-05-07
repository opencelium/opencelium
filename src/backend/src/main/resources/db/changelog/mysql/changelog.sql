--liquibase formatted sql

--changeset 1.1:1
ALTER TABLE connection DROP COLUMN IF EXISTS name1;

