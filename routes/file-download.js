const router = require('express').Router();

router.get('/:indirizzo/:nome', function(req, res){
    const file = `./uploads/${req.params.indirizzo}`;
    res.download(file, req.params.nome);
});

module.exports = router;