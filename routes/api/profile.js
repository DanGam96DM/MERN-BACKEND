const express=require('express');
const request=require('request');
const config=require('config');
const router=express.Router();
const auth=require('../../middleware/auth');
const Profile=require('../../models/Profile');
const User=require('../../models/User');
const { check, validationResult } = require('express-validator');

// @route  GET api/profile/me
// @desc   Obtener el perfil de usuario actual
// @access Private
router.get('/me', auth, async(req, res)=>{
    try {
        const profile=await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);
        if (!profile) {
            return res.status(400).json({msg: 'No hay un perfil para este usuario'});
        }
        res.json(profile);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error de servidor')
    }
});

// @route  GET api/profile
// @desc   Crear o actualizar un perfil de usuario
// @access Private
router.post('/', [
    auth, 
    [
        check('status', 'Status es requerido').not().isEmpty(),
        check('skills', 'Skills son requeridas').not().isEmpty()
    ],
    async(req, res)=>{
        const errors=validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors:errors.array()});
        }

        const {
            company,
            website,
            location,
            bio,
            status,
            githubusername,
            skills,
            youtube,
            facebook,
            twitter,
            instagram,
            linkedin
        } = req.body;

        //construir un objeto del perfil
        const profileFields = {};
        profileFields.user=req.user.id;
        if (company) profileFields.company=company;
        if (website) profileFields.website=website;
        if (location) profileFields.location=location;
        if (bio) profileFields.bio=bio;
        if (status) profileFields.status=status;
        if (githubusername) profileFields.githubusername=githubusername;
        if (skills) {
            profileFields.skills=skills.split(',').map(skill=>skill.trim());
        }

        //construir un objeto de social 
        profileFields.social={}; //siempre ha que inicializarlo
        if (youtube) profileFields.social.youtube=youtube;
        if (facebook) profileFields.social.facebook=facebook;
        if (twitter) profileFields.social.twitter=twitter;
        if (instagram) profileFields.social.instagram=instagram;
        if (linkedin) profileFields.social.linkedin=linkedin;

        try {
            let profile=await Profile.findOne({user: req.user.id});
            //update
            if (profile) {
                profile=await Profile.findOneAndUpdate(
                    { user:req.user.id },
                    { $set: profileFields },
                    { new: true }
                );
                return res.json(profile);
            }
            //create
            profile=new Profile(profileFields);
            await profile.save();
            res.json(profile);

        } catch (error) {
            console.error(error.message);
            res.status(500).send('Server Error');
        }
    }
]);

// @route  GET api/profile
// @desc   Obtener todos los perfiles
// @access Public
router.get('/', async(req, res)=>{
    try {
        const profiles=await Profile.find().populate('user', ['name', 'avatar']);
        res.json(profiles);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('SERVER ERROR');
    }
});

// @route  GET api/profile/user/:user_id
// @desc   Obtener perfil por id de usuario
// @access Public
router.get('/user/:user_id', async(req, res)=>{
    try {
        const profile=await Profile.findOne({ user: req.params.user_id}).populate('user', ['name', 'avatar']);
        if (!profile) {
            return res.status(400).json({msg: 'No hay perfil para este usuario'});
        }
        res.json(profile);
    } catch (error) {
        if (error.kind=="ObjectId") {
            return res.status(400).json({msg: 'No hay perfil para este usuario'});
        }
        console.error(error.message);
        res.status(500).send('SERVER ERROR');
    }
});

// @route  DELETE api/profile
// @desc   Eliminar perfil, user y posts
// @access Private
router.delete('/', auth, async(req, res)=>{
    try {
        
        //remover perfil
        await Profile.findOneAndRemove({ user: req.user.id});
        await User.findOneAndRemove({_id: req.user.id});
        res.json({msg: 'Usuario eliminado'});
    } catch (error) {
        console.error(error.message);
        res.status(500).send('SERVER ERROR');
    }
});

// @route  PUR api/profile/experience
// @desc   A;adir experiencia en el perfil
// @access Private
router.put('/experience', [auth, [
    check('title', 'El titulo es requerido').not().isEmpty(),
    check('company', 'La compa;ia es requerida').not().isEmpty(),
    check('from', 'De es requerido').not().isEmpty()
]], 
async(req, res)=>{
    const errors=validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors:errors.array()});
    }
    const{
        title,
        company,
        location,
        from,
        to,
        current,
        description
    }=req.body;

    const newExp={
        title,
        company,
        location,
        from,
        to,
        current,
        description
    }

    try {
        const profile=await Profile.findOne({user: req.user.id});
        profile.experience.unshift(newExp);
        await profile.save();
        res.json(profile);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// @route  DELETE api/profile/experience/:exp_id
// @desc   Eliminar experiencia del perfil
// @access Private
router.delete('/experience/:exp_id', auth, async(req, res)=>{
    try {
        const profile=await Profile.findOne({user: req.user.id});
        
        //obtener indice a eliminar
        const removeIndex=profile.experience.map(item=>item.id).indexOf(req.params.exp_id);
        profile.experience.splice(removeIndex, 1);
        await profile.save();
        res.json(profile);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// @route  PUT api/profile/education
// @desc   A;adir educacion en el perfil
// @access Private
router.put('/education', [auth, [
    check('school', 'Insitucion es requerido').not().isEmpty(),
    check('degree', 'Degree es requerida').not().isEmpty(),
    check('fieldofstudy', 'Field of study es requerido').not().isEmpty(),
    check('from', 'De es requerido').not().isEmpty()
]], 
async(req, res)=>{
    const errors=validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors:errors.array()});
    }
    const{
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    }=req.body;

    const newEdu={
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    }

    try {
        const profile=await Profile.findOne({user: req.user.id});
        profile.education.unshift(newEdu);
        await profile.save();
        res.json(profile);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// @route  DELETE api/profile/education/:edu_id
// @desc   Eliminar educacion del perfil
// @access Private
router.delete('/education/:edu_id', auth, async(req, res)=>{
    try {
        const profile=await Profile.findOne({user: req.user.id});
        
        //obtener indice a eliminar
        const removeIndex=profile.education.map(item=>item.id).indexOf(req.params.edu_id);
        profile.education.splice(removeIndex, 1);
        await profile.save();
        res.json(profile);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// @route  GET api/profile/github/:username
// @desc   GET repositorios de github
// @access Public
router.get('/github/:username', async(req, res)=>{
    try {
        const options={
            uri:`https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`,
            method: 'GET',
            headers: {'user-agent':'node.js'}
        };
        request(options, (error, response, body)=>{
            if (error) {
                console.error(error);
            }
            if (response.statusCode!==200) {
               return res.status(404).json({msg:"No github profile found"});
            }
            res.json(JSON.parse(body));
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
})
module.exports=router;