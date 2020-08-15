'use strict'

var express = require("express")
var UsuarioController = require("../controllers/controllerUniversal")
var md_auth = require("../middlewares/authenticated")

//RUTAS
var api = express.Router()
api.post('/commands',md_auth.ensureAuth,UsuarioController.command)

module.exports = api;