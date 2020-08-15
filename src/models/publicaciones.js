'use strict'

var mongoose = require("mongoose")
var Schema = mongoose.Schema;

var PublicacionesSchema = Schema({
    usuario: { type: Schema.ObjectId, ref: 'user',require:true},
    contenido: {type: String, require: true},
    fecha: Date,
    usuarioslike:{
        usuariolike:{ type: Schema.ObjectId, ref:'user',require:true}},
    respuestas:[{
        usuarioId: {type: Schema.ObjectId, ref:'user',require:true},
        usuario: {type:String},
        contenidoR: {type:String}
    }]
})

module.exports = mongoose.model('publicacion', PublicacionesSchema)