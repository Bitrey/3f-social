let socket = io("/chat").connect();
$(".chat-alert").hide();
$(".error-div").hide();
// Query DOM

socket.on("connect", function(){
    $("#chat-buttons").css("display", "block");
    socket.emit("joinRoom", {corsoId: corsoId});
});

let chat_window = document.getElementById("chat-window");

let message = document.getElementById("message"),
    username = document.getElementById("username"),
    btn = document.getElementById("send"),
    output = document.getElementById("output"),
    feedback = document.getElementById("feedback");

let spamTimer = false;
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
                adUtente: false,
                corsoId: corsoId,
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
    }
});

$('body').click(function(){
    if($("#message").val() == ""){
        socket.emit("notyping");
    }
});

$('body').keypress(function(){
    if($("#message").val() == ""){
        socket.emit("notyping");
    }
});

$("#message").keydown(function(e){
    // Enter was pressed without shift key
    if (e.keyCode == 13 && !e.shiftKey){
        e.preventDefault();
        inviaMsg();
    }
});

let unread = 0;

function getOreMinuti(dataString){
    let date = new Date(Date.parse(dataString));
    return `${(date.getHours()<10?'0':'') + date.getHours()}:${(date.getMinutes()<10?'0':'') + date.getMinutes()}`;
}

let pastDay, pastMonth, pastYear;

// Listen for events
socket.on("chat", function(data){
    $(".no-chat-message").remove();
    let scrollFlag = false;
        // Stampa differenza di giorni, se presente
    if(Math.round(chat_window.scrollTop) == Math.round(chat_window.scrollHeight - chat_window.offsetHeight)){
        scrollFlag = true;
    }
    let currentDate = new Date(Date.parse(data.dataCreazione));
    if(!pastDay || currentDate.getDate() > pastDay || currentDate.getMonth() > pastMonth || currentDate.getFullYear() > pastYear){
        let month = currentDate.getMonth() + 1;
        let year = currentDate.getFullYear();
        output.innerHTML += `<p class="date-separator">${currentDate.getDate()}/${month}/${year}</p>`;
    }
    feedback.innerHTML = "";
    if(data.socket_id == socket.id){
        output.innerHTML += "<div class='chat-message' id='" + data.dataCreazione + "'><p><strong class='chat-username show-profile' data-profile='" + data.idProfilo + "'>" + data.mittente + "</strong><small> " + getOreMinuti(data.dataCreazione) + "</small></p><span class='chat-content'>" + data.contenuto + "</span><span class='delete'><i class='fa fa-trash' aria-hidden='true'></i></span></div>";
    } else {
        output.innerHTML += "<div class='chat-message' id='" + data.dataCreazione + "'><p><strong class='chat-username show-profile' data-profile='" + data.idProfilo + "'>" + data.mittente + "</strong><small> " + getOreMinuti(data.dataCreazione) + "</small></p><span class='chat-content'>" + data.contenuto + "</span></div>";
    }
    if(scrollFlag){
        chat_window.scrollTop = chat_window.scrollHeight;
        scrollFlag = false;
    }
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
    if(messages.length <= 0){
        output.innerHTML = '<p class="text-center align-items-center mt-3 no-chat-message"><i class="fas fa-comment-slash"></i> Nessun messaggio in chat.</p></div>';
        return false;
    }
    let currentDate = new Date(Date.parse(messages[0].dataCreazione));
    $("#output").html(`<p class="date-separator">${currentDate.getDate()}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}</p>`);
    for(let i = 0; i < messages.length; i++){
        unread++;
        document.title = "(" + unread + ") 3F Chat";

        // Stampa differenza di giorni, se presente
        currentDate = new Date(Date.parse(messages[i].dataCreazione));
        let pastDate;
        if(messages[i - 1]){
            pastDate = new Date(Date.parse(messages[i - 1].dataCreazione));
        } else {
            pastDate = currentDate;
        }
        pastDay = pastDate.getDate();
        pastMonth = pastDate.getMonth();
        pastYear = pastDate.getFullYear();
        if(currentDate.getDate() > pastDay || currentDate.getMonth() > pastMonth || currentDate.getFullYear() > pastYear){
            let month = currentDate.getMonth() + 1;
            let year = currentDate.getFullYear();
            output.innerHTML += `<p class="date-separator">${currentDate.getDate()}/${month}/${year}</p>`;
        }

        // Controlla se utente esiste
        let username, idProfilo;
        if(messages[i].mittente){
            username = "<span class='username-chat-span'>" + messages[i].mittente.username + "</span>";
            idProfilo = messages[i].mittente._id;
            output.innerHTML += "<div class='chat-message' id='" + messages[i].dataCreazione + "'><p><strong class='chat-username show-profile' data-profile='" + idProfilo + "'>" + username + "</strong><small> " + getOreMinuti(messages[i].dataCreazione) + "</small></p><span class='chat-content'>" + messages[i].contenuto + "</span></div>";
        } else {
            username = "<span class='text-muted'><i class='fas fa-user-slash'></i> Utente non trovato</span>"
            output.innerHTML += "<div class='chat-message' id='" + messages[i].dataCreazione + "'><p><strong class='chat-username'>" + username + "</strong><small> " + getOreMinuti(messages[i].dataCreazione) + "</small></p><span class='chat-content'>" + messages[i].contenuto + "</span></div>";
        }
    }
    chat_window.scrollTop = chat_window.scrollHeight;
});

$("#output").on("click", ".delete", function(){
    socket.emit("cancella", $(this).parent().attr("id"));
	$(this).parent().html('<p id="loading" class="text-center pt-3"><span class="spinner-border spinner-border-sm text-danger" role="status"><span class="sr-only">Rimozione...</span></span> Rimozione del messaggio</p>');
});

socket.on("cancella", function(data){
    let element = document.getElementById(data.date);
    element.parentNode.removeChild(element);
});

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

socket.on("error", function(message){
    if(message == "User not authorized through passport. (User Property not found)"){
        $("#inner-output").html('<div class="p-3"><h5><i class="fas fa-user-slash"></i> Chi sei?</h5><p>Per usare la chat devi autenticarti <i class="fas fa-sign-in-alt"></i></p></div>');
    } else {
        $("#inner-output").html('<div class="p-3"><h5><i class="fas fa-comment-slash"></i> Connessione al socket rifiutata</h5><p style="border-bottom: none">Per usare la chat devi autenticarti <i class="fas fa-sign-in-alt"></i></p><small>' + message + '</div>');
    }
});

socket.on("prova", function(){
    alert("CIAO");
});

socket.on("connect_error", function(message){
    $("#inner-output").html('<div class="p-3"><h5><i class="fas fa-comment-slash"></i> Connessione al socket rifiutata</h5><p>Per usare la chat devi autenticarti <i class="fas fa-sign-in-alt"></i></p><small>Errore: ' + message + '</div>');
});

// Tronca contenuto troppo lungo
$(".post-contenuto").each(function(){
    $(this).html($.truncate($(this).html(), {
        length: 80,
        words: true
    }));
});

$(".post").each(function(){
    $(this).css("height", ($(this).children(".card-title").css("height") + $(this).children(".post-text").css("height") + $(this).children(".card-btns").css("height")));
});

socket.on("changeOwnUsername", function(data){
    $("#username-span").text(data);
});

socket.on("changeUsername", function(data){
    $(".username-chat-span").each(function(){
        if($(this).text() == data.oldUsername){
            $(this).text(data.newUsername);
        }
    });
    $(".username-post-span").each(function(){
        if($(this).text() == data.oldUsername){
            $(this).text(data.newUsername);
        }
    });
});

socket.on("error-msg", function(msg){
    output.innerHTML += "<div class='chat-message'><p><strong style='color: red;'>Errore</strong></p><span class='chat-content'>" + msg + "</span></div>";
    chat_window.scrollTop = chat_window.scrollHeight;
});

const urlParams = new URLSearchParams(window.location.search);
const showCode = urlParams.get('showCode');
if(showCode == "true"){
    $('#mostraCodiceModal').modal('show');
}