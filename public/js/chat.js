var socket = io.connect();
$(".chat-alert").hide();
$(".error-div").hide();
// Query DOM

socket.on("connect", function(){
    $("#chat-buttons").css("display", "block");
})

var chat_window = document.getElementById("chat-window");

var message = document.getElementById("message"),
    username = document.getElementById("username"),
    btn = document.getElementById("send"),
    output = document.getElementById("output"),
    feedback = document.getElementById("feedback");

var spamTimer = false;
function inviaMsg() {
    if(!spamTimer){
        $("#send").attr("disabled", true);
        $("#message").attr("disabled", true);
        clearTimeout(spamTimer);
        spamTimer = setTimeout(function(){
            spamTimer = false;
            $("#send").attr("disabled", false);
            $("#message").attr("disabled", false);
            $("#message").focus();
        }, 1000);
        if (username.value !== "" && message.value !== "") {
            $(".chat-alert").hide();
            socket.emit("chat", {
                message: message.value,
                username: username.value
            });
            message.value = "";
    
        } else {
            displayError("Scrivi lo username e il messaggio!");
        }
    } else {
        $("#send").text("Slow down ni🅱️🅱️a");
        $("#send").attr("disabled", true);
        clearTimeout(spamTimer);
        spamTimer = setTimeout(function(){
            $("#send").text("Invia");
            $("#send").attr("disabled", false);
            $("#message").attr("disabled", false);
            $("#message").focus();
            spamTimer = false;
        }, 1000);
    }
}

// Emit event
btn.addEventListener("click", inviaMsg);

message.addEventListener("keypress", function() {
    if(username.value != ""){
        if($("#message").val() != ""){
            socket.emit("typing", username.value);
        } else {
            socket.emit("notyping");
        }
    };
});

$('body').click(function(){
    if($("#message").val() == ""){
        socket.emit("notyping");
    }
})

$('body').keypress(function(){
    if($("#message").val() == ""){
        socket.emit("notyping");
    }
})

message.addEventListener("keyup", function(){
    if(event.keyCode == 13 && !event.shiftKey){
        inviaMsg();
    };
});

var unread = 0;

function getOreMinuti(dataString){
    var date = new Date(Date.parse(dataString));
    return `${(date.getHours()<10?'0':'') + date.getHours()}:${(date.getMinutes()<10?'0':'') + date.getMinutes()}`;
}

let pastDay, pastMonth, pastYear;

// Listen for events
socket.on("chat", function(data) {
        // Stampa differenza di giorni, se presente
    let currentDate = new Date(Date.parse(data.dataCreazione));
    if(currentDate.getDate() > pastDay || currentDate.getMonth() > pastMonth || currentDate.getFullYear() > pastYear){
        let month = currentDate.getMonth() + 1;
        let year = currentDate.getFullYear();
        output.innerHTML += `<p class="date-separator">${currentDate.getDate()}/${month}/${year}</p>`;
    }
    feedback.innerHTML = "";
    if(data.socket_id == socket.id){
        output.innerHTML += "<p id='" + data.dataCreazione + "'><span class='delete'><i class='fa fa-trash' aria-hidden='true'></i></span> <strong><span class='username-chat-span'>" + data.autore + "</span></strong> " + data.contenuto + "<br><small>" + getOreMinuti(data.dataCreazione) + "</small></p>";
    } else {
        output.innerHTML += "<p id='" + data.dataCreazione + "'><strong><span class='username-chat-span'>" + data.autore + "</span></strong> " + data.contenuto + "<br><small>" + getOreMinuti(data.dataCreazione) + "</small></p>";
    };
    chat_window.scrollTop = chat_window.scrollHeight;
    unread++;
    document.title = "(" + unread + ") 3F Chat";
    let pastDate = new Date(Date.parse(data.dataCreazione));
    pastDay = pastDate.getDate();
    pastMonth = pastDate.getMonth();
    pastYear = pastDate.getFullYear();
});

socket.on("typing", function(data) {
    feedback.innerHTML = "<p><em>" + data + " sta scrivendo...</em></p>";
    chat_window.scrollTop = chat_window.scrollHeight;
});

socket.on("notyping", function() {
    feedback.innerHTML = "";
    chat_window.scrollTop = chat_window.scrollHeight;
});

setInterval(function(){
    if(document.hidden){
        if(unread != 0){
            document.title = "(" + unread + ") 3F Chat";
        }
    } else {
        unread = 0;
        document.title = "3F Chat";
    }
}, 500);

socket.on("pastMsg", function(messages){
    $("#output").html("");
    for(let i = 0; i < messages.length; i++){
        unread++;
        document.title = "(" + unread + ") 3F Chat";
        if(i > 1){
            // Stampa differenza di giorni, se presente
            let currentDate = new Date(Date.parse(messages[i].dataCreazione));
            let pastDate = new Date(Date.parse(messages[i - 1].dataCreazione))
            pastDay = pastDate.getDate();
            pastMonth = pastDate.getMonth();
            pastYear = pastDate.getFullYear();
            if(currentDate.getDate() > pastDay || currentDate.getMonth() > pastMonth || currentDate.getFullYear() > pastYear){
                let month = currentDate.getMonth() + 1;
                let year = currentDate.getFullYear();
                output.innerHTML += `<p class="date-separator">${currentDate.getDate()}/${month}/${year}</p>`;
            }
        }
        // Controlla se utente esiste
        let username;
        if(messages[i].autore){
            username = "<span class='username-chat-span'>" + messages[i].autore.username + "</span>";
        } else {
            username = "<span class='text-muted'><i class='fas fa-user-slash'></i> Utente non trovato</span>"
        }
        output.innerHTML += "<p id='" + messages[i].dataCreazione + "'><strong>" + username + "</strong> " + messages[i].contenuto + "<br><small>" + getOreMinuti(messages[i].dataCreazione) + "</small></p>";
    }
    chat_window.scrollTop = chat_window.scrollHeight;
});

$(".hideMe").hide();

var sfondo = false;

function magia(){
    $(".hideMe").toggle();
    if(sfondo == false){
        $("#chat-window").css("background", "#ffffff88");
        $("#chat-window").css("background-image", "url('https://s5.gifyu.com/images/ezgif-2-52ade8a765d5.gif')");
        $("#footer-img-left").attr("src", "https://www.googleapis.com/drive/v3/files/1K8QMR8ETZbb0kP0pGRl8noQB-XaR78nn?alt=media&key=AIzaSyCzJtUQTqW3tZTuLnq4b8EvfZlZqhaw5Hw");
        $("#footer-img-right").attr("src", "https://www.googleapis.com/drive/v3/files/1K8QMR8ETZbb0kP0pGRl8noQB-XaR78nn?alt=media&key=AIzaSyCzJtUQTqW3tZTuLnq4b8EvfZlZqhaw5Hw");
        sfondo = true;
    } else {
        $("#chat-window").css("background", "#f9f9f9");
        $("#chat-window").css("background-image", "");
        $("#footer-img-left").attr("src", "https://i.imgur.com/P60WYPZ.png");
        $("#footer-img-right").attr("src", "https://i.imgur.com/lDIspTu.png");
        sfondo = false;
    };
};

$("#output").on("click", ".delete", function(){
    socket.emit("cancella", $(this).parent().attr("id"));
	$(this).parent().html('<p id="loading" class="text-center pt-3"><span class="spinner-border spinner-border-sm text-danger" role="status"><span class="sr-only">Rimozione...</span></span> Rimozione del messaggio</p>');
});

socket.on("cancella", function(data){
    var element = document.getElementById(data.date);
    element.parentNode.removeChild(element);
});

var imgPrompt = false;
$("#img").on("click", function(){
    if($("#username").val() == ""){
        displayError("Scrivi lo username!");
    } else {
        imgPrompt = prompt("Inserisci il link dell'immagine");
        if(imgPrompt){
            try {
                var img = new Image();
                img.src = imgPrompt;
                img.onload = function(){
                    $(".chat-alert").hide();
                    socket.emit("chat", {
                        message: "<img style='width: auto; max-width: 80%; max-height: 300px; display: block;' src='" + imgPrompt + "'",
                        username: username.value
                    });
                };
                img.onerror = function(){
                    displayError("Immagine non valida!");
                };
            } catch(e){
                displayError("Si è verificato un errore: " + e);
            }
        }
    }
})

function isUrlImage(uri){
    uri = uri.split('?')[0];
    var parts = uri.split('.');
    var extension = parts[parts.length-1];
    var imageTypes = ['jpg','jpeg','tiff','png','gif','bmp'];
    if(imageTypes.indexOf(extension) !== -1) {
        return true;   
    }
}

let inError = false;
function displayError(message){
    $(".chat-alert").text(message);
    $(".chat-alert").show();
    if(!inError){
        $(".chat-alert").addClass("red-bg");
        inError = true;
        setTimeout(function(){
            $(".chat-alert").removeClass("red-bg");
            inError = false;
        }, 666);
    }
}

let dio = ["🐷", "🐶", "🐈", "🐒"];

$(".navbar-brand").on("click", function(){
    output.innerHTML += `<p><strong>Dio</strong> ${dio[Math.floor(Math.random()*dio.length)]}</p>`;
    chat_window.scrollTop = chat_window.scrollHeight;
});

socket.on("error", function(message){
    if(message == "User not authorized through passport. (User Property not found)"){
        $("#inner-output").html('<div class="p-3"><h5><i class="fas fa-user-slash"></i> Chi sei?</h5><p>Per usare la chat devi autenticarti <i class="fas fa-sign-in-alt"></i></p></div>');
    } else {
        $("#inner-output").html('<div class="p-3"><h5><i class="fas fa-comment-slash"></i> Connessione al socket rifiutata</h5><p style="border-bottom: none">Per usare la chat devi autenticarti <i class="fas fa-sign-in-alt"></i></p><small>' + message + '</div>');
    }
})

socket.on("connect_error", function(message){
    $("#inner-output").html('<div class="p-3"><h5><i class="fas fa-comment-slash"></i> Connessione al socket rifiutata</h5><p>Per usare la chat devi autenticarti <i class="fas fa-sign-in-alt"></i></p><small>Errore: ' + message + '</div>');
})

// Tronca file con nome > 16 caratteri
$(".post-text").each(function(){
    if($(this).text().length > 120){
        var text = $(this).text();
        text = text.substr(0, 120) + '...';
        $(this).text(text);
    }
});

// $(".card").each(function(){
//     $(this).css("height", $(".card-body").css("height"));
// })

$(".post").each(function(){
    $(this).css("height", ($(this).children(".card-title").css("height") + $(this).children(".post-text").css("height") + $(this).children(".card-btns").css("height")));
})

socket.on("changeOwnUsername", function(data){
    $("#username-span").text(data);
});

socket.on("changeUsername", function(data){
    $(".username-chat-span").each(function(){
        if($(this).text() == data.oldUsername){
            $(this).text(data.newUsername);
        }
    })
    $(".username-post-span").each(function(){
        if($(this).text() == data.oldUsername){
            $(this).text(data.newUsername);
        }
    })
});

let codiceMostrato = false;
$("#mostra-codice-h1").on("click", function(){
    if(codiceMostrato){
        codiceMostrato = false;
        $("#codice-corso-h1").hide();
        $(this).children("span").text("Mostra codice");
    } else {
        codiceMostrato = true;
        $("#codice-corso-h1").show();
        $(this).children("span").text("Nascondi codice");
    }
})