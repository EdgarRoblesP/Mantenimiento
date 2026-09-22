-- =============================================================================
-- List Website - Esquema de base de datos (MySQL 8.x)
-- Proyecto: Mantenimiento de Software - Ejercicio 2 (App de Tareas)
-- Requisitos cubiertos: RNF-03, NRF-01..NRF-10
--
-- Ejecutar:
--   mysql -h <host> -P <puerto> -u <usuario> -p <base> < database/schema.sql
-- En Railway el nombre de la base lo crea el servicio MySQL (normalmente
-- `railway`), por eso este script NO hace CREATE DATABASE ni USE.
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- users - NRF-01 (registro con correo y contraseña), NRF-02 (verificación)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email           VARCHAR(254)    NOT NULL,
  password_hash   VARCHAR(255)    NOT NULL,
  email_verified  TINYINT(1)      NOT NULL DEFAULT 0,
  verified_at     DATETIME        NULL,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- auth_tokens - NRF-02 (verificación de correo) y NRF-04 (recuperación)
-- Se guarda solo el hash SHA-256 del token: el valor en claro viaja únicamente
-- en el correo enviado por Brevo (RNF-02).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth_tokens (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NOT NULL,
  token_hash  CHAR(64)        NOT NULL,
  type        ENUM('email_verification', 'password_reset') NOT NULL,
  expires_at  DATETIME        NOT NULL,
  used_at     DATETIME        NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_auth_tokens_hash (token_hash),
  KEY ix_auth_tokens_user_type (user_id, type),
  KEY ix_auth_tokens_expires (expires_at),
  CONSTRAINT fk_auth_tokens_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- user_sessions - NRF-03 (inicio de sesión) y NRF-05 (cierre de sesión)
-- Cada JWT emitido lleva un `jti` que apunta a una fila de esta tabla. El cierre
-- de sesión marca `revoked_at`, con lo que el token deja de ser válido aunque
-- todavía no haya expirado.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_sessions (
  id          CHAR(36)        NOT NULL,
  user_id     BIGINT UNSIGNED NOT NULL,
  user_agent  VARCHAR(255)    NULL,
  expires_at  DATETIME        NOT NULL,
  revoked_at  DATETIME        NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_user_sessions_user (user_id),
  KEY ix_user_sessions_expires (expires_at),
  CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- tasks - NRF-06 (nombre, fecha y hora), NRF-08 (completada)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       BIGINT UNSIGNED NOT NULL,
  title         VARCHAR(255)    NOT NULL,
  due_date      DATE            NOT NULL,
  due_time      TIME            NOT NULL,
  completed     TINYINT(1)      NOT NULL DEFAULT 0,
  completed_at  DATETIME        NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_tasks_user_completed (user_id, completed),
  KEY ix_tasks_user_due (user_id, due_date, due_time),
  CONSTRAINT fk_tasks_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- subtasks - NRF-07 (solo nombre), NRF-08, NRF-09, NRF-10
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subtasks (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  task_id       BIGINT UNSIGNED NOT NULL,
  title         VARCHAR(255)    NOT NULL,
  completed     TINYINT(1)      NOT NULL DEFAULT 0,
  completed_at  DATETIME        NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_subtasks_task (task_id, completed),
  CONSTRAINT fk_subtasks_task FOREIGN KEY (task_id) REFERENCES tasks (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- vw_task_progress - NRF-10 (barra de progreso por tarea)
-- Para tareas sin subtareas el progreso es 100 % si la tarea está completada.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_task_progress AS
SELECT
  t.id                                                   AS task_id,
  t.user_id                                              AS user_id,
  COUNT(s.id)                                            AS subtask_total,
  COALESCE(SUM(s.completed), 0)                          AS subtask_completed,
  CASE
    WHEN COUNT(s.id) = 0 THEN IF(t.completed = 1, 100, 0)
    ELSE ROUND(SUM(s.completed) * 100 / COUNT(s.id))
  END                                                    AS progress
FROM tasks t
LEFT JOIN subtasks s ON s.task_id = t.id
GROUP BY t.id, t.user_id, t.completed;

SET FOREIGN_KEY_CHECKS = 1;
