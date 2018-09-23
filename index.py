import os
import dialogflow
import requests
import json
import pusher

from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

key = os.getenv("PUSHER_APP_CLUSTER")
print(f"Pusher KEY: {key}")

# initialize Pusher
pusher_client = pusher.Pusher(
	app_id=os.getenv('PUSHER_APP_ID'),
	key=os.getenv('PUSHER_APP_KEY'),
	secret=os.getenv('PUSHER_APP_SECRET'),
	cluster=os.getenv('PUSHER_APP_CLUSTER'),
	ssl=True)
	
app = Flask(__name__)

@app.route('/')
def index():
	return render_template('index.html')


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


@app.route('/send_message', methods=['POST'])
def send_message():
	message = request.form['message']
	project_id = os.getenv('DIALOGFLOW_PROJECT_ID')
	fulfillment_text = detect_intent_texts(project_id, "unique", message, 'en')
	response_text = {"message": fulfillment_text}

	return jsonify(response_text)


if __name__ == '__main__':
	app.run()
