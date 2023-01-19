const TOKEN = 'auth_token'
const TARGET_USER = 'target_user';

const socket = io('http://localhost:3000', {
    extraHeaders: {
        'Authorization': localStorage.getItem(TOKEN)
    }
})

var signupForm = document.getElementById('signup-form');
var generalToast = document.getElementById('general-toast')
var generalToast_inst = bootstrap.Toast.getOrCreateInstance(generalToast)
var signupSection = document.getElementById('signup')
var chatDashboard = document.getElementById('chat-dashboard')
var mainContainer = document.getElementById('main-container')
var usersList = document.getElementById('users-list')
var logout = document.getElementById('logout')

function signupFormSubmit(e) {
    e.preventDefault();
    var user = {
        email: e.target.elements.email.value,
        password: e.target.elements.password.value
    }

    socket.emit('user:signup', user);
}

socket.on('connect', () => {
    if (signupForm) {
        signupForm.addEventListener('submit', signupFormSubmit)
    
        socket.on('user:signup:success', (payload) => {
            if (payload?.token) localStorage.setItem(TOKEN, payload.token)
            
            signupSection.style.display = 'none';
            chatDashboard.style.visibility = "visible";
            mainContainer.style.paddingTop = "0px";

            signupForm.reset();

            socket.emit('user:get_onlines', {
                'Authorization': localStorage.getItem(TOKEN)
            });

            socket.on('user:get_onlines:success', (payload) => {
                var usersListHtml = ``;
                payload.users.map((user) => {
                    usersListHtml += `<li class="list-group-item user-list-item" aria-current="true">${user?.email}</li>`
                })
                usersList.innerHTML = usersListHtml;

                socket.on('user:new:join', (payload) => {
                    let usersListHtml = `<li class="list-group-item user-list-item" aria-current="true">${payload?.email}</li>`
                    usersList.innerHTML += usersListHtml
                    const allUsers = document.querySelectorAll('.user-list-item')
                    if(allUsers.length > 0) document.getElementById('message-box').style.visibility = 'visible';
                    if(allUsers.length === 1) {
                        localStorage.setItem(TARGET_USER, payload?.email);
                        document.getElementById('target-user').innerText = payload?.email;
                    }
                    if(allUsers.length > 0) document.getElementById('message-box').style.visibility = 'visible';
                    allUsers.forEach((e) => {
                        if(localStorage.getItem(TARGET_USER) && e.innerText === localStorage.getItem(TARGET_USER)) {
                            e.style.backgroundColor = 'blue'
                            e.style.color = 'white'
                            document.getElementById('target-user').innerText = e.innerText;
                        } else {
                            e.style.backgroundColor = '#f9f9f9'
                            e.style.color = 'black'
                        }
                        e.addEventListener('click', () => {
                            allUsers.forEach(other => {
                                if(e !== other) {
                                    other.style.backgroundColor = '#f9f9f9'
                                    other.style.color = 'black'
                                }
                            })
                            e.style.backgroundColor = 'blue'
                            e.style.color = 'white'
                            localStorage.setItem(TARGET_USER, e.innerText);
                            document.getElementById('target-user').innerText = e.innerText;
                        })
                    })
                })

                const allUsers = document.querySelectorAll('.user-list-item')
                if(allUsers.length > 0) document.getElementById('message-box').style.visibility = 'visible';
                allUsers.forEach((e) => {
                    if(localStorage.getItem(TARGET_USER) && e.innerText === localStorage.getItem(TARGET_USER)) {
                        e.style.backgroundColor = 'blue'
                        e.style.color = 'white'
                        document.getElementById('target-user').innerText = e.innerText;
                    }
                    e.addEventListener('click', () => {
                        socket.emit('chat:message:view', {
                            Authorization: localStorage.getItem(TOKEN),
                            sender: e.innerText.trim()
                        })
                        allUsers.forEach(other => {
                            if(e !== other) {
                                other.style.backgroundColor = '#f9f9f9'
                                other.style.color = 'black'
                            }
                        })
                        e.style.backgroundColor = 'blue'
                        e.style.color = 'white'
                        localStorage.setItem(TARGET_USER, e.innerText);
                        document.getElementById('target-user').innerText = e.innerText;
                    })
                })

                socket.on('chat:message:view:success', (payload) => {
                    let messagesHtml = ``;
                    payload.forEach((chat, index) => {
                        messagesHtml += `<p class="card-text message-text recieved-message">${chat.message}</p><br>`
                    })
                    document.getElementById('messages-list').innerHTML = messagesHtml;
                })

                socket.on('chat:message:view:fail', (payload) => {
                    console.log(payload)
                })


                const chatForm = document.getElementById('chat-form');
                chatForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    socket.emit('chat:message', {
                        Authorization: localStorage.getItem(TOKEN),
                        target_user: localStorage.getItem(TARGET_USER),
                        message: e.target.elements.message.value
                    })
                    chatForm.reset();
                })



                socket.on('chat:message:recieve', (payload) => {
                    var message = payload.message;
                    console.log(payload)
                    if(localStorage.getItem(TARGET_USER) === payload.sender) {
                        var messagesList = document.getElementById('messages-list')
                        messagesList.innerHTML = `<p class="card-text message-text recieved-message">${message}</p>`;
                    } else {
                        allUsers.forEach(e => {
                            if(localStorage.getItem(TARGET_USER) !== e.innerText.trim() && e.innerText.trim() === payload.sender) {
                                e.style.backgroundColor = '#F2DEBA';
                            }
                        })
                    }
                })
                socket.on('chat:message:success', (payload) => {
                    var message = payload.message;
                    var messagesList = document.getElementById('messages-list')
                    messagesList.innerHTML = `<p class="card-text message-text">${message}</p>`;
                })

                socket.on('chat:message:fail', (payload) => {
                    console.log(payload)
                })
            })
            
        })
    
        socket.on('user:signup:fail', (payload) => {
            localStorage.removeItem(TOKEN)
            var errorEmail = document.getElementById('email-error')
            var errorPassword = document.getElementById('password-error')
            var errorGeneral = document.getElementById('general-error')
            if(payload?.email) errorEmail.innerText = payload.email[0]
            else errorEmail.innerText = "";
            if(payload?.password) errorPassword.innerText = payload.password[0]
            else errorPassword.innerText = ""
            if(payload?.general) {
                errorGeneral.innerText = payload.general[0]
                generalToast_inst.show();
            }
            else errorGeneral.innerText = ""
    
            signupSection.style.display = 'block';
            chatDashboard.style.visibility = "hidden";
            mainContainer.style.paddingTop = "200px";
        })

        socket.on('user:all', (payload) => {
            var errorGeneral = document.getElementById('general-error')
            if(payload?.general) {
                errorGeneral.innerText = payload.general[0]
                generalToast_inst.show();
            }
        })
    }

    if(chatDashboard) {
        logout.addEventListener('click', () => {
            localStorage.removeItem(TOKEN)
            socket.disconnect();
            signupSection.style.display = 'block';
            chatDashboard.style.visibility = "hidden";
            document.getElementById('message-box').style.visibility = 'hidden';
            mainContainer.style.paddingTop = "200px";
        })

        socket.on('user:new:left', (payload) => {
            const allUsers = document.querySelectorAll('.user-list-item')
            if(allUsers.length < 1) document.getElementById('message-box').style.visibility = 'hidden'
            else {
                const allUsers = document.querySelectorAll('.user-list-item')
                allUsers[0].style.backgroundColor = 'blue';
                allUsers[0].style.color = 'white'
            }
        })
    }
})