var mocha  = require('mocha');
var expect = require('chai').expect;
var config = require('../../lib/config').getConfig(true);

describe('Locative Configuration', function() {
    it('is not coming from a json file (while under test)', function() {
      expect(config.is_json).to.be.false;
    });

    it('has a valid hostname', function() {
      expect(config.hostname).to.equal('my.locative.io');
    });

    it('has a valid servername', function() {
      expect(config.servername).to.equal('my-locative-io-stg');
    });

    it('has a valid MongoDB url', function() {
      expect(config.mongodb_url).to.equal('https://user:pass@mongolab.com/dbname');
    });

    it('has a valid Redis url', function() {
      expect(config.redis_url).to.equal('https://user@pass@rediscloud.com/dbname');
    });

    it('has a valid status mail recipient', function() {
      expect(config.status_mail_recipient).to.equal('support@locative.io');
    });

    it('has a valid mail from address', function() {
      expect(config.mail_from).to.equal('support@locative.io');
    });

    it('has a valid mail server address', function() {
      expect(config.mail_server).to.equal('locative.io');
    });

    it('has a valid mail user name', function() {
      expect(config.mail_user).to.equal('locative');
    });

    it('has a valid mail password', function() {
      expect(config.mail_password).to.equal('l0c4t1v3');
    });

    it('has a valid Facebook App Id', function() {
      expect(config.fb_app_id).to.equal('12345');
    });

    it('has a valid Facebook App Secret', function() {
      expect(config.fb_app_secret).to.equal('67890');
    });

    it('has a valid Facebook App Auth callback', function() {
      expect(config.fb_auth_callback).to.equal('https://my.locative.io/oauth/fb/callback');
    });

    it('has a valid Twitter consumer key', function() {
      expect(config.tw_consumer_key).to.equal('ABCDEF');
    });

    it('has a valid Twitter consumer secret', function() {
      expect(config.tw_consumer_secret).to.equal('GHIJK');
    });

    it('has a valid Twitter Auth callback', function() {
      expect(config.tw_auth_callback).to.equal('https://my.locative.io/oauth/tw/callback');
    });

});
