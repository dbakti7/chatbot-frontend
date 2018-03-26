// export function for listening to the socket
// might be obsolete now
module.exports = function (socket) {

  socket.on('send:message', function (data) {
    
  });

  socket.on('disconnect', function () {
    
  });
};