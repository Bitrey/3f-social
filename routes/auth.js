const router = require('express').Router();
const passport = require('passport');

// auth login
router.get('/login', function(req, res){
    // res.render('login');
    res.redirect("/auth/google");
});

// auth logout
router.get('/logout', function(req, res){
    req.flash("success", "Ti sei disconnesso");
    req.logout();
    res.redirect('/');
});

// auth with google+
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

router.get('/google/redirect', passport.authenticate('google'), function(req, res){
    req.flash("success", "Ti sei autenticato");
    res.redirect('/profile');
});

module.exports = router;