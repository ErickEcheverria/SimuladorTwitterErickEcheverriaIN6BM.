'use strict'

var mongoose = require("mongoose")
var Schema = mongoose.Schema;

var UserSchema = Schema({
    usuario: {type: String, require: true},
    password: {type: String, require: true},
    rol: String,
    seguidos: {
        usuarioSeguido: {type: Schema.ObjectId, ref:'user'},
    },
    retweets:{
        idTweetOriginal: {type: Schema.ObjectId, ref:'publicacion'},
        comentario: String,
    },
    contadores:{
        cantidadLikes: Number,
        cantidadRespuestas: Number,
        cantidadRetweets: Number,
    }
})

module.exports = mongoose.model('user', UserSchema)