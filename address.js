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

var maxUsers = 10;

members = new HashMap();

members.put('01027952195','John');
members.put('114','Park');
members.put('025251123','Home');

//addrTable.innerHTML = '';
key = members.getKeys();
var selected = []
for(i=0;i<key.length;i++) selected[i] = false;

textParticipants = document.getElementById('participants');

var userlist = [];  
for (i=0;i<10;i++) {
    userlist.push(document.getElementById('user'+i));

    // add listener        
    (function(index){
        userlist[index].addEventListener("click", function() {
            managePaticipants(index);
        })
    })(i);  
}

function managePaticipants(index) {
    console.log('index:'+index+' selected'+selected[index])

    if(selected[index] == false) {
        selected[index] = true;
        console.log('add member: '+ key[index]+' '+members.get(key[index]));

        userlist[index].innerHTML = 
        `<tr><td><b>${members.get(key[index])}</b></td><td><b>${key[index]}</b></td></tr>`
    }
    else {
        selected[index] = false;
        console.log('remove member: '+ key[index]+' '+members.get(key[index]));

        userlist[index].innerHTML = 
        `<tr><td>${members.get(key[index])}</td><td>${key[index]}</td></tr>`
    }

    var list = '';
    var morethanone = false;
    for(i=0;i<key.length;i++) {
        if(selected[i]==true) {
            if(!morethanone) {
                list += members.get(key[i]);
                morethanone = true;
            }
            else {
                list += ', ';
                list += members.get(key[i]);
            }
        }
    }
    textParticipants.textContent = list;
}

makeList();

function makeList() {
    for(i=0;i<3;i++) {
        userlist[i].innerHTML = 
            `<tr><td>${members.get(key[i])}</td><td>${key[i]}</td></tr>`
    }
}

const submitBtn = document.querySelector('#submit');
    
submitBtn.addEventListener('click', onInvite);
    
function onInvite() {
    participantList = new Array();

    for(i=0;i<key.length;i++) {
        if(selected[i]==true) participantList.push(key[i]);
    }

    console.log('submit participants: '+participantList)
    if (participantList != '') {
        window.opener.StartNewChat(participantList);
    }
    self.close();
};