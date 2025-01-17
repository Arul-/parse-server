import {version} from '../../package.json';
import PromiseRouter from '../PromiseRouter';
import * as middleware from '../middlewares';

export class FeaturesRouter extends PromiseRouter {
  mountRoutes() {
    this.route('GET', '/serverInfo', middleware.promiseEnforceMasterKeyAccess, req => {
      const { config } = req;
      const features = {
        analytics: {
          slowQueries: true,
          performanceAnalysis: true,
          retentionAnalysis: true,
        },
        globalConfig: {
          create: true,
          read: true,
          update: true,
          delete: true,
        },
        hooks: {
          create: true,
          read: true,
          update: true,
          delete: true,
        },
        cloudCode: {
          jobs: true,
          viewCode: !!(config.dashboardOptions || {}).cloudFileView,
        },
        logs: {
          level: true,
          size: true,
          order: true,
          until: true,
          from: true,
        },
        push: {
          immediatePush: config.hasPushSupport,
          scheduledPush: config.hasPushScheduledSupport,
          storedPushData: config.hasPushSupport,
          pushAudiences: true,
          localization: true,
        },
        schemas: {
          addField: true,
          removeField: true,
          addClass: true,
          removeClass: true,
          clearAllDataFromClass: true,
          exportClass: false,
          editClassLevelPermissions: true,
          editPointerPermissions: true,
        },
      };

      return {
        response: {
          features: features,
          parseServerVersion: version,
        },
      };
    });
  }
}
