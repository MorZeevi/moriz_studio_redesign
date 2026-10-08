-- Grant the server-only service_role the table privileges it needs on the
-- diagnostic_ tables. The tables were created with RLS enabled but without any
-- table-level grants, so PostgREST requests made with the service-role key fail
-- with "permission denied for table" (SQLSTATE 42501). RLS still denies the
-- browser roles (anon / authenticated) by default -- only the trusted server
-- role is granted access here. The default-privileges statement covers future
-- diagnostic_ tables created by this migration role (P5/P6) automatically.
grant all on table diagnostic_sessions to service_role;
grant all on table diagnostic_answers  to service_role;
grant all on table diagnostic_contacts to service_role;
alter default privileges in schema public grant all on tables to service_role;
