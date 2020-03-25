const express=require('express');
const router=express.Router();
const { check, validationResult }=require('express-validator');
const auth=require('../../middleware/auth');
const User=require('../../models/User');
const Profile=require('../../models/Profile');
const Post=require('../../models/Post');

// @route  Post api/posts
// @desc   Crear un apublicacion
// @access private
router.post('/', [auth, [
    check('text', 'El texto es requerido').not().isEmpty()
]], async(req, res)=>{
    const errors=validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    try {
        const user = await User.findById(req.user.id).select('-password');
        const newPost= new Post({
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        });

        const post=await newPost.save();
        res.json(post);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// @route  Get api/posts
// @desc   obtener todos los posts
// @access Private
router.get('/', auth, async(req, res)=>{
    try {
        const posts=await Post.find().sort({date: -1});
        res.json(posts);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// @route  Get api/posts/:id
// @desc   obtener publicaciones por id
// @access Private
router.get('/:id', auth, async(req, res)=>{
    try {
        const post=await Post.findById(req.params.id);
        if (!post) {
            return res.status(400).json({msg:'Publicacion no encontrada'});
        }
        res.json(post);
    } catch (error) {
        console.error(error.message);
        if (error.kind=='ObjectId') {
            return res.status(400).json({msg:'Publicacion no encontrada'});
        }
        res.status(500).send('Server Error');
    }
});

// @route  Delete api/posts/:id
// @desc   eliminar una publicacion
// @access Private
router.delete('/:id', auth, async(req, res)=>{
    try {
        const post=await Post.findById(req.params.id);
        if (!post) {
            return res.status(400).json({msg:'Publicacion no encontrada'});
        }
        //Check user
        if (post.user.toString()!==req.user.id) {
            return res.status(401).json({msg:'Usuario no autorizado'});
        }

        await post.remove();

        res.json({msg:'Publicacion removida'});

    } catch (error) {
        console.error(error.message);
        if (error.kind=='ObjectId') {
            return res.status(400).json({msg:'Publicacion no encontrada'});
        }
        res.status(500).send('Server Error');
    }
});

// @route  Put api/posts/like/:id
// @desc   Like a post
// @access Private
router.put('/like/:id', auth, async(req, res)=>{
    try {
        const post=await Post.findById(req.params.id);

        // chekear si el post ya ha sido likeado
        if (post.likes.filter(like => like.user.toString()===req.user.id).length>0) {
            return res.status(400).json({msg:'Ya tiene tu like la publicacion'});
        }
        post.likes.unshift({user:req.user.id});
        await post.save();
        res.json(post.likes);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// @route  Put api/posts/unlike/:id
// @desc   Unlike a post
// @access Private
router.put('/unlike/:id', auth, async(req, res)=>{
    try {
        const post=await Post.findById(req.params.id);

        // chekear si el post ya ha sido likeado
        if (post.likes.filter(like => like.user.toString()===req.user.id).length===0) {
            return res.status(400).json({msg:'Aun no le has dado me gusta a la publicacion'});
        }

        //obtener el indice a remover
        const removeIndex=post.likes.map(like=>like.user.toString()).indexOf(req.user.id);

        post.likes.splice(removeIndex, 1);
        await post.save();
        res.json(post.likes);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// @route  Post api/posts/comment/:id
// @desc   Comentar una publicacion
// @access private
router.post('/comment/:id', [auth, [
    check('text', 'El texto es requerido').not().isEmpty()
]], async(req, res)=>{
    const errors=validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    try {
        const user = await User.findById(req.user.id).select('-password');
        const post=await Post.findById(req.params.id);
        
        const newComment= {
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        };

        post.comments.unshift(newComment);
        await post.save();
        res.json(post.comments);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// @route  Delete api/posts/comment/:id/:comment_id
// @desc   Eliminar comentario de publicacion
// @access private
router.delete('/comment/:id/:comment_id', auth, async(req,res)=>{
    try {
        const post=await Post.findById(req.params.id);

        //sacar el comentario
        const comment=post.comments.find(comment=>comment.id===req.params.comment_id);

        //Asegurarse que el comentario exista
        if (!comment) {
            return res.status(404).json({msg:'El comentario no existe'});
        }

        //chekear usuario
        if (comment.user.toString()!==req.user.id) {
            return res.status(401).json({msg:'El usuario no esta autorizado'});
        }

        //obtener indice a remover
        const removeIndex=post.comments.map(comment=>comment.user.toString()).indexOf(req.user.id);

        post.comments.splice(removeIndex, 1);
        await post.save();
        res.json(post.comments);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
})
module.exports=router;