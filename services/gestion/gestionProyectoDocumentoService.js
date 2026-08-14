import {
    GestionProyectoDocumento,
    GestionProyectoMiembro,
    GestionProyecto
} from "../../models/index.js";

const vincularDocumento = async (
    user,
    proyecto_id,
    documento_id
) => {

    const proyecto =
        await GestionProyecto.findByPk(
            proyecto_id
        );

    if (!proyecto) {
        throw new Error(
            "Proyecto no encontrado"
        );
    }

    if (
        Number(user.rol_id) !== 1
    ) {

        const esCreador =
            proyecto.creado_por_id === user.id;

        const esResponsable =
            proyecto.responsable_id === user.id;

        const esSupervisorPrincipal =
            proyecto.supervisor_id === user.id;

        const supervisorMiembro =
            await GestionProyectoMiembro.findOne({
                where: {
                    proyecto_id,
                    usuario_id: user.id,
                    rol: "SUPERVISOR",
                    activo: true,
                },
            });

        if (
            !esCreador &&
            !esResponsable &&
            !esSupervisorPrincipal &&
            !supervisorMiembro
        ) {
            throw new Error(
                "No tiene permisos sobre este proyecto"
            );
        }

    }

    return GestionProyectoDocumento.create({
        proyecto_id,
        documento_id,
        usuario_id: user.id,
    });

};

export default {
    vincularDocumento,
};