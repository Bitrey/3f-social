const router = require('express').Router();

router.get('/:indirizzo', function(req, res){
    // RISOLVI!!
    const file = `./uploads/${req.params.indirizzo}`;
    res.download(file);
});

module.exports = router;