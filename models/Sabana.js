module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Sabana', {

		saba_id: {
			type: DataTypes.INTEGER(11),
			allowNull: false,
			primaryKey: true,
			autoIncrement: true,
			field: 'saba_id'
		},
		saba_credito: {
			type: DataTypes.STRING(20),
			allowNull: true,
			field: 'saba_credito'
		},
		saba_id_cuota: {
			type: DataTypes.STRING(20),
			allowNull: true,
			field: 'saba_id_cuota'
		},
		saba_empresa: {
			type: DataTypes.STRING(200),
			allowNull: true,
			field: 'saba_empresa'
		},
		saba_fecha_solicitud: {
			type: DataTypes.DATE,
			allowNull: true,
			field: 'saba_fecha_solicitud'
		},
		saba_anio_solicitud: {
			type: DataTypes.STRING(4),
			allowNull: true,
			field: 'saba_anio_solicitud'
		},
		saba_fecha_desembolso: {
			type: DataTypes.DATE,
			allowNull: true,
			field: 'saba_fecha_desembolso'
		},
		saba_anio_desembolso: {
			type: DataTypes.STRING(4),
			allowNull: true,
			field: 'saba_anio_desembolso'
		},
		saba_mes_desembolso: {
			type: DataTypes.STRING(2),
			allowNull: true,
			field: 'saba_mes_desembolso'
		},
		saba_fecha_pago_sistema: {
			type: DataTypes.DATE,
			allowNull: true,
			field: 'saba_fecha_pago_sistema'
		},
		saba_fecha_pago: {
			type: DataTypes.DATE,
			allowNull: true,
			field: 'saba_fecha_pago'
		},
		saba_fecha_pagocuota: {
			type: DataTypes.DATE,
			allowNull: true,
			field: 'saba_fecha_pagocuota'
		},
		saba_mes_recaudar: {
			type: DataTypes.STRING(2),
			allowNull: true,
			field: 'saba_mes_recaudar'
		},
		saba_anio: {
			type: DataTypes.STRING(4),
			allowNull: true,
			field: 'saba_anio'
		},
		saba_fecha_pago_usuario: {
			type: DataTypes.DATE,
			allowNull: true,
			field: 'saba_fecha_pago_usuario'
		},
		saba_mes_pago: {
			type: DataTypes.STRING(2),
			allowNull: true,
			field: 'saba_mes_pago'
		},
		saba_anio_pago: {
			type: DataTypes.STRING(4),
			allowNull: true,
			field: 'saba_anio_pago'
		},
		saba_dias_cartera: {
			type: DataTypes.STRING(10),
			allowNull: true,
			field: 'saba_dias_cartera'
		},
		saba_full_name: {
			type: DataTypes.STRING(100),
			allowNull: true,
			field: 'saba_full_name'
		},
		saba_numero_cedula: {
			type: DataTypes.STRING(12),
			allowNull: true,
			field: 'saba_numero_cedula'
		},
		saba_monto: {
			type: DataTypes.STRING(10),
			allowNull: true,
			field: 'saba_monto'
		},
		saba_iva: {
			type: DataTypes.STRING(10),
			allowNull: true,
			field: 'saba_iva'
		},
		saba_seguro: {
			type: DataTypes.STRING(2),
			allowNull: true,
			field: 'saba_seguro'
		},
		saba_interes: {
			type: DataTypes.STRING(10),
			allowNull: true,
			field: 'saba_interes'
		},
		saba_tecnologia: {
			type: DataTypes.STRING(10),
			allowNull: true,
			field: 'saba_tecnologia'
		},
		saba_administracion: {
			type: DataTypes.STRING(10),
			allowNull: true,
			field: 'saba_administracion'
		},
		saba_pago_total: {
			type: DataTypes.STRING(10),
			allowNull: true,
			field: 'saba_pago_total'
		},
		saba_pago_actual: {
			type: DataTypes.STRING(10),
			allowNull: true,
			field: 'saba_pago_actual'
		},
		saba_estado_credito: {
			type: DataTypes.STRING(20),
			allowNull: true,
			field: 'saba_estado_credito'
		},
		saba_sub_estado: {
			type: DataTypes.STRING(20),
			allowNull: true,
			field: 'saba_sub_estado'
		},
		saba_valor_cuota: {
			type: DataTypes.STRING(10),
			allowNull: true,
			field: 'saba_valor_cuota'
		},
		saba_desembolso: {
			type: DataTypes.STRING(10),
			allowNull: true,
			field: 'saba_desembolso'
		},
		saba_n_cuotas: {
			type: DataTypes.STRING(2),
			allowNull: true,
			field: 'saba_n_cuotas'
		},
		saba_dif: {
			type: DataTypes.STRING(10),
			allowNull: true,
			field: 'saba_dif'
		},
		saba_capital: {
			type: DataTypes.STRING(15),
			allowNull: true,
			field: 'saba_capital'
		},
		saba_intereses: {
			type: DataTypes.STRING(10),
			allowNull: true,
			field: 'saba_intereses'
		},
		saba_administracion_2: {
			type: DataTypes.STRING(10),
			allowNull: true,
			field: 'saba_administracion_2'
		},
		saba_iva_2: {
			type: DataTypes.STRING(10),
			allowNull: true,
			field: 'saba_iva_2'
		},
		saba_pago_real: {
			type: DataTypes.STRING(10),
			allowNull: true,
			field: 'saba_pago_real'
		},
		saba_capital_2: {
			type: DataTypes.STRING(10),
			allowNull: true,
			field: 'saba_capital_2'
		},
		saba_intereses_2: {
			type: DataTypes.STRING(10),
			allowNull: true,
			field: 'saba_intereses_2'
		},
		saba_administracion_3: {
			type: DataTypes.STRING(10),
			allowNull: true,
			field: 'saba_administracion_3'
		},
		saba_iva3: {
			type: DataTypes.STRING(10),
			allowNull: true,
			field: 'saba_iva3'
		},
		saba_diferencia: {
			type: DataTypes.STRING(10),
			allowNull: true,
			field: 'saba_diferencia'
		},
		saba_cartera: {
			type: DataTypes.STRING(10),
			allowNull: true,
			field: 'saba_cartera'
		},
		saba_responsable: {
			type: DataTypes.STRING(50),
			allowNull: true,
			field: 'saba_responsable'
		},
		saba_motivo: {
			type: DataTypes.STRING(80),
			allowNull: true,
			field: 'saba_motivo'
		}
	}, {
		sequelize,
		modelName: 'Sabana',
		freezeTableName: true,
		timestamps: false
	}, {
	tableName: 'Sabana'
});

};
