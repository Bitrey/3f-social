var img = "/img/post/default.jpeg";

$(document).ready(function () {
    $("#titolo").focus();
});

function imageExists(url){
    try {
        var imgTry = new Image();
        imgTry.onload = function(){ img = url; $("#hiddenImgField").val(url); $(".post-img").attr("src", url) };
        imgTry.onerror = function(){ alert("Immagine non valida!"); };
        imgTry.src = url;
    } catch(e){
        alert("URL non valido!");
    }
}

$("#change-post-img").on("click", function() {
    var link = prompt("Inserisci l'URL dell'immagine");
    if(link){
        imageExists(link);
    }
})