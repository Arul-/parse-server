"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.PublicAPIRouter = void 0;

var _PromiseRouter = _interopRequireDefault(require("../PromiseRouter"));

var _Config = _interopRequireDefault(require("../Config"));

var _express = _interopRequireDefault(require("express"));

var _path = _interopRequireDefault(require("path"));

var _fs = _interopRequireDefault(require("fs"));

var _querystring = _interopRequireDefault(require("querystring"));

var _node = require("parse/node");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const public_html = _path.default.resolve(__dirname, '../../public_html');

const views = _path.default.resolve(__dirname, '../../views');

class PublicAPIRouter extends _PromiseRouter.default {
  verifyEmail(req) {
    const {
      token,
      username
    } = req.query;
    const appId = req.params.appId;

    const config = _Config.default.get(appId);

    if (!config) {
      this.invalidRequest();
    }

    if (!config.publicServerURL) {
      return this.missingPublicServerURL();
    }

    if (!token || !username) {
      return this.invalidLink(req);
    }

    const userController = config.userController;
    return userController.verifyEmail(username, token).then(() => {
      const params = _querystring.default.stringify({
        username
      });

      return Promise.resolve({
        status: 302,
        location: `${config.verifyEmailSuccessURL}?${params}`
      });
    }, () => {
      return this.invalidVerificationLink(req);
    });
  }

  resendVerificationEmail(req) {
    const username = req.body.username;
    const appId = req.params.appId;

    const config = _Config.default.get(appId);

    if (!config) {
      this.invalidRequest();
    }

    if (!config.publicServerURL) {
      return this.missingPublicServerURL();
    }

    if (!username) {
      return this.invalidLink(req);
    }

    const userController = config.userController;
    return userController.resendVerificationEmail(username).then(() => {
      return Promise.resolve({
        status: 302,
        location: `${config.linkSendSuccessURL}`
      });
    }, () => {
      return Promise.resolve({
        status: 302,
        location: `${config.linkSendFailURL}`
      });
    });
  }

  changePassword(req) {
    return new Promise((resolve, reject) => {
      const config = _Config.default.get(req.query.id);

      if (!config) {
        this.invalidRequest();
      }

      if (!config.publicServerURL) {
        return resolve({
          status: 404,
          text: 'Not found.'
        });
      } // Should we keep the file in memory or leave like that?


      _fs.default.readFile(_path.default.resolve(views, 'choose_password'), 'utf-8', (err, data) => {
        if (err) {
          return reject(err);
        }

        data = data.replace('PARSE_SERVER_URL', `'${config.publicServerURL}'`);
        resolve({
          text: data
        });
      });
    });
  }

  requestResetPassword(req) {
    const config = req.config;

    if (!config) {
      this.invalidRequest();
    }

    if (!config.publicServerURL) {
      return this.missingPublicServerURL();
    }

    const {
      username,
      token
    } = req.query;

    if (!username || !token) {
      return this.invalidLink(req);
    }

    return config.userController.checkResetTokenValidity(username, token).then(() => {
      const params = _querystring.default.stringify({
        token,
        id: config.applicationId,
        username,
        app: config.appName
      });

      return Promise.resolve({
        status: 302,
        location: `${config.choosePasswordURL}?${params}`
      });
    }, () => {
      return this.invalidLink(req);
    });
  }

  resetPassword(req) {
    const config = req.config;

    if (!config) {
      this.invalidRequest();
    }

    if (!config.publicServerURL) {
      return this.missingPublicServerURL();
    }

    const {
      username,
      token,
      new_password
    } = req.body;

    if ((!username || !token || !new_password) && req.xhr === false) {
      return this.invalidLink(req);
    }

    if (!username) {
      throw new _node.Parse.Error(_node.Parse.Error.USERNAME_MISSING, 'Missing username');
    }

    if (!token) {
      throw new _node.Parse.Error(_node.Parse.Error.OTHER_CAUSE, 'Missing token');
    }

    if (!new_password) {
      throw new _node.Parse.Error(_node.Parse.Error.PASSWORD_MISSING, 'Missing password');
    }

    return config.userController.updatePassword(username, token, new_password).then(() => {
      return Promise.resolve({
        success: true
      });
    }, err => {
      return Promise.resolve({
        success: false,
        err
      });
    }).then(result => {
      const params = _querystring.default.stringify({
        username: username,
        token: token,
        id: config.applicationId,
        error: result.err,
        app: config.appName
      });

      if (req.xhr) {
        if (result.success) {
          return Promise.resolve({
            status: 200,
            response: 'Password successfully reset'
          });
        }

        if (result.err) {
          throw new _node.Parse.Error(_node.Parse.Error.OTHER_CAUSE, `${result.err}`);
        }
      }

      return Promise.resolve({
        status: 302,
        location: `${result.success ? `${config.passwordResetSuccessURL}?username=${username}` : `${config.choosePasswordURL}?${params}`}`
      });
    });
  }

  invalidLink(req) {
    return Promise.resolve({
      status: 302,
      location: req.config.invalidLinkURL
    });
  }

  invalidVerificationLink(req) {
    const config = req.config;

    if (req.query.username && req.params.appId) {
      const params = _querystring.default.stringify({
        username: req.query.username,
        appId: req.params.appId
      });

      return Promise.resolve({
        status: 302,
        location: `${config.invalidVerificationLinkURL}?${params}`
      });
    } else {
      return this.invalidLink(req);
    }
  }

  missingPublicServerURL() {
    return Promise.resolve({
      text: 'Not found.',
      status: 404
    });
  }

  invalidRequest() {
    const error = new Error();
    error.status = 403;
    error.message = 'unauthorized';
    throw error;
  }

  setConfig(req) {
    req.config = _Config.default.get(req.params.appId);
    return Promise.resolve();
  }

  mountRoutes() {
    this.route('GET', '/apps/:appId/verify_email', req => {
      this.setConfig(req);
    }, req => {
      return this.verifyEmail(req);
    });
    this.route('POST', '/apps/:appId/resend_verification_email', req => {
      this.setConfig(req);
    }, req => {
      return this.resendVerificationEmail(req);
    });
    this.route('GET', '/apps/choose_password', req => {
      return this.changePassword(req);
    });
    this.route('POST', '/apps/:appId/request_password_reset', req => {
      this.setConfig(req);
    }, req => {
      return this.resetPassword(req);
    });
    this.route('GET', '/apps/:appId/request_password_reset', req => {
      this.setConfig(req);
    }, req => {
      return this.requestResetPassword(req);
    });
  }

  expressRouter() {
    const router = _express.default.Router();

    router.use('/apps', _express.default.static(public_html));
    router.use('/', super.expressRouter());
    return router;
  }

}

exports.PublicAPIRouter = PublicAPIRouter;
var _default = PublicAPIRouter;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9Sb3V0ZXJzL1B1YmxpY0FQSVJvdXRlci5qcyJdLCJuYW1lcyI6WyJwdWJsaWNfaHRtbCIsInBhdGgiLCJyZXNvbHZlIiwiX19kaXJuYW1lIiwidmlld3MiLCJQdWJsaWNBUElSb3V0ZXIiLCJQcm9taXNlUm91dGVyIiwidmVyaWZ5RW1haWwiLCJyZXEiLCJ0b2tlbiIsInVzZXJuYW1lIiwicXVlcnkiLCJhcHBJZCIsInBhcmFtcyIsImNvbmZpZyIsIkNvbmZpZyIsImdldCIsImludmFsaWRSZXF1ZXN0IiwicHVibGljU2VydmVyVVJMIiwibWlzc2luZ1B1YmxpY1NlcnZlclVSTCIsImludmFsaWRMaW5rIiwidXNlckNvbnRyb2xsZXIiLCJ0aGVuIiwicXMiLCJzdHJpbmdpZnkiLCJQcm9taXNlIiwic3RhdHVzIiwibG9jYXRpb24iLCJ2ZXJpZnlFbWFpbFN1Y2Nlc3NVUkwiLCJpbnZhbGlkVmVyaWZpY2F0aW9uTGluayIsInJlc2VuZFZlcmlmaWNhdGlvbkVtYWlsIiwiYm9keSIsImxpbmtTZW5kU3VjY2Vzc1VSTCIsImxpbmtTZW5kRmFpbFVSTCIsImNoYW5nZVBhc3N3b3JkIiwicmVqZWN0IiwiaWQiLCJ0ZXh0IiwiZnMiLCJyZWFkRmlsZSIsImVyciIsImRhdGEiLCJyZXBsYWNlIiwicmVxdWVzdFJlc2V0UGFzc3dvcmQiLCJjaGVja1Jlc2V0VG9rZW5WYWxpZGl0eSIsImFwcGxpY2F0aW9uSWQiLCJhcHAiLCJhcHBOYW1lIiwiY2hvb3NlUGFzc3dvcmRVUkwiLCJyZXNldFBhc3N3b3JkIiwibmV3X3Bhc3N3b3JkIiwieGhyIiwiUGFyc2UiLCJFcnJvciIsIlVTRVJOQU1FX01JU1NJTkciLCJPVEhFUl9DQVVTRSIsIlBBU1NXT1JEX01JU1NJTkciLCJ1cGRhdGVQYXNzd29yZCIsInN1Y2Nlc3MiLCJyZXN1bHQiLCJlcnJvciIsInJlc3BvbnNlIiwicGFzc3dvcmRSZXNldFN1Y2Nlc3NVUkwiLCJpbnZhbGlkTGlua1VSTCIsImludmFsaWRWZXJpZmljYXRpb25MaW5rVVJMIiwibWVzc2FnZSIsInNldENvbmZpZyIsIm1vdW50Um91dGVzIiwicm91dGUiLCJleHByZXNzUm91dGVyIiwicm91dGVyIiwiZXhwcmVzcyIsIlJvdXRlciIsInVzZSIsInN0YXRpYyJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7O0FBRUEsTUFBTUEsV0FBVyxHQUFHQyxjQUFLQyxPQUFMLENBQWFDLFNBQWIsRUFBd0IsbUJBQXhCLENBQXBCOztBQUNBLE1BQU1DLEtBQUssR0FBR0gsY0FBS0MsT0FBTCxDQUFhQyxTQUFiLEVBQXdCLGFBQXhCLENBQWQ7O0FBRU8sTUFBTUUsZUFBTixTQUE4QkMsc0JBQTlCLENBQTRDO0FBQ2pEQyxFQUFBQSxXQUFXLENBQUNDLEdBQUQsRUFBTTtBQUNmLFVBQU07QUFBRUMsTUFBQUEsS0FBRjtBQUFTQyxNQUFBQTtBQUFULFFBQXNCRixHQUFHLENBQUNHLEtBQWhDO0FBQ0EsVUFBTUMsS0FBSyxHQUFHSixHQUFHLENBQUNLLE1BQUosQ0FBV0QsS0FBekI7O0FBQ0EsVUFBTUUsTUFBTSxHQUFHQyxnQkFBT0MsR0FBUCxDQUFXSixLQUFYLENBQWY7O0FBRUEsUUFBSSxDQUFDRSxNQUFMLEVBQWE7QUFDWCxXQUFLRyxjQUFMO0FBQ0Q7O0FBRUQsUUFBSSxDQUFDSCxNQUFNLENBQUNJLGVBQVosRUFBNkI7QUFDM0IsYUFBTyxLQUFLQyxzQkFBTCxFQUFQO0FBQ0Q7O0FBRUQsUUFBSSxDQUFDVixLQUFELElBQVUsQ0FBQ0MsUUFBZixFQUF5QjtBQUN2QixhQUFPLEtBQUtVLFdBQUwsQ0FBaUJaLEdBQWpCLENBQVA7QUFDRDs7QUFFRCxVQUFNYSxjQUFjLEdBQUdQLE1BQU0sQ0FBQ08sY0FBOUI7QUFDQSxXQUFPQSxjQUFjLENBQUNkLFdBQWYsQ0FBMkJHLFFBQTNCLEVBQXFDRCxLQUFyQyxFQUE0Q2EsSUFBNUMsQ0FDTCxNQUFNO0FBQ0osWUFBTVQsTUFBTSxHQUFH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QUZGLEVBR0U1RCxHQUFHLElBQUk7QUFDTCxXQUFLMEQsU0FBTCxDQUFlMUQsR0FBZjtBQUNELEtBTEgsRUFNRUEsR0FBRyxJQUFJO0FBQ0wsYUFBTyxLQUFLbUMsb0JBQUwsQ0FBMEJuQyxHQUExQixDQUFQO0FBQ0QsS0FSSDtBQVVEOztBQUVENkQsRUFBQUEsYUFBYSxHQUFHO0FBQ2QsVUFBTUMsTUFBTSxHQUFHQyxpQkFBUUMsTUFBUixFQUFmOztBQUNBRixJQUFBQSxNQUFNLENBQUNHLEdBQVAsQ0FBVyxPQUFYLEVBQW9CRixpQkFBUUcsTUFBUixDQUFlMUUsV0FBZixDQUFwQjtBQUNBc0UsSUFBQUEsTUFBTSxDQUFDRyxHQUFQLENBQVcsR0FBWCxFQUFnQixNQUFNSixhQUFOLEVBQWhCO0FBQ0EsV0FBT0MsTUFBUDtBQUNEOztBQXZUZ0Q7OztlQTBUcENqRSxlIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFByb21pc2VSb3V0ZXIgZnJvbSAnLi4vUHJvbWlzZVJvdXRlcic7XG5pbXBvcnQgQ29uZmlnIGZyb20gJy4uL0NvbmZpZyc7XG5pbXBvcnQgZXhwcmVzcyBmcm9tICdleHByZXNzJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCBxcyBmcm9tICdxdWVyeXN0cmluZyc7XG5pbXBvcnQgeyBQYXJzZSB9IGZyb20gJ3BhcnNlL25vZGUnO1xuXG5jb25zdCBwdWJsaWNfaHRtbCA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi8uLi9wdWJsaWNfaHRtbCcpO1xuY29uc3Qgdmlld3MgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4vLi4vdmlld3MnKTtcblxuZXhwb3J0IGNsYXNzIFB1YmxpY0FQSVJvdXRlciBleHRlbmRzIFByb21pc2VSb3V0ZXIge1xuICB2ZXJpZnlFbWFpbChyZXEpIHtcbiAgICBjb25zdCB7IHRva2VuLCB1c2VybmFtZSB9ID0gcmVxLnF1ZXJ5O1xuICAgIGNvbnN0IGFwcElkID0gcmVxLnBhcmFtcy5hcHBJZDtcbiAgICBjb25zdCBjb25maWcgPSBDb25maWcuZ2V0KGFwcElkKTtcblxuICAgIGlmICghY29uZmlnKSB7XG4gICAgICB0aGlzLmludmFsaWRSZXF1ZXN0KCk7XG4gICAgfVxuXG4gICAgaWYgKCFjb25maWcucHVibGljU2VydmVyVVJMKSB7XG4gICAgICByZXR1cm4gdGhpcy5taXNzaW5nUHVibGljU2VydmVyVVJMKCk7XG4gICAgfVxuXG4gICAgaWYgKCF0b2tlbiB8fCAhdXNlcm5hbWUpIHtcbiAgICAgIHJldHVybiB0aGlzLmludmFsaWRMaW5rKHJlcSk7XG4gICAgfVxuXG4gICAgY29uc3QgdXNlckNvbnRyb2xsZXIgPSBjb25maWcudXNlckNvbnRyb2xsZXI7XG4gICAgcmV0dXJuIHVzZXJDb250cm9sbGVyLnZlcmlmeUVtYWlsKHVzZXJuYW1lLCB0b2tlbikudGhlbihcbiAgICAgICgpID0+IHtcbiAgICAgICAgY29uc3QgcGFyYW1zID0gcXMuc3RyaW5naWZ5KHsgdXNlcm5hbWUgfSk7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xuICAgICAgICAgIHN0YXR1czogMzAyLFxuICAgICAgICAgIGxvY2F0aW9uOiBgJHtjb25maWcudmVyaWZ5RW1haWxTdWNjZXNzVVJMfT8ke3BhcmFtc31gLFxuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgICAoKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmludmFsaWRWZXJpZmljYXRpb25MaW5rKHJlcSk7XG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIHJlc2VuZFZlcmlmaWNhdGlvbkVtYWlsKHJlcSkge1xuICAgIGNvbnN0IHVzZXJuYW1lID0gcmVxLmJvZHkudXNlcm5hbWU7XG4gICAgY29uc3QgYXBwSWQgPSByZXEucGFyYW1zLmFwcElkO1xuICAgIGNvbnN0IGNvbmZpZyA9IENvbmZpZy5nZXQoYXBwSWQpO1xuXG4gICAgaWYgKCFjb25maWcpIHtcbiAgICAgIHRoaXMuaW52YWxpZFJlcXVlc3QoKTtcbiAgICB9XG5cbiAgICBpZiAoIWNvbmZpZy5wdWJsaWNTZXJ2ZXJVUkwpIHtcbiAgICAgIHJldHVybiB0aGlzLm1pc3NpbmdQdWJsaWNTZXJ2ZXJVUkwoKTtcbiAgICB9XG5cbiAgICBpZiAoIXVzZXJuYW1lKSB7XG4gICAgICByZXR1cm4gdGhpcy5pbnZhbGlkTGluayhyZXEpO1xuICAgIH1cblxuICAgIGNvbnN0IHVzZXJDb250cm9sbGVyID0gY29uZmlnLnVzZXJDb250cm9sbGVyO1xuXG4gICAgcmV0dXJuIHVzZXJDb250cm9sbGVyLnJlc2VuZFZlcmlmaWNhdGlvbkVtYWlsKHVzZXJuYW1lKS50aGVuKFxuICAgICAgKCkgPT4ge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgICAgICBzdGF0dXM6IDMwMixcbiAgICAgICAgICBsb2NhdGlvbjogYCR7Y29uZmlnLmxpbmtTZW5kU3VjY2Vzc1VSTH1gLFxuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgICAoKSA9PiB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xuICAgICAgICAgIHN0YXR1czogMzAyLFxuICAgICAgICAgIGxvY2F0aW9uOiBgJHtjb25maWcubGlua1NlbmRGYWlsVVJMfWAsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICk7XG4gIH1cblxuICBjaGFuZ2VQYXNzd29yZChyZXEpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3QgY29uZmlnID0gQ29uZmlnLmdldChyZXEucXVlcnkuaWQpO1xuXG4gICAgICBpZiAoIWNvbmZpZykge1xuICAgICAgICB0aGlzLmludmFsaWRSZXF1ZXN0KCk7XG4gICAgICB9XG5cbiAgICAgIGlmICghY29uZmlnLnB1YmxpY1NlcnZlclVSTCkge1xuICAgICAgICByZXR1cm4gcmVzb2x2ZSh7XG4gICAgICAgICAgc3RhdHVzOiA0MDQsXG4gICAgICAgICAgdGV4dDogJ05vdCBmb3VuZC4nLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIC8vIFNob3VsZCB3ZSBrZWVwIHRoZSBmaWxlIGluIG1lbW9yeSBvciBsZWF2ZSBsaWtlIHRoYXQ/XG4gICAgICBmcy5yZWFkRmlsZShcbiAgICAgICAgcGF0aC5yZXNvbHZlKHZpZXdzLCAnY2hvb3NlX3Bhc3N3b3JkJyksXG4gICAgICAgICd1dGYtOCcsXG4gICAgICAgIChlcnIsIGRhdGEpID0+IHtcbiAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVqZWN0KGVycik7XG4gICAgICAgICAgfVxuICAgICAgICAgIGRhdGEgPSBkYXRhLnJlcGxhY2UoXG4gICAgICAgICAgICAnUEFSU0VfU0VSVkVSX1VSTCcsXG4gICAgICAgICAgICBgJyR7Y29uZmlnLnB1YmxpY1NlcnZlclVSTH0nYFxuICAgICAgICAgICk7XG4gICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICB0ZXh0OiBkYXRhLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICApO1xuICAgIH0pO1xuICB9XG5cbiAgcmVxdWVzdFJlc2V0UGFzc3dvcmQocmVxKSB7XG4gICAgY29uc3QgY29uZmlnID0gcmVxLmNvbmZpZztcblxuICAgIGlmICghY29uZmlnKSB7XG4gICAgICB0aGlzLmludmFsaWRSZXF1ZXN0KCk7XG4gICAgfVxuXG4gICAgaWYgKCFjb25maWcucHVibGljU2VydmVyVVJMKSB7XG4gICAgICByZXR1cm4gdGhpcy5taXNzaW5nUHVibGljU2VydmVyVVJMKCk7XG4gICAgfVxuXG4gICAgY29uc3QgeyB1c2VybmFtZSwgdG9rZW4gfSA9IHJlcS5xdWVyeTtcblxuICAgIGlmICghdXNlcm5hbWUgfHwgIXRva2VuKSB7XG4gICAgICByZXR1cm4gdGhpcy5pbnZhbGlkTGluayhyZXEpO1xuICAgIH1cblxuICAgIHJldHVybiBjb25maWcudXNlckNvbnRyb2xsZXIuY2hlY2tSZXNldFRva2VuVmFsaWRpdHkodXNlcm5hbWUsIHRva2VuKS50aGVuKFxuICAgICAgKCkgPT4ge1xuICAgICAgICBjb25zdCBwYXJhbXMgPSBxcy5zdHJpbmdpZnkoe1xuICAgICAgICAgIHRva2VuLFxuICAgICAgICAgIGlkOiBjb25maWcuYXBwbGljYXRpb25JZCxcbiAgICAgICAgICB1c2VybmFtZSxcbiAgICAgICAgICBhcHA6IGNvbmZpZy5hcHBOYW1lLFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgICAgICAgc3RhdHVzOiAzMDIsXG4gICAgICAgICAgbG9jYXRpb246IGAke2NvbmZpZy5jaG9vc2VQYXNzd29yZFVSTH0/JHtwYXJhbXN9YCxcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgICAgKCkgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5pbnZhbGlkTGluayhyZXEpO1xuICAgICAgfVxuICAgICk7XG4gIH1cblxuICByZXNldFBhc3N3b3JkKHJlcSkge1xuICAgIGNvbnN0IGNvbmZpZyA9IHJlcS5jb25maWc7XG5cbiAgICBpZiAoIWNvbmZpZykge1xuICAgICAgdGhpcy5pbnZhbGlkUmVxdWVzdCgpO1xuICAgIH1cblxuICAgIGlmICghY29uZmlnLnB1YmxpY1NlcnZlclVSTCkge1xuICAgICAgcmV0dXJuIHRoaXMubWlzc2luZ1B1YmxpY1NlcnZlclVSTCgpO1xuICAgIH1cblxuICAgIGNvbnN0IHsgdXNlcm5hbWUsIHRva2VuLCBuZXdfcGFzc3dvcmQgfSA9IHJlcS5ib2R5O1xuXG4gICAgaWYgKCghdXNlcm5hbWUgfHwgIXRva2VuIHx8ICFuZXdfcGFzc3dvcmQpICYmIHJlcS54aHIgPT09IGZhbHNlKSB7XG4gICAgICByZXR1cm4gdGhpcy5pbnZhbGlkTGluayhyZXEpO1xuICAgIH1cblxuICAgIGlmICghdXNlcm5hbWUpIHtcbiAgICAgIHRocm93IG5ldyBQYXJzZS5FcnJvcihQYXJzZS5FcnJvci5VU0VSTkFNRV9NSVNTSU5HLCAnTWlzc2luZyB1c2VybmFtZScpO1xuICAgIH1cblxuICAgIGlmICghdG9rZW4pIHtcbiAgICAgIHRocm93IG5ldyBQYXJzZS5FcnJvcihQYXJzZS5FcnJvci5PVEhFUl9DQVVTRSwgJ01pc3NpbmcgdG9rZW4nKTtcbiAgICB9XG5cbiAgICBpZiAoIW5ld19wYXNzd29yZCkge1xuICAgICAgdGhyb3cgbmV3IFBhcnNlLkVycm9yKFBhcnNlLkVycm9yLlBBU1NXT1JEX01JU1NJTkcsICdNaXNzaW5nIHBhc3N3b3JkJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbmZpZy51c2VyQ29udHJvbGxlclxuICAgICAgLnVwZGF0ZVBhc3N3b3JkKHVzZXJuYW1lLCB0b2tlbiwgbmV3X3Bhc3N3b3JkKVxuICAgICAgLnRoZW4oXG4gICAgICAgICgpID0+IHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGVyciA9PiB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIGVycixcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgKVxuICAgICAgLnRoZW4ocmVzdWx0ID0+IHtcbiAgICAgICAgY29uc3QgcGFyYW1zID0gcXMuc3RyaW5naWZ5KHtcbiAgICAgICAgICB1c2VybmFtZTogdXNlcm5hbWUsXG4gICAgICAgICAgdG9rZW46IHRva2VuLFxuICAgICAgICAgIGlkOiBjb25maWcuYXBwbGljYXRpb25JZCxcbiAgICAgICAgICBlcnJvcjogcmVzdWx0LmVycixcbiAgICAgICAgICBhcHA6IGNvbmZpZy5hcHBOYW1lLFxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAocmVxLnhocikge1xuICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgICAgICAgICAgIHN0YXR1czogMjAwLFxuICAgICAgICAgICAgICByZXNwb25zZTogJ1Bhc3N3b3JkIHN1Y2Nlc3NmdWxseSByZXNldCcsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHJlc3VsdC5lcnIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBQYXJzZS5FcnJvcihQYXJzZS5FcnJvci5PVEhFUl9DQVVTRSwgYCR7cmVzdWx0LmVycn1gKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgICAgICBzdGF0dXM6IDMwMixcbiAgICAgICAgICBsb2NhdGlvbjogYCR7XG4gICAgICAgICAgICByZXN1bHQuc3VjY2Vzc1xuICAgICAgICAgICAgICA/IGAke2NvbmZpZy5wYXNzd29yZFJlc2V0U3VjY2Vzc1VSTH0/dXNlcm5hbWU9JHt1c2VybmFtZX1gXG4gICAgICAgICAgICAgIDogYCR7Y29uZmlnLmNob29zZVBhc3N3b3JkVVJMfT8ke3BhcmFtc31gXG4gICAgICAgICAgfWAsXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gIH1cblxuICBpbnZhbGlkTGluayhyZXEpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgIHN0YXR1czogMzAyLFxuICAgICAgbG9jYXRpb246IHJlcS5jb25maWcuaW52YWxpZExpbmtVUkwsXG4gICAgfSk7XG4gIH1cblxuICBpbnZhbGlkVmVyaWZpY2F0aW9uTGluayhyZXEpIHtcbiAgICBjb25zdCBjb25maWcgPSByZXEuY29uZmlnO1xuICAgIGlmIChyZXEucXVlcnkudXNlcm5hbWUgJiYgcmVxLnBhcmFtcy5hcHBJZCkge1xuICAgICAgY29uc3QgcGFyYW1zID0gcXMuc3RyaW5naWZ5KHtcbiAgICAgICAgdXNlcm5hbWU6IHJlcS5xdWVyeS51c2VybmFtZSxcbiAgICAgICAgYXBwSWQ6IHJlcS5wYXJhbXMuYXBwSWQsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xuICAgICAgICBzdGF0dXM6IDMwMixcbiAgICAgICAgbG9jYXRpb246IGAke2NvbmZpZy5pbnZhbGlkVmVyaWZpY2F0aW9uTGlua1VSTH0/JHtwYXJhbXN9YCxcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5pbnZhbGlkTGluayhyZXEpO1xuICAgIH1cbiAgfVxuXG4gIG1pc3NpbmdQdWJsaWNTZXJ2ZXJVUkwoKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgICB0ZXh0OiAnTm90IGZvdW5kLicsXG4gICAgICBzdGF0dXM6IDQwNCxcbiAgICB9KTtcbiAgfVxuXG4gIGludmFsaWRSZXF1ZXN0KCkge1xuICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKCk7XG4gICAgZXJyb3Iuc3RhdHVzID0gNDAzO1xuICAgIGVycm9yLm1lc3NhZ2UgPSAndW5hdXRob3JpemVkJztcbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxuXG4gIHNldENvbmZpZyhyZXEpIHtcbiAgICByZXEuY29uZmlnID0gQ29uZmlnLmdldChyZXEucGFyYW1zLmFwcElkKTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cblxuICBtb3VudFJvdXRlcygpIHtcbiAgICB0aGlzLnJvdXRlKFxuICAgICAgJ0dFVCcsXG4gICAgICAnL2FwcHMvOmFwcElkL3ZlcmlmeV9lbWFpbCcsXG4gICAgICByZXEgPT4ge1xuICAgICAgICB0aGlzLnNldENvbmZpZyhyZXEpO1xuICAgICAgfSxcbiAgICAgIHJlcSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLnZlcmlmeUVtYWlsKHJlcSk7XG4gICAgICB9XG4gICAgKTtcblxuICAgIHRoaXMucm91dGUoXG4gICAgICAnUE9TVCcsXG4gICAgICAnL2FwcHMvOmFwcElkL3Jlc2VuZF92ZXJpZmljYXRpb25fZW1haWwnLFxuICAgICAgcmVxID0+IHtcbiAgICAgICAgdGhpcy5zZXRDb25maWcocmVxKTtcbiAgICAgIH0sXG4gICAgICByZXEgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5yZXNlbmRWZXJpZmljYXRpb25FbWFpbChyZXEpO1xuICAgICAgfVxuICAgICk7XG5cbiAgICB0aGlzLnJvdXRlKCdHRVQnLCAnL2FwcHMvY2hvb3NlX3Bhc3N3b3JkJywgcmVxID0+IHtcbiAgICAgIHJldHVybiB0aGlzLmNoYW5nZVBhc3N3b3JkKHJlcSk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnJvdXRlKFxuICAgICAgJ1BPU1QnLFxuICAgICAgJy9hcHBzLzphcHBJZC9yZXF1ZXN0X3Bhc3N3b3JkX3Jlc2V0JyxcbiAgICAgIHJlcSA9PiB7XG4gICAgICAgIHRoaXMuc2V0Q29uZmlnKHJlcSk7XG4gICAgICB9LFxuICAgICAgcmVxID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVzZXRQYXNzd29yZChyZXEpO1xuICAgICAgfVxuICAgICk7XG5cbiAgICB0aGlzLnJvdXRlKFxuICAgICAgJ0dFVCcsXG4gICAgICAnL2FwcHMvOmFwcElkL3JlcXVlc3RfcGFzc3dvcmRfcmVzZXQnLFxuICAgICAgcmVxID0+IHtcbiAgICAgICAgdGhpcy5zZXRDb25maWcocmVxKTtcbiAgICAgIH0sXG4gICAgICByZXEgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5yZXF1ZXN0UmVzZXRQYXNzd29yZChyZXEpO1xuICAgICAgfVxuICAgICk7XG4gIH1cblxuICBleHByZXNzUm91dGVyKCkge1xuICAgIGNvbnN0IHJvdXRlciA9IGV4cHJlc3MuUm91dGVyKCk7XG4gICAgcm91dGVyLnVzZSgnL2FwcHMnLCBleHByZXNzLnN0YXRpYyhwdWJsaWNfaHRtbCkpO1xuICAgIHJvdXRlci51c2UoJy8nLCBzdXBlci5leHByZXNzUm91dGVyKCkpO1xuICAgIHJldHVybiByb3V0ZXI7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgUHVibGljQVBJUm91dGVyO1xuIl19