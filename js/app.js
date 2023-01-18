const TOKEN = 'auth_token'

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
                    usersListHtml += `<li class="list-group-item active" aria-current="true">${user?.email}</li>`
                })
                usersList.innerHTML = usersListHtml;
            })

            // TODO: left here... 18-01-2023
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

            signupSection.style.display = 'block';
            chatDashboard.style.visibility = "hidden";
            mainContainer.style.paddingTop = "200px";
        })
    }
})