const Book = require('../models/Book');
const fs = require('fs');
const sharp = require('sharp');


exports.createBook = async (req, res, next) => {
    try {
        // On redimensionne l'image uploadée
        const resizedImage = await sharp(req.file.path)
            .resize(390, 536)
            .jpeg({ quality: 90 })
            .toBuffer();
        
        // On enregistre la nouvelle image redimensionnée
        const imageName = `resized_${req.file.filename}`;
        await fs.promises.writeFile(`./${req.file.destination}/${imageName}`, resizedImage);
        
        const bookObject = JSON.parse(req.body.book);
        delete bookObject._id;
        delete bookObject._userId;
        
        // On crée un nouvel objet Book avec les propriétés redimensionnées
        const book = new Book({
            ...bookObject,
            userId: req.auth.userId,
            imageUrl: `${req.protocol}://${req.get('host')}/images/${imageName}`,
            averageRating: 0
        });
        
        // On enregistre le nouveau livre
        await book.save();

        // Une fois le processus terminé, on supprime l'image originale
        const originalImageName = req.file.filename;
        await fs.promises.unlink(`./${req.file.destination}/${originalImageName}`);

        res.status(201).json({ message: 'Livre enregistré !' });
    } catch (error) {
        res.status(400).json({ error });
    }
};

exports.modifyBook = (req, res, next) => {
    const bookObject = req.file ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body }

    delete bookObject._userId;
    Book.findOne({ _id: req.params.id })
    .then((book) => {
        if (book.userId != req.auth.userId) {
            res.status(403).json({ message: 'Non-autorisé' });
        } else {
            if (req.file)
            {
                // On supprime l'ancienne image
                const filename = book.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Book.updateOne({ _id: req.params.id}, { ...bookObject, _id: req.params.id })
                        .then(() => res.status(200).json({ message: 'Livre modifié !' }))
                        .catch(error => res.status(401).json({ error }));
                });
            } else {
                    Book.updateOne({ _id: req.params.id}, { ...bookObject, _id: req.params.id })
                        .then(() => res.status(200).json({ message: 'Livre modifié !' }))
                        .catch(error => res.status(401).json({ error }));
            }
        }
    })
    .catch(error => res.status(400).json({ error }));
};

exports.deleteBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id})
    .then(book => {
        if (book.userId != req.auth.userId) {
            res.status(403).json({message: 'Non-autorisé'});
        } else {
            const filename = book.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, () => {
                Book.deleteOne({_id: req.params.id})
                .then(() => { res.status(200).json({message: 'Livre supprimé !'})})
                .catch(error => res.status(401).json({ error }));
            });
        }
    })
    .catch( error => {
        res.status(500).json({ error });
    });
};

exports.getOneBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
    .then(book => res.status(200).json( book ))
    .catch(error => res.status(404).json({ error }));
};

exports.bestRatings = async (req, res, next) => {
    // récupère les 3 livres ayant la meilleure note moyenne
    try { const bestRatings = await Book.find()
        .sort({ averageRating: -1 }).limit(3);
        // console.log("bestRatings: ", bestRatings);
        res.status(200).json(bestRatings);
    } catch (error) {
        // console.log("error: ", error);
        res.status(400).json({ error: error });
    }
};

exports.getAllBook = (req, res, next) => {
    Book.find()
    .then(books => res.status(200).json( books ))
    .catch(error => res.status(400).json({ error }));
};


exports.rateBook = (req, res, next) => {    
    Book.findOne({ _id: req.params.id })
    .then((book) => {
        const ratings = book.ratings;
        const userId = req.auth.userId;
        const userRating = ratings.find(rating => rating.userId === userId);

        if (userRating) {
            return res.status(400).json({ error });
        }

        const sum = ratings.reduce((acc, rating) => acc + rating.grade, 0);
        const newRating = {
            userId,
            grade: req.body.rating
        }
        ratings.push(newRating);
        const average = Math.ceil((sum + newRating.grade) / ratings.length);
        Book.updateOne(
            { _id: req.params.id },
            { $push: { ratings: newRating }, averageRating: average }
        )
            .then(() => res.status(200).json({ id: req.params.id, _id: req.params.id, averageRating: average }))
            .catch(error => res.status(401).json({ error }));
    })
    .catch(error => res.status(400).json({ error }));
};