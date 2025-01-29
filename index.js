const express = require('express');
const app = express();
const path = require('path');
const api = require('./api');
const cors = require('cors');

const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: { origin: "*" }
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/pages'));
app.use(cors());
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
  {
    "name": "Crye Precision AVS plate carrier (Ranger Green)",
    "properties": {
      "armorSlots": [
        {
          "nameId": "Front_plate",
          "allowedPlates": [
            {
              "name": "AR500 Legacy Plate ballistic plate"
            },
            {
              "name": "Cult Locust ballistic plate"
            },
            {
              "name": "Cult Termite ballistic plate"
            },
            {
              "name": "GAC 3s15m ballistic plate"
            },
            {
              "name": "GAC 4sss2 ballistic plate"
            },
            {
              "name": "Global Armor’s Steel ballistic plate"
            },
            {
              "name": "Kiba Arms Steel ballistic plate"
            },
            {
              "name": "KITECO SC-IV SA ballistic plate"
            },
            {
              "name": "Kiba Arms Titan ballistic plate"
            },
            {
              "name": "Monoclete level III PE ballistic plate"
            },
            {
              "name": "NESCO 4400-SA-MC ballistic plate"
            },
            {
              "name": "NewSphereTech level III ballistic plate"
            },
            {
              "name": "SPRTN Elaphros ballistic plate"
            },
            {
              "name": "PRTCTR Lightweight ballistic plate"
            },
            {
              "name": "SPRTN Omega ballistic plate"
            },
            {
              "name": "TallCom Guardian ballistic plate"
            },
            {
              "name": "SAPI level III+ ballistic plate"
            },
            {
              "name": "ESAPI level IV ballistic plate"
            }
          ]
        },
        {
          "nameId": "Back_plate",
          "allowedPlates": [
            {
              "name": "AR500 Legacy Plate ballistic plate"
            },
            {
              "name": "Cult Locust ballistic plate"
            },
            {
              "name": "Cult Termite ballistic plate"
            },
            {
              "name": "GAC 3s15m ballistic plate"
            },
            {
              "name": "GAC 4sss2 ballistic plate"
            },
            {
              "name": "Global Armor’s Steel ballistic plate"
            },
            {
              "name": "KITECO SC-IV SA ballistic plate"
            },
            {
              "name": "Kiba Arms Steel ballistic plate"
            },
            {
              "name": "Monoclete level III PE ballistic plate"
            },
            {
              "name": "Kiba Arms Titan ballistic plate"
            },
            {
              "name": "NESCO 4400-SA-MC ballistic plate"
            },
            {
              "name": "PRTCTR Lightweight ballistic plate"
            },
            {
              "name": "SPRTN Elaphros ballistic plate"
            },
            {
              "name": "NewSphereTech level III ballistic plate"
            },
            {
              "name": "SPRTN Omega ballistic plate"
            },
            {
              "name": "TallCom Guardian ballistic plate"
            },
            {
              "name": "SAPI level III+ ballistic plate"
            },
            {
              "name": "ESAPI level IV ballistic plate"
            }
          ]
        },
        {
          "nameId": "Soft_armor_front",
          "class": 3,
          "durability": 42,
          "material": {
            "id": "Aramid"
          }
        },
        {
          "nameId": "Soft_armor_back",
          "class": 3,
          "durability": 42,
          "material": {
            "id": "Aramid"
          }
        },
        {
          "nameId": "Groin",
          "class": 3,
          "durability": 28,
          "material": {
            "id": "Aramid"
          }
        }
      ]
    }
  } 
];

io.on("connection", (socket) => {
  console.log(socket.id);

    socket.on('requestArmorData', (armorName) => {
        const armor = armorData.find(a => a.name.toLowerCase() === armorName.toLowerCase());

        if (armor) {
            socket.emit('recieveArmorData', armor);
        } else {
            socket.emit('recieveArmorDataError', { error: "Armor not found" });
        }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
})

server.listen(3000, () => {
  console.log('Server is listening on http://localhost:3000');
});