
const {
    OrdenTrabajo,
    OrdenResponsable,
    HistorialEstado,
    Activo,
    Usuario
} = require('../models');

const sequelize = require('../config/database');
const { Op } = require('sequelize');

// Crear una orden de trabajo
const crearOrdenTrabajo = async (datos, usuario) => {
    validarDatosOrden(datos);

    const {
        activoId,
        titulo,
        descripcion,
        prioridad,
        responsables
    } = datos;

    // Solo el administrador puede establecer la prioridad
    if (prioridad && usuario.rol !== 'administrador') {
        const error = new Error('Solo el administrador puede establecer la prioridad.');
        error.statusCode = 403;
        throw error;
    }

    // Solo el administrador puede asignar responsables
    if (responsables !== undefined && usuario.rol !== 'administrador') {
        const error = new Error('Solo el administrador puede asignar responsables.');
        error.statusCode = 403;
        throw error;
    }

    const resultado = await sequelize.transaction(async (transaction) => {
        const activo = await Activo.findByPk(activoId, { transaction });

        if (!activo) {
            const error = new Error('El activo que intentas seleccionar no existe.');
            error.statusCode = 404;
            throw error;
        }

        if (!activo.estado) {
            const error = new Error('No se pueden crear órdenes para un activo inactivo.');
            error.statusCode = 409;
            throw error;
        }

        // Contar órdenes que todavía están pendientes o en proceso
        const ordenesAbiertas = await OrdenTrabajo.count({
            where: {
                activoId,
                estado: {
                    [Op.in]: ['pendiente', 'en_proceso']
                }
            },
            transaction
        });

                                const orden = await OrdenTrabajo.create({
            activoId,
            titulo: titulo.trim(),
            descripcion: descripcion.trim(),
            prioridad: usuario.rol === 'administrador' && prioridad
                ? prioridad
                : 'media',
            estado: 'pendiente',
            fechaInicio: null,
            fechaFinalizacion: null
        }, { transaction });
        // Si se enviaron responsables, validar y guardar las asignaciones
        if (responsables !== undefined) {
            await validarResponsables(responsables, transaction);

            for (const responsable of responsables) {
                await OrdenResponsable.create({
                    ordenTrabajoId: orden.id,
                    usuarioId: responsable.usuarioId,
                    funcion: responsable.funcion.trim()
                }, { transaction });
            }
        }

        // Registrar el estado inicial en el historial
        await HistorialEstado.create({
            ordenTrabajoId: orden.id,
            estadoAnterior: null,
            estadoNuevo: 'pendiente',
            usuarioId: usuario.id,
            fechaCambio: new Date()
        }, { transaction });

        return {
            id: orden.id,
            ordenesAbiertas
        };
    });

    const ordenCompleta = await obtenerOrdenPorId(resultado.id);

    return {
        orden: ordenCompleta,
        ordenesAbiertas: resultado.ordenesAbiertas,
        advertencia: resultado.ordenesAbiertas > 0
    };
};

// Listar todas las órdenes de trabajo
const listarOrdenesTrabajo = async () => {
    return await OrdenTrabajo.findAll({
        include: [
            {
                model: Activo,
                as: 'activo'
            },
            {
                model: OrdenResponsable,
                as: 'responsables',
                include: [
                    {
                        model: Usuario,
                        as: 'usuario',
                        attributes: [
                            'id',
                            'nombres',
                            'apellidos',
                            'email',
                            'rol'
                        ]
                    }
                ]
            }
        ],
        order: [
            [
                sequelize.literal(`
                    CASE
                        WHEN prioridad = 'alta' THEN 1
                        WHEN prioridad = 'media' THEN 2
                        WHEN prioridad = 'baja' THEN 3
                    END
                `),
                'ASC'
            ],
            ['createdAt', 'ASC']
        ]
    });
};

// Obtener una orden por su ID
const obtenerOrdenPorId = async (id) => {
    await buscarOrden(id);

    return await OrdenTrabajo.findByPk(id, {
        include: [
            {
                model: Activo,
                as: 'activo'
            },
            {
                model: OrdenResponsable,
                as: 'responsables',
                include: [
                    {
                        model: Usuario,
                        as: 'usuario',
                        attributes: [
                            'id',
                            'nombres',
                            'apellidos',
                            'email',
                            'rol'
                        ]
                    }
                ]
            },
            {
                model: HistorialEstado,
                as: 'historial',
                include: [
                    {
                        model: Usuario,
                        as: 'usuario',
                        attributes: [
                            'id',
                            'nombres',
                            'apellidos',
                            'email'
                        ]
                    }
                ]
            }
        ],
        // Mostrar primero los cambios de estado más antiguos
        order: [
            [
                { model: HistorialEstado, as: 'historial' },
                'fechaCambio',
                'ASC'
            ]
        ]
    });
};

// Actualizar una orden de trabajo
const actualizarOrdenTrabajo = async (id, datos, usuario) => {
    // Validar que los datos sean un objeto
    if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
        const error = new Error('Los datos enviados no son válidos.');
        error.statusCode = 400;
        throw error;
    }

    const orden = await buscarOrden(id);

    // No permitir editar órdenes cerradas
    if (['finalizada', 'cancelada'].includes(orden.estado)) {
        const error = new Error('No se pueden modificar órdenes finalizadas o canceladas.');
        error.statusCode = 409;
        throw error;
    }

    // El personal de mantenimiento solo puede modificar órdenes asignadas
    if (usuario.rol === 'mantenimiento') {
        await validarResponsableOrden(orden.id, usuario.id);
    }

    const camposPermitidos = ['titulo', 'descripcion', 'prioridad'];

    const camposRecibidos = Object.keys(datos);

    if (camposRecibidos.length === 0) {
        const error = new Error('Debes enviar al menos un campo para actualizar.');
        error.statusCode = 400;
        throw error;
    }

    const camposNoPermitidos = camposRecibidos.filter(
        campo => !camposPermitidos.includes(campo)
    );

    if (camposNoPermitidos.length > 0) {
        const error = new Error('Uno o más campos enviados no están permitidos.');
        error.statusCode = 400;
        throw error;
    }

    const cambios = {};

    if (datos.titulo !== undefined) {
        if (
            typeof datos.titulo !== 'string' ||
            !datos.titulo.trim() ||
            datos.titulo.trim().length > 150
        ) {
            const error = new Error('El título es obligatorio y no puede superar los 150 caracteres.');
            error.statusCode = 400;
            throw error;
        }

        cambios.titulo = datos.titulo.trim();
    }

    if (datos.descripcion !== undefined) {
        if (
            typeof datos.descripcion !== 'string' ||
            !datos.descripcion.trim()
        ) {
            const error = new Error('La descripción es obligatoria.');
            error.statusCode = 400;
            throw error;
        }

        cambios.descripcion = datos.descripcion.trim();
    }

    if (datos.prioridad !== undefined) {
        if (usuario.rol !== 'administrador') {
            const error = new Error('Solo el administrador puede modificar la prioridad.');
            error.statusCode = 403;
            throw error;
        }

        validarPrioridad(datos.prioridad);
        cambios.prioridad = datos.prioridad;
    }

    await orden.update(cambios);

    return await obtenerOrdenPorId(orden.id);
};

// Reemplazar los responsables de una orden
const asignarResponsables = async (id, responsables) => {
    const orden = await buscarOrden(id);

    if (['finalizada', 'cancelada'].includes(orden.estado)) {
        const error = new Error('No se pueden modificar los responsables de una orden finalizada o cancelada.');
        error.statusCode = 409;
        throw error;
    }

    await sequelize.transaction(async (transaction) => {
        await validarResponsables(responsables, transaction);

        // Eliminar las asignaciones anteriores
        await OrdenResponsable.destroy({
            where: { ordenTrabajoId: orden.id },
            transaction
        });

        // Guardar las nuevas asignaciones
        for (const responsable of responsables) {
            await OrdenResponsable.create({
                ordenTrabajoId: orden.id,
                usuarioId: responsable.usuarioId,
                funcion: responsable.funcion.trim()
            }, { transaction });
        }
    });

    return await obtenerOrdenPorId(orden.id);
};


// Cambiar el estado de una orden
const cambiarEstadoOrden = async (id, estadoNuevo, usuario) => {
    const estadosValidos = [
        'pendiente',
        'en_proceso',
        'finalizada',
        'cancelada'
    ];

    if (!estadosValidos.includes(estadoNuevo)) {
        const error = new Error('El estado enviado no es válido.');
        error.statusCode = 400;
        throw error;
    }

    const orden = await buscarOrden(id);

    const transiciones = {
        pendiente: ['en_proceso', 'cancelada'],
        en_proceso: ['finalizada', 'cancelada'],
        finalizada: ['en_proceso'],
        cancelada: []
    };

    if (!transiciones[orden.estado].includes(estadoNuevo)) {
        const error = new Error(
            `No se puede cambiar una orden de ${orden.estado} a ${estadoNuevo}.`
        );
        error.statusCode = 409;
        throw error;
    }

    if (usuario.rol === 'mantenimiento') {
        await validarResponsableOrden(orden.id, usuario.id);
    }

    if (estadoNuevo === 'en_proceso') {
        const responsablesActivos = await OrdenResponsable.count({
            where: {
                ordenTrabajoId: orden.id
            },
            include: [
                {
                    model: Usuario,
                    as: 'usuario',
                    where: {
                        estado: true,
                        rol: 'mantenimiento'
                    }
                }
            ]
        });

        if (responsablesActivos === 0) {
            const error = new Error(
                'Debes asignar al menos un responsable activo de mantenimiento antes de iniciar la orden.'
            );
            error.statusCode = 409;
            throw error;
        }
    }

    const estadoAnterior = orden.estado;
    const fechaCambio = new Date();

    const datosActualizacion = {
        estado: estadoNuevo
    };

    if (estadoNuevo === 'en_proceso') {
        if (!orden.fechaInicio) {
            datosActualizacion.fechaInicio = fechaCambio;
        }

        datosActualizacion.fechaFinalizacion = null;
    }

    if (estadoNuevo === 'finalizada') {
        datosActualizacion.fechaFinalizacion = fechaCambio;
    }

    await sequelize.transaction(async (transaction) => {
        await orden.update(datosActualizacion, { transaction });

        await HistorialEstado.create({
            ordenTrabajoId: orden.id,
            estadoAnterior,
            estadoNuevo,
            usuarioId: usuario.id,
            fechaCambio
        }, { transaction });
    });

    return await obtenerOrdenPorId(orden.id);
};


// Comprobar que el usuario esté asignado a la orden
const validarResponsableOrden = async (ordenTrabajoId, usuarioId) => {
    const asignacion = await OrdenResponsable.findOne({
        where: {
            ordenTrabajoId,
            usuarioId
        }
    });

    if (!asignacion) {
        const error = new Error(
            'No tienes permiso para modificar esta orden porque no estás asignado como responsable.'
        );
        error.statusCode = 403;
        throw error;
    }
};

// Validar los datos generales de una orden
const validarDatosOrden = (datos) => {
    if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
        const error = new Error('Los datos de la orden no son válidos.');
        error.statusCode = 400;
        throw error;
    }

    if (
        !datos.activoId ||
        !Number.isInteger(Number(datos.activoId)) ||
        Number(datos.activoId) <= 0
    ) {
        const error = new Error('Debes seleccionar un activo válido.');
        error.statusCode = 400;
        throw error;
    }

    if (
        typeof datos.titulo !== 'string' ||
        !datos.titulo.trim() ||
        datos.titulo.trim().length > 150
    ) {
        const error = new Error('El título es obligatorio y no puede superar los 150 caracteres.');
        error.statusCode = 400;
        throw error;
    }

    if (
        typeof datos.descripcion !== 'string' ||
        !datos.descripcion.trim()
    ) {
        const error = new Error('La descripción es obligatoria.');
        error.statusCode = 400;
        throw error;
    }

    if (datos.prioridad !== undefined) {
        validarPrioridad(datos.prioridad);
    }
};

// Validar la prioridad
const validarPrioridad = (prioridad) => {
    const prioridadesValidas = ['baja', 'media', 'alta'];

    if (!prioridadesValidas.includes(prioridad)) {
        const error = new Error('La prioridad debe ser baja, media o alta.');
        error.statusCode = 400;
        throw error;
    }
};

// Validar los responsables enviados
const validarResponsables = async (responsables, transaction) => {
    if (!Array.isArray(responsables)) {
        const error = new Error('Los responsables deben enviarse en una lista.');
        error.statusCode = 400;
        throw error;
    }

    const usuariosIds = [];

    for (const responsable of responsables) {
        if (
            !responsable ||
            !Number.isInteger(Number(responsable.usuarioId)) ||
            Number(responsable.usuarioId) <= 0
        ) {
            const error = new Error('Cada responsable debe tener un usuarioId válido.');
            error.statusCode = 400;
            throw error;
        }

        if (
            typeof responsable.funcion !== 'string' ||
            !responsable.funcion.trim() ||
            responsable.funcion.trim().length > 100
        ) {
            const error = new Error('La función de cada responsable es obligatoria y no puede superar los 100 caracteres.');
            error.statusCode = 400;
            throw error;
        }

        const usuarioId = Number(responsable.usuarioId);

        if (usuariosIds.includes(usuarioId)) {
            const error = new Error('No puedes asignar el mismo usuario más de una vez.');
            error.statusCode = 400;
            throw error;
        }

        usuariosIds.push(usuarioId);
    }

    // Comprobar que todos sean usuarios activos de mantenimiento
    if (usuariosIds.length > 0) {
        const usuariosValidos = await Usuario.findAll({
            where: {
                id: {
                    [Op.in]: usuariosIds
                },
                estado: true,
                rol: 'mantenimiento'
            },
            transaction
        });

        if (usuariosValidos.length !== usuariosIds.length) {
            const error = new Error(
                'Solo puedes asignar usuarios activos con el rol de mantenimiento.'
            );
            error.statusCode = 400;
            throw error;
        }
    }
};

// Buscar una orden y comprobar que exista
const buscarOrden = async (id) => {
    if (!id || !/^\d+$/.test(String(id)) || Number(id) <= 0) {
        const error = new Error('El ID de la orden no es válido.');
        error.statusCode = 400;
        throw error;
    }

    const orden = await OrdenTrabajo.findByPk(id);

    if (!orden) {
        const error = new Error('La orden de trabajo no existe.');
        error.statusCode = 404;
        throw error;
    }

    return orden;
};


module.exports = {
    crearOrdenTrabajo,
    listarOrdenesTrabajo,
    obtenerOrdenPorId,
    actualizarOrdenTrabajo,
    asignarResponsables,
    cambiarEstadoOrden
};
