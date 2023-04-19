module.exports = (req, res, next) => {
    const bookObject = req.body;
    
    console.log(req.body);
    console.log(bookObject);
    if (!bookObject || !bookObject.title || !bookObject.author || !bookObject.year || !bookObject.genre ) {
        return res.status(400).json({ error: 'Invalid request data' });
    }
    
    next();
};

// module.exports = check;