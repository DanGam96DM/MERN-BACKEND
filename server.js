const express=require('express');
const connectDB=require('./config/db');
const app=express();
connectDB();
app.get('/', (req, res)=>res.send('API Corriendo'));

//Se definen todas las rutas
app.use('/api/users', require('./routes/api/user'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/posts', require('./routes/api/posts'));


const PORT=process.env.PORT || 5000;
app.listen(PORT, ()=>console.log(`El servidor se inicio en el puerto ${PORT}`));
