from flask import Flask, jsonify, request
from flask_cors import CORS
import pickle
import pandas as pd
import numpy as np

app = Flask(__name__)
CORS(app)  # Allow React frontend to call this API

# Load the trained model
print("Loading HastaKrafts recommendation model...")
with open('hastakrafts_model.pkl', 'rb') as f:
    model_data = pickle.load(f)

svd_model         = model_data['svd_model']
user_item_matrix  = model_data['user_item_matrix']
user_similarity_df = model_data['user_similarity_df']
item_similarity_df = model_data['item_similarity_df']
product_info      = model_data['product_info']
df_agg            = model_data['df_agg']

print("✅ Model loaded successfully!")


def get_recommendations_for_user(user_id, n=6):
    """Recommended for you — Collaborative Filtering"""
    if user_id not in user_similarity_df.index:
        # Cold start: return popular products
        popular = df_agg.groupby('product_id')['weighted_rating'] \
                        .sum().sort_values(ascending=False).head(n)
        result = []
        for pid in popular.index:
            if pid in product_info.index:
                result.append({
                    'product_id': int(pid),
                    'product_name': product_info.loc[pid, 'product_name'],
                    'category': product_info.loc[pid, 'category_name'],
                    'score': round(float(popular[pid]), 2),
                    'type': 'popular'
                })
        return result

    # Products this user already interacted with
    user_products = set(df_agg[df_agg['user_id'] == user_id]['product_id'].tolist())

    # Top 10 similar users
    similar_users = user_similarity_df[user_id] \
                        .sort_values(ascending=False)[1:11].index.tolist()

    # Score products from similar users
    scores = {}
    for sim_user in similar_users:
        sim_score = user_similarity_df.loc[user_id, sim_user]
        sim_data  = df_agg[df_agg['user_id'] == sim_user]
        for _, row in sim_data.iterrows():
            pid = row['product_id']
            if pid not in user_products:
                scores[pid] = scores.get(pid, 0) + (sim_score * row['weighted_rating'])

    top_products = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:n]
    result = []
    for pid, score in top_products:
        if pid in product_info.index:
            result.append({
                'product_id': int(pid),
                'product_name': product_info.loc[pid, 'product_name'],
                'category': product_info.loc[pid, 'category_name'],
                'score': round(float(score), 2),
                'type': 'collaborative'
            })
    return result


def get_similar_products(product_id, n=6):
    """You may also like — Item-Based Filtering"""
    if product_id not in item_similarity_df.index:
        return []

    similar = item_similarity_df[product_id] \
                  .sort_values(ascending=False)[1:n+1]
    result = []
    for pid, score in similar.items():
        if pid in product_info.index:
            result.append({
                'product_id': int(pid),
                'product_name': product_info.loc[pid, 'product_name'],
                'category': product_info.loc[pid, 'category_name'],
                'score': round(float(score), 4),
                'type': 'item_based'
            })
    return result


# ─── ROUTES ───────────────────────────────────────────

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'message': 'HastaKrafts AI Recommendation Engine',
        'status': 'running',
        'endpoints': {
            'recommended_for_you': '/recommend/user/<user_id>',
            'you_may_also_like':   '/recommend/similar/<product_id>',
            'health':              '/health'
        }
    })


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'model': 'loaded'})


@app.route('/recommend/user/<int:user_id>', methods=['GET'])
def recommend_for_user(user_id):
    """
    GET /recommend/user/1?n=6
    Returns: Recommended for you — for home page
    """
    try:
        n = int(request.args.get('n', 6))
        recommendations = get_recommendations_for_user(user_id, n)
        return jsonify({
            'user_id': user_id,
            'recommendations': recommendations,
            'count': len(recommendations),
            'powered_by': 'AI — Collaborative Filtering (SVD)'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/recommend/similar/<int:product_id>', methods=['GET'])
def recommend_similar(product_id):
    """
    GET /recommend/similar/22?n=6
    Returns: You may also like — for product page
    """
    try:
        n = int(request.args.get('n', 6))
        similar = get_similar_products(product_id, n)
        return jsonify({
            'product_id': product_id,
            'similar_products': similar,
            'count': len(similar),
            'powered_by': 'AI — Item-Based Collaborative Filtering'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print("🚀 Starting HastaKrafts Recommendation API...")
    print("   http://localhost:5001/recommend/user/1")
    print("   http://localhost:5001/recommend/similar/22")
    app.run(host='0.0.0.0', port=5001, debug=True)