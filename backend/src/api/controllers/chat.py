from flask import Blueprint, request
import http.client as http_client
from ..gigachat.chat import process_promt_list_chat

mod = Blueprint('chat', __name__, url_prefix='/')


@mod.route('/chat', methods=['POST'])
def simple_chat():
    promts = request.json.get('promts_list')
    result = process_promt_list_chat(promts)
    return { 'result': result }, http_client.OK
