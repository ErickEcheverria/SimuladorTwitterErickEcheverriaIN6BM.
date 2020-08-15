'use strict'

// VARIABLE GOLBALES
const express = require("express")
const app = express();
const bodyParser = require("body-parser")

//CARGA DE RUTAS
var universal_routes = require("./routes/routesUniversal")



//MIDDLEWARES
app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())

//CABECERAS
app.use((req, res, next)=>{
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods','GET. POST, OPTIONS, PUT, DELETE');
    res.header('Allow','GET, POST, OPTIONS, PUT, DELETE');

    next();
})

//RUTAS
app.use('/api',universal_routes)



//EXPORTAR
module.exports = app;