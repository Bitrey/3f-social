const router = require('express').Router();

const authCheck = (req, res, next) => {
    if(!req.user){
        res.redirect('/auth/google');
    } else {
        next();
    }
};

router.get('/', authCheck, (req, res) => {
    res.render('profile', { utente: req.user });
});

module.exports = router;