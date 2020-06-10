HashMap = function() {
    this.map = new Array();
};

HashMap.prototype = {
    put: function(key, value) {
        this.map[key] = value;
    },
    get: function(key) {
        return this.map[key];
    },
    getAll: function() {
        return this.map;
    },
    clear: function() {
        return this.map;
    },
    isEmpty: function() {
        return (this.map.size()==0);
    },
    remove: function(key) {
        delete this.map[key];
    },
    getKeys: function() {
        var keys = new Array();
        for(i in this.map) {
            keys.push(i);
        }
        return keys;
    }
};

// Make connection
var socket = io.connect('http://localhost:4000');

// Documents
const title = document.querySelector('#title');
const sendBtn = document.querySelector('#sendBtn');
const message = document.querySelector('#chatInput')
const attachFile = document.querySelector('#attachFile');
const newConversation = document.querySelector('#newConversation');  // To input callee number
const newParticipant = document.querySelector('#refer');  // To input callee number
const exitChatroom = document.querySelector('#depart');  // To input callee number

const chatPanel = document.querySelector('#chatPanel');

const refreshCallLog = document.querySelector('#refreshCallLog');
const refreshChatWindow = document.querySelector('#refreshChatWindow');

// To-Do: uname and uid need to get from the index.html for security
var uname = localStorage.getItem('name'); // set userID if exists 
var uid = localStorage.getItem('phonenumber'); // set userID if exists 
if(uid != '')    {
    socket.emit('join',uid);  
    console.log('joined: '+uid);

    title.textContent = uid; 

    uid_str = document.getElementById('uid');
    uid_str.textContent = uid;
} 

var callee = -1;  // current conversation partner

// group info - participants
participants = new HashMap();

// call log
var list = [];  
for (i=0;i<20;i++) {
    list.push(document.getElementById('callLog'+i));
}
var index = 0;    // # of call log lists
var listparam = []; // the params of list
var idx = new HashMap();   // hashmap for index

// initiate all elements of message log
var msglist = [];
var msglistparam = [];
var maxMsgItems = 50;
IMDN = new HashMap();

for (i=0;i<maxMsgItems;i++) {
    msglist.push(document.getElementById('msgLog'+i));

    // add listener        
    (function(index) {
        msglist[index].addEventListener("click", function() {
            console.log('click! index: '+index);
        })
    })(i);
}

// eventbase: To-Do: it will replated to indexed eventbase
var msgHistory = new HashMap();

assignNewCallLog(callee);  // make a call log for callee

function assignNewCallLog(id) {
    if(id != -1) {
        // make a history
        if(!msgHistory.get(id))
            msgHistory.put(id, new Array())
        
        idx.put(id, index);
        index++;   
        
        from = id;
        // console.log('from: '+ from + ' index: '+idx.get(from) );

        list[idx.get(from)].innerHTML = 
        `<div class="friend-drawer friend-drawer--onhover">
            <img class="profile-image" src="basicprofile.jpg" alt="">
            <div class="text">
                <h6 id='${from}_name'></h6>
            <p class="text-muted" id="${from}_text"></p>
            </div>
            <span class="time text-muted small" id="${from}_timestr"></span>
        </div>`;     
        
        var param = ['','',''];  // param[0] = name, parma[0] = text, param[1] = timestr
        listparam[idx.get(from)] = param;        
        listparam[idx.get(from)][0] = document.getElementById(from+'_name');
        listparam[idx.get(from)][1] = document.getElementById(from+'_text');
        listparam[idx.get(from)][2] = document.getElementById(from+'_timestr');    

        if(from[0]=='g') {
            // console.log("From: ", from);
            listparam[idx.get(from)][0].textContent = getNameofGroup(from, 32);
        }
        else {
            listparam[idx.get(from)][0].textContent = from;
        }
        
        var m = new HashMap();
        m.put('abc',10);

        callLog = msgHistory.get(callee);

        // add listener        
        (function(index, name) {
            list[index].addEventListener("click", function() {
                console.log('--> chatroom: '+idx.get(name)+' ('+name+')');

                if(name != callee) {
                    callee = name;

                    callLog = msgHistory.get(callee);                   
                    for(i=callLog.length-1;i>=0;i--) {
                        if(callLog[i].logType==0) {  
                            if(callLog[i].status==1) { // If display notification needs to send
                                // console.log('send display notification: '+callLog[i].msg.MsgID);
                                sendDisplayNoti(callLog[i].msg.From, callLog[i].msg.Originated, callLog[i].msg.MsgID);
                                callLog[i].status = 2;
                            }
                            else break;
                        }
                    }
                    setConveration(name);
                    updateChatWindow(name); 
                } 
            })
        })(idx.get(from),from);
    }
}

function updateCalllog() {
    keys = msgHistory.getKeys();
//    console.log('key length: '+keys.length);

    for(i=0;i<keys.length;i++) {
//        console.log('key: '+keys[i]);

        var callLog = msgHistory.get(keys[i]);
        from = keys[i];
        
        if(callLog.length>0) {
            var text = callLog[callLog.length-1].msg.Body;
            var date = new Date(callLog[callLog.length-1].msg.Timestamp * 1000);
            var timestr = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();

        //    console.log('From: '+from+' Text: '+text+' Timestr: '+timestr);

            if(from[0]=='g') {
//                console.log("groupchat: "+ from);
                listparam[idx.get(from)][0].textContent = getNameofGroup(from, 32);
            }
            else {
                listparam[idx.get(from)][0].textContent = from;
            }

            listparam[idx.get(from)][1].textContent = text; 
            listparam[idx.get(from)][2].textContent = timestr; 
        } else {
            from = keys[i];

            if(from[0]=='g') {
//                console.log("groupchat: "+ from);
                listparam[idx.get(from)][0].textContent = getNameofGroup(from, 32);
            }
            else {
                listparam[idx.get(from)][0].textContent = from;
            }

            listparam[idx.get(from)][1].textContent = ''; 
            listparam[idx.get(from)][2].textContent = '';
        }
    }
}

// initialize 
setConveration(callee);
updateChatWindow(callee);

// earn the desternation number from "invite.html"
function setDest(id) {
    console.log('Destination: '+id);
    callee = id;

    if(!msgHistory.get(callee)) {
        assignNewCallLog(callee);
    }

    setConveration(callee);
    updateChatWindow(callee);
}

function StartNewChat(participantList) {
    console.log('The earn participant list; '+participantList);

    if(participantList.length==1) { // 1 to 1 chat
        callee = participantList[0];
    }
    else if(participantList.length==2 && participantList[0]==uid) { // 1 to 1 chat
        callee = participantList[1];
    }
    else if(participantList.length==2 && participantList[1]==uid) { // 1 to 1 chat
        callee = participantList[0];
    }
    else { // groupchat
        isIncluded = false
        for(i=0;i<participantList.length;i++) {  // if the owner is not included in the participants list, add it
            if(participantList[i] == uid) {
                isIncluded = true;
                break;
            }
        }
        if(isIncluded == false) participantList.push(uid);

        // To-Do
        // If there is a duplicated groupchat which has the same participants, use the groupID
        
        console.log('size: '+participantList.length);

        grpID = 'group_'+uuidv4();
        // console.log(grpID)

        var date = new Date();
        var timestamp = Math.floor(date.getTime()/1000);
                
        const chatmsg = {
            EvtType: "create",
            From: uid,
            Originated: uid,
            To: grpID,
            MsgID: "",
            Timestamp: timestamp,
            Body: JSON.stringify(participantList)
        };

        const msgJSON = JSON.stringify(chatmsg);
        
        console.log('create groupchat: ' + grpID + ' with=' + participantList);
        participants.put(grpID, participantList)
        
        socket.emit('chat', msgJSON);  // creat groupchat

        callee = grpID;
    }

    if(!msgHistory.get(callee)) {
        assignNewCallLog(callee);
    }
    
    setConveration(callee);
    updateChatWindow(callee);
}

// getCurrentParticipants is to deliver the current participant list to "invite.js"
function getCurrentParticipants() {
    var participantList = participants.get(callee);
    console.log("current: "+participantList)

    return participantList;
}

// addNewParticipant is to refer for new participants
function addNewParticipant(addedparticipantList) {
    console.log('The added participant list; '+addedparticipantList);
//    console.log('size: '+addedparticipantList.length);
//    console.log("callee: ", callee);

    var date = new Date();
    var timestamp = Math.floor(date.getTime()/1000);
        
    const chatmsg = {
        EvtType: "refer",
        From: uid,
        Originated: uid,
        To: callee,
        MsgID: "",
        Timestamp: timestamp,
        Body: JSON.stringify(addedparticipantList)
    };

    const msgJSON = JSON.stringify(chatmsg);
    
    console.log('<-- refer: ' + addedparticipantList);
    
    socket.emit('chat', msgJSON);  // refer 

    // refer can be failed
/*    participantList = participants.get(callee);
    for(i=0;i<addedparticipantList.length;i++) {
        participantList.push(addedparticipantList[i]);
    }
    participants.put(callee, participantList)
    
    // update callLog, Conversation, ChatWindow
    updateCalllog();        
    setConveration(callee);
    updateChatWindow(callee); */
}

// Listeners
message.addEventListener('keyup', function(e){
    if (e.keyCode == 13) {
        onSend(e);
    }
});

refreshCallLog.addEventListener('click', function(){
    console.log('update callupdate call logs');
    updateCalllog();
});

refreshChatWindow.addEventListener('click', function(){
    console.log('update chat window');
    updateChatWindow(callee);
});

attachFile.addEventListener('click', function(){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", "http://localhost:8080/search/kyopark", false ); // false for synchronous request
    xmlHttp.send( null );
    console.log(xmlHttp.responseText);

    var input = $(document.createElement('input')); 
    input.attr("type", "file");
    input.trigger('click');
    return false;
});

newConversation.addEventListener('click', function(){
    var popUrl = "invite.html";	
	var popOption = "width=400, height=500, resizable=no, scrollbars=no, status=no;";    
        window.open(popUrl,"",popOption);
});

newParticipant.addEventListener('click', function(){
    console.log('callee: '+ callee);
    if(callee==-1) {
        alert("Make a chatroom first!")
    }
    else {
        var popUrl = "invite_refer.html";	
        var popOption = "width=400, height=500, resizable=no, scrollbars=no, status=no;";    
            window.open(popUrl,"",popOption);
    }
});

exitChatroom.addEventListener('click', function(){
    console.log('callee: '+ callee);
    console.log('left!!');
    if(callee[0]=='g') {
     /*   var popUrl = "invite_refer.html";	
        var popOption = "width=400, height=500, resizable=no, scrollbars=no, status=no;";    
            window.open(popUrl,"",popOption); */

        var r = window.confirm("You will be left this groupchat!");
        if (r == true) {
            var date = new Date();
            var timestamp = Math.floor(date.getTime()/1000);
                
            const chatmsg = {
                EvtType: "depart",
                From: uid,
                Originated: uid,
                To: callee,
                MsgID: '',
                Timestamp: timestamp,
                Body: ''
            };
            
            const msgJSON = JSON.stringify(chatmsg);
            
            console.log('depart : ' + callee);

            participantList = participants.get(callee);
            var newList = new Array();
            for(i=0;i<participantList.length;i++) {
                if(participantList[i])
                    newList.push(participantList[i]);
            }
            participants.put(callee, newList);

            console.log('newList: '+newList);

            socket.emit('chat', msgJSON);  // refer 

            // update callLog, Conversation, ChatWindow
            updateCalllog();        
            setConveration(callee);
            updateChatWindow(callee);
        } 
    }
});


sendBtn.addEventListener('click', onSend);

function onSend(e) {
    e.preventDefault();

    if(message.value != '' && callee != -1) {
        var date = new Date();
        var timestamp = Math.floor(date.getTime()/1000);
            
        const chatmsg = {
            EvtType: "message",
            From: uid,
            Originated: uid,
            To: callee,
            MsgID: uuidv4(),
            Timestamp: timestamp,
            Body: message.value
        };

        const msgJSON = JSON.stringify(chatmsg);
    //    console.log(msgJSON);
    
        // update call log
        var date = new Date(timestamp * 1000);
        var timestr = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();

        if(callee[0] == 'g') listparam[idx.get(callee)][0].textContent = getNameofGroup(callee, 32); 
        else listparam[idx.get(callee)][0].textContent = callee; 

        listparam[idx.get(callee)][1].textContent = message.value; 
        listparam[idx.get(callee)][2].textContent = timestr; 

        // console.log('participant: '+ participants.get(callee));
        var cnt;
        if(callee[0] == 'g') cnt = participants.get(callee).length-1;
        else cnt = 1;

        // save the sent message
        const log = {
            logType: 1,    // 1: sent, 0: receive
            status: 0,     // 0: sent, 1: delivery, 2: display
            readCount: cnt,
            msg: chatmsg
        };

        callLog = msgHistory.get(callee);
        callLog.push(log);

        console.log('<-- sent: '+log.msg.MsgID+' To:'+log.msg.To + ' ' + log.msg.Body);
        
        updateChatWindow(callee);

        // send the message
        socket.emit('chat', msgJSON);
    }
    
    message.value = "";
}

function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

// receive the id of callee from "invite.html"
function setConveration(id) {
    if(id != -1) {
        if(id[0] == 'g') {
            calleeName.textContent = 'Groupchat'
            calleeId.textContent = getNameofGroup(id, 55); 
        }
        else {
            calleeName.textContent = 'Name'+id;  // To-do: next time, it will be earn from the profile server
            calleeId.textContent = id;
        }
    }
}

function getNameofGroup(id, maxLength) {
    var participantList=participants.get(id);
//    console.log('id: '+id + ' list: ' +participantList)
    
    var index=0;
    var participantStr='';
    for(i=0;i<participantList.length;i++) {        
        if(participantList[i] != uid) {
            if(index==0) {
                participantStr = participantList[i];
                index++;
            }
            else {
                participantStr += (', '+participantList[i]);
                index++;
            }
        }
    } 

//    console.log('length:'+participantStr.length +' new: ',participantStr.substring(0,maxLength));
    if(participantStr.length>maxLength) return participantStr.substring(0,maxLength)+'...';
    else return participantStr;
}

// Listen events to receive a message
socket.on('chat', function(event){
    var date = new Date(event.Timestamp * 1000);
    var timestr = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();

    if(event.EvtType == 'message') {
        console.log('--> received: '+event.Body+' id:'+event.MsgID+' (from:'+event.From +' '+event.Originated+ ')');

        // if the sender is not in call list, create a call log
        if(!msgHistory.get(event.From)) {
            assignNewCallLog(event.From);      

//            console.log('New hashmap table was created: '+event.From);
        }

        const log = {
            logType: 0,    // 1: sent, 0: receive
            status: 0,     // 0: sent, 1: delivery, 2: display
            msg: event
        };
        callLog = msgHistory.get(event.From);
        callLog.push(log);
        
        // show received message
        if(callee == -1) {
            callee = event.From;

            setConveration(callee);
            updateChatWindow(callee); 
        }

        if(callee == event.From) {
            updateChatWindow(callee);
        }

        // update the call log 
        if(event.From[0]=='g') listparam[idx.get(event.From)][0].textContent = getNameofGroup(event.From, 32); 
        else listparam[idx.get(event.From)][0].textContent = event.From; 

        listparam[idx.get(event.From)][1].textContent = event.Body; 
        listparam[idx.get(event.From)][2].textContent = timestr;

        sendDeliveryNoti(event.From, event.Originated, event.MsgID);
        log.status = 1;
        callLog[msgHistory.length-1] = log;
        
        // send display report
        focused = document.hasFocus();
//        console.log('focus: ', focused);

        if(focused) {
            imdnIDX = IMDN.get(event.MsgID)
            if(imdnIDX) {
                callLog[imdnIDX].status = 2;
                sendDisplayNoti(event.From, event.Originated, event.MsgID);
            }            
        } 
    }
    else if(event.EvtType == 'delivery') {
        console.log('--> delivery report was received: '+event.MsgID);        

        imdnIDX = IMDN.get(event.MsgID)
        console.log('imdn index: '+imdnIDX+' readCount='+callLog[imdnIDX].readCount);

        // change status from 'sent' to 'delivery'
        callLog = msgHistory.get(event.From);
        if(callLog[imdnIDX].status == 0) {
            callLog[imdnIDX].status = 1;
        }
            
        // console.log('imdn index: '+imdnIDX+' readCount='+callLog[imdnIDX].readCount);
        msglistparam[imdnIDX].textContent = callLog[imdnIDX].readCount;  
    }    
    else if(event.EvtType == 'display') {
        console.log('--> display report was received: '+event.MsgID);        

        // change status from 'sent' to 'delivery'
        imdnIDX = IMDN.get(event.MsgID)
        callLog = msgHistory.get(event.From);
        callLog[imdnIDX].status = 2;   
        
        if(callLog[imdnIDX].readCount>=1) callLog[imdnIDX].readCount--;
            
        console.log('imdn index: '+imdnIDX+' readCount='+callLog[imdnIDX].readCount);
        if(callLog[imdnIDX].readCount==0) 
            msglistparam[imdnIDX].textContent = '\u00A0'; 
        else
            msglistparam[imdnIDX].textContent = callLog[imdnIDX].readCount; 
    } 
    else {  // for group info
        if(event.EvtType == 'subscribe') {
            participants.put(event.From, JSON.parse(event.Body))
        }
        else if(event.EvtType == 'join') {
            participantList = participants.get(event.From);
            list = JSON.parse(event.Body);
    
            for(i=0;i<list.length;i++) 
                participantList.push(list[i]);
            
            participants.put(event.From, participantList);       
        }
        else if(event.EvtType == 'depart') {
            participantList = participants.get(event.From);
            newParticipantList = '';
            for(i=0;i<event.Participants.length;i++) {
                if(event.Participants[i]!=event.Originated) {
                    newparticipantList.push(participantList[i]);
                }
            }
            participants.put(event.From, participantList);
        }
        updateCalllog();
        setConveration(event.From);
        updateCalllog();
    }
/*    else {
        console.log('received event: '+event.EvtType+' group:'+event.From+' ('+event.Originated+')');   

        participantList = participants.get(callee);
        newList = new Array();
        for (i=0;i<participantList.length;i++) {
            if(participantList[i] != event.Originated) {
                newList.push(participantList[i]);
            }
        }

        participants.put(callee, newList);

        console.log("newList: "+newList);

        updateCalllog();
        setConveration(callee);
        updateChatWindow(callee); 
    } */
});

(function() {
    window.addEventListener("focus", function() {
//        console.log("Back to front");

        if(msgHistory.get(callee))
            updateCallLogToDisplayed();
    })
})();

function updateCallLogToDisplayed() {
    callLog = msgHistory.get(callee);                   

/*    for(i=0;i<callLog.length;i++) {
        console.log(callLog[i].logType+' '+callLog[i].status+' '+callLog[i].msg.From+' '+callLog[i].msg.MsgID)
    } */
    
    for(i=callLog.length-1;i>=0;i--) {
        if(callLog[i].logType==0) {  
            if(callLog[i].status==1) { // If display notification needs to send
                sendDisplayNoti(callLog[i].msg.From, callLog[i].msg.Originated, callLog[i].msg.MsgID);
                callLog[i].status = 2;
            }
            else break;
        }  
    }
}

function sendDeliveryNoti(To, Originated, MsgID) {
    // send delivery report
    console.log('<-- delivery: '+MsgID);

    var date = new Date();
    var timestamp = Math.floor(date.getTime()/1000);
    
    const deliverymsg = {
        EvtType: "delivery",
        From: uid,
        Originated: Originated,
        To: To,
        MsgID: MsgID,
        Timestamp: timestamp,
    };
    
    const deliveryJSON = JSON.stringify(deliverymsg);
                
    socket.emit('chat', deliveryJSON);    
}

function sendDisplayNoti(To, Originated, MsgID) {
   console.log('<-- display: '+MsgID);    

    var date = new Date();
    var timestamp = Math.floor(date.getTime()/1000);
            
    const displaymsg = {
        EvtType: "display",
        From: uid,
        Originated: Originated,
        To: To,
        MsgID: MsgID,
        Timestamp: timestamp,
    };
            
    const displayJSON = JSON.stringify(displaymsg);
                
    // send the display message
    socket.emit('chat', displayJSON);   
}

function addSenderMessage(index,timestr,text,status,readCount) {
    // console.log("sent message: "+text+' status='+status + ' readcount=',readCount);

    msglist[index].innerHTML = 
        `<div class="chat-sender chat-sender--right"><h1>${timestr}</h1>${text}&nbsp;<h2 id="status${index}"></h2></div>`;   
       // To-Do In orter to manager that all characters are blank, inserted a blank but I will fix it later.
       
    msglistparam[index] = document.getElementById('status'+index);
    
    if(status==0) {
        msglistparam[index].textContent = '\u00A0';
    } 
    else if(status==1 || status==2) {
        if(readCount == 0)
            msglistparam[index].textContent = '\u00A0'; 
        else
            msglistparam[index].textContent = readCount; 
    }
    
    // console.log(msglist[index].innerHTML);
}

function addReceiverMessage(index, sender,timestr, msg) {
//    console.log("add received message: "+msg);

    msglist[index].innerHTML =  
    `<div class="chat-receiver chat-receiver--left"><h1>${sender}</h1><h2>${timestr}</h2>${msg}&nbsp;</div>`;     

//    console.log(msglist[index].innerHTML);   
}

function updateChatWindow(from) {
    if(from != -1) {
        // clear chat window
        for (i=0;i<maxMsgItems;i++) {
            msglist[i].innerHTML = '';
        }
        IMDN.clear();

        callee = from;

        // load callLog
        callLog = msgHistory.get(from);

        // shows maxMsgItems messages based on arrived order    
        if(callLog.length < maxMsgItems) start = 0;
        else start = callLog.length - maxMsgItems;

        for(i=start;i<callLog.length;i++) {
            var date = new Date(callLog[i].msg.Timestamp * 1000);            
            var timestr = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();

            if(callLog[i].logType == 1) {
                // console.log('Text: ',callLog[i].msg.Body)
                addSenderMessage(i-start,timestr,callLog[i].msg.Body,callLog[i].status,callLog[i].readCount);

                IMDN.put(callLog[i].msg.MsgID, i-start);
            }
            else {
                if(callLog[i].msg.Originated == '')
                    addReceiverMessage(i-start,callLog[i].msg.From,timestr,callLog[i].msg.Body);  // To-Do: event.From -> Name       
                else 
                    addReceiverMessage(i-start,callLog[i].msg.Originated,timestr,callLog[i].msg.Body);  
            }
        }

        chatPanel.scrollTop = chatPanel.scrollHeight;  // scroll needs to move bottom
    }
}

socket.on('typing', function(event){
    feedback.innerHTML = '<p><em>' + event + ' is typing a message...</em></p>';
    
});
