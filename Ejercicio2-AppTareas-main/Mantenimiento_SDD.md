# Documento de Visión y Alcance

**Proyecto:** List Website
**Equipo:** Andrea Martínez Arroyo, Jorge Bryan Piedras Mora, Edgar Robles Pérez y Clarissa Pitol Salazar
**Fecha:** 21/09/2026
**Versión:** 1.0

---

## 1. Problema

### 1.1 Descripción del problema
La versión actual del software contiene una paleta de colores poco llamativa, lo que no resulta atractivo para nuevos usuarios. Adicionalmente, no se cuenta con una base de datos. Por lo tanto, las tareas no se guardan entre sesiones ni hay manera de que los usuarios se registren de manera permanente. De igual manera, no se cuenta con módulos de registro, autenticación, inicio de sesión ni recuperación de contraseña. Finalmente, el manejo de tareas es muy básico, causando que no se puedan descomponer tareas en subtareas.

### 1.2 ¿Quién lo sufre?
Tanto los usuarios recurrentes como los potenciales usuarios sufren de las consecuencias de dichas faltas de funcionalidad.

---

## 2. Solución propuesta

### 2.1 Descripción general
Para comenzar, es necesario implementar una base de datos que incluya tablas de usuario, tareas y subtareas. Siguiendo esto, se deben de crear módulos de registro e inicio de sesión, los cuales deben estar relacionados al correo electrónico para poder recuperar contrseña y autenticación. El equipo también propone seleccionar una nueva paleta de colores para las interfaces. Adicionalmente, agregar la función de creación de subtareas permitirá al usuario descomponer las tareas principales.

---

## 3. Usuarios y casos de uso

### 3.1 Perfiles de usuario (personas)

| Perfil | Rol/contexto | Necesidad principal |
|---|---|---|
| Usuario | Gestiona sus tareas con ayuda del software, lo que involucra estado (pendiente o completado), fecha, hora y progreso general de tarea (basado en subtareas). | Crear una cuenta para poder iniciar sesión y guardar tareas y subtareas en una base de datos. |

---

## 4. Alcance

### 4.1 Incluido en este proyecto
- [ ] Registro y autenticación.
- [ ] Inicio de sesión.
- [ ] Recuperación de contraseña con Brevo para el envío de correo electrónico (si hay una mejor opción propónla).
- [ ] Registro de tareas y subtareas.
- [ ] Base de datos con MySQL.
- [ ] Railway para servidor de Base de Datos y backend.

### 4.2 Explícitamente fuera de alcance
- Cambio de lenguaje.

---

## 5. Nuevos requisitos funcionales

| ID | Requisito | Prioridad (Must/Should/Could) |
|---|---|---|
| NRF-01 | El sistema debe permitir al usuario registrarse únicamente ingresando correo electrónico y contraseña. | Must |
| NRF-02 | El sistema debe autenticar el correo electrónico para poder finalizar el registro del usuario. | Should |
| NRF-03 | El sistema debe permitir al usuario iniciar sesión con su correo electrónico y contraseña. | Must |
| NRF-04 | El sistema debe permitir al usuario recuperar contraseña a través de su correo electrónico. | Should |
| NRF-05 | El sistema debe permitir al usuario iniciar sesión con su correo y contraseña. | Must |
| NRF-06 | El sistema debe permitir al usuario crear tareas, guardando nombre, hora y fecha. | Must |
| NRF-07 | El sistema debe permitir al usuario crear subtareas dentro de cada tarea, guardando únicamente nombre. | Should |
| NRF-08 | El sistema debe permitir al usuario marcar tareas y subtareas como completadas. | Should |
| NRF-09 | Al estar todas las subtareas en estado completado, el sistema debe marcar la tarea como completada automaticamente. | Should |
| NRF-10 | El sistema debe mostrar una barra de progreso de cada tarea basada en los estados de sus subtareas. | Could |

---

## 6. Nuevos requisitos no funcionales

| ID | Requisito | Categoría |
|---|---|---|
| RNF-01 | Las interfaces deberán integrar colores saturados, minimizando el uso de blanco y negro. | Usabilidad |
| RNF-02 | El sistema deberá ser compatible con: [herramientas externas]. | Compatibilidad |
| RNF-03 | La base de datos debe ser desarrollada en MySQL. | Arquitectura |
| RNF-04 | Todo el código fuente del sistema deberá ser refactorizado con el objetivo de mejorar su legibilidad, mantenibilidad, estructura y calidad, sin alterar la funcionalidad existente. | Arquitectura |

---

## 7. Métricas de éxito

1. El sistema deberá cumplir satisfactoriamente el 100 % de los requisitos funcionales antes de la entrega final.
2. El sistema deberá cumplir satisfactoriamente el 100 % de los requisitos no funcionales antes de la entrega final.
3. El 100 % del código fuente deberá haber sido revisado y refactorizado, eliminando código duplicado o innecesariamente complejo sin modificar las funcionalidades existentes.
4. El 100 % de las pruebas automatizadas de registro, inicio de sesión, autenticación y recuperación de contraseña deberá ejecutarse correctamente de acuerdo con los requisitos definidos.
5. El 100 % de las pruebas automatizadas de persistencia deberá comprobar que las tareas y subtareas creadas sean almacenadas correctamente en MySQL y recuperadas después de reiniciar la aplicación.
