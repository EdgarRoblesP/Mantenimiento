-- =============================================================================
-- List Website - Datos de ejemplo (opcional, solo para desarrollo)
--
-- Este script NO crea el usuario demo, porque la contraseña debe pasar por
-- bcrypt y eso no se puede hacer desde SQL. Para sembrar todo de una vez usa:
--
--   cd backend && npm run seed
--
-- Ese comando crea demo@listwebsite.com / Tareas2026! (ya verificado) y además
-- inserta estas mismas tareas y subtareas.
--
-- Si prefieres SQL puro: regístrate desde la aplicación con el correo
-- demo@listwebsite.com y después ejecuta este archivo.
-- =============================================================================

SET NAMES utf8mb4;

SET @demo_id = (SELECT id FROM users WHERE email = 'demo@listwebsite.com');

INSERT INTO tasks (user_id, title, due_date, due_time, completed)
SELECT @demo_id, t.title, t.due_date, t.due_time, t.completed
FROM (
  SELECT 'Preparar exposición del proyecto'             AS title, '2026-10-05' AS due_date, '14:15:00' AS due_time, 0 AS completed
  UNION ALL SELECT 'Subir código de la práctica 2 al repositorio', '2026-10-02', '11:30:00', 0
  UNION ALL SELECT 'Revisar apuntes de la clase',                  '2026-09-30', '09:00:00', 1
) AS t
WHERE @demo_id IS NOT NULL;

SET @task_expo = (
  SELECT id FROM tasks
  WHERE user_id = @demo_id AND title = 'Preparar exposición del proyecto'
  ORDER BY id DESC LIMIT 1
);

INSERT INTO subtasks (task_id, title, completed)
SELECT @task_expo, s.title, s.completed
FROM (
  SELECT 'Armar el guion de la presentación' AS title, 1 AS completed
  UNION ALL SELECT 'Diseñar las diapositivas', 0
  UNION ALL SELECT 'Ensayar el demo en vivo',  0
) AS s
WHERE @task_expo IS NOT NULL;
