INSERT INTO roles (id, name) VALUES (1, 'admin') ON CONFLICT(id) DO UPDATE SET name=excluded.name;
INSERT INTO roles (id, name) VALUES (2, 'user') ON CONFLICT(id) DO UPDATE SET name=excluded.name;

INSERT INTO users (id, username, password_hash, role_id) VALUES (1, 'admin', '$2a$10$AtbieXwDFuihP1HvwpVLreMoNGN6wtWtcJohl/Ngaqavw9q11hIPS', 1) ON CONFLICT(id) DO UPDATE SET username=excluded.username, password_hash=excluded.password_hash, role_id=excluded.role_id;