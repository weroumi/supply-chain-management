import os
from flask import Flask, request, jsonify  # Importing request module


from src.controllers.controller import DataController

# Set the views folders' paths
template_dir = os.path.abspath('./src/views/templates')
static_dir = os.path.abspath('./src/views/static')
app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)

#Set HTTP paths for HTML pages
@app.route('/')
def index():
    return DataController.render_line_chart()

@app.route('/main')
def line_chart():
    return DataController.render_line_chart()

@app.route('/about')
def about():
    return DataController.render_about()

#Set the data fetch paths for D3
@app.route('/line-data')
def get_line_data():
    return {"data": DataController.get_validated_line_data()}

@app.route('/default-datasets')
def get_default_datasets():
    return DataController.load_default_datasets_names()

@app.route('/choropleth-data')
def get_choropleth_data():
    return DataController.get_validated_choropleth_data()

@app.route('/chord-data')
def get_chord_data():
    return  DataController.get_validated_chord_data()

@app.route('/node-link-data')
def get_node_link_data():
    return DataController.get_validated_node_link_data()

@app.route('/sweden-geojson')
def get_sweden_geojson():
    return DataController.get_sweden_geojson()

#post requests
@app.route('/default-datasets', methods=['POST'])
def set_default_dataset():
    data = request.get_json()
    file_name = data.get('datasetName', '')

    DataController.load_default_dataset(file_name, sheet_name="simple")
    return jsonify(DataController.get_validated_choropleth_data()), 200

@app.route('/upload', methods=['POST'])
def upload_file():
    file = request.files['file']
    if file.filename.endswith('.dat'):
        # Process the uploaded text file
        text_data = file.read().decode('utf-8')
        # Convert to JSON format
        json_data = convert_to_json(text_data)
        return jsonify(json_data)
    elif file.filename.endswith('.xlsx'):
        DataController.default_dataset_name = 'custom'
        return DataController.load_xlsx(file)
    else:
        return jsonify({'error': 'Uploaded file must be in DAT or CSV format.'})



def convert_to_json(text_data):
    nodes = set()
    links = []

    # Process each line in the text data
    for line in text_data.split('\n'):
        parts = line.split()
        if len(parts) == 3:  # Ensure each line contains three parts: node_origin, node_destiny, timestamp
            node_origin, node_destiny, _ = parts
            nodes.add(node_origin)
            nodes.add(node_destiny)
            links.append({'source': node_origin, 'target': node_destiny})

    # Create node data
    nodes_data = [{'id': node, 'group': i+1} for i, node in enumerate(nodes)]

    return {'nodes': nodes_data, 'links': links}

if __name__ == '__main__':
    app.run(debug=True, host='localhost', port=8080)
