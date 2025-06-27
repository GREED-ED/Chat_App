const socket = io()

const $messageForm = document.querySelector('#msgForm')
const $messageInput = document.querySelector('#msgIn')
const $messageButton = document.querySelector('button')
const $locationBtn = document.querySelector('#location')
const $message = document.querySelector('#messages')

//Template
const messageTemplate = document.querySelector('#messageTemplate').innerHTML
const locationTemplate = document.querySelector('#locationTemplate').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const { username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true})

const autoScroll = () =>{
    // New message element
    const $newMessage = $message.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $message.offsetHeight

    // Height of messages container
    const containerHeight = $message.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $message.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $message.scrollTop = $message.scrollHeight
    }
}

socket.on('message', (message) => {
    const html = Mustache.render(messageTemplate ,{
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm A')
    })
    $message.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('sharelocation', (url) =>{
    const html = Mustache.render(locationTemplate, {
        username: url.username,
        url: url.url,
        createdAt: moment(url.createdAt).format('h:mm A')
    })
    $message.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) =>{
    e.preventDefault(); 
    $messageButton.setAttribute('disabled', 'disabled')
   
    const message = e.target.elements.message.value
    socket.emit('sendMessage', message, (error) =>{
    $messageButton.removeAttribute('disabled')
    $messageInput.value = ''
    $messageInput.focus()

        if (error) {
            return console.log(error)
        }
        console.log('Message delivered!')
    })

})

$locationBtn.addEventListener('click', () =>{
    $locationBtn.setAttribute('disabled', 'disabled')
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.')
    }

    navigator.geolocation.getCurrentPosition((position) => {
        const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }
        socket.emit('sendLocation', location, (msg) =>{
            console.log(msg) 
            $locationBtn.removeAttribute('disabled')
        })
    })
})

socket.emit('join', { username, room }, (error) =>{
    if (error) {
        alert(error)
        location.href = '/'
    }
})