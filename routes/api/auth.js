const express=require('express');
const router=express.Router();
const bcrypt=require('bcryptjs');
const auth=require('../../middleware/auth');
const User=require('../../models/User');
const { check, validationResult } = require('express-validator');
const config=require('config');
const jwt=require('jsonwebtoken');

// @route  GET api/auth
// @desc   Test route
// @access Public

router.get('/',auth, async(req, res)=>{
    try {
        const user=await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});


// @route  POST api/auth
// @desc   autenticar y obtener el token
// @access Public

router.post('/', [
    check('email', 'Por favor incluya con correo valido').isEmail(),
    check('password', 'La contrase;a es requerida').exists()
],
async(req, res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }
    const { email, password } = req.body;
    try{
        // ver si el usuario existe
        let user=await User.findOne({ 
            email
         });
         if(!user){
           return res.status(400).json({errors: [{msg: 'Credenciales invalidas'}]});
         }

        const isMatch=await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({errors: [{msg: 'Credenciales invalidas'}]});
        }

        // retornar el jwt
        const payload={
            user:{
                id:user.id
            }
        }
        jwt.sign(payload, config.get('jwtToken'),
            {expiresIn: 360000},
            (err, token)=>{
                if(err) throw err;
                res.json({token});
            }
        );
    }catch(err){
        console.error(err.message);
        res.status(500).send('Error de servidor');
    }
});
module.exports=router;