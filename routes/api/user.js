const express=require('express');
const router=express.Router();
const gravatar=require('gravatar');
const bcrypt=require('bcryptjs');
const { check, validationResult } = require('express-validator');
const User=require('../../models/User');
const jwt=require('jsonwebtoken');
const config=require('config');

// @route  POST api/users
// @desc   Register user
// @access Public
router.post('/', [
    check('name', 'El nombre es requerido').not().isEmpty(),
    check('email', 'Por favor incluya con correo valido').isEmail(),
    check('password', 'Por favor introduzca una contrase;a con 6 o mas caracteres').isLength({min:6})
],
async(req, res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }
    const { name, email, password } = req.body;
    try{
        // ver si el usuario existe
        let user=await User.findOne({ 
            email
         });
         if(user){
           return res.status(400).json({errors: [{msg: 'El usuario ya existe'}]});
         }
        // get gravatar de usuario
         const avatar=gravatar.url(email, {
             s: '200',
             r: 'pg',
             d: 'mm'
         });

         user=new User({
             name,
             email,
             avatar,
             password
         });
        // encriptar la contrasse;a
         const salt= await bcrypt.genSalt(10);
         user.password=await bcrypt.hash(password, salt);
         await user.save();
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