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

var map = new HashMap();
map.put('kyopark', 'John is living in Seoul');
map.put('cwkdyb', 'Wonkyoung is working in hospital');
map.put('ksdyb', 'I am working in Samsung');
var value = map.get('kyopark');
var keys = map.getKeys();

console.log(value);
console.log(keys);

console.log(map.get('cwkdyb'));
map.remove('cwkdyb');

console.log(map.getKeys());

keys = map.getKeys();
for(i=0;i<keys.length;i++) {
    console.log('key: ' +keys[i] +' value:'+map.get(keys[i]) );
}

if (map.get('ksdyb')) {
    console.log(map.get('ksdyb'));
}

if (map.get('cwkdyb')) {
    console.log(map.get('cwkdyb'));
} else {
    console.log('cwkdyb does not exist')
}


