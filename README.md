# webchat-js-webclient
It is a chat client to support 1-to-1 chat and groupchat.
And it is optimized to ensure the operation of webchat server.

## Build & Run
```c
$ docker build -t webclient:v1 .
$ docker run -d -p 8080:80 webclient:v1
```
Then, run it using chrom browser. 

## Coversation Overview

This design was inspired from "FilipRastovic" as described in reference.
I appended java script to make a chat service. Also, several compoents were added such as display/delivery notification and presence features. 

This pciture shows a snap shot for group conversation where the call log is left side and chat conversation is right side.
![image](https://user-images.githubusercontent.com/52392004/84659810-f4f38300-af52-11ea-9ed9-9bf4cd8cdc36.png)

### Structure

The left side shows the call logs and right side shows message logs.
For this calllist and msglist are used with msgHistory which saves all call and message history.

#### Call Log for history of conversation
```java
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
```

#### Message Log for history of chatting
```java
(function(index) {
        msglist[index].addEventListener("click", function() {
            console.log('click! index: '+index);

            callLog = msgHistory.get(callee);
            if(callLog.length < maxMsgItems) i = index;
            else i = index + maxMsgItems;

            console.log("index=",index+' readcount:', callLog[i].readCount + ' body:', callLog[i].msg.Body+ ' status:',callLog[i].status);
        })
    })(i);
```

#### Call Log

Call Log shws the name of participants in chat room and the last message and received time. 

![image](https://user-images.githubusercontent.com/52392004/84660117-57e51a00-af53-11ea-9589-1199bdcecb55.png)


#### Chat Profile

Chat Profile shows the name and numbers of participants in the groupchat. Also, there are three buttons, refresh, add new member and left groupchat.
![image](https://user-images.githubusercontent.com/52392004/84660203-75b27f00-af53-11ea-807b-6c4bc1ad7288.png)


#### Chat Bubble (Receive)
The received message needs to show the sender name and the sent time where the time is based on sent time which is reached in the server.

![image](https://user-images.githubusercontent.com/52392004/84659902-12c0e800-af53-11ea-811e-a7987039a3e1.png)


#### Chat Bubble (Send)
The sent message bubble can shows how many members in the groupchat read the message but the sender name doesn't need to display.

![image](https://user-images.githubusercontent.com/52392004/84659978-2f5d2000-af53-11ea-819c-c77f5fd68b3d.png)


#### Display notification

If one of participants receives the message, then there is a read notification icon in the left of chat bubble.
![image](https://user-images.githubusercontent.com/52392004/84660428-ca55fa00-af53-11ea-9bf1-38b9e0d22c08.png)


### REFERENCE

https://codepen.io/FilipRastovic/pen/pXgqKK
