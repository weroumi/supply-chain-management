from exceptiongroup import catch
from flask import render_template, jsonify
from ..models.data import DataModel
from io import StringIO, BytesIO
import pandas as pd
import os
import glob
import json


class DataController:
    df = None

    default_datasets_directory = '..\\res\\datasets'
    default_dataset_name = None

    file_name = None

    @staticmethod
    def load_xlsx(file, sheet_name):
        # Read the uploaded Excel file into a DataFrame
        DataController.df = pd.read_excel(BytesIO(file.read()), sheet_name=sheet_name)
        DataController.df['id'] = DataController.df.index
        data = DataController.df.to_dict(orient='records')
        return jsonify({"message": "File loaded successfully"}), 200

    @staticmethod
    def load_default_dataset(file_name, sheet_name):
        if (file_name == DataController.default_dataset_name):
            return

        DataController.file_name = file_name

        default_dataset_name = file_name.strip()
        # file_path = "".join(os.path.join(os.path.dirname(__file__).strip(), DataController.default_datasets_directory.strip(), file_name.strip()))
        file_path = os.path.join(
            os.path.dirname(__file__).strip(),
            DataController.default_datasets_directory.strip(),
            file_name.strip()
        )
        file_path = file_path.replace("\\", "/").strip()
        if not os.path.exists(file_path.replace('\r', '').replace('\n', '')):
            return jsonify({"error": "File not found"}), 404

        with open(file_path, 'rb') as file:
            return DataController.load_xlsx(file, sheet_name)

    @staticmethod
    def load_default_datasets_names():
        directory = os.path.join(os.path.dirname(__file__), '../res/datasets/*')
        files = glob.glob(directory)
        file_names = [os.path.basename(file) for file in files]
        return jsonify(file_names)

    @staticmethod
    def render_line_chart():
        return render_template('charts.html', data=[])


    @staticmethod
    def render_about():
        return render_template('about.html', data=[])

    @staticmethod
    def get_validated_bar_data():
        data = DataModel.get_bar_data()
        # Simple validation: Ensure data is not empty
        if not data:
            raise ValueError("Data is empty")

        return data

    @staticmethod
    def get_validated_line_data():
        data = DataModel.get_line_data(DataController.df)
        # Simple validation: Ensure data is not empty
        if not data:
            raise ValueError("Data is empty")
        return data

    @staticmethod
    def get_validated_choropleth_data():
        data = DataModel.get_choropleth_data_by_category(DataController.df)
        tariffs_per_category_simple = DataModel.get_product_categories_map(DataController.df)
        DataController.load_default_dataset(DataController.file_name, sheet_name="weighted")
        tariffs_per_category_weighted = DataModel.get_product_categories_map(DataController.df)
        # if data.empty:
        #     raise ValueError("Data is empty")

        # records = data.to_dict(orient='records')
        payload = {
            "data": data,
            "tariffs_per_category_simple": tariffs_per_category_simple,
            "tariffs_per_category_weighted": tariffs_per_category_weighted
        }
        return payload

    @staticmethod
    def get_validated_chord_data():
        return DataModel.get_chord_data(DataController.df)

    @staticmethod
    def get_validated_node_link_data():
        return DataModel.get_temporal_node_link_data(DataController.df)

    @staticmethod
    def get_sweden_geojson():
        with open('src/res/geojson/laen-kustlinjer.geo.json', 'r') as file:
            data = json.load(file)

        if not data:
            raise ValueError("Geojson data is empty")
        return data