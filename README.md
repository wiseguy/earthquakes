# earthquakes

To run locally make sure you must have node v16 installed
=========================
- npm install
- npm start

To run as a container
=========================
- Install Docker Desktop

- Build: docker build -t aamir/earthquakes:1.0 .
- Run: docker container run --name earthquakes1.0 -p 3000:8080 aamir/earthquakes:1.0


- PS: Pretty convenient to use docker from VS Code

Test
============================
- For local run - http://127.0.0.1:8080/earthquakes/subscribe/getAll
- For docker - http://127.0.0.1:3000/earthquakes/subscribe/getAll
- response: {}

Usage
============================
- Use Thunder Client (VS Code extension) or Postman to test

- To View All Subscriptions 
- Get : http://localhost:3000/earthquakes/subscribe/getAll


- To subscribe 
- Post : http://localhost:3000/earthquakes/subscribe/set

```javascript
{
  "endpoint": "https://felt-requests-ontorsbua380.runkit.sh",
  "filters": [
    {
      "type": "magnitude",
      "minimum": 1.0
    }
  ]
}
```


