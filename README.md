# ORION Maintenance Lite

**Prueba técnica para aprendices y practicantes SENA.**

Aplicación web para la gestión de activos y órdenes de trabajo de mantenimiento, desarrollada como solución a la prueba técnica del equipo ORION para aprendices y practicantes SENA.

## 1. Descripción del proyecto

ORION Maintenance Lite permite administrar los activos de una organización y gestionar las órdenes de trabajo asociadas a ellos.

La aplicación cuenta con autenticación de usuarios, control de acceso por roles, persistencia en MySQL y una interfaz web desarrollada con React.

## 2. Tecnologías utilizadas

### Frontend
- React 19.
- Vite.
- JavaScript.
- CSS.
- Axios para las peticiones HTTP.
- React Router para la navegación.
- Oxlint para revisar el código.

### Backend
- Node.js.
- Express 5.
- Sequelize como ORM.
- MySQL como sistema de gestión de base de datos.
- JSON Web Token (JWT) para la autenticación.
- bcryptjs para proteger las contraseñas.
- dotenv para gestionar variables de entorno.

### Pruebas
- Jest.
- Supertest.

### Herramientas
- Git y GitHub.
- MySQL Workbench o una herramienta equivalente para administrar la base de datos.

## 3. Funcionalidades implementadas

### 3.1 Autenticación y usuarios
- Inicio de sesión mediante correo electrónico y contraseña.
- Autenticación mediante tokens JWT.
- Protección de rutas según el rol del usuario.
- Administración de usuarios desde el backend.
- Contraseñas almacenadas mediante hash.

### 3.2 Gestión de activos
- Registrar activos.
- Consultar el listado de activos.
- Consultar el detalle de un activo.
- Editar información de activos.
- Desactivar activos sin eliminarlos físicamente.
- Reactivar activos desactivados.
- Generar identificadores de inventario desde el backend.

Cada activo contiene información como nombre, tipo, ubicación, estado y fecha de registro.

### 3.3 Gestión de órdenes de trabajo
- Crear órdenes asociadas a activos.
- Consultar el listado de órdenes.
- Consultar el detalle de una orden.
- Asignar responsables a las órdenes.
- Definir prioridad.
- Actualizar el estado de las órdenes.
- Consultar el historial de cambios de estado.

Las órdenes incluyen título, descripción, prioridad, estado, activo asociado y responsables cuando corresponda.

### 3.4 Roles de usuario

La aplicación contempla los siguientes roles:

| Rol | Funcionalidades principales |
|---|---|
| Administrador | Gestionar activos, administrar usuarios y asignar responsables. También puede gestionar órdenes. |
| Mantenimiento | Consultar activos y gestionar órdenes de trabajo. |
| Consulta | Consultar la información disponible sin realizar operaciones de modificación. |

Los permisos se validan en el backend para proteger las operaciones.

## 4. Reglas de negocio

### Activos
- El nombre, tipo y ubicación son obligatorios.
- Cada activo recibe un identificador de inventario generado por el backend.
- Los activos no se eliminan físicamente: se desactivan.
- Un activo inactivo no puede utilizarse para crear nuevas órdenes.
- Los activos pueden reactivarse mediante los permisos correspondientes.

### Órdenes de trabajo
- Toda orden debe estar asociada a un activo existente y activo.
- El título y la descripción son obligatorios.
- La prioridad puede ser Alta, Media o Baja.
- Las nuevas órdenes comienzan en estado `Pendiente`.
- Se permite crear órdenes sin responsables asignados.
- Para pasar una orden a `En progreso`, debe tener al menos un responsable de mantenimiento activo.
- La asignación de responsables está restringida al administrador.
- Se permite advertir sobre otras órdenes abiertas asociadas al mismo activo sin bloquear la creación.

### Flujo de estados

El flujo implementado sigue las decisiones del documento `REFINEMENT.md`:

- `Pendiente` → `En progreso`.
- `Pendiente` → `Cancelada`.
- `En progreso` → `Finalizada`.
- `En progreso` → `Cancelada`.
- `Finalizada` → `En progreso` (reapertura).
- Una orden `Cancelada` no puede reabrirse.

Los cambios de estado se registran en el historial con su fecha y usuario correspondiente.

**Nota:** estas reglas siguen el refinamiento de los requerimientos, que amplía el flujo inicial descrito en la prueba técnica.

## 5. Requisitos previos

Antes de instalar el proyecto, se debe contar con:

- Node.js y npm.
- MySQL Server.
- Git.
- Un cliente para administrar MySQL, como MySQL Workbench (opcional).

Se recomienda utilizar una versión de Node.js compatible con Vite 8.

## 6. Instalación y configuración

### 6.1 Clonar el repositorio

```bash
git clone https://github.com/Chanty12345/PruebaTecnicaSENA.git
cd PruebaTecnicaSENA
```

### 6.2 Crear las bases de datos

Desde MySQL Workbench o la consola de MySQL, ejecutar:

```sql
CREATE DATABASE orion_maintenance;
CREATE DATABASE orion_maintenance_test;
```

La primera base de datos almacena la información de desarrollo y la segunda se utiliza para las pruebas automatizadas.

### 6.3 Configurar el backend

Ingresar a la carpeta:

```bash
cd backend
```

Instalar dependencias:

```bash
npm install
```

Crear el archivo `.env` a partir de `.env.example`.

En Git Bash se puede utilizar:

```bash
cp .env.example .env
```

Configurar las variables del archivo `backend/.env`:

```env
PORT=3000

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=orion_maintenance
DB_USER=root
DB_PASSWORD=

DB_NAME_TEST=orion_maintenance_test

JWT_SECRET=coloca_una_clave_segura
```

Reemplazar los valores de conexión por los correspondientes a la instalación local de MySQL.

Agregar también los datos para crear el administrador inicial:

```env
ADMIN_NOMBRES=Nombre
ADMIN_APELLIDOS=Apellido
ADMIN_EMAIL=admin@orion.com
ADMIN_PASSWORD=UnaClaveSegura123
```

La contraseña debe tener entre 8 y 72 caracteres.

No se debe compartir ni subir el archivo `.env` al repositorio.

### 6.4 Ejecutar las migraciones

Desde la carpeta `backend`, ejecutar:

```bash
npx sequelize-cli db:migrate
```

Este comando crea las tablas necesarias en la base de datos configurada para el entorno de desarrollo.

### 6.5 Crear el administrador inicial

Ejecutar:

```bash
node src/scripts/crearAdministrador.js
```

Si los datos son correctos y el correo no está registrado, se creará un usuario con el rol `administrador`.

### 6.6 Iniciar el backend

Para desarrollo:

```bash
npm run dev
```

El servidor se ejecuta en:

```text
http://localhost:3000
```

Para iniciar el servidor sin Nodemon:

```bash
npm start
```

## 7. Instalación y ejecución del frontend

Abrir otra terminal desde la raíz del proyecto e ingresar a:

```bash
cd frontend
```

Instalar las dependencias:

```bash
npm install
```

Iniciar el servidor de desarrollo:

```bash
npm run dev
```

Vite mostrará en la terminal la dirección local para abrir la aplicación en el navegador, normalmente:

```text
http://localhost:5173
```

El frontend consume la API del backend configurada en `src/services/api.js`.

## 8. Ejecución de pruebas

Las pruebas automatizadas se encuentran en:

```text
backend/tests/
```

Para ejecutarlas, ingresar a la carpeta `backend` y utilizar:


```bash
npx sequelize-cli db:migrate --env test
```
Despues

```bash
npm test
```

Las pruebas utilizan la base de datos de pruebas configurada mediante `DB_NAME_TEST`, separada de la base de datos de desarrollo.

Para ejecutar Jest en modo de observación:

```bash
npm run test:watch
```

### Validación del frontend

Desde la carpeta `frontend`:

```bash
npm run lint
```

Para comprobar la compilación de producción:

```bash
npm run build
```

## 9. Estructura del proyecto

```text
PruebaTecnicaSENA/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── database/
│   │   │   ├── migrations/
│   │   │   └── seeders/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── scripts/
│   │   ├── services/
│   │   └── server.js
│   ├── tests/
│   ├── .env.example
│   ├── .sequelizerc
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── styles/
│   └── package.json
│
├── .gitignore
├── GUIA_EJECUCION.md
├── README.md
├── BACKLOG.md
└── REFINEMENT.md
```

### Organización del backend

El backend utiliza una separación por responsabilidades:

- `routes`: define los endpoints de la API.
- `controllers`: recibe las solicitudes y construye las respuestas.
- `services`: contiene las reglas de negocio.
- `models`: define los modelos de Sequelize.
- `middlewares`: implementa validaciones y controles de acceso.
- `config`: contiene la configuración de la aplicación y la base de datos.
- `database/migrations`: contiene las migraciones para crear las tablas.
- `scripts`: contiene tareas administrativas, como la creación del administrador.

### Organización del frontend

- `pages`: contiene las páginas principales.
- `components`: contiene componentes reutilizables.
- `services`: centraliza las peticiones al backend.
- `context`: administra el estado compartido de autenticación.
- `styles`: contiene los estilos de la aplicación.
- `assets`: contiene recursos estáticos.

## 10. Decisiones técnicas

- Se eligió React para construir una interfaz por componentes.
- Se utilizó Express para desarrollar la API REST.
- Sequelize permite administrar la persistencia mediante modelos y migraciones.
- MySQL almacena los usuarios, activos, órdenes, responsables e historial.
- Se implementó autenticación JWT para proteger los endpoints.
- Las contraseñas se protegen utilizando bcryptjs.
- Se separaron las rutas, controladores y servicios para mantener responsabilidades claras.
- Se implementó desactivación lógica de activos para conservar la información relacionada.
- Se registran los cambios de estado de las órdenes para mantener un historial.
- Se utilizaron bases de datos separadas para desarrollo y pruebas.

## 11. Limitaciones conocidas

- La aplicación está pensada para ejecutarse en un entorno local de desarrollo.
- No cuenta con un despliegue público configurado.
- No se ha implementado una aplicación móvil.
- No se ha implementado un sistema de notificaciones.
- No se ha incorporado una integración de CI/CD.
- La configuración de conexión del frontend apunta al backend local.

## 12. Mejoras futuras

- Implementar Docker y Docker Compose.
- Incorporar documentación interactiva de la API con Swagger/OpenAPI.
- Implementar filtros y paginación en los listados.
- Ampliar las pruebas automatizadas.
- Incorporar un dashboard con indicadores de mantenimiento.
- Implementar notificaciones sobre cambios en las órdenes.
- Mejorar las opciones de búsqueda y consulta.
- Configurar un entorno de despliegue.

## 13. Git y control de versiones

El proyecto utiliza Git para controlar los cambios durante el desarrollo.

Se realizaron commits progresivos con mensajes descriptivos para identificar la implementación de funcionalidades, pruebas, refactorizaciones y configuración del proyecto.

El archivo `.gitignore` evita versionar dependencias, variables de entorno, archivos generados y otros elementos que no deben formar parte del repositorio.

## 14. Uso de inteligencia artificial

Se utilizaron herramientas de inteligencia artificial como apoyo durante el desarrollo para comprender conceptos, revisar errores, orientar la implementación y mejorar la documentación.

El código y las decisiones técnicas deben ser comprendidos por el desarrollador y poder explicarse durante la sustentación.

## 15. Sustentación

La solución está orientada a demostrar:

1. El problema de gestión de activos y órdenes de trabajo.
2. La arquitectura y organización del proyecto.
3. Las funcionalidades desarrolladas.
4. La persistencia de información en MySQL.
5. La autenticación y los permisos por rol.
6. Las pruebas realizadas.
7. Las dificultades encontradas y las mejoras futuras.

---

**Proyecto:** ORION Maintenance Lite

**Tipo:** Prueba técnica SENA

**Repositorio:** https://github.com/Chanty12345/PruebaTecnicaSENA
