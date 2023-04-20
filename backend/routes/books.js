const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');

const booksCtrl = require('../controllers/books');


router.get('/bestrating', booksCtrl.bestRatings);
router.post('/', auth, multer, booksCtrl.createBook);
router.post('/:id/rating', auth, booksCtrl.rateBook);
router.put('/:id', auth, multer, booksCtrl.modifyBook);
router.delete('/:id', auth, booksCtrl.deleteBook);
router.get('/:id', booksCtrl.getOneBook);
router.get('/', booksCtrl.getAllBook);

module.exports = router;