var host = 'localhost';

// Make connection
var socket = io.connect('http://'+host+':4000');

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

    SetProfile(uid, uname);
} 

var callee = -1;  // current conversation partner

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

// group info - participants
participants = new HashMap();

// call log list
var maxListItems = 20;
var list = [];  
for (i=0;i<maxListItems;i++) {
    list.push(document.getElementById('callLog'+i));
}
var index = 0;    // # of call log lists
var listparam = []; // the params of list
var listIDX = new HashMap();   // hashmap for index

// message log list
var msglist = [];
var msglistparam = [];
var maxMsgItems = 50;
var msgIDX = new HashMap();

// eventbase: To-Do: it will replated to indexed eventbase
var msgHistory = new HashMap();

// closed group list
var closedGroup = new HashMap();

for (i=0;i<maxMsgItems;i++) {
    msglist.push(document.getElementById('msgLog'+i));

    // add listener        
    (function(index) {
        msglist[index].addEventListener("click", function() {
            console.log('click! index: '+index);

            callLog = msgHistory.get(callee);
            if(callLog.length < maxMsgItems) i = index;
            else i = index + maxMsgItems;

            console.log("index=",index+' readcount:', callLog[i].readCount + ' body:', callLog[i].msg.Body+ ' status:',callLog[i].status);
        })
    })(i);
}

members = loadProfiles();
memberSize = 0;

assignNewCallLog(callee);  // make a call log for callee

function assignNewCallLog(id) {
    if(id != -1) {
        // make a history
        if(!msgHistory.get(id))
            msgHistory.put(id, new Array())
        
        listIDX.put(id, index);
        index++;    
        if(index>=maxListItems) {
            list = listIDX.getAll();

            listIDX.clear();
            for(i=0;i<maxListItems;i++) {
                listIDX.put(list[index-maxListItems+i],i); // check this logic later
            }
        }
        
        from = id;
        // console.log('from: '+ from + ' index: '+listIDX.get(from) );

        list[listIDX.get(from)].innerHTML = 
        `<div class="friend-drawer friend-drawer--onhover">
            <img class="profile-image" src="basicprofile.jpg" alt="">
            <div class="text">
                <h6 id='${from}_name'></h6>
            <p class="text-muted" id="${from}_text"></p>
            </div>
            <span class="time text-muted small" id="${from}_timestr"></span>
        </div>`;     
        
        var param = ['','',''];  // param[0] = name, parma[0] = text, param[1] = timestr
        listparam[listIDX.get(from)] = param;        
        listparam[listIDX.get(from)][0] = document.getElementById(from+'_name');
        listparam[listIDX.get(from)][1] = document.getElementById(from+'_text');
        listparam[listIDX.get(from)][2] = document.getElementById(from+'_timestr');    

        if(from[0]=='g') {
            listparam[listIDX.get(from)][0].textContent = getNameofGroup(id, 32);
        }
        else {
            listparam[listIDX.get(from)][0].textContent = members.get(from);
        }
        
        callLog = msgHistory.get(callee);
        // add listener        
        (function(index, name) {
            list[index].addEventListener("click", function() {
                console.log('--> chatroom: '+listIDX.get(name)+' ('+name+')');

                if(name != callee) {
                    callee = name;

                    callLog = msgHistory.get(callee);                   
                    for(i=callLog.length-1;i>=0;i--) {
                        if(callLog[i].logType==0) {  // receive
                            if(callLog[i].status==1) { // If display notification needs to send
                                // console.log('send display notification: '+callLog[i].msg.MsgID);
                                sendDisplayNoti(callLog[i].msg);
                                callLog[i].status = 2;
                            }
                            else break;
                        }
                    }

                    if(closedGroup.get(callee) == 1) {
                        console.log(callee+' was closed previously');
                        setConveration(name);
                    } 
                    else {
                        setConveration(name);
                    }

                    updateChatWindow(name); 
                } 
            })
        })(listIDX.get(from),from);
    }
}

function updateCalllog() {
    keys = msgHistory.getKeys();
    console.log('key length: '+keys.length);

    for(i=0;i<keys.length;i++) {
        console.log('key: '+keys[i]);

        var callLog = msgHistory.get(keys[i]);
        from = keys[i];
        
        if(callLog.length>0) {
            if(callLog[callLog.length-1].logType == 0 || callLog[callLog.length-1].logType == 1) {  // send, receive
                var text = callLog[callLog.length-1].msg.Body;
                var date = new Date(callLog[callLog.length-1].msg.Timestamp * 1000);
                var timestr = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
            }
            else { // notify
                var text = callLog[callLog.length-1].msg;
                var timestr = '';
            }

            console.log('From: '+from+' Text: '+text+' Timestr: '+timestr);

            if(from[0]=='g') {
//                console.log("groupchat: "+ from);
                if (closedGroup.get(from) == 1) listparam[listIDX.get(from)][0].textContent = 'Closed Group';
                else listparam[listIDX.get(from)][0].textContent = getNameofGroup(from, 32);
            }
            else {
                listparam[listIDX.get(from)][0].textContent = from;
            }

            listparam[listIDX.get(from)][1].textContent = text; 
            listparam[listIDX.get(from)][2].textContent = timestr; 
        } else {
            from = keys[i];

            if(from[0]=='g') {
//                console.log("groupchat: "+ from);
                listparam[listIDX.get(from)][0].textContent = getNameofGroup(from, 32);
            }
            else {
                listparam[listIDX.get(from)][0].textContent = members.get[from];
            }

            listparam[listIDX.get(from)][1].textContent = ''; 
            listparam[listIDX.get(from)][2].textContent = '';
        }
    }
}

// initialize 
setConveration(callee);
updateChatWindow(callee);

// load all profiles 
function loadProfiles() {
    console.log("Get all profiles");
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( 'GET', 'http://'+host+':4040/getall', false ); // false for synchronous request      
    xmlHttp.send( null );
    
    const jsonObject = JSON.parse(xmlHttp.responseText)
//    console.log(jsonObject);
    
    members = new HashMap();
    memberSize = jsonObject.length;
    
    for(i=0;i<jsonObject.length;i++) {
        const profile = JSON.parse(jsonObject[i]);
//        console.log('uid: ' + profile.UID + ' name: '+profile.Name);
    
        members.put(profile.UID, profile.Name);
    }

    return members
}

// load a profile
function loadProfile(id) {
//    console.log('load profile: '+id);
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( 'GET', 'http://'+host+':4040/search/'+id, false ); // false for synchronous request      
    xmlHttp.send( null );
    
    const profile = JSON.parse(xmlHttp.responseText);
//    console.log('uid: ' + profile.UID + ' name: '+profile.Name);
    
    members.put(profile.UID, profile.Name);
}

// Save profile of owner
function SetProfile(id, name) {
    console.log(id, name);
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( 'POST', 'http://'+host+':4040/add', false ); // false for synchronous request      

    const profile = {
        UID: id,
        Name: name
    }
    
    const profileJSON = JSON.stringify(profile);
    console.log(profileJSON);

//    xmlHttp.send(null);
    xmlHttp.send(profileJSON);
    
    console.log(xmlHttp.responseText);
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
            EvtType: 'create',
            From: grpID,
            Originated: uid,
            To: grpID,
            MsgID: '',
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

function RejoinGroupchat(event) {
    var date = new Date();
    var timestamp = Math.floor(date.getTime()/1000);
                
    const chatmsg = {
        EvtType: "rejoin",
        From: event.From,
        Originated: uid,
        To: event.From,
        MsgID: "",
        Timestamp: timestamp,
        Body: ""
    };

    const msgJSON = JSON.stringify(chatmsg);
        
    console.log('<-- rejoin groupchat: ' + event.From);
        
    socket.emit('chat', msgJSON);  // creat groupchat

    callee = event.From;
}

// getCurrentParticipants is to deliver the current participant list to "invite.js"
function getCurrentParticipants() {
    if(callee[0] == 'g') {
        var participantList = participants.get(callee);
    }
    else {
        var participantList = new Array();
        participantList.push(uid)
        participantList.push(callee); 
    }

    console.log("current participants: "+participantList)

    return participantList;
}

// addNewParticipant is to refer for new participants
function addNewParticipant(addedparticipantList) {
    console.log('The added participant list; '+addedparticipantList);
//    console.log('size: '+addedparticipantList.length);
//    console.log("callee: ", callee);

    if(callee[0] == 'g') {
        var date = new Date();
        var timestamp = Math.floor(date.getTime()/1000);
            
        const chatmsg = {
            EvtType: "refer",
            From: callee,
            Originated: uid,
            To: callee,
            MsgID: "",
            Timestamp: timestamp,
            Body: JSON.stringify(addedparticipantList)
        };

        const msgJSON = JSON.stringify(chatmsg);
        
        console.log('<-- refer: ' + addedparticipantList);
        
        socket.emit('chat', msgJSON);  // refer 
    }
    else {  // upgrade from 1-to-1 to groupchat
        participantList = addedparticipantList;
        participantList.push(uid);
        participantList.push(callee);
        StartNewChat(participantList); 
    }
}

// Listeners
message.addEventListener('keyup', function(e){
    if (e.keyCode == 13) {
        onSend(e);
    }
});

refreshCallLog.addEventListener('click', function(){
    console.log('update call logs');
    updateCalllog();
});

refreshChatWindow.addEventListener('click', function(){
    console.log('update chat window');
    updateChatWindow(callee);
});

attachFile.addEventListener('click', function(){
    if(callee != -1 && closedGroup.get(callee) != 1) {
        var input = $(document.createElement('input')); 
        input.attr("type", "file");
        input.trigger('click');
        return false;
    }
});

newConversation.addEventListener('click', function(){
    var popUrl = "invite.html";	
	var popOption = "width=400, height=500, resizable=no, scrollbars=no, status=no;";    
        window.open(popUrl,"",popOption);
});

newParticipant.addEventListener('click', function(){
    console.log('callee: '+ callee);
    if(closedGroup.get(callee)!=1) {
        if(callee==-1) {
            var popUrl = "invite.html";	
            var popOption = "width=400, height=500, resizable=no, scrollbars=no, status=no;";    
                window.open(popUrl,"",popOption);
        }
        else {
            var popUrl = "invite_refer.html";	
            var popOption = "width=400, height=500, resizable=no, scrollbars=no, status=no;";    
                window.open(popUrl,"",popOption);
        }
    }
});

exitChatroom.addEventListener('click', function(){
    console.log('callee: '+ callee);
    if(callee[0]=='g' && closedGroup.get(callee) != 1) {
        var r = window.confirm("You will be left this groupchat!");
        if (r == true) {
            var date = new Date();
            var timestamp = Math.floor(date.getTime()/1000);
                
            const chatmsg = {
                EvtType: "depart",
                From: callee,
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

            socket.emit('chat', msgJSON);  // depart

            closedGroup.put(callee, 1);  // put callee into closed group list

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

    if(message.value != '' && callee != -1 && closedGroup.get(callee)!=1) {
        var date = new Date();
        var timestamp = Math.floor(date.getTime()/1000);

        var From, Originaterd;
        if(callee[0] == 'g') {  // Group
            From = callee;
            Originaterd = uid;
        }
        else { // 1-to-1
            From = uid;
            Originaterd = '';
        }
            
        const chatmsg = {
            EvtType: "message",
            From: From,
            Originated: Originaterd,
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

        if(callee[0] == 'g') listparam[listIDX.get(callee)][0].textContent = getNameofGroup(callee, 32); 
        else listparam[listIDX.get(callee)][0].textContent = callee; 

        listparam[listIDX.get(callee)][1].textContent = message.value; 
        listparam[listIDX.get(callee)][2].textContent = timestr; 

        // console.log('participant: '+ participants.get(callee));
        var cnt;
        if(callee[0] == 'g') cnt = participants.get(callee).length-1;
        else cnt = 1;

        // save the sent message
        const log = {
            logType: 1,    // 0: receive, 1: sent, 2: notify 
            status: 0,     // 0: sent, 1: delivery, 2: display
            readCount: cnt,
            msg: chatmsg
        };

        callLog = msgHistory.get(callee);
        callLog.push(log);

        console.log('<-- sent: '+log.msg.MsgID+' To:'+log.msg.To + ' listIDX:', callLog.length-1+' ' + log.msg.Body);
        
        msgIDX.put(chatmsg.MsgID, callLog.length - 1)
               
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
            if(closedGroup.get(id) == 1) {  // closed
                calleeName.textContent = 'Closed Group'; 
                calleeId.textContent = getNumberofGroup(id, 55); 
            }
            else {
                calleeName.textContent = getNameofGroup(id, 55); 
                calleeId.textContent = getNumberofGroup(id, 55); 
            }
        }
        else {
            calleeName.textContent = members.get(id);  // To-do: next time, it will be earn from the profile server
            calleeId.textContent = id;
        }
    } 
}

function getNameofGroup(id, maxLength) {
    var participantList=participants.get(id);
    console.log('id: '+id + ' list: ' +participantList)

    if(participantList != undefined) {
        var index=0;
        var participantStr='';
        for(i=0;i<participantList.length;i++) {        
            if(participantList[i] != uid) {
                if(index==0) {
                    participantStr = members.get(participantList[i]);
                    index++;
                }
                else {
                    participantStr += (', '+members.get(participantList[i]));
                    index++;
                }
            }
        } 

//        console.log('length:'+participantStr.length +' new: ',participantStr.substring(0,maxLength));
        if(participantStr.length>maxLength) return participantStr.substring(0,maxLength)+'...';
        else return participantStr;
    }
    else {
        return '';
    }
}

function getNumberofGroup(id, maxLength) {
    var participantList=participants.get(id);
    // console.log('id: '+id + ' list: ' +participantList)

    if(participantList != undefined) {
        var idx=0;
        var participantStr='';
        for(i=0;i<participantList.length;i++) {        
            if(participantList[i] != uid) {
                if(idx==0) {
                    participantStr = participantList[i];
                    idx++;
                }
                else {
                    participantStr += (', '+participantList[i]);
                    idx++;
                }
            }
        } 

//        console.log('length:'+participantStr.length +' new: ',participantStr.substring(0,maxLength));
        if(participantStr.length>maxLength) return participantStr.substring(0,maxLength)+'...';
        else return participantStr;
    }
    else {
        return '';
    }
}

// Listen events to receive a message
socket.on('chat', function(event){
    var date = new Date(event.Timestamp * 1000);
    var timestr = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();

//    console.log('--> event: ('+event.EvtType+') '+event.Body+' id:'+event.MsgID+' (from:'+event.From +' / '+event.Originated+ ')');

    if(event.EvtType == 'message') {
        console.log('--> '+event.Body+': '+event.MsgID+' ('+event.From+' / '+event.Originated+')');        

        if(closedGroup.get(event.From) == 1) {
            console.log("back to open groupchat");
            closedGroup.put(event.From, 0);

            setConveration(callee);
            updateChatWindow(callee); 
        }

        // if the sender is not in call list, create a call log
        if(!msgHistory.get(event.From)) {
            assignNewCallLog(event.From);      

//            console.log('New hashmap table was created: '+event.From);
        }

        // console.log('group: ',event.From +' participants: ', participants.get(event.From));
        if(participants.get(event.From)==undefined && event.From[0] == 'g') {
            console.log('No participant list, Rejoin is required')
            RejoinGroupchat(event);
        }

        const log = {
            logType: 0,    // 0: receive, 1: sent, 2: notify 
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
        if(event.From[0]=='g') listparam[listIDX.get(event.From)][0].textContent = getNameofGroup(event.From, 32); 
        else listparam[listIDX.get(event.From)][0].textContent = event.From; 

        listparam[listIDX.get(event.From)][1].textContent = event.Body; 
        listparam[listIDX.get(event.From)][2].textContent = timestr;

        // send delivery report
        sendDeliveryNoti(event);
        callLog[callLog.length-1].status = 1;

        // send display report
        if(document.hasFocus() && event.From == callee) {
            sendDisplayNoti(event);
            callLog[callLog.length-1].status = 2;
        } 
    }
    else if(event.EvtType == 'delivery') {
        console.log('--> delivery: '+event.MsgID+' ('+event.From+')');        
        
        idx = msgIDX.get(event.MsgID);
 //       console.log('idx:',idx+' msgID:', event.MsgID);

        callLog = msgHistory.get(event.From);
        if(idx != undefined && callLog[idx] != undefined) {
            // change status from 'sent' to 'delivery'            
            if(callLog[idx].status == 0) {
                callLog[idx].status = 1;
            }
                
            if(idx < maxMsgItems) {
                msglistparam[idx].textContent = callLog[idx].readCount;   
//                console.log('index: '+idx+' readCount='+callLog[idx].readCount+' status=',callLog[idx].status);
            }
            else {
                if(callLog.length < maxMsgItems) start = 0;
                else start = callLog.length - maxMsgItems;

                console.log('msgIDXIDX: ', idx - start);
                msglistparam[idx-start].textContent = callLog[idx].readCount;   
//                console.log('index: '+(idx-start)+' readCount='+callLog[idx].readCount+' status=',callLog[idx].status);
            }
        }
    }    
    else if(event.EvtType == 'display') {
        console.log('--> display: '+event.MsgID+' ('+event.From+')');             

        // change status from 'sent' to 'delivery'
        idx = msgIDX.get(event.MsgID)
//        console.log('msgIDXIDX: ', idx);

        if(idx != undefined && callLog[idx] != undefined) {
            callLog = msgHistory.get(event.From);
            // console.log('calllog[idx]'+callLog[idx])
            callLog[idx].status = 2;   
            
            if(callLog[idx].readCount>=1) callLog[idx].readCount--;
                            
            if(idx<maxMsgItems) {
//                console.log('index: '+idx+' readCount='+callLog[idx].readCount);
                if(callLog[idx].readCount==0) msglistparam[idx].textContent = '\u00A0'; 
                else msglistparam[idx].textContent = callLog[idx].readCount;
            }
            else {
                i = idx;
                while(i >= maxMsgItems) i -= maxMsgItems;

                console.log('index: '+i+' readCount='+callLog[idx].readCount);
                if(callLog[i].readCount==0) msglistparam[i].textContent = '\u00A0'; 
                else msglistparam[i].textContent = callLog[idx].readCount; 
            }
        }
    } 
    else {  // for group info
        if(event.EvtType == 'notify') {
            console.log('--> NOTIFY from: '+event.From+' body: ', JSON.parse(event.Body))
            participants.put(event.From, JSON.parse(event.Body))
        //    console.log('After Notify, Participants: ',participants.get(event.From))
        
            // update profile
            participantList = participants.get(event.From);
            for(i=0;i<participantList.length;i++) {
                loadProfile(participantList[i]) // update profile
            }
        }
        else if(event.EvtType == 'restart') {
            console.log('RESTART for: '+event.From);
            
            // update profile
            participantList = participants.get(event.From);

            var date = new Date();
            var timestamp = Math.floor(date.getTime()/1000);
                        
            const chatmsg = {
                EvtType: "rejoin",
                From: event.From,
                Originated: uid,
                To: event.From,
                MsgID: "",
                Timestamp: timestamp,
                Body: JSON.stringify(participantList)
            };

            const msgJSON = JSON.stringify(chatmsg);
                
            console.log('<-- rejoin groupchat: ' + event.From + ' participants: '+participantList);
                
            socket.emit('chat', msgJSON);  // creat groupchat            
        }

        else if(event.EvtType == 'join') {
            console.log('join notififcation for '+event.From);

            participantList = participants.get(event.From);
            var joinedList = ''; 
            if(participantList != undefined && participants != undefined) {
                list = JSON.parse(event.Body);
            
                for(i=0;i<list.length;i++) {
                    participantList.push(list[i]);
                    loadProfile(list[i]) // update profile
                
                    if(i==0) joinedList = members.get(list[i]);
                    else joinedList += (' '+members.get(list[i]));
                }

                participants.put(event.From, participantList);       
            }

            if(participantList.length==1)
                msg = joinedList + ' has joined this chat';
            else
                msg = joinedList + ' have joined this chat';

            console.log('joinlist: '+joinedList);

            const log = {
                logType: 2,    // 0: receive, 1: sent, 2: notify 
                status: 3,     // 0: sent, 1: delivery, 2: display, 3: notify
                msg: msg
            };
            callLog = msgHistory.get(event.From);
            callLog.push(log);
               
            if(callee == event.From) {
                updateChatWindow(callee);
            }
        }
        else if(event.EvtType == 'depart') {
            console.log(event.Originated + ' has left from '+event.From)

            // remove the left user
            participantList = participants.get(event.From);
            if(participantList != undefined && participants != undefined) {
                newParticipantList = new Array();
                for(i=0;i<participantList.length;i++) {
                    if(participantList[i]!=event.Originated) {
                        newParticipantList.push(participantList[i]);
                    }
                }

                console.log("left number of users: ", newParticipantList.length)
                if(newParticipantList.length == 1) {
                    console.log("If the user is only left, close the groupchat");
                    closedGroup.put(callee, 1);

                    // TO-DO: unsubscribe request to close the dummy group
                }
                else {
                    participants.put(event.From, newParticipantList);          
                }
            }      

            msg = event.Originated + ' has left this chat';

            const log = {
                logType: 2,    // 0: receive, 1: send, 2: notify 
                status: 3,     // 0: sent, 1: delivery, 2: display, 3: notify
                msg: msg
            };
            callLog = msgHistory.get(event.From);

            callLog.push(log);
        }

        if(callee == event.From) {
            updateChatWindow(callee);
            setConveration(callee);
        }
        updateCalllog();
    }
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
    }  */
    
    for(i=callLog.length-1;i>=0;i--) {
        if(callLog[i].logType==0) {  
            if(callLog[i].status==1) { // If display notification needs to send
                sendDisplayNoti(callLog[i].msg);
                callLog[i].status = 2;
            }
            else break;
        }  
    }
}

function sendDeliveryNoti(event) {
    // send delivery report
    console.log('<-- delivery: '+event.MsgID);

    var date = new Date();
    var timestamp = Math.floor(date.getTime()/1000);

    if(event.To[0] == 'g') {  // group
        From = event.From;
        To = event.Originated;
        Originated = uid;
    }
    else {  // 1-to-1
        From = uid;
        To = event.From;
        Originated = '';
    }
    
    const deliverymsg = {
        EvtType: "delivery",
        From: From,
        Originated: Originated,
        To: To,
        MsgID: event.MsgID,
        Timestamp: timestamp,
    };
    
    const deliveryJSON = JSON.stringify(deliverymsg);
                
    socket.emit('chat', deliveryJSON);    
}

function sendDisplayNoti(event) {
    console.log('<-- display: '+event.MsgID);    

    var date = new Date();
    var timestamp = Math.floor(date.getTime()/1000);

    if(event.To[0] == 'g') {  // group
        From = event.From;
        To = event.Originated;
        Originated = uid;
    }
    else {  // 1-to-1
        From = uid;
        To = event.From;
        Originated = '';
    }
            
    const displaymsg = {
        EvtType: "display",
        From: From,
        Originated: Originated,
        To: To,
        MsgID: event.MsgID,
        Timestamp: timestamp,
    };
            
    const displayJSON = JSON.stringify(displaymsg);
                
    // send the display message
    socket.emit('chat', displayJSON);   
}

function addSentMessage(index,timestr,text,status,readCount) {
//    console.log("sent message:"+text+' status='+status + ' readcount=',readCount);

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
}

function addReceivedMessage(index, sender, timestr, msg) {
//    console.log("add received message: "+msg);

    msglist[index].innerHTML =  
    `<div class="chat-receiver chat-receiver--left"><h1>${sender}</h1><h2>${timestr}</h2>${msg}&nbsp;</div>`;     

//    console.log(msglist[index].innerHTML);   
}

function addNotifyMessage(index, msg) {
    msglist[index].innerHTML =  
        `<div class="notification-text">${msg}</div>`;     
}
    
function updateChatWindow(from) {
    if(from != -1) {
        // clear chat window
        for (i=0;i<maxMsgItems;i++) {
            msglist[i].innerHTML = '';
        }

        callee = from;

        // load callLog
        callLog = msgHistory.get(from);

        // shows maxMsgItems messages based on arrived order    
        if(callLog.length < maxMsgItems) start = 0;
        else start = callLog.length - maxMsgItems;

        for(i=start;i<callLog.length;i++) {
        //    console.log("i: ",i + " start: ",start + ' i-start:' + (i-start));

            var date = new Date(callLog[i].msg.Timestamp * 1000);            
            var timestr = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();

            if(callLog[i].logType == 1) { // send
            //    console.log('i= ',i,' Text: ',callLog[i].msg.Body,' readcount: ',callLog[i].readCount)
                addSentMessage(i-start,timestr,callLog[i].msg.Body,callLog[i].status,callLog[i].readCount);
            }
            else if(callLog[i].logType == 0)  {  // receive
                if(callLog[i].msg.From[0] == 'g')
                    addReceivedMessage(i-start,members.get(callLog[i].msg.Originated),timestr,callLog[i].msg.Body);  
                else
                    addReceivedMessage(i-start,members.get(callLog[i].msg.From),timestr,callLog[i].msg.Body);
            }
            else if(callLog[i].logType == 2) {  // notify
                addNotifyMessage(i-start, callLog[i].msg);
            }
        }

        chatPanel.scrollTop = chatPanel.scrollHeight;  // scroll needs to move bottom
    }
}

socket.on('typing', function(event){
    feedback.innerHTML = '<p><em>' + event + ' is typing a message...</em></p>';
    
});
