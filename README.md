# flask_chatbot
building a chatbot using flask, pusher channels, ngrok, dialogflow and jquery 
that tells users about movie details.

# Installation
1. Python 3.6
2. [Pusher Channels](https://pusher.com/channels)
3. jQuery
4. [Dialogflow](https://dialogflow.com/)
5. [ngrok](https://ngrok.com/download)

# Creating Project
Our project directory should look like this

```
 flask_chatbot
    ├── .env
    ├── .flaskenv
    ├── index.py
    ├── requirements.txt
    ├── static
    │   ├── custom.js
    │   └── style.css
    └── templates
        └── index.html
```

**Using different way to create project folders and files**

```
# Create folders (terminal / cmd)
mkdir flask_chatbot && cd flask_chatbot && mkdir templates static

# Create files (terminal only)
touch index.py static/{custom.js,style.css} templates/index.html requirements.txt .flaskenv .env
```

The files and folders created:

1. ```index.py```: the main entry point of our project.
2. ```requirements.txt```: all libraries our project will be using.
3. ```static```: contains Static files like css and js.
4. ```templates```: our HTML files will live here.
5. ```.flaskenv```: this is where we’ll store Flask environment variables.
6. ```.env```: we’ll use this to store our private keys.

Your ```requirements.txt``` file should have these python packages

```
Flask==1.0.2
requests==2.18.4
dialogflow==0.4.0
python-dotenv==0.8.2
pusher==2.0.1
```

Install the packages inside virtualenv (not necessary). For learning about 
virtualenv have a look at my other django repositories.

```
pip install -r requirements.txt
```

1. ```requests```: we’ll use this library to make a request to external URLs.
2. ```dialogflow```: to interact with Dialogflow’s API.
3. ```python-dotenv```: will be used by Flask to load environment configurations files.
4. ```pusher```: to add realtime to our chatbot.

Alternatively you can use ```python-decouple``` in place of ```python-dotenv```

# Flask Configs
Inside ```.flaskenv``` file add the following variables

```
FLASK_APP=index.py
FLASK_ENV=development
```

These env variables configure **Flask** to use ```index.py``` as the main entry 
file and start up the project in ```development``` mode.

First let's import all the packages 

```
from flask import Flask, request, jsonify, render_template
import os
import dialogflow
import requests
import json
import pusher
```

We have already installed these packages.

Now we will define the only route url for our flask app

```
...
import pusher

app = Flask(__name__)

@app.route('/')
def index():
	return render_template('index.html')


if __name__ == '__main__':
	app.run()

```

After this run the flask command from root folder

```
>>> flask run

 * Serving Flask app "index.py" (lazy loading)
 * Environment: development
 * Debug mode: on
 * Restarting with stat
 * Debugger is active!
 * Debugger PIN: 215-658-318
 * Running on http://127.0.0.1:5000/ (Press CTRL+C to quit)
```

# Movie API Key
The main purpose of our chatbot is to display movie details that users asks our 
bot. For that purpose we use OMDb. The OMDb API is a RESTful web service to 
obtain movie information.

OMDb requires that we have an API key before you can use their service. To get a 
free API access key, head to OMDb. Sign up for a free account. An email will be 
sent to you that contains your API key. You also need to activate your account 
from the email sent to you.

Once you have the **API KEY** add it to ```.env``` file

```
OMDB_API_KEY=API_KEY
```

# [Dialogflow](http://dialogflow.com)
Create an account on dialogflow which is done by your google account. Click on 
**Go to console** and on the left sidebar click on **Create new agent**

Going with our context, name the bot **Movie_Bot**. You can select your timezone
and also in the bottom you can create a new **Google Project**

Once done, enable the **Small Talk** by scrolling the left sidebar. This gives 
our bot small talks ability by default.

# Movie Intents
When users ask about a movie, at the moment our bot won't know what to respond 
with because it does not know about movies. So, let's train it to understand 
when the user is asking about a movie. This will be a movie intent.

Now,

1. Click on Intents on the sidebar of your dashboard
2. Then click on the CREATE INTENT button
3. Next, type in movie as the intent name
4. Finally, click on the SAVE button

Next, click on **Add Training Phrases** Now, type in texts that a user is likely 
going to use to ask about a movie as seen in the image above.

For example:

1. Show details about The Mummy
2. More about Black Panther
3. Give me synopsis about The Godfather
4. I want to know more about Upgrade

**NOTE:** The more training data, the more intelligent your bot will be

Once done click on **SAVE** button.

# Create Entities
The entity is used for extracting parameter values from the user input. Let's 
train our bot to know which among the texts is the actual movie name. All we 
need is the name of the movie so we can search for the movie.

Now,

1. Click on Entities on the sidebar.
2. Next, click on the CREATE ENTITY button.
3. Type in movie as the ENTITY NAME as seen in the image below.
4. Then add one or more movie name of your choice as seen in the image below.
5. Finally, click on the SAVE button.

Next, click on Intents on the sidebar. Under the intents lists, click on movie. 

Then for each of the intent you have typed earlier, **highlight** the movie name. 
You’ll get an entity option, then select @movie. Don't forget to click on **SAVE** button once done.

Finally, on the same page, scroll down to **Fulfillment** and enable it to use 
webhook then **SAVE**.

# API Keys
To make use of Dialogflow Python library, it requires that we have an API key. So we need to get it.

1. Go to Google Cloud Platform.
2. Select our bot project name - Movie-Bot (This is the same as the name we gave 
our Agent)
3. Copy out the ```project_id``` Then add the project_id to the ```.env``` file:
	
	```
	DIALOGFLOW_PROJECT_ID=<your_project_id>
	```
4. Next, go to APIs & Services then Credentials
   Under Create credentials, click on Service account key   
   Select Dialogflow integrations under Service account.
   Then select JSON under key type.
   Finally, click on the Create button to download your API key
   Your API key will be downloaded automatically.
5. Now, copy the downloaded JSON file ( Movie-Bot.json) to the root folder of 
the project - movie_bot.
	**NOTE:** This is your API key, you should not commit it to a public repository.

Now add the json file into ```.env``` file

```
GOOGLE_APPLICATION_CREDENTIALS=Moive-Bot-*.json
```

```Moive-Bot-*.json``` be sure to add the whole file name.

# Setting Up Webhook
Now when a user asks our bot about a movie, it will detect the intent of the 
user but can't reply with the movie detail. That is where webhooks come in. 

When our bot detects the movie keyword, it will make a request to our webhook 
using the movie keyword. Now using the movie keyword, we'll query OMDb for 
details about the movie. Then send the result back to Dialogflow.

Lets a create a new route which we'll use as our webhook. Add the following code 
to ```index.py```

```
...

@app.route('/get-movie-details', methods=['POST'])
def get_movie_detail():
	data = request.get_json(silent=True)
	movie = data['queryResult']['parameters']['moive']
	api_key = os.getenv('OMDB_API_KEY')

	movie_detail = requests.get('http://www.omdbapi.com/?t={0}&apikey={1}'.format(movie, api_key))
	movie_detail = json.loads(movie_detail)
	response = """
		Title : {0}
		Released: {1}
		Actors: {2}
		Plot: {3}
	""".format(movie_detail['Title'], movie_detail['Released'], movie_detail['Actors'], movie_detail['Plot'])

	reply = {
		'fulfillmentText': response
	}

	return jsonify(reply)
```

In the preceding code:

1. We created a route named get_movie_detail, which is a POST method.
2. Then, we got the json request that will be sent by Diagflow to the route using request.get_json().
3. Next, we extracted the movie keyword data['queryResult']['parameters']['movie'][ 'movie'] from the request data.
4. Finally, we returned a JSON response of the movie detail.

# Exposing Localhost
Now that we have created our webhook for getting details about a movie, let's 
add the webhook to Dialogflow. Oh wait, this is localhost, Dialogflow can’t 
access it!

Hold on, Ngrok can help us out here.

Open up a new window of your command line, and type the following command:

```
ngrok http localhost:5000
```

Which should display results like

```
ngrok by @inconshreveable                                           (Ctrl+C to quit)

Session Status                online
Session Expires               7 hours, 59 minutes
Version                       2.2.8
Region                        United States (us)
Web Interface                 http://127.0.0.1:4040
Forwarding                    http://9b78dc0b.ngrok.io -> localhost:5000
Forwarding                    https://9b78dc0b.ngrok.io -> localhost:5000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

Copy any url, let's copy ```http://9b78dc0b.ngrok.io``` and head over to dialogflow sidebar where a separate section for **Fulfillment** is given.

Enable the **Webhook** and in **url** section paste the ngrok url with ```/get-movie-detail``` at last

```
http://9b78dc0b.ngrok.io/get-movie-detail
```

Hit **SAVE** button.

**NOTE:** Every time the ngrok is stopped and restarted the new url should be 
updated with the dialogflow fulfillment url

# Finally Using [Pusher](http://pusher.com)
Pusher Channels does the job of adding realtime functionality to applications. 
We’ll use this to add realtime functionality to our bot. But before we can start 
using the platform, we need an API key. 

Head to pusher and create new account then create new app and inside app click
on **App Keys** Add the keys to ```.env``` file

```
PUSHER_APP_ID=app_id
PUSHER_KEY=key
PUSHER_SECRET=secret
PUSHER_CLUSTER=cluster
```

# Bot Interface
We will have a simple chatbot interface which will be implemented using bootstrap

Add this code to ```index.html``` file

```
<!doctype html>
<html lang="en">

<head>
    <!-- Required meta tags -->
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.0/css/bootstrap.min.css">
    <link rel="stylesheet" href="{{ url_for('static', filename='style.css') }}">
    <title>Movie Bot</title>
</head>

<body>
    <div class="container h-100">
        <div class="row align-items-center h-100">
            <div class="col-md-8 col-sm-12 mx-auto">
                <div class="h-100 justify-content-center">
                    <div class="chat-container" style="overflow: auto; max-height: 80vh">
                        <!-- chat messages -->
                    </div>
                    <form id="target">
                        <input class="input" type="text" value="" placeholder="Enter message..." id="input_message" />
                        <input type="submit" hidden>
                    </form>
                </div>
            </div>
        </div>
    </div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.0/js/bootstrap.min.js"></script>
    <script src="https://js.pusher.com/4.1/pusher.min.js"></script>
    <script src="{{ url_for('static', filename='custom.js')}}"></script>
</body>

</html>
```

```style.css``` file 

```
 body,
 html {
     height: 100%;
 }

 .chat-container {
     margin: 0px;
     padding: px;
 }

 .chat-message {
     padding: 6px;
     border-radius: 3px;
     margin-bottom: 3px;
 }

 .bot-message {
     background: green;
     color: white;
 }

 .human-message {
     background: dodgerblue;
     color: white;
     margin: 13px 1px;
 }

 .input {
     width: 100%;
     margin: 35px 0px;
     height: 60px;
     border: 1px solid rosybrown;
     border-radius: 3px;
 }
```

# Sending Message To Dialogflow And Displaying Responses
When a user submits a message, we’ll send it to Diagflow to detect the intent of 
the user. Dialogflow will process the text, then send back a fulfillment 
response.

Add the following code to ```index.py```:

```
def detect_intent_texts(project_id, session_id, text, language_code):
	session_client = dialogflow.SessionsClient()
	session = session_client.session_path(project_id, session_id)
	
	if text:
		text_input = dialogflow.types.TextInput(
			text=text, language_code=language_code)
		query_input = dialogflow.types.QueryInput(text=text_input)
		response = session_client.detect_intent(
			session=session, query_input=query_input)

		return response.query_result.fulfillment_text
```

Finally, let’s create a route that this text will be submitted to. Add the 
following code to index.py:

```
@app.route('/send_message', methods=['POST'])
def send_message():
	message = request.form['message']
	project_id = os.getenv('DIALOGFLOW_PROJECT_ID')
	fulfillment_text = detect_intent_texts(project_id, "unique", message, 'en')
	response_text = {"message": fulfillment_text}

	return jsonify(response_text)
```

# Displaying Messages
Now, let's display all the messages and responses to our chatbot's page.

Add the following code to ```script.js```

```
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
```

Here, we created a function - submit_message - that will be invoked once a user submits a message.

Then, we’ll use jQuery to send the message to our route - /send_message - from where it will be processed.

Finally, we’ll append the response to the HTML DOM.

Next, add the following code to ```static/custom.js```:

```
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
```

Done, Test the installation by running stopping server and ```flask run``` again
