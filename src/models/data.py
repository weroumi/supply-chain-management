from geopy.extra.rate_limiter import RateLimiter
import pandas as pd
from functools import partial
import networkx as nx
from collections import defaultdict
import numpy as np
from pandas.core.interchange.dataframe_protocol import DataFrame


class DataModel:
    geocoded_data_df = pd.read_csv(
        'src/res/geocoded_data/csv/geocoded.csv',
        delimiter=';')
    iso3166_1_df = pd.read_csv('src/res/iso/iso3166-1-with-centroids.csv', delimiter=';')

    @staticmethod
    def fake_data():
        return pd.read_csv(r"C:\Users\Admin\Documents\uni\qwerty\DataVis_Template_LNU\src\res\mock\data.csv")

    @staticmethod
    def get_bar_data():
        # Simulating data retrieval from a database or external source
        return [10, 20, 30, 40, 50]

    @staticmethod
    def get_line_data(df):
        print(df)
        df = df.dropna(subset=['order_iso_code'])
        frequency_per_year = df['year'].value_counts().reset_index()
        frequency_per_year_sorted = frequency_per_year.sort_values('year')
        data = frequency_per_year_sorted.to_dict(orient='records')
        return data


    @staticmethod
    def get_choropleth_data(df):
        df = df.dropna(subset=['order_iso_code'])
        res = df

        res = res.rename(columns={"order_iso_code": "country_code",
                                  "order_country": "country_name"})
        res = res.dropna(subset=['country_code'])
        res = res.rename(columns={'year': 'year1', 'year_month': 'year'})

        res = res.groupby(["country_code", "country_name", "year"], as_index=False).agg(
            days_for_shipping_real=('days_for_shipping_real', 'mean'),
            days_for_shipping_scheduled=('days_for_shipping_scheduled', 'mean'),
            count=('id', 'count')
        )

        return res

    @staticmethod
    def get_choropleth_data_by_category(df: pd.DataFrame) -> dict[str, list[dict]]:
        result: dict[str, list[dict]] = {}

        df_all = DataModel.get_choropleth_data(df)
        result["-- All categories"] = df_all.to_dict(orient="records")

        for cat, df_cat in df.groupby("category_name"):
            df_agg = DataModel.get_choropleth_data(df_cat)
            result[cat] = df_agg.to_dict(orient="records")

        return result

    @staticmethod
    def safe_split(value: str):
        try:
            if type(value) is float:
                return None
            return value.split(', ', 1)[1]
        except IndexError:
            return None

    @staticmethod
    def get_graph_data(df: pd.DataFrame):
        df = df.copy()
        df.loc[:, 'country_code'] = df.apply(lambda row: [row['customer_iso_code'], row['order_iso_code']], axis=1)
        data = df['country_code'].to_list()

        g = nx.Graph()
        for row in data:
            row = [x for x in row if str(x) != 'nan']
            if len(row) == 0:
                continue
            if len(row) == 1:
                g = DataModel.add_node(g, row[0])
                continue

            # remove same nodes as ego
            source = row[0]
            shortened_row = [source] + [element for element in row if element != source]
            g = DataModel.add_node(g, source)
            if len(shortened_row) < len(row):
                if g.has_edge(source, source):
                    g[source][source]["weight"] += 1
                else:
                    g.add_edge(source, source, weight=1)

            # remove repeating nodes
            unique_entries = list(set(shortened_row))
            if len(unique_entries) < 2:
                continue

            # compose the graph
            for i in range(1, len(unique_entries)):
                target = unique_entries[i]
                g = DataModel.add_node(g, target)
                if g.has_edge(source, target):
                    g[source][target]["weight"] += 1
                else:
                    g.add_edge(source, target, weight=1)
        for node in g.nodes:
            g.nodes[node]['size'] = g.degree(weight='weight')[node]
        return g

    @staticmethod
    def get_node_link_data(df: pd.DataFrame):
        g = DataModel.get_graph_data(df)
        return nx.node_link_data(g, edges="links")

    @staticmethod
    def get_temporal_node_link_data(df: pd.DataFrame):
        res = {}
        years = []
        for year in sorted(df['year_month'].unique()):
            years.append(year)
            year_df = df[df['year_month'].isin(years)]
            res[year] = DataModel.get_node_link_data(year_df)
        return res

    @staticmethod
    def get_chord_data(df: DataFrame):
        g = DataModel.get_graph_data(df)
        colors = []

        regions_dict = defaultdict(int)
        for node in g.nodes:
            try:
                regions_dict[g.nodes[node]["region"]] += g.nodes[node]["size"]
                colors.append(g.nodes[node]["color"])
            except KeyError:
                print(node)

        regions_list = [{'name': region, 'size': size} for region, size in
                    regions_dict.items()]
        graph_data_dict = nx.node_link_data(g)
        graph_data_dict['regions'] = regions_list
        graph_data_dict['matrix'] = nx.to_numpy_array(g).tolist()
        graph_data_dict['names'] = np.array(g.nodes).tolist()
        graph_data_dict['colors'] = colors

        return graph_data_dict

    @staticmethod
    def add_node(graph: nx.Graph, node: str):
        if node == "nan" or type(node) is float:
            return graph
        if not graph.has_node(node):
            regions = DataModel.iso3166_1_df.loc[DataModel.iso3166_1_df['alpha-3'] == node, 'region'].unique()
            region = regions[0] if len(regions) > 0 else None
            longitudes = DataModel.iso3166_1_df.loc[DataModel.iso3166_1_df['alpha-3'] == node, 'longitude'].unique()
            longitude = longitudes[0] if len(longitudes) > 0 else None
            latitudes = DataModel.iso3166_1_df.loc[DataModel.iso3166_1_df['alpha-3'] == node, 'latitude'].unique()
            latitude = latitudes[0] if len(latitudes) > 0 else None
            graph.add_node(node, size=1,
                           region=region, longitude=longitude, latitude=latitude)
        return graph

    @staticmethod
    def get_product_categories_map(df: pd.DataFrame):
        df['2015'] = (df['2015']).round(2)
        df['2016'] = (df['2016']).round(2)
        df['2017'] = (df['2017']).round(2)
        df['2018'] = (df['2018']).round(2)

        years = [str(y) for y in range(2015, 2019)]
        nested = {
            cat: {
                year: dict(
                    sorted(
                        grp.set_index('order_iso_code')[year].items(),
                        key=lambda kv: kv[1],  # sort by the value
                        reverse=False  # largest first
                    )
                )
                for year in years
            }
            for cat, grp in df.groupby('category_name')
        }
        all_categories = {
            year: dict(
                sorted(
                    df.set_index('order_iso_code')[year].items(),
                    key=lambda kv: kv[1],
                    reverse=False
                )
            )
            for year in years
        }
        nested["-- All categories"] = all_categories
        return nested
