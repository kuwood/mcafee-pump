import io from 'socket.io-client';
const socket = io('https://streamer.cryptocompare.com/');

// the websocket server does not currently have data for all coins
const socketHandler = {
  message: socket.on('m', message => console.log(message)),
  subscribeTo: (sub) => {
    socket.emit('SubAdd', sub);
  },
  unsubscribe: (items) => socket.emit('SubRemove', items)
}

export default socketHandler;