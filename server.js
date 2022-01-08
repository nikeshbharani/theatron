const express = require(`express`);
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const fs = require('fs');
const { SocketAddress } = require('net');

const { v4: uuidV4 } = require('uuid');

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.redirect(`/${uuidV4()}`)
})

app.get('/video', (req, res)=> {
  //console.log(req);
  const path = 'content/TomandJerry.mp4'
  const stat = fs.statSync(path)
  const fileSize = stat.size
  const range = req.headers.range
  //console.log(fileSize)
  if (range) 
  {
    const parts = range.replace(/bytes=/, "").split("-")
    const start = parseInt(parts[0], 10)
    const end = parts[1]? parseInt(parts[1], 10): fileSize - 1
    const chunksize = (end - start) + 1
    const chunk = fs.createReadStream(path, { start, end })
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    }
    res.writeHead(206, head);
    chunk.pipe(res);
  } 
  /*else if(!range) {
    firstCall = false;
    res.sendFile(__dirname+"/frontend.html");
  }*/
  else
  {
    const head = {
      'Content-Length' : fileSize,
      'Content-Type' : 'video/mp4'
    }
    res.writeHead(200, head);
    fs.createReadStream(path).pipe(res);
  }
});  

app.get('/:room', (req, res) => {
    res.render('room', { roomId: req.params.room });
})

io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) => {
        console.log(`New ${userId} Joined`);
        socket.join(roomId);
        socket.broadcast.to(roomId).emit('user-connected', userId);
        socket.on('disconnect', () => {
            //console.log(userId);
            socket.broadcast.to(roomId).emit('user-disconnected', userId);
        })
        socket.on('play', ()=>{
            //console.log('play clicked');
            socket.broadcast.to(roomId).emit('video-played');
        })
        socket.on('pause', ()=>{
            //console.log('pause clicked');
            socket.broadcast.to(roomId).emit('video-paused');
        })

        socket.on('position-update', (time)=>{
          socket.broadcast.to(roomId).emit('new-position',time);
        })

        socket.on('new-chat',(text, name)=>{
          socket.broadcast.to(roomId).emit('new-text-addition', text, userId, name);
        })
    })
})

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`listening on ${port}`);
});