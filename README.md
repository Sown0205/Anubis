## Anubis - Network Intrusion Detection System Webapp integrates AI model

### Steps to deploy the webapp locally

1. Pull the code from Github

```bash
git clone 
```

2. Install required dependencies for frontend server (React)

```bash 
npm install
```

3. Install required packages for backend server (Python FastAPI)

```bash
pip install -r requirements.txt
```

4. Start the backend server first

```bash
uvicorn backend.server:app --reload
```

or cd into backend folder and just run

```bash
uvicorn server:app --reload
```

5. Start the frontend server

The frontend server was managed by yarn and craco, so the proper way to boot up the frontend server will be

```bash
yarn start
```

(cd into the frontend folder before run this command)