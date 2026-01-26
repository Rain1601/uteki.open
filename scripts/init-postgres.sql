-- PostgreSQL initialization script for uteki.open
-- This script runs automatically when the container starts for the first time

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas for each domain
CREATE SCHEMA IF NOT EXISTS admin;
CREATE SCHEMA IF NOT EXISTS trading;
CREATE SCHEMA IF NOT EXISTS data;
CREATE SCHEMA IF NOT EXISTS agent;
CREATE SCHEMA IF NOT EXISTS evaluation;
CREATE SCHEMA IF NOT EXISTS dashboard;

-- Set search path
ALTER DATABASE uteki SET search_path TO public, admin, trading, data, agent, evaluation, dashboard;

-- Create a read-only user for analytics (optional)
-- CREATE USER uteki_readonly WITH PASSWORD 'readonly_pass';
-- GRANT CONNECT ON DATABASE uteki TO uteki_readonly;
-- GRANT USAGE ON SCHEMA public, admin, trading, data, agent, evaluation, dashboard TO uteki_readonly;

-- Log successful initialization
SELECT 'PostgreSQL initialized successfully for uteki.open' AS status;
