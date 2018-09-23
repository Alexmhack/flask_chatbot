function submitMessage(message) {
	$.post("/send_message", {message: message}, handle_response);

	function handle_response(data) {
		$('.chat-container').append(`
		    <div class="chat-message col-md-5 offset-md-7 bot-message">
		        ${data.message}
		    </div>
		`)
		// remove the loading indicator
		$( "#loading" ).remove();
	}
}

$("#target").on('submit', function(e) {
	e.preventDefault();
	const input_message = $("#input_message").val();

	if (!input_message) {
		return
	}

	$(".chat-container").append(`
		<div class="chat-message col-md-5 human-message">
        	${input_message}
        </div>
	`)

	$(".chat-container").append(`
		<div class="chat-message text-center col-md-2 offset-md-10 bot-message" id="loading">
			<b>...</b>
		</div>
	`)

	$('#input_message').val('')

    // send the message
	submit_message(input_message)
})
