const socket = io();

//Elements
const $frmMessage = document.querySelector('#frmMessage');
const $inMessage = $frmMessage.elements.message;
const $btnSendMessage = document.querySelector('#btnSendMessage');
const $btnSendLocation = document.querySelector('#btnSendLocation');
const $messages = document.querySelector('#messages');
const $sidebar = document.querySelector('#sidebar');

//Templates
const tmpMessage = document.querySelector('#message-template').innerHTML;
const tmpLocationMessage = document.querySelector('#location-message-template').innerHTML;
const tmpSidebar = document.querySelector('#sidebar-template').innerHTML;

//Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true});

const autoScroll = () => {
    const $newMessage = $messages.lastElementChild;
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageYMargin = parseInt(newMessageStyles.marginBottom) + parseInt(newMessageStyles.marginTop);
    const newMessageHeight = $newMessage.offsetHeight + newMessageYMargin;
    const visibleHeight = $messages.offsetHeight;
    const containerHeight = $messages.scrollHeight;
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }
};

socket.on('message', (message) => {
    console.log(message);
    const html = Mustache.render(tmpMessage, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm:ss A'),
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
});

socket.on('locationMessage', (message) => {
    console.log(message);
    const html = Mustache.render(tmpLocationMessage, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm:ss A'),
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
});

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(tmpSidebar, {room, users});
    $sidebar.innerHTML = html;
});

$frmMessage.addEventListener('submit', (e) => {
    e.preventDefault();
    $btnSendMessage.setAttribute('disabled', 'disabled');
    const message = e.target.elements.message.value
    socket.emit('sendMessage', message, (error) => {
        $btnSendMessage.removeAttribute('disabled');
        $inMessage.value = '';
        $inMessage.focus();
        if (error) console.log(error);
        else console.log('Message delivered');
    });
});

$btnSendLocation.addEventListener('click', () => {
    if (!navigator.geolocation) return alert('Geolocation not supported by your browser');
    $btnSendLocation.setAttribute('disabled', 'disabled');
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, (message) => {
            $btnSendLocation.removeAttribute('disabled');
            console.log(message);
        });
    });
});

socket.emit('join', {username, room}, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});