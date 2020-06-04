// Make connection
var socket = io.connect('http://localhost:4000');

// Query DOM
var message = document.getElementById('message'),
    from = document.getElementById('from'),
    to = document.getElementById('to'),
    btn = document.getElementById('send'),
    output = document.getElementById('output'),
    feedback = document.getElementById('feedback'),
    title = document.getElementById('title');

var fromID = localStorage.getItem('from'); // set userID if exists 
if(fromID != '')    {
    from.value = fromID;
}

var toID = localStorage.getItem('to'); // set userID if exists 
if(toID != '')    {
    to.value = toID;
}

var subscribed = false;

function onSend(e) {
    if(from.value=='' || to.value=='') {
        alert("Sender/Receiver should not be blank");
    }
    else if(message.value != '') {
        if(subscribed == false) {
            subscribed = true;
            socket.emit('join',from.value);  
        }
        if(fromID != from.value) {
            fromID = from.value;  // update
            localStorage.setItem('from', from.value)  
        }
        if(toID != to.value) {
            toID = to.value;  // update
            localStorage.setItem('to', to.value) 
        }
           
        var date = new Date();
        var timestamp = Math.floor(date.getTime()/1000);
        
        const chatmsg = {
            from: from.value,
            to: to.value,
            timestamp: timestamp,
            message: message.value
        };

        const msgJSON = JSON.stringify(chatmsg);
        console.log(msgJSON);

        // show the message
        var timestr = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
        output.innerHTML += '<div style="display: flex; justify-content: flex-end"><p>'+ message.value +'     <strong>('+ timestr+')</strong></p></div>';        
        output.scrollIntoView(false);

        // send the message
        socket.emit('chat', msgJSON);
    }

    message.value = "";
}

// Button - to send a message
btn.addEventListener('click', onSend);

// message box
message.addEventListener('keypress', function(e){
    socket.emit('typing', name.value);

    if(e.keyCode==13) {
        onSend(e);
    }
})

// Listen for events 
socket.on('chat', function(data){
    feedback.innerHTML = '';

    var date = new Date(data.Timestamp * 1000);
    var timestr = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
  
    if(data.EvtType == 'message') {
        output.innerHTML += '<p><strong>' + toID  + ': </strong>' + data.Text +'     <strong>('+ timestr+')</strong></p>';      
    }
        
    output.scrollIntoView(false);
  });

// Listen for events 
socket.on('participant', function(data){
    title.textContent = 'Web Chat (' + data + ')';
    console.log('update participants');
});

socket.on('typing', function(data){
    feedback.innerHTML = '<p><em>' + data + ' is typing a message...</em></p>';
});