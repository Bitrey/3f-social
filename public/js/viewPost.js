$(".download").on("click", function(){
    try {
        $('#downloadForm').submit(function(){

                $(this).ajaxSubmit({

                    error: function(xhr){
                        status('Errore: ' + xhr.status);
                        alert("Errore");
                    },

                    success: function(response){
                        if(response.msg == "ok"){
                            alert("File scaricato!");
                        }
                    }
                });
                // Annulla rinfrescamento pagina
                return false;
            });
    } catch(e){
        $("#status").empty().text("Errore: " + err.toString());
    }
})

// Tronca file con nome > 16 caratteri
$(".file-title").each(function(){
    if($(this).text().length > 16){
        var text = $(this).text();
        text = text.substr(0, 16) + '...';
        $(this).text(text);
    }
});

$('#font-slider').on('input', function(){
    $("#contenuto").css("font-size", ($(this).val() / 2) + "rem");
});

var str = JSON.parse($("#post-text").text());
$("#post-text").remove();

str = str.replace(/(?:\r\n|\r|\n)/g, '<br>');
$("#contenuto").html(str);