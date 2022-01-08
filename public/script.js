const socket = io('/')
const videoGrid = document.getElementById('video-grid');
//console.log(videoGrid);
const myPeer = new Peer(undefined,{
    host: '/',
    port: '3001'
});

var userName = "";
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
    //videoGrid.append(video)
  }

  const vidPlayer = document.getElementById('videoPlayer');
  const vidButton = document.getElementById('videoButton');
  vidButton.addEventListener('click', ()=>{
      if(vidPlayer.paused)
      {
          console.log('trigger1');
          vidPlayer.play();
          vidButton.innerText = 'pause';
          socket.emit('play')
      }
      else
      {
          console.log('trigger2');
          vidPlayer.pause();
          vidButton.innerText = 'play';
          socket.emit('pause')
      }
  })

  var isManual = true;

    vidPlayer.addEventListener('pause',()=>{
    vidButton.innerText = 'play';
    if(isManual)
    {
      console.log('manual');
      socket.emit('pause')
    }
    else
    {
      console.log('automatic');
      isManual = true;
    }
  })
  
  vidPlayer.addEventListener('play', ()=>{
    
    vidButton.innerText = 'pause';
    if(isManual)
    {
      console.log('manual');
      socket.emit('play')
      console.log(isManual);
    }
    else
    {
      console.log('automatic');
      isManual = true;
    }
  })

  var manualSeeked = true;
  vidPlayer.addEventListener('seeked',()=>{
    if(manualSeeked)
      socket.emit('position-update',vidPlayer.currentTime);
      manualSeeked = true;
  })

  socket.on('video-played', ()=>{
    isManual = false;
    vidPlayer.play(); 
  })

  socket.on('video-paused', ()=>{
    isManual = false;
    vidPlayer.pause();
  })
  
  socket.on('new-position', (time)=>{
    manualSeeked = false;
    vidPlayer.currentTime = time;
  })

  socket.on('new-text-addition',(text, uid, name)=>{
    var textDiv = document.createElement('div');
    var nameSpan = document.createElement('span');
    var messageSpan = document.createElement('span');
    textDiv.classList.add("textDiv");
    nameSpan.innerText = name + ": ";
    messageSpan.innerText = text;
    nameSpan.classList.add("nameSpan");
    textDiv.appendChild(nameSpan);
    textDiv.appendChild(messageSpan);
    chatArea.appendChild(textDiv);
  })

  const chatArea = document.getElementById("chatArea");
  const tform = document.getElementById('tform');
  tform.addEventListener('submit', (event)=>{
    event.preventDefault();
    var text = tform.elements['ctextBox'].value;
    if(text!=="")
    {
       console.log(text);
       var textDiv = document.createElement('div');
       var nameSpan = document.createElement('span');
       var messageSpan = document.createElement('span');
       textDiv.classList.add("textDiv");
       nameSpan.innerText = "You: ";
       messageSpan.innerText = text;
       nameSpan.classList.add("nameSpan");
       textDiv.appendChild(nameSpan);
       textDiv.appendChild(messageSpan);
       chatArea.appendChild(textDiv);
       //console.log(textDiv);
       tform.elements['ctextBox'].value = "";
       socket.emit('new-chat', text, userName);
    }
  })


  //frontend stuff

  const modalEle = document.getElementById('modal');
  const overlayEle = document.getElementById('overlay');
  window.onload = function(){
    modalEle.classList.add('active');
    overlayEle.classList.add('active');
  } 

  const nform = document.getElementById('nform');
  nform.addEventListener('submit', (event)=>{
        userName = nform.elements['uname'].value;
      //console.log(userName);
      modalEle.classList.remove('active');
      overlayEle.classList.remove('active');
      if(userName==="")
      {
        modalEle.classList.add('active');
        overlayEle.classList.add('active');
      }
      event.preventDefault();
  })


