npm install
npm audit fix
tsc -p tsconfig.client.json

python -m venv .venv
.venv\Scripts\activate
pip install -r py\requirements.txt
pip install -r node_modules\node-gyp\gyp\requirements-dev.txt
