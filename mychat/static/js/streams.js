import  {appId}  from './config.js'

const APP_ID = appId;
console.log('hhhhhhhhhhh' ,APP_ID);
/* const APP_ID = 'b66a1b0354e14da991e9aca3aa964e44'
 */const CHANNEL = sessionStorage.getItem('room')
const TOKEN = sessionStorage.getItem('token')
let UID = sessionStorage.getItem('UID')
let NAME = sessionStorage.getItem('name')
const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })

let localTracks = [] // local client 
let remoteUsers = {}

let joinAndDisplayLocalStream = async () => {
    document.getElementById('room-name').innerText = CHANNEL

    //display other users when they join the room
    client.on('user-published', handleUserJoin)
    //delete the display container of a leaving user
    client.on('user-left', handleUserLeft)

    try {
        await client.join(APP_ID, CHANNEL, TOKEN, UID)
    } catch (error) {
        console.error(error)
        window.open('/', '_self') // redirect to homepage if error 
    }



    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks()

    let member = await createMember()
    let player = `
                     <div class="video-container" id="user-container-${UID}">
                        <div class="username-wrapper"><span class="user-name">${member.name}</span></div>
                        <div class="video-player" id="user-${UID}"></div>
                    </div>`
    document.getElementById('video-streams').insertAdjacentHTML('beforeend', player)

    localTracks[1].play(`user-${UID}`)

    //let other users can see me
    await client.publish([localTracks[0], localTracks[1]])

}

let handleUserJoin = async (user, mediaType) => {
    remoteUsers[user.uid] = user
    await client.subscribe(user, mediaType)
    if (mediaType == 'video') {
        //check if the user's videoplayer does not already exists ( refresh page or leaving & rejoining the room issues)
        let player = document.getElementById(`user-container-${user.uid}`)
        if (player != null) {
            player.remove()
        }
        let member = await getMember(user)
        player = `
                     <div class="video-container" id="user-container-${user.uid}">
                        <div class="username-wrapper"><span class="user-name">${member.name}</span></div>
                        <div class="video-player" id="user-${user.uid}"></div>
                    </div>`
        document.getElementById('video-streams').insertAdjacentHTML('beforeend', player)
        user.videoTrack.play(`user-${user.uid}`)
    }
    if (mediaType == 'audio') {
        user.audioTrack.play()
    }
}
let handleUserLeft = async (user) => {
    delete remoteUsers[user.uid]

    document.getElementById(`user-container-${user.uid}`).remove()
}

let leaveAndRemoveLocalStream = async () => {
    for (let i = 0; i < localTracks.length; i++) {
        localTracks[i].stop()// stop is not enough becose we still able to reopen the track
        localTracks[i].close()// the only way to open a track is to create a new one   
    }
    await client.leave()
    deleteMember()
    window.open('/', '_self')//redirect to homepage
}

let toggleCamera = async (e) => {
    if (localTracks[1].muted) {//if true => camara of
        await localTracks[1].setMuted(false)

        e.target.style.backgroundColor = '#fff'
    } else {
        await localTracks[1].setMuted(true)
        e.target.style.backgroundColor = 'rgb(255, 80, 80, 1)'
    }
}
let toggleMicro = async (e) => {
    if (localTracks[0].muted) {//if true => microphone of
        await localTracks[0].setMuted(false)

        e.target.style.backgroundColor = '#fff'
    } else {
        await localTracks[0].setMuted(true)
        e.target.style.backgroundColor = 'rgb(255, 80, 80, 1)'
    }
}
let createMember = async () => {
    let response = await fetch('/create_member/', {
        method: 'POST',
        headers: {
            'Content-Type': ' application/json'
        },
        body: JSON.stringify({ 'name': NAME, 'UID': UID, 'room_name': CHANNEL })
    })
    let member = await response.json()
    return member
}

let getMember = async (user) => {
    let response = await  fetch(`/get_member/?uid=${user.uid}&room_name=${CHANNEL}`)
    let member = await response.json()
    return member
    
}

let deleteMember = async () => {
    let response = await fetch('/delete_member/', {
        method: 'POST',
        headers: {
            'Content-Type': ' application/json'
        },
        body: JSON.stringify({ 'name': NAME, 'room_name': CHANNEL , 'UID': UID})
    })
    let member = await response.json()
}

joinAndDisplayLocalStream()

window.addEventListener('beforeunload',deleteMember)
document.getElementById('leave-btn').addEventListener('click', leaveAndRemoveLocalStream)
document.getElementById('video-btn').addEventListener('click', toggleCamera)
document.getElementById('mic-btn').addEventListener('click', toggleMicro)

console.log(' stream.js connected')