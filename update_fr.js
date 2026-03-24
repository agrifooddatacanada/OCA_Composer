const fs = require('fs');
const path = 'public/locales/fr/translation.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

data["Each column of your dataset is an attribute in your schema. Here you can add, remove, and edit attributes and their details."] = "Chaque colonne de votre jeu de données est un attribut dans votre schéma. Ici, vous pouvez ajouter, supprimer et modifier des attributs et leurs détails.";

data["Enter the column names below. These are the column headers in the tabular data set no matter the language."] = "Entrez les noms de colonnes ci-dessous. Ce sont les en-têtes de colonnes dans le jeu de données tabulaires quelle que soit la langue.";

data["Write column names or drag and drop an existing dataset (Excel or .csv file) to import names (the first row must contain the column headers). You can edit these later."] = "Écrivez les noms de colonne ou faites glisser et déposez un jeu de données existant (fichier Excel ou .csv) pour importer des noms (la première ligne doit contenir les en-têtes de colonne). Vous pouvez les modifier plus tard.";

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log("Updated!");
