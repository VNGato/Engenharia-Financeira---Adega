from flask import Flask, render_template, request, redirect, url_for, jsonify, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'adega-secret-123'
app.config['SQLALCHEMY_DATABASE_DATA_DB_URI'] = 'sqlite:///' + os.path.join(app.root_path, 'adega.db')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(app.root_path, 'adega.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

# --- Modelos ---
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)

class DashboardState(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), unique=True, nullable=False)
    fat = db.Column(db.Float, default=0.0)
    socios = db.Column(db.Integer, default=0)
    base_esc = db.Column(db.Float, default=0.0)
    base_cax = db.Column(db.Float, default=0.0)
    base_rep = db.Column(db.Float, default=0.0)
    q_esc = db.Column(db.Integer, default=0)
    q_cax = db.Column(db.Integer, default=0)
    q_rep = db.Column(db.Integer, default=0)

# Inicialização automática do banco
with app.app_context():
    db.create_all()

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# --- Rotas ---

@app.route('/')
@login_required
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    user_exists = User.query.first() is not None
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if not user_exists:
            new_user = User(username=username, password=generate_password_hash(password))
            db.session.add(new_user)
            db.session.commit()
            login_user(new_user)
            return redirect(url_for('index'))
        
        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password, password):
            login_user(user)
            return redirect(url_for('index'))
        else:
            flash('Usuário ou senha inválidos')
            
    return render_template('login.html', user_exists=user_exists)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/api/get_data', methods=['GET'])
@login_required
def get_data():
    state = DashboardState.query.filter_by(user_id=current_user.id).first()
    if not state:
        state = DashboardState(user_id=current_user.id)
        db.session.add(state)
        db.session.commit()
    
    return jsonify({
        "fat": state.fat, "socios": state.socios,
        "base_esc": state.base_esc, "base_cax": state.base_cax, "base_rep": state.base_rep,
        "q_esc": state.q_esc, "q_cax": state.q_cax, "q_rep": state.q_rep
    })

@app.route('/api/save_data', methods=['POST'])
@login_required
def save_data():
    data = request.json
    state = DashboardState.query.filter_by(user_id=current_user.id).first()
    if not state:
        state = DashboardState(user_id=current_user.id)
        db.session.add(state)
    
    state.fat = data.get('fat', 0)
    state.socios = data.get('socios', 0)
    state.base_esc = data.get('base_esc', 0)
    state.base_cax = data.get('base_cax', 0)
    state.base_rep = data.get('base_rep', 0)
    state.q_esc = data.get('q_esc', 0)
    state.q_cax = data.get('q_cax', 0)
    state.q_rep = data.get('q_rep', 0)
    
    db.session.commit()
    return jsonify({"status": "success"})

@app.route('/api/clear_data', methods=['POST'])
@login_required
def clear_data():
    DashboardState.query.filter_by(user_id=current_user.id).update({
        "fat": 0, "socios": 0, "base_esc": 0, "base_cax": 0, "base_rep": 0,
        "q_esc": 0, "q_cax": 0, "q_rep": 0
    }, synchronize_session='fetch')
    db.session.commit()
    return jsonify({"status": "success"})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
