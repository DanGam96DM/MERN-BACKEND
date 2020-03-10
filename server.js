const express=require('express');
const app=express();
app.get('/', (req, res)=>res.send('API Corriendo'));

const PORT=process.env.PORT || 5000;
app.listen(PORT, ()=>console.log(`El servidor se inicio en el puerto ${PORT}`));
