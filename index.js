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
    "name": "NFM THOR Concealable Reinforced Vest body armor",
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
              "name": "KITECO SC-IV SA ballistic plate"
            },
            {
              "name": "Kiba Arms Titan ballistic plate"
            },
            {
              "name": "Kiba Arms Steel ballistic plate"
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
              "name": "PRTCTR Lightweight ballistic plate"
            },
            {
              "name": "SPRTN Elaphros ballistic plate"
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
            },
            {
              "name": "Granit Br4 ballistic plate"
            },
            {
              "name": "Granit Br5 ballistic plate"
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
              "name": "PRTCTR Lightweight ballistic plate"
            },
            {
              "name": "SPRTN Elaphros ballistic plate"
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
            },
            {
              "name": "Granit Br4 ballistic plate"
            },
            {
              "name": "Granit Br5 ballistic plate"
            }
          ]
        },
        {
          "nameId": "Left_side_plate",
          "allowedPlates": [
            {
              "name": "SSAPI level III+ ballistic plate (Side)"
            },
            {
              "name": "ESBI level IV ballistic plate (Side)"
            },
            {
              "name": "Granit ballistic plate (Side)"
            }
          ]
        },
        {
          "nameId": "Right_side_plate",
          "allowedPlates": [
            {
              "name": "SSAPI level III+ ballistic plate (Side)"
            },
            {
              "name": "ESBI level IV ballistic plate (Side)"
            },
            {
              "name": "Granit ballistic plate (Side)"
            }
          ]
        },
        {
          "nameId": "Soft_armor_front",
          "class": 3,
          "durability": 25,
          "material": {
            "name": "Aramid",
            "destructibility": 0.1875
          }
        },
        {
          "nameId": "Soft_armor_back",
          "class": 3,
          "durability": 25,
          "material": {
            "name": "Aramid",
            "destructibility": 0.1875
          }
        },
        {
          "nameId": "Soft_armor_left",
          "class": 3,
          "durability": 10,
          "material": {
            "name": "Aramid",
            "destructibility": 0.1875
          }
        },
        {
          "nameId": "soft_armor_right",
          "class": 3,
          "durability": 10,
          "material": {
            "name": "Aramid",
            "destructibility": 0.1875
          }
        }
      ]
    }
  }
];

const armorDataBD = api.itemQuery.getArmorRig().then((data) =>{
  return data.items;
});

const armorPlateDataDB = api.itemQuery.getArmorPlate().then((data) =>{
  console.log(data.items);
  return data.items;
});

// const Armor = require('./models/armor'); // Mongo model

// async function findArmorAsync(armorName) {
//     return await Armor.findOne({ name: armorName }).exec();
// }

function findArmorAsync(armorName) {
  return new Promise((resolve) => {
      setTimeout(() => { 
          //armorDataBD.then((data)=>{console.log(data)});
          const armor = armorDataBD.then((data) => {
            return data.find(a => a.name.toLowerCase() === armorName.toLowerCase())
          });
          resolve(armor);
      }, 50); 
  });
}

io.on("connection", (socket) => {
    console.log(socket.id);

    socket.on('requestArmorData', async(armorName) => {
        try {
          const armor = await findArmorAsync(armorName); 

          if (armor) {
              socket.emit('recieveArmorData', armor);
          } else {
              socket.emit('recieveArmorDataError', { error: "Armor not found" });
          }
      } catch (error) {
          console.error("Error fetching armor data:", error);
          socket.emit('recieveArmorDataError', { error: "Server error" });
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
})

server.listen(3000, () => {
  console.log('Server is listening on http://localhost:3000');
});