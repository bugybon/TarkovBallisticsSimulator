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

const armorDataBD = api.itemQuery.getArmorRig().then((data) =>{
  return data.items;
});

async function armorDataBDFunc(){
  return new Promise((res,rej) => {
    let items = api.itemQuery.getArmorRig().then((data) =>{
      //console.log(data.items);
      return data.items;
    });
    res(items);
  });
};

const armorPlateDataDB = api.itemQuery.getArmorPlate().then((data) =>{
  //console.log(data.items);
  return data.items;
});

function findItemAsync(itemName,location) {
  return new Promise((resolve) => {
      setTimeout(() => { 
          //armorDataBD.then((data)=>{console.log(data)});
          const armor = location.then((data) => {
            return data.find(a => a.name.toLowerCase() === itemName.toLowerCase())
          });
          resolve(armor);
      }, 50); 
  });
}

io.on("connection", (socket) => {
    console.log(socket.id);

    socket.on('requestArmorNames', async () => {
      try {
        let names = await armorDataBDFunc();
        names = names.filter((item) => 
          item.properties.armorSlots !== null
        ).map((item) =>
          item.name
        );
        //console.log(names);
        
        if(names){
          socket.emit('recieveArmorNames', names);
        }else{
          socket.emit('recieveArmorNamesError',{error: "Names couldn't be generated"});
        }
      }catch(error){
        console.error("Error fetching armor data:", error);
        socket.emit('recieveArmorNamesError', { error: "Server error" });
      }
    });

    socket.on('requestArmorData', async(armorName) => {
        try {
          const armor = await findItemAsync(armorName,armorDataBD); 

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

    socket.on('plateSelected', async(plateName) => {
      try {
        const plate = await findItemAsync(plateName,armorPlateDataDB); 

        if (plate) {
            socket.emit('recievePlateData', plate);
        } else {
            socket.emit('recievePlateDataError', { error: "Plate not found" });
        }
      } catch (error) {
        console.error("Error fetching armor data:", error);
        socket.emit('recievePlateDataError', { error: "Server error" });
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
})

server.listen(3000, () => {
  console.log('Server is listening on http://localhost:3000');
});