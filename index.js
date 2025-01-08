const express = require('express');
const path = require('path');
const api = require('./api');

const app = express();

const cors = require('cors');
app.use(cors());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/pages'));
app.use(express.static('node_modules'));
app.use(express.static('static'));

function globalErrorHandler(err, req, res, next) {
  if (err.code === 'ENOENT')
    res.code(404).end();
  res.code(500).end();
}

app.use(globalErrorHandler);

app.get('/', (req, res) => {
  res.render('home');
})

const armorData = [
  { name: "PACA Soft Armor", class: 2, material: "Aramid" },
];

app.get('/armor', (req, res) => {
  const armorName = req.query.name;

  if (!armorName) {
      return res.status(400).json({ error: "Armor name is required" });
  }

  const armor = armorData.find(a => a.name.toLowerCase() === armorName.toLowerCase());

  if (!armor) {
      return res.status(404).json({ error: "Armor not found" });
  }

  res.json(armor);
});

app.listen(8080, function () {
  console.log('Server is listening on http//localhost:8080');
  api.itemQuery.getArmorRig();
})