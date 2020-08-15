'use strict'

// IMPORTS
const User = require("../models/usuarios");
var Publicacion = require('../models/publicaciones');
var bcrypt = require("bcrypt-nodejs");
var jwt = require("../services/jwt");
var path = require("path");
var fs = require("fs");
const { TIMEOUT } = require("dns");


async function command(req, res, commands){
    try {
        var user = new User();
        var publicacion = new Publicacion();
        var espacio = req.body.commands;
        espacio = espacio.toUpperCase();
        var dato = espacio.split(' ');
        var commands = (dato[0] != null && dato.length > 0 ? dato[0] : "");
        switch (commands) {
            case"LIKE_TWEET":
            if(dato[1]){
                var TweetSeleccionado = dato[1];
                var usuario = req.user.sub;

                Publicacion.findOne({"usuarioslike.usuariolike": usuario},(error, encontrado)=>{
                    if(error) return res.status(200).send({message: error});
                    if(encontrado){
                        Publicacion.findByIdAndUpdate(TweetSeleccionado,{$pull : { usuarioslike:{usuariolike: usuario}}},(error,likeEliminado)=>{
                            if (error) return res.status(404).send({ message: "Error en la peticion de Publicacion" })
                            if (!likeEliminado) return res.status(500).send({ message: "El Usuario no se ha encontrado en la base de datos" })
                            return res.status(200).send({message:"Like Eliminado", likeEliminado })
                        })
                        User.findByIdAndUpdate(usuario,{$inc:{"contadores.cantidadLikes":-1}}, { new: true },(error,likeAgregadoContador)=>{
                            if (error) return console.log("Error al ingresar like en el contador");
                            if (likeAgregadoContador) return console.log("Like Eliminado con exito");
                        })
                    }else{
                        Publicacion.findByIdAndUpdate(TweetSeleccionado,{$addToSet:{usuarioslike:{usuariolike:usuario}}},{new:true},(error,LikeIngresado)=>{
                            if (error) return res.status(404).send({ message: "Error en la peticion de Publicacion" })
                            if (!LikeIngresado) return res.status(500).send({ message: "El tweet no se ha encontrado en la base de datos" })
                            return res.status(200).send({message:"Like realizado con exito", LikeIngresado })
                        }) 
                        User.findByIdAndUpdate(usuario,{$inc:{"contadores.cantidadLikes":1}}, { new: true },(error,likeAgregadoContador)=>{
                            if (error) return console.log("Error al ingresar like en el contador");
                            if (likeAgregadoContador) return console.log("Like Agragado con exito");
                        })
                    }
                })
            }else{
                res.status(400).send({ message: 'Faltan datos para completar la accion' });
            }
            break;
            case "REPLY_TWEET":
                if(dato[1],dato[2]){
                    var usuario = req.user.sub;
                    var TweetAResponder = dato[1];
                    var contenido = dato[2];
                    
                    Publicacion.findByIdAndUpdate(TweetAResponder,{$addToSet:{respuestas:{usuarioId: usuario,usuario:req.user.usuario,contenidoR:contenido}}}, {new:true},(error,respuesta)=>{
                        if(error) return res.status(500).send({ message: 'Error en la peticion de Tweet'})
                        if(!respuesta) return res.status(404).send({ message: 'Error al responder Tweet'})
                        return res.status(200).send({message: "Respuesta Ingresada", respuesta })
                    }).select('-usuarioslike')

                    User.findByIdAndUpdate(usuario,{$inc:{"contadores.cantidadRespuestas":1}}, { new: true },(error,respuestaAgregadoContador)=>{
                        if (error) return console.log("Error al ingresar like en el contador");
                        if (respuestaAgregadoContador) return console.log("Respuesta Agragada con exito");
                    })
                }else{
                    res.status(400).send({message:'Faltan datos para completar la accion'});
                }
            break
            case"RETWEET":
            if(dato[1]){
                var idTweetaDarRetweet = dato[1];
                var usuario = req.user.sub;
                var comentarioUsuario = dato[2] || "Comentario (Opcinal) no agregado por el usuario";
                
                User.findOne({"retweets.idTweetOriginal": idTweetaDarRetweet},(error, encontrado)=>{
                    if(error) return res.status(200).send({message: error});
                    if(encontrado){
                        User.findByIdAndUpdate(usuario,{$pull:{retweets:{idTweetOriginal:idTweetaDarRetweet}}},(error,retweetEliminado)=>{
                            if (error) return res.status(404).send({ message: "Error en la peticion de Usuario" })
                            if (!retweetEliminado) return res.status(500).send({ message: "El tweet no se ha encontrado en la base de datos" })
                            return res.status(200).send({message:"Retweet Eliminado", retweetEliminado })
                        })
                        User.findByIdAndUpdate(usuario,{$inc:{"contadores.cantidadRetweets":-1}}, { new: true },(error,retweetEliminadoContador)=>{
                            if (error) return console.log("Error al ingresar like en el contador");
                            if (retweetEliminadoContador) return console.log("Retweet Eliminado con exito");
                        })
                    }else{
                        User.findByIdAndUpdate(usuario,{$addToSet:{retweets:{idTweetOriginal:idTweetaDarRetweet,comentario:comentarioUsuario}}},{new:true},(error,retweet)=>{
                            if (error) return res.status(404).send({ message: "Error en la peticion de Usuario" })
                            if (!retweet) return res.status(500).send({ message: "El tweet no se ha encontrado en la base de datos" })
                            return res.status(200).send({message:"Retweet realizado con exito", retweet })
                        })
                        User.findByIdAndUpdate(usuario,{$inc:{"contadores.cantidadRetweets":1}}, { new: true },(error,retweetAgregadoContador)=>{
                            if (error) return console.log("Error al ingresar like en el contador");
                            if (retweetAgregadoContador) return console.log("Retweet Agragada con exito");
                        })
                    }
                })
            }else{
                res.status(400).send({ message: 'Faltan datos para completar la accion' });
            }
            break;
            case"VIEW_TWEETS":
                if ( dato[1]){
                    var nombreUsuario = dato[1];
                    var idUsuario = req.user.sub;
                    
                    User.findOne({usuario: nombreUsuario},(error,usuarioEncontrado) => {
                        if (!usuarioEncontrado) {
                            return res.status(404).send({ message: "El usuario no se encuentra en la base de datos" })
                        }else{
                            User.find(({ usuario: nombreUsuario }), (error, publicaciones) => {
                                if (error) return res.status(500).send({ message: "Error en la peticion de usuarios" })
                                if (!publicaciones) return res.status(404).send({ message: "Error al busvar Usuario" })
                                return res.status(200).send({ usuario: publicaciones })
                            }).select('-seguidos').select('-rol').select('-__v').select('-password').select('-retweets');
                        }
                    })
            }else {
                res.status(400).send({ message: 'Faltan datos para completar la accion' });
            }
            break;
            case "REGISTER":
                if ( dato[1] &&  dato[2]) {
                    user.usuario =  dato[1];
                    user.password =  dato[2];
                    user.rol= "ROL_USUARIO"
                    await User.find({
                        $or: [
                            { usuario: user.usuario },
                        ]
                    }).exec((err, usuarios) => {
                        if (err) return res.status(500).send({ message: 'Error en la peticion de usuarios' })        
                        if (usuarios && usuarios.length >= 1) {
                            return res.status(500).send({ message: 'El usuario ya existe' })
                        } else {
                            bcrypt.hash(user.password, null, null, (err, hash) => {
                                user.password = hash;
                                user.save((err, usuarioGuardado) => {
                                    if (err) return res.status(500).send({ message: 'Error al guardar el Usuario' })
                                    if (usuarioGuardado) {
                                        res.status(200).send({ user: usuarioGuardado })
                                    } else {
                                        res.status(404).send({ message: 'No se ha podido registrar el usuario' })
                                    }
                                })
                            })
                        }
                    })
                } else {
                    res.status(400).send({ message: 'Faltan datos para completar la accion' });
                }
                break;
            default:
                res.status(500).send({ message: 'Invalido' });
            break;
            case"LOGIN":
                if ( dato[1] &&  dato[2]){
                    user.usuario =  dato[1];
                    user.passwordd = dato[2];
                    user.gettoken = true;
                    
                    await User.findOne({usuario: user.usuario}, (err, users)=>{
                        if(err) 
                        return res.status(500).send({message: 'Error en la peticion'})
                        if(users){
                            bcrypt.compare(user.passwordd, users.password, (err, check)=>{
                                if(check){
                                    if(user.gettoken){
                                        return res.status(200).send({
                                            token: jwt.createToken(users)
                                        })
                                    }else{
                                        users.password = undefined;
                                        return res.status(200).send({ users })
                                    }
                                }else{
                                    return res.status(404).send({message: 'El usuario no se ha podido identificar'})
                                }
                            })
                        }else{
                            return res.status(404).send({message: 'El usuario no se a podido logear'})
                        }
                    })
            } else {
                res.status(400).send({ message: 'Faltan datos para completar la accion' });
            }
            break;
            case"ADD_TWEET":
                if ( dato[1]){
                    publicacion.usuario = req.user.sub;
                    publicacion.contenido = dato[1];
                    publicacion.fecha = new Date();
                    
                    publicacion.save((err, publicacionGuardada)=>{
                    if(err) return res.status(500).send({ message: 'Error en la peticion de Publicacion' })
                    if(!publicacionGuardada) return res.sta(404).send({ message: 'Error al agregar tweet'})
                    return res.status(200).send({ publicacion: publicacionGuardada })
                })
            }else {
                res.status(400).send({ message: 'Faltan datos para completar la accion' });
            }
            break;
            case"DELETE_TWEET":
                if ( dato[1]){
                    publicacion.usuario = req.user.sub;
                    publicacion._id = dato[1];
                    
                    if(publicacion.usuario != req.user.sub){
                        return res.status(500).send({ message: 'Usted no tiene el permiso de eliminar este tweet'})
                    }
                    Publicacion.findByIdAndDelete(publicacion._id,(err, tweetEliminado)=>{
                        if(err) return res.status(500).send({ message: 'Error en la peticion de eliminar el tweet'})
                        if(!tweetEliminado) return res.status(404).send({ message: 'Error al eliminar el tweet'})
                        return res.status(200).send({ message: 'Tweet Eliminado', publicacion: tweetEliminado})
                    })
                
            }else {
                res.status(400).send({ message: 'Faltan datos para completar la accion' });
            }
            break;
            case"EDIT_TWEET":
                if ( dato[1] && dato[2]){
                    publicacion.usuario = req.user.sub;
                    publicacion._id = dato[1];
                    publicacion.contenido = dato[2];
                    
                    if(publicacion.usuario != req.user.sub){
                        return res.status(500).send({ message: 'Usted no tiene el permiso de editar este Usuario'})
                    }
                    Publicacion.findByIdAndUpdate(publicacion._id, publicacion.contenido, { new: true }, (err, publicacionActualizada)=>{
                        if(err) return res.status(500).send({ message: 'Error en la peticion' })
                        if(!publicacionActualizada) return res.status(404).send({ message: 'No se a podido actualizar los datos del Usuario' })
                        return res.status(200).send({ publicacion: publicacionActualizada })
                    }) 
                
            }else {
                res.status(400).send({ message: 'Faltan datos para completar la accion' });
            }
            break;
            case"FOLLOW":
                if ( dato[1]){
                    var usuarioId = req.user.sub;
                    var nombreDeusuario = dato[1];

                    User.findOne({ usuario: nombreDeusuario }, (error, usuarioEncontrado) => {
                        if (error) return res.status(500).send({ message: "Error en la peticion de usuario" })
                        if (!usuarioEncontrado || nombreDeUsuario == usuarioId) {
                            return res.status(404).send({ message: "El usuario ingresado no existe" })
                        }else{
                            User.findByIdAndUpdate(usuarioId, { $addToSet: { seguidos: { usuarioSeguido: usuarioId, usuario: nombreDeusuario } } }, { new: true }, (error,usuarioSeguido) => {
                                return res.status(200).send({ message: "Follow ingresado con éxito", usuarioSeguido })
                            })
                        }
                    })
                }else {
                res.status(400).send({ message: 'Faltan datos para completar la accion' });
            }
            break;
            case"UNFOLLOW":
                if ( dato[1]){
                    user.usuario = req.user.sub;
                    user.usuariooo = dato[1];
                    
                    User.findOneAndUpdate({"seguidos.usuarioSeguido": user.usuariooo},{$pull : { seguidos:{_id: user.usuariooo}}},(err,comentarioEliminado)=>{
                        if(err) return res.status(500).send({ message: 'Error en la peticion de eliminar usuario'})
                        if(!comentarioEliminado) return res.status(404).send({ message: 'Error al eliminar el usuario de seguidos'})
                        return res.status(200).send({ usuario: comentarioEliminado})
                    })
                }else {
                res.status(400).send({ message: 'Faltan datos para completar la accion' });
                }
            break;
            case"PROFILE":
                if(dato[1]){
                    var nombreDeUsuario = dato[1];
                    
                    User.findOne({ usuario: nombreDeUsuario }, (error, usuarioEncontrado) => {
                        if (error) return res.status(404).send({ message: "Error en la peticion de Usuario" })
                        if (!usuarioEncontrado) return res.status(500).send({ message: "El usuario no se ha encontrado en la base de datos" })
                        return res.status(200).send({ usuarioEncontrado })
                    }).select('-password').select('-rol').select('-__v')
                }else{
                    res.status(400).send({ message: 'Faltan datos para completar la accion' });
                }
            break;
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: error.message });
    }
}
module.exports = {
    command
}