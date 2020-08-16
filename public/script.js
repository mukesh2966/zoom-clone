////////////------- HOME for all front-end javascript
let name;
if (ROOM_ID) {
  while (!name) {
    name = prompt("Please mention your name");
  }
}
const socket = io("/");

name =
  name.split(" ")[0].length < 11
    ? name.split(" ")[0]
    : name.slice(0, 11) + "...";

//-----for adding user entered! in his own screen, in others screen it is shown by createNewConnection of the server.
$("ul").append(
  `<div class="entry_div"><li id="entered"><b>${name} entered!</b><br/></li></div>`
);

// connection id for user is already defined by Peer, so lets keep it undefined
var peer = new Peer(undefined, {
  path: "/peerjs", // defined in server.js
  host: "/",
  port: "3030",
});

const videoGrid = document.getElementById("video-grid");
// creating html element of type video
const myVideo = document.createElement("video");
myVideo.muted = true; // for-self_to_slef voice muting

/////-------ADD VIDEO STREAM----------setting some properties of incoming/outgoing stream and adding it inside the html div that contains other video-streams
const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  //   const newName = name;
  //   const html1 = `<div class="video_div_${newName} video_div"><div class="username">${newName}</div></div>`;
  //   videoGrid.insertAdjacentHTML("beforeend", html1);
  //   document.querySelector(`.video_div_${newName}`).append(video);
  videoGrid.append(video);
};

let myVideoStream;
// this guy below returns a promise
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true, /// for testing and styling purpose
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, myVideoStream);

    ////////------------answering call(of video-stream) of new connected user.

    peer.on("call", (call) => {
      // user2 sending his stream----while answering the call
      call.answer(myVideoStream);
      //////--------------------------------------
      /////---video type element created to house incoming video stream
      const video = document.createElement("video");
      //////-------------adding and playing the received videostream of user1
      call.on("stream", (user1VideoStream) => {
        addVideoStream(video, user1VideoStream);
      });
      /////////////--------------------------------
    });

    /////////////----------------------------
    socket.on("user-connected", (userId, name) => {
      // function for sending our- video stream to the new connected user
      // this below function is executed by only those users that were already present in the room
      // as the "user-connected" broadcast was emmitted to the already present users only, and not the new user.
      connectToNewUser(userId, myVideoStream, name);
    });

    ///////////////-----------------SENDING & DISPLAYING MESSAGES
    // let text = document.querySelector('input') is same as below
    let text = $("input");

    // document.querySelector('html').keydown is same as below
    $("html").keydown((e) => {
      if (e.which == 13 && text.val().length !== 0) {
        console.log(text.val());
        socket.emit("message", text.val(), name);
        text.val("");
      }
    });

    socket.on("createMessage", (message, name1) => {
      console.log(
        `this is message from the server: ${message} with the name: ${name1}`
      );
      $("ul").append(
        `<li class="message"><i><b>${name1}</b></i>${message}</li>`
      );
      // for the messages-window only-----So, if message screen if full--------last message will be visible just above input box
      // So, basically we will be at the bottom of the message list.
      scrollToBottom();
    });
  });
/////////----------------------------------

peer.on("open", (id) => {
  console.log("my connection ID for joining the room", id);
  socket.emit("join-room", ROOM_ID, id, name);
});

const connectToNewUser = (userId, stream, name) => {
  console.log(
    `New User identified with userId: ${userId}. Connect to new user(via-video)`
  );
  $("ul").append(
    `<div class="entry_div"><li id="entered"><b>${name} entered!</b><br/></li></div>`
  );

  ////////----------- sending our stream to user2 via call.

  const call = peer.call(userId, stream);

  //-------------------------------------------------
  /////---video type element created to house incoming video stream
  const video = document.createElement("video");
  ////////---------adding and playing the videoStream received from user2.
  call.on("stream", (user2VideoStream) => {
    addVideoStream(video, user2VideoStream);
  });
};

const scrollToBottom = () => {
  // An element's scrollTop value is a measurement of the distance from the element's top to its topmost visible content.
  // When an element's content does not generate a vertical scrollbar, then its scrollTop value is 0.
  let d = document.querySelector(".main__chat_window");
  d.scrollTop = d.scrollHeight - d.clientHeight;
};

const scrollToRight = () => {
  let d = document.querySelector(".main");
  d.scrollLeft = d.scrollWidth - d.clientWidth;
};

///////////////////-----------MUTE-UNMUTE OUR AUDIO-----------------------------------------------///////////////////////
const muteUnmute = () => {
  // getAudioTracks() method gives a list of objects of AudioTracks present in our stream
  // 0th element in that list in our own AudioTrack, we can set its enabled property to true or false
  // to enable or disable our own AudioTrack respectively.
  console.log("So this is the myVideoStream:", myVideoStream);

  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setMuteUnmuteButton("unmute ", "-slash", "Unmute"); ///-----for changing the mike icon to unmute yourself(currently muted)
  } else {
    setMuteUnmuteButton("", "", "Mute"); ////------for changing the mike icon to mute yourself(currently unmuted)
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
};

const setMuteUnmuteButton = (a, b, c) => {
  const html = `<i class="${a}fas fa-microphone${b}"></i><span>${c}</span>`;
  document.querySelector(".main__mute_button").innerHTML = html;
};
///----------to mute and unmute
document.querySelector(".main__mute_button").addEventListener("click", () => {
  muteUnmute();
});

///////////////////////////////////////////////--------------------------------------------------------------------------------------

///////////////////-----------MUTE-UNMUTE OUR AUDIO-----------------------------------------------///////////////////////
const playStop = () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayStopButton("stop ", "-slash", "Play Video"); ///-----for changing the mike icon to unmute yourself(currently muted)
  } else {
    setPlayStopButton("", "", "Stop Video"); ////------for changing the mike icon to mute yourself(currently unmuted)
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
};

const setPlayStopButton = (a, b, c) => {
  const html = `<i class="${a}fas fa-video${b}"></i><span>${c}</span>`;
  document.querySelector(".main__video_button").innerHTML = html;
};
///----------to mute and unmute
document.querySelector(".main__video_button").addEventListener("click", () => {
  playStop();
});

//////////////////////////////////////////////////////////////////-------------to leave the meeting
document.querySelector(".red").addEventListener("click", () => {
  $("ul").append(
    `<div class="entry_div"><li id="entered"><b>${name} Left!</b><br/></li></div>`
  );
  socket.emit("room-left", name);
  location.assign("/meeting/exited");
});

socket.on("person-left", (name2) => {
  $("ul").append(
    `<div class="entry_div"><li id="entered"><b>${name2} Left!</b><br/></li></div>`
  );
});

//////////////////////////////////////////////////////////////////------------------

//------hide and unhide chat column
document.querySelector(".hide_chat").addEventListener("click", (e) => {
  document.querySelector(".main__right").classList.toggle("hide_class");
  document.querySelector(".main__left").classList.toggle("not_hide_class");
  scrollToRight();
});

window.addEventListener("resize", () => {
  let w = document.documentElement.clientWidth;
  if (w > 700) {
    document.querySelector(".main__right").classList.remove("hide_class");
    document.querySelector(".main__left").classList.remove("not_hide_class");
  }
});

if (document.documentElement.clientWidth > 700) {
  document.querySelector(".main__right").classList.remove("hide_class");
  document.querySelector(".main__left").classList.remove("not_hide_class");
}
