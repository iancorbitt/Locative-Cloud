.PHONY: test

test:
	HOSTNAME=my.locative.io \
	SERVERNAME=my-locative-io-stg \
	MONGOLAB_URI=https://user:pass@mongolab.com/dbname \
	REDISCLOUD_URL=https://user@pass@rediscloud.com/dbname \
	STATUS_MAIL_RCPT=support@locative.io \
	MAIL_FROM=support@locative.io \
	MAIL_SERVER=locative.io \
	MAIL_USER=locative \
	MAIL_PASSWORD=l0c4t1v3 \
	FB_APP_ID=12345 \
	FB_APP_SECRET=67890 \
	FB_AUTH_CALLBACK=https://my.locative.io/oauth/fb/callback \
	TW_CONSUMER_KEY=ABCDEF \
	TW_CONSUMER_SECRET=GHIJK \
	TW_AUTH_CALLBACK=https://my.locative.io/oauth/tw/callback \
	./node_modules/.bin/mocha --recursive

dev:
	source .env && supervisor app.js
