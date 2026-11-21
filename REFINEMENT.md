# Refinamiento de requisitos – ORION Maintenance Lite

## Propósito

Identificar información faltante en los requerimientos, formular preguntas, documentar supuestos, justificar decisiones de implementación, reconocer riesgos y priorizar funcionalidades.

# Escenario 1: Activos duplicados

## Preguntas adicionales

1. ¿El código de inventario debe ser único para toda la organización o solamente dentro de cada centro?
2. ¿El sistema debe generar automáticamente el código de inventario?
3. ¿Un activo desactivado conserva su código o este puede reutilizarse?

## Supuestos

1. Cada activo tendrá un código de inventario único a nivel global dentro de ORION.
2. El código será generado automáticamente por el backend.
3. Los activos desactivados conservarán su código y no se permitirá reutilizarlo.

## Decisión de implementación

Se implementará un código de inventario único para identificar cada activo. El backend será responsable de generarlo y la base de datos MySQL tendrá una restricción `UNIQUE` para impedir registros duplicados.

La generación del código deberá ser segura ante solicitudes simultáneas, utilizando un mecanismo de asignación concurrente y no una simple consulta del último código registrado.

Si se intenta registrar un activo con un código existente, el sistema bloqueará la operación y mostrará un mensaje claro.

Si un activo cambia de ubicación, conservará su código de inventario.

## Riesgos

1. Dos solicitudes simultáneas podrían intentar generar el mismo código. Se controlará mediante una generación segura y una restricción `UNIQUE` en la base de datos.
2. Eliminar o reutilizar códigos podría afectar la trazabilidad. Por eso se conservarán los códigos incluso cuando los activos estén desactivados.

# Escenario 2: Eliminación de activos

## Preguntas adicionales

1. ¿Se debe eliminar permanentemente un activo o solamente desactivarlo?
2. ¿Qué sucede con las órdenes de trabajo asociadas a un activo desactivado?
3. ¿Qué usuarios tendrán permiso para desactivar y reactivar activos?

## Supuestos

1. Los activos no se eliminarán físicamente de la base de datos; se utilizará una desactivación lógica.
2. Las órdenes de trabajo existentes se conservarán aunque el activo sea desactivado.
3. Solamente los administradores podrán desactivar y reactivar activos.

## Decisión

Se implementará una desactivación lógica (soft delete), conservando la información del activo y su historial.

El administrador podrá reactivar un activo cuando sea necesario. El código de inventario se conservará durante todo su ciclo de vida.

No se permitirá crear nuevas órdenes de trabajo para activos desactivados, pero las órdenes existentes seguirán disponibles para consulta y seguimiento.

Antes de desactivar un activo, el sistema solicitará confirmación al administrador.

## Riesgos

1. Una desactivación accidental podría afectar las operaciones. Se solicitará confirmación antes de ejecutar la acción.
2. La eliminación física podría provocar pérdida de información histórica. Se conservarán los registros mediante desactivación lógica.

# Escenario 3: Órdenes simultáneas

## Preguntas adicionales

1. ¿Un activo puede tener varias órdenes de trabajo abiertas al mismo tiempo?
2. ¿Qué estados se consideran abiertos?
3. ¿El sistema debe bloquear o advertir cuando ya existan órdenes abiertas para el mismo activo?

## Supuestos

1. Un activo podrá tener varias órdenes de trabajo abiertas simultáneamente.
2. Los estados Pendiente y En progreso se considerarán abiertos.
3. El sistema mostrará una advertencia con la cantidad de órdenes abiertas, pero no bloqueará la creación de una nueva.

## Decisión

Se permitirá crear múltiples órdenes de trabajo para un mismo activo.

Antes de registrar una nueva orden, el sistema mostrará las órdenes existentes asociadas al activo y advertirá si existen otras pendientes o en progreso.

La advertencia será informativa y no impedirá registrar una nueva orden, ya que diferentes mantenimientos pueden requerir trabajos independientes o atención de varios responsables.

## Riesgos

1. La acumulación de órdenes abiertas podría dificultar el seguimiento. Se mostrará la cantidad de órdenes pendientes y en progreso.
2. Podrían registrarse solicitudes duplicadas. Se mostrarán las órdenes existentes del activo antes de crear una nueva.

# Escenario 4: Flujo de estados

## Preguntas adicionales

1. ¿Se puede finalizar directamente una orden pendiente o primero debe pasar a En progreso?
2. ¿Se puede reabrir una orden finalizada?
3. ¿Se debe registrar un historial de cambios de estado y las fechas de cada transición?

## Supuestos

1. Una orden seguirá el flujo Pendiente → En progreso → Finalizada.
2. Se permitirá reabrir una orden finalizada, regresándola a En progreso.
3. Se incluirá el estado Cancelada para diferenciar una orden cancelada de una finalizada.
4. Las fechas de creación, inicio y finalización se registrarán automáticamente.
5. Cada cambio de estado quedará registrado en un historial independiente.

## Decisión

Se implementará un flujo de estados con las siguientes transiciones permitidas:

- Pendiente → En progreso.
- Pendiente → Cancelada.
- En progreso → Finalizada.
- En progreso → Cancelada.
- Finalizada → En progreso (reapertura).

Las transiciones serán validadas en el backend para impedir cambios no permitidos.

Solamente los administradores y el personal autorizado de mantenimiento podrán cancelar órdenes de trabajo.

Se registrarán automáticamente las fechas de creación, inicio y finalización. Además, se implementará una tabla `HistorialEstado` relacionada con las órdenes de trabajo para conservar cada transición, su fecha y el usuario responsable del cambio.

Cuando una orden finalizada sea reabierta, se conservará el registro de su finalización anterior en la tabla `HistorialEstado`. Al finalizar nuevamente la orden, se registrará una nueva fecha de finalización, sin perder la trazabilidad de los eventos anteriores.

La reapertura de órdenes canceladas queda pendiente de definición funcional.

## Riesgos

1. Los usuarios podrían realizar cambios de estado no permitidos. El backend validará cada transición antes de actualizar la orden.
2. Reabrir una orden podría provocar pérdida de información histórica si se sobrescribe la fecha de finalización. Se conservará cada transición en una tabla de historial.

# Escenario 5: Priorización

## Preguntas adicionales

1. ¿Quién asigna la prioridad de una orden?
2. ¿Se puede modificar la prioridad después de crear la orden?
3. ¿Cómo se deben ordenar las órdenes cuando tienen la misma prioridad?

## Supuestos

1. El administrador será responsable de asignar la prioridad al crear una orden.
2. Solamente el administrador podrá modificar la prioridad.
3. Las órdenes se mostrarán primero por prioridad y después por antigüedad.

## Decisión

Se implementarán tres niveles de prioridad: Baja, Media y Alta.

El administrador asignará la prioridad durante la creación de la orden y podrá modificarla posteriormente.

Las órdenes se ordenarán de la siguiente manera:

1. Prioridad Alta.
2. Prioridad Media.
3. Prioridad Baja.

Cuando varias órdenes tengan la misma prioridad, se mostrará primero la más antigua, aplicando el criterio FIFO (First In, First Out).

## Riesgos

1. Una asignación incorrecta de prioridad podría afectar la atención de los mantenimientos. El administrador podrá modificarla.
2. Una orden urgente podría quedar retrasada por otras solicitudes. Se implementará ordenamiento por prioridad y antigüedad.

# Escenario 6: Responsables

## Preguntas adicionales

1. ¿Una orden puede tener uno o varios responsables?
2. ¿Quién tendrá permiso para asignar o modificar los responsables?
3. ¿Es obligatorio asignar responsables al momento de crear una orden?

## Supuestos

1. Una orden podrá tener varios responsables porque algunos mantenimientos pueden requerir la colaboración de diferentes personas.
2. Solamente el administrador podrá asignar o modificar los responsables.
3. Cada responsable tendrá una función específica dentro de la orden, como diagnóstico, reparación o pruebas.
4. Se permitirá crear órdenes sin responsables, pero será obligatorio asignar al menos uno antes de cambiar su estado a En progreso.
5. Los usuarios asignados deberán pertenecer al personal autorizado de mantenimiento.

## Decisión

Se implementará una relación muchos a muchos entre las entidades `OrdenTrabajo` y `Usuario`.

Se utilizará una tabla intermedia `OrdenResponsable`, que almacenará:

- Identificador de la orden.
- Identificador del usuario responsable.
- Función o responsabilidad asignada dentro del mantenimiento.

El administrador podrá asignar varios responsables a una misma orden y modificar sus asignaciones.

Una orden podrá permanecer pendiente sin responsables asignados, pero no podrá pasar a En progreso hasta contar con al menos uno.

El backend comprobará que los usuarios asignados tengan el rol autorizado para realizar trabajos de mantenimiento.

No se implementará un módulo independiente de gestión de cuadrillas en esta versión.

## Riesgos

1. Las órdenes sin responsables podrían quedar olvidadas. Se mostrarán las órdenes pendientes que todavía no tienen responsables.
2. Podrían asignarse usuarios que no estén autorizados para realizar mantenimientos. El backend validará el rol de cada usuario antes de permitir la asignación.

# Priorización

| Funcionalidad | Clasificación | Justificación |
|---|---|---|
| Registrar activos | Obligatoria | Es necesario registrar los activos tecnológicos que serán administrados por ORION. |
| Listar activos | Obligatoria | Permite consultar los activos registrados y conocer su información. |
| Editar activos | Obligatoria | Permite mantener actualizada la información de los activos. |
| Desactivar activos | Obligatoria | Permite retirar activos sin perder su historial ni sus órdenes asociadas. |
| Crear órdenes | Obligatoria | Es una función central para gestionar los mantenimientos. |
| Consultar órdenes | Obligatoria | Permite hacer seguimiento a las solicitudes registradas. |
| Cambiar estado | Obligatoria | Permite controlar el avance de los mantenimientos. |
| Autenticación | Obligatoria | Permite identificar usuarios y controlar sus permisos. |
| Dashboard | Importante | Facilita la supervisión mediante indicadores, pero no es indispensable para las operaciones principales. |
| Docker | Importante | Facilita la instalación y ejecución del proyecto en diferentes entornos. |
| Notificaciones | Importante | Permite informar oportunamente a los responsables sobre nuevas asignaciones y cambios importantes, evitando retrasos. |
| Aplicación móvil | Fuera del alcance | La prueba se enfocará en una aplicación web adaptable a diferentes dispositivos. |
| Gestión de cuadrillas | Fuera del alcance | Se permitirá asignar varios responsables directamente a una orden, sin desarrollar un módulo independiente de equipos. |
| Historial | Obligatoria | Permite conservar la trazabilidad de los cambios de estado y las reaperturas de órdenes. |
| Exportación Excel | Opcional | Facilita la generación de informes, pero no es necesaria para las operaciones principales. |
| Despliegue en nube | Fuera del alcance | La entrega se enfocará en una aplicación funcional que pueda ejecutarse localmente. |

**Resumen de clasificación:**

- Obligatoria: 9 funcionalidades.
- Importante: 3 funcionalidades.
- Opcional: 1 funcionalidad.
- Fuera del alcance: 3 funcionalidades.

# Diseño de la solución

## Tecnologías y motivo

Se utilizarán las siguientes tecnologías:

- React: desarrollo de la interfaz de usuario y componentes reutilizables.
- Node.js: ejecución del entorno del servidor.
- Express: construcción de la API REST y gestión de rutas HTTP.
- MySQL: almacenamiento relacional de activos, usuarios, órdenes e historiales.
- Sequelize: ORM para gestionar los modelos, relaciones y consultas a la base de datos.
- Jest: ejecución de pruebas automatizadas.
- Supertest: pruebas de integración de los endpoints HTTP.
- Docker: facilitar la configuración y ejecución del proyecto mediante contenedores.

Esta combinación permite separar el frontend del backend, mantener una estructura organizada y utilizar tecnologías adecuadas para desarrollar una aplicación web.

## Organización del código

Se utilizará una arquitectura por capas para separar las responsabilidades y facilitar el mantenimiento.

La estructura actual del backend es:

```text
backend/
└── src/
    ├── config/
    │   ├── config.js
    │   └── database.js
    ├── controllers/
    │   ├── activoController.js
    │   ├── authController.js
    │   └── ordenTrabajoController.js
    ├── database/
    │   └── migrations/
    ├── middlewares/
    │   ├── authMiddleware.js
    │   └── errorMiddleware.js
    ├── models/
    │   ├── Activo.js
    │   ├── HistorialEstado.js
    │   ├── OrdenResponsable.js
    │   ├── OrdenTrabajo.js
    │   ├── Usuario.js
    │   └── index.js
    ├── routes/
    │   ├── activoRoutes.js
    │   ├── authRoutes.js
    │   └── ordenTrabajoRoutes.js
    ├── scripts/
    │   └── crearAdministrador.js
    ├── services/
    │   ├── activoService.js
    │   ├── authService.js
    │   └── ordenTrabajoService.js
    ├── app.js
    └── server.js
```

Responsabilidades:

- Routes: definición de endpoints y métodos HTTP.
- Controllers: recepción de solicitudes y construcción de respuestas.
- Services: implementación de las reglas del negocio.
- Models: representación de tablas y relaciones de la base de datos.
- Middlewares: autenticación, autorización y manejo centralizado de errores.
- Config: configuración de la conexión a MySQL.

El frontend tendrá su propia estructura de componentes, páginas, servicios para consumir la API y mecanismos de manejo de sesión.

## Persistencia

Se utilizará MySQL con Sequelize como ORM.

La estructura de la base de datos se administrará mediante migraciones, permitiendo registrar y controlar los cambios realizados en tablas, campos, índices y relaciones.

Las entidades principales serán:

- Activo.
- Usuario.
- OrdenTrabajo.
- OrdenResponsable.
- HistorialEstado.

Se establecerán claves primarias, claves foráneas, restricciones de unicidad e índices según las necesidades del sistema.

La relación entre órdenes y responsables será muchos a muchos mediante una tabla intermedia que también almacenará la función de cada responsable.

Los activos utilizarán desactivación lógica para conservar la trazabilidad.

## Validaciones

Se implementarán validaciones tanto en React como en Express.

En el frontend se comprobarán los campos obligatorios, formatos y datos básicos para mejorar la experiencia del usuario.

En el backend se repetirán las validaciones para garantizar que ninguna solicitud inválida pueda almacenarse, incluso cuando se envíe directamente desde herramientas externas.

Se validarán especialmente:

- Campos obligatorios y formatos.
- Código de inventario único.
- Existencia del activo relacionado con una orden.
- Prohibición de crear órdenes para activos inactivos.
- Prioridades permitidas.
- Estados y transiciones permitidas.
- Existencia y autorización de los responsables asignados.
- Asignación de al menos un responsable antes de iniciar una orden.

La base de datos también tendrá restricciones para proteger la integridad de la información.

## Manejo de errores

Se implementará un middleware centralizado de errores en Express.

Los controladores y servicios enviarán los errores al middleware para mantener respuestas consistentes y evitar duplicar lógica.

Se utilizarán códigos HTTP adecuados:

- 200: operación exitosa.
- 201: recurso creado.
- 400: solicitud inválida.
- 401: usuario no autenticado.
- 403: usuario sin permisos.
- 404: recurso no encontrado.
- 409: conflicto, como un código de inventario duplicado.
- 500: error interno del servidor.

Las respuestas mostrarán mensajes claros para el usuario y los errores internos se registrarán sin exponer credenciales, contraseñas ni información sensible.

## Pruebas prioritarias

Se utilizarán Jest y Supertest para implementar pruebas unitarias, de integración y de autorización.

**Pruebas unitarias:**

- Validación del código de inventario.
- Validación de prioridades y estados.
- Validación de reglas de transición.

**Pruebas de integración:**

- Registro y consulta de activos.
- Creación y consulta de órdenes.
- Asignación de varios responsables.
- Actualización de estados e historial.
- Restricción de nuevas órdenes para activos inactivos.

**Pruebas de autorización:**

- Solamente administradores pueden desactivar y reactivar activos.
- Solamente administradores pueden modificar prioridades y responsables.
- Los usuarios sin permisos no pueden ejecutar operaciones administrativas.
- Las rutas privadas deben exigir autenticación.

## Riesgos de seguridad identificados

1. Acceso no autorizado: se implementará autenticación y autorización basada en roles (RBAC).
2. Exposición de contraseñas: se almacenarán mediante hash seguro con bcrypt, nunca en texto plano.
3. Acceso a rutas privadas: se protegerán los endpoints mediante middleware de autenticación.
4. Escalada de privilegios: el backend verificará los permisos en cada operación protegida.
5. Inyección SQL: se utilizarán consultas parametrizadas y las herramientas de Sequelize, evitando construir consultas inseguras con datos del usuario.
6. Exposición de credenciales: las variables de entorno almacenarán secretos y datos de conexión fuera del código fuente.
7. Acceso a información sensible: se aplicará el principio de mínimo privilegio y se limitarán los datos devueltos por la API.
8. Cambios no autorizados: las operaciones administrativas y las transiciones de estado tendrán validaciones en el backend.

# Plan de trabajo

| Paso | Actividad | Resultado esperado |
|---:|---|---|
| 1 | Configurar el proyecto, dependencias y estructura inicial. | Proyecto preparado para el desarrollo. |
| 2 | Diseñar la base de datos y crear las migraciones. | Tablas, relaciones y restricciones implementadas. |
| 3 | Implementar autenticación y autorización. | Acceso seguro y permisos por roles. |
| 4 | Desarrollar el CRUD de activos. | Registro, consulta, edición y desactivación de activos. |
| 5 | Desarrollar las órdenes de trabajo y asignación de responsables. | Creación, consulta y asignación de órdenes. |
| 6 | Implementar el flujo de estados y el historial. | Seguimiento de mantenimientos y trazabilidad. |
| 7 | Desarrollar el frontend y conectarlo con la API. | Aplicación web funcional. |
| 8 | Ejecutar pruebas, corregir errores y documentar el proyecto. | Solución verificada y preparada para la entrega. |

# Resultado final

**Esta sección se completará después de implementar y probar el proyecto. No se deben registrar resultados que todavía no se hayan verificado.**

## Funcionalidades completadas

- Autenticación mediante correo electrónico y contraseña utilizando JWT.
- Protección de rutas y control de permisos mediante roles.
- Administración de usuarios mediante endpoints protegidos del backend.
- Registro, consulta, edición, desactivación y reactivación de activos.
- Generación automática de códigos de inventario únicos.
- Creación, consulta y actualización de órdenes de trabajo.
- Asociación de órdenes con activos.
- Asignación de varios responsables a una orden.
- Gestión de prioridades Alta, Media y Baja.
- Validación de las transiciones permitidas entre estados.
- Registro del historial de cambios de estado.
- Registro automático de las fechas de inicio y finalización.
- Advertencias sobre otras órdenes abiertas del mismo activo.
- Interfaz web desarrollada con React.
- Persistencia mediante MySQL y Sequelize.
- Pruebas automatizadas del backend.

## Funcionalidades pendientes

- Implementación de Docker y Docker Compose.
- Sistema de notificaciones.
- Documentación interactiva de la API mediante Swagger/OpenAPI.
- Despliegue público de la aplicación.
- Interfaz gráfica para la administración de usuarios.
- Funcionalidades adicionales de búsqueda, filtros y paginación.
- Integración del dashboard con indicadores y datos reales.

## Principal dificultad encontrada

Una de las principales dificultades fue implementar correctamente las reglas de negocio de las órdenes de trabajo, especialmente las transiciones entre estados, la asignación de responsables y el registro del historial.

También fue necesario mantener la coherencia entre el backend, el frontend y la base de datos.

## ¿Cómo resolviste los problemas encontrados?

Se trabajó por etapas, separando las responsabilidades del sistema mediante rutas, controladores y servicios.

Se implementaron validaciones en el backend para proteger las reglas de negocio y se utilizaron migraciones para mantener organizada la estructura de la base de datos.

Además, se desarrollaron pruebas automatizadas con Jest y Supertest para verificar el comportamiento de los endpoints y corregir errores durante el desarrollo.

## ¿Qué mejorarías con más tiempo?

- Incorporaría Docker y Docker Compose para facilitar la instalación.
- Agregaría filtros y paginación a los listados.
- Implementaría notificaciones para informar sobre asignaciones y cambios de estado.
- Desarrollaría una interfaz gráfica para administrar usuarios.
- Ampliaría las pruebas automatizadas.
- Incorporaría documentación de la API mediante Swagger.
- Configuraría un proceso de integración y despliegue continuo.
- Conectar los indicadores del dashboard con la información almacenada en la base de datos.

## Tiempo aproximado dedicado

El tiempo aproximado dedicado fue de 2 días, trabajando entre 7 y 11 horas por día.

## ¿Utilizaste herramientas de inteligencia artificial? ¿Para qué?

Sí. Se utilizó como apoyo durante el análisis de requerimientos, la comprensión de conceptos, la identificación y corrección de errores y la mejora de la documentación.

Las herramientas se utilizaron como apoyo al aprendizaje y al desarrollo. Las soluciones propuestas se revisaron y probaron antes de incorporarlas al proyecto.

## ¿Qué parte del código consideras más importante explicar?

Considero especialmente importante explicar el servicio de órdenes de trabajo, porque concentra varias reglas de negocio fundamentales del sistema.

En esta parte se controlan las transiciones de estado, la asignación de responsables, las prioridades, las fechas automáticas y el historial de cambios.

También es importante explicar la relación entre activos y órdenes, así como los mecanismos de autenticación y autorización que protegen las operaciones.

# Conocimientos sobre Microsoft 365 y Copilot

## 1. Microsoft 365 y Copilot

### ¿Qué es Microsoft 365 y qué recursos interoperan con Copilot?

Microsoft 365 es una plataforma de productividad que reúne aplicaciones y servicios para crear documentos, analizar información, comunicarse y colaborar en equipo.

Entre sus principales herramientas se encuentran:

- Word: creación y edición de documentos.
- Excel: organización y análisis de datos.
- PowerPoint: creación de presentaciones.
- Outlook: gestión de correos y calendarios.
- Teams: comunicación y colaboración.
- OneDrive: almacenamiento de archivos en la nube.
- SharePoint: gestión documental y colaboración empresarial.
- OneNote: organización de notas e información.

Microsoft 365 Copilot se integra con estas herramientas y utiliza inteligencia artificial para ayudar a los usuarios a redactar, resumir, analizar información y realizar tareas.

Microsoft Graph permite acceder al contexto de la información de Microsoft 365, respetando los permisos de cada usuario. Esto permite que Copilot utilice información de documentos, correos, reuniones y otros recursos a los que el usuario tenga autorización.

## 2. Copilot Studio

### ¿Qué es Copilot Studio y qué ofrece?

Microsoft Copilot Studio es una plataforma gráfica de bajo código (low-code) que permite crear, configurar, probar y administrar agentes de inteligencia artificial y flujos de trabajo.

Ofrece funcionalidades como:

- Crear agentes que respondan preguntas y ayuden a realizar tareas.
- Conectar agentes con información empresarial.
- Integrar fuentes de datos mediante conectores.
- Automatizar procesos mediante flujos de trabajo.
- Incorporar acciones y servicios externos.
- Publicar agentes en diferentes canales, como Microsoft Teams y sitios web.
- Probar y supervisar el comportamiento de los agentes.

Su principal ventaja es que permite crear soluciones basadas en inteligencia artificial sin tener que desarrollar toda la infraestructura desde cero, aunque también ofrece posibilidades de personalización para desarrolladores.

## 3. Aplicaciones basadas en agentes

### ¿Qué mejores prácticas consideras para implementar, comprobar y evaluar aplicaciones con agentes?

Considero importantes las siguientes prácticas:

1. Definir claramente el objetivo del agente y las tareas que puede realizar.
2. Utilizar fuentes de información confiables, actualizadas y bien organizadas.
3. Configurar correctamente los permisos para evitar que el agente acceda a información no autorizada.
4. Probar diferentes escenarios, incluyendo preguntas incorrectas, ambiguas o fuera del alcance.
5. Implementar pruebas automatizadas y pruebas de regresión para comprobar que los cambios no afecten funcionalidades anteriores.
6. Evaluar la precisión, relevancia y utilidad de las respuestas.
7. Mantener supervisión humana para acciones importantes o sensibles.
8. Registrar errores y recopilar comentarios de los usuarios para mejorar el agente.
9. Monitorear el rendimiento, la seguridad y el comportamiento después de su publicación.
10. Realizar mejoras continuas a partir de los resultados de las evaluaciones.

Un agente no debe considerarse confiable solamente porque responde correctamente algunas preguntas. Debe probarse con diferentes situaciones y comprobar que respete las instrucciones, los permisos y las reglas del negocio.

## 4. Caso práctico: aplicación de inventario

### Describa un caso de uso e implementación para una aplicación de inventario con información en varios archivos bajo el ambiente Microsoft 365 y Copilot.

Se propone desarrollar una aplicación de inventario empresarial que permita consultar y analizar información almacenada en diferentes archivos de Microsoft 365 mediante un agente creado con Copilot Studio.

**Organización de la información**

Los archivos podrían almacenarse en SharePoint y OneDrive, organizados de la siguiente manera:

- Inventario general.xlsx: contiene códigos, nombres, cantidades, ubicaciones y estados de los activos.
- Proveedores.xlsx: contiene información de proveedores, contactos y productos.
- Historial de mantenimiento.xlsx: registra las fechas y actividades de mantenimiento.
- Facturas y compras.pdf: contiene documentos relacionados con las adquisiciones.
- Procedimientos.docx: contiene instrucciones y políticas para la gestión del inventario.

**Implementación**

1. Organizar los documentos en SharePoint o OneDrive, utilizando nombres, columnas y formatos consistentes.
2. Configurar los permisos de acceso para que cada usuario consulte únicamente la información autorizada.
3. Crear un agente en Copilot Studio que utilice las fuentes de conocimiento y conectores correspondientes para consultar los documentos.
4. Configurar instrucciones para que el agente identifique la información relevante y responda con datos verificables.
5. Cuando se requieran acciones, como registrar una entrada o actualizar existencias, integrar flujos de Power Automate o servicios conectados que ejecuten las operaciones con validaciones y permisos.
6. Incorporar confirmación humana antes de realizar cambios importantes en el inventario.
7. Probar el agente con diferentes preguntas y escenarios para comprobar la exactitud de las respuestas y el cumplimiento de los permisos.

**Ejemplos de consultas**

- ¿Cuántos computadores tenemos registrados?
- ¿Qué activos se encuentran en una ubicación determinada?
- ¿Qué productos tienen existencias por debajo del mínimo?
- ¿Cuándo fue el último mantenimiento de un equipo?
- ¿Qué proveedor suministró un activo específico?
- ¿Qué activos necesitan mantenimiento próximamente?

**Beneficios**

Esta solución permitiría consultar información que actualmente se encuentra distribuida en diferentes archivos, reduciendo el tiempo de búsqueda y facilitando la toma de decisiones.

También ayudaría a centralizar el acceso a la información, mejorar la productividad y automatizar algunas tareas administrativas.

Es importante que el agente respete los permisos de SharePoint y OneDrive, que las fuentes se mantengan actualizadas y que las operaciones que modifiquen el inventario se validen antes de ejecutarse.