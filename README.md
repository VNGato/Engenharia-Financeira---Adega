# 🍷 Adega Business Intelligence

Sistema de engenharia financeira e controle de lucro para adegas e pequenos comércios. Desenvolvido em **Python/Flask** para alta performance e facilidade de deploy.

## 🚀 Como Rodar Localmente

1. **Crie e ative o ambiente virtual:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

2. **Instale as dependências:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Inicie o servidor:**
   ```bash
   python app.py
   ```
   Acesse em: `http://localhost:5000`

## ☁️ Deploy no PythonAnywhere

Siga estes passos para colocar seu sistema online:

1. **Suba os arquivos para o GitHub.**
2. **No PythonAnywhere:**
   - Abra um console Bash.
   - Clone seu repositório: `git clone https://github.com/SEU_USUARIO/Adega.git`
   - Vá para a aba **Web**.
   - Clique em **Add a new web app**.
   - Escolha **Manual Configuration** -> **Python 3.10** (ou mais recente).
   - Configure o **Source Code** para o caminho da pasta (`/home/SEU_USUARIO/Adega`).
   - Configure o **Working Directory** para a mesma pasta.
   - No arquivo **WSGI configuration file** (link azul na aba Web), substitua o conteúdo por:
     ```python
     import sys
     import os

     path = '/home/SEU_USUARIO/Adega'
     if path not in sys.path:
         sys.path.append(path)

     from app import app as application
     ```
   - No console, instale as dependências: `pip install flask`
   - **Reload** na aba Web e pronto!

## 🛠️ Tecnologias Utilizadas

- **Backend:** Python / Flask
- **Frontend:** HTML5, CSS3 (Glassmorphism), Vanilla JavaScript
- **Design:** UI Premium com background imersivo e micro-animações.

---
*Desenvolvido para gestão profissional de adegas.*
