// Initialize Pusher
const pusher = new Pusher('0cbe70dafa641d9765d9', {
    cluster: 'ap2',
    forceTLS: true
});

// Subscribe to movie_bot channel
const channel = pusher.subscribe('movie_bot');

  // bind new_message event to movie_bot channel
  channel.bind('new_message', function(data) {

   // Append human message
    $('.chat-container').append(`
        <div class="chat-message col-md-5 human-message">
            ${data.human_message}
        </div>
    `)

    // Append bot message
    $('.chat-container').append(`
        <div class="chat-message col-md-5 offset-md-7 bot-message">
            ${data.bot_message}
        </div>
    `)
});

function submitMessage(message) {
	console.log("SUBMIT MESSAGE IS CALLED...");
	$.post("/send_message", {
		message: message,
		// socketId: pusher.connections.socket_id
	}).done(function (data) {
		alert(data);
	});

	function handle_response(data) {
		console.log("HANDLE RESPONSE IS CALLED...");
		$('.chat-container').append(`
		    <div class="chat-message col-md-5 offset-md-7 bot-message">
		        ${data.message}
		    </div>
		`)
		// remove the loading indicator
		$("#loading").remove();
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
	submitMessage(input_message)
})
