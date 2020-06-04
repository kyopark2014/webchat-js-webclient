const myForm = document.querySelector('#my-form');
const nameInput = document.querySelector('#name');
const phonenumberInput = document.querySelector('#phonenumber');
const msg = document.querySelector('.msg');

myForm.addEventListener('submit', onSubmit);

// load name and email
nameInput.value = localStorage.getItem('name');
phonenumberInput.value = localStorage.getItem('phonenumber');

var name = localStorage.getItem('name'); // set userID if exists 
if(name != '')    {
    nameInput.value = name;
}

var phonenumber = localStorage.getItem('phonenumber'); // set userID if exists 
if(phonenumber != '')    {
    phonenumberInput.value = phonenumber;
}

function onSubmit(e) {
    e.preventDefault();

    console.log(nameInput.value);
    console.log(phonenumberInput.value);

    if(nameInput.value == '' || phonenumberInput.value == '') {
        msg.classList.add('error');
        msg.innerHTML = 'Please enter fields'

        setTimeout(()=> msg.remove(), 3000);
    } else {
        // update name and email
        localStorage.setItem('name',nameInput.value);
        localStorage.setItem('phonenumber',phonenumberInput.value);

    //    window.opener.setName(nameInput.value);

        window.location.href = "chat.html";
    }
}

