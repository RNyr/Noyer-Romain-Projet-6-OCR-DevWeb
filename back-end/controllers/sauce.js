const Sauce = require("../models/sauce");
const fs = require("fs");

//-------------------------------

exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;
  delete sauceObject._userId;
  const sauce = new Sauce({
    ...sauceObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
  });

  sauce
    .save()
    .then(() => {
      res.status(201).json({ message: "Sauce enregistrée !" });
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

//-------------------------------

exports.getAllSauce = (req, res, next) => {
  Sauce.find()
    .then((sauces) => {
      res.status(200).json(sauces);
    })
    .catch((error) => {
      res.status(400).json({
        error: error,
      });
    });
};

//-------------------------------

exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({
    _id: req.params.id,
  })
    .then((sauce) => {
      res.status(200).json(sauce);
    })
    .catch((error) => {
      res.status(404).json({
        error: error,
      });
    });
};

//-------------------------------

exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file
    ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };

  delete sauceObject._userId;
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      if (sauce.userId != req.auth.userId) {
        res.status(401).json({ message: "Not authorized" });
      } else {
        Sauce.updateOne(
          { _id: req.params.id },
          { ...sauceObject, _id: req.params.id }
        )
          .then(() => res.status(200).json({ message: "Objet modifié!" }))
          .catch((error) => res.status(401).json({ error }));
      }
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

//------------------------------------

exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      if (sauce.userId != req.auth.userId) {
        res.status(401).json({ message: "Not authorized" });
      } else {
        const filename = sauce.imageUrl.split("/images/")[1];
        fs.unlink(`images/${filename}`, () => {
          Sauce.deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: "Objet supprimé !" });
            })
            .catch((error) => res.status(401).json({ error }));
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

//-----------------------------------------

const MESSAGE_LIKE = "Vous aimez cette sauce";
const MESSAGE_DISLIKE = "Vous n’aimez pas cette sauce";
const MESSAGE_UNLIKE = "Vous n’aimez plus cette sauce";
const MESSAGE_UNDISLIKE = "Vous aimerez peut-être cette sauce à nouveau";
const ERROR_GENERIC = "Une erreur est survenue";

exports.likeSauce = async (req, res, next) => {
  try {
    const like = req.body.like;
    const sauceId = req.params.id;
    const userId = req.body.userId;
    const sauce = await Sauce.findById(sauceId);
    if (!sauce) {
      return res.status(404).json({ error: "Sauce introuvable" });
    }

    if (like === 1) {
      sauce.likes++;
      sauce.usersLiked.push(userId);
    } else if (like === -1) {
      sauce.dislikes++;
      sauce.usersDisliked.push(userId);
    } else if (like === 0 && sauce.usersLiked.includes(userId)) {
      sauce.likes--;
      sauce.usersLiked = sauce.usersLiked.filter((id) => id !== userId);
    } else if (like === 0 && sauce.usersDisliked.includes(userId)) {
      sauce.dislikes--;
      sauce.usersDisliked = sauce.usersDisliked.filter((id) => id !== userId);
    } else {
      return res.status(400).json({ error: "Valeur 'like' invalide" });
    }

    await sauce.save();
    res.status(200).json({
      message:
        like === 1
          ? MESSAGE_LIKE
          : like === -1
          ? MESSAGE_DISLIKE
          : like === 0 && sauce.usersLiked.includes(userId)
          ? MESSAGE_UNLIKE
          : MESSAGE_UNDISLIKE,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: ERROR_GENERIC });
  }
};
