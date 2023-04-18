const Book = require('../models/Book');
const fs = require('fs');


exports.createBook = (req, res, next) => {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject._userId;
    const book = new Book({
        ...bookObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
        averageRating: 0
    });

    book.save()
    .then(() => { res.status(201).json({message: 'Objet enregistré !'})})
    .catch(error => { res.status(400).json( { error })})
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
            res.status(400).json({ message: 'Non-autorisé' });
        } else {
            if (req.file)
            {
                // On supprime l'ancienne image
                const filename = book.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Book.updateOne({ _id: req.params.id}, { ...bookObject, _id: req.params.id })
                        .then(() => res.status(200).json({ message: 'Objet modifié !' }))
                        .catch(error => res.status(401).json({ error }));
                });
            } else {
                    Book.updateOne({ _id: req.params.id}, { ...bookObject, _id: req.params.id })
                        .then(() => res.status(200).json({ message: 'Objet modifié !' }))
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
            res.status(401).json({message: 'Not authorized'});
        } else {
            const filename = book.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, () => {
                Book.deleteOne({_id: req.params.id})
                .then(() => { res.status(200).json({message: 'Objet supprimé !'})})
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
            return res.status(400).json({ error: "Vous avez déjà noté ce livre." });
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
            .then(() => res.status(200).json({ _id: req.params.id, averageRating: average }))
            .catch(error => res.status(401).json({ error }));
    })
    .catch(error => res.status(400).json({ error }));
};