'use strict'
var jwt = require("jwt-simple")
var moment = require("moment")
var secret = 'clave_secreta_IN6BM'

exports.ensureAuth =  (req, res, next)=>{
    var espacio = req.body.commands;
    espacio = espacio.toUpperCase();
    var dato = espacio.split(' ');
    espacio = dato[0] != null && dato.length > 0 ? dato[0] : "";

        if(espacio != "REGISTER" && espacio != "LOGIN"){
            if(!req.headers.authorization){
                return res.status(403).send({message : "Necesitas loguearte para realizar esta accion u opcion no valida"})
            }
            var token = req.headers.authorization.replace(/['"]+/g, "")
            try{
                var payload = jwt.decode(token, secret)
                if(payload.exp <= moment().unix()){
                return res.status(401).send({
                message: 'El Token ha expirado'
                })
            }
        }catch (ex) {
            return res.status(404).send({
                message: 'El token no es valido'
            })
        }
    }

    req.user = payload;
    next();
}