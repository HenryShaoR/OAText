.PHONY: all frontend backend clean

all: frontend backend

frontend: .frontend-installed
	npm run dev --prefix ./client

backend: .backend-installed
	cd ./server && node ./src/index.js

.frontend-installed: ./client/package.json
	npm install --prefix ./client
	touch $@

.backend-installed: ./server/package.json
	npm install --prefix ./server
	touch $@

clean:
	rm -f .frontend-installed .backend-installed
