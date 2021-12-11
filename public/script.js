const socket = io('/')
const videoGrid = document.getElementById('video-grid');
//console.log(videoGrid);
const myPeer = new Peer(undefined,{
    host: '/',
    port: '3001'
});

const peers = {};
const myVideo = document.createElement('video');
myVideo.muted = true;

navigator.mediaDevices.getUserMedia({
    //video: true,
    audio: true
}).then(stream => {
    addVideoStream(myVideo, stream)

    myPeer.on('call', call=>{
        call.answer(stream)
        const video = document.createElement('video');
        call.on('stream', userVideoStream=>{
            addVideoStream(video, userVideoStream);
        })
    })

    socket.on('user-connected', userId =>{
        connectToNewUser(userId, stream);
    })

    socket.on('user-disconnected', userId=>{
        if(peers[userId])
            peers[userId].close();
    })

    
})

myPeer.on('open', id=> {
    socket.emit('join-room', ROOM_ID, id)  
})



function connectToNewUser(userId, stream)
{
    const call = myPeer.call(userId, stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream=>{
        addVideoStream(video, userVideoStream);
    })
    call.on('close',()=>{
        video.remove();
    })
    peers[userId] = call;
}

function addVideoStream(video, stream) {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
      video.play()
    })
    videoGrid.append(video)
  }

  const vidPlayer = document.getElementById('videoPlayer');
  const vidButton = document.getElementById('videoButton');
  vidButton.addEventListener('click', ()=>{
      if(vidPlayer.paused)
      {
          vidPlayer.play();
          vidButton.innerText = 'pause';
          socket.emit('play')
      }
      else
      {
          vidPlayer.pause();
          vidButton.innerText = 'play';
          socket.emit('pause')
      }
  })

  vidPlayer.addEventListener('pause',()=>{
    vidPlayer.pause();
    vidButton.innerText = 'play';
    socket.emit('pause')
  })
  
  vidPlayer.addEventListener('play',()=>{
    vidPlayer.play();
    vidButton.innerText = 'pause';
    socket.emit('play')
  })

  socket.on('video-played', ()=>{
    vidPlayer.play();
    vidButton.innerText = 'pause';
  })

  socket.on('video-paused', ()=>{
    vidPlayer.pause();
    vidButton.innerText = 'play';
  })
  
  /*vidPlayer.addEventListener('seeking',()=>{
    vidPlayer.pause();
    vidButton.innerText = 'play';
  })*/

  /*vidPlayer.addEventListener('seeked',()=>{
    
      socket.emit('positionChanged', vidPlayer.currentTime)
      vidPlayer.play();
    console.log('played');
    vidButton.innerText = 'pause';
  })*/