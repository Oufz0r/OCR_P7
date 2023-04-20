const multer = require('multer');

const MIME_TYPES = {
    'image/jpg': 'jpg',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp'
};


const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'images');
    },
    filename: (req, file, callback) => {
        const name = file.originalname.split(' ').join('_');
        const extension = MIME_TYPES[file.mimetype];
        callback(null, name + Date.now() + '.' + extension);
    }
});

const fileFilter = (req, file, callback) => {
    if (!MIME_TYPES.hasOwnProperty(file.mimetype)) {
        return callback(new Error('format de fichier non-autorisé'))
    }
    const bookObject = JSON.parse(req.body.book);
    if (!bookObject.title || !bookObject.author || !bookObject.year || !bookObject.genre)
    {
        return callback(new Error('Il manque quelque chose au formulaire'));
    }
    callback(null, true)
};

module.exports = multer({fileFilter: fileFilter, storage: storage}).single('image');


// const multer = require('multer');

// const MIME_TYPES = {
//     'image/jpg': 'jpg',
//     'image/jpeg': 'jpg',
//     'image/png': 'png'
// };


// const storage = multer.diskStorage({
//     destination: (req, file, callback) => {
//         const bookObject = JSON.parse(req.body.book);
//         if (!bookObject.title || !bookObject.author || !bookObject.year || !bookObject.genre)
//         {
//             return callback(new Error('Il manque quelque chose au formulaire'));
//         }
//         callback(null, 'images');
//     },
//     filename: (req, file, callback) => {
//         const name = file.originalname.split(' ').join('_');
//         const extension = MIME_TYPES[file.mimetype];
//         callback(null, name + Date.now() + '.' + extension);
//     }
// });

// module.exports = multer({storage: storage}).single('image');