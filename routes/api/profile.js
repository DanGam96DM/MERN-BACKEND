const express=require('express');
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
module.exports=router;