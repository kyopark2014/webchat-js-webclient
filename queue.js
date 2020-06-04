Queue = function() {
    this.first = null;
    this.qsize = 0;
    this.recent = null;
}
  
Queue.prototype = {
    size: function() {
        return this.qsize;
    },
    isEmpty: function(){
        return (this.qsize == 0);
    },
    push: function(data) {
        var Node = function(data) {
            this.data = data;
            this.next = null;
        };

        var node = new Node(data);
  
        if (!this.first){
            this.first = node;
        } else {
            n = this.first;
            while (n.next) {
                n = n.next;
            }
            n.next = node;
        }
    
        this.qsize += 1;
        this.recent = data;

        return node;
    },
    front: function() {
        return this.first;
    },
    pop: function() {
        this.first = this.first.next;
        this.qsize -= 1;
    }
}

var q = new Queue();
q.push("item1");
q.push("item2");
q.push("item3");
q.push("item4");

var size = q.size();
console.log(size);

// last one
console.log('recent: ' +q.recent);


for(i=0;i<size;i++) {
    var v = q.front();
    q.pop();
    console.log('value: ' + v.data);
} 

while(!q.isEmpty()) {
    var v = q.front();
    q.pop();
    console.log('value: ' + v.data);
}

