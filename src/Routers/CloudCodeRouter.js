import PromiseRouter from '../PromiseRouter';
import Parse from 'parse/node';
import rest from '../rest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const triggers = require('../triggers');
const middleware = require('../middlewares');

function formatJobSchedule(job_schedule) {
  if (typeof job_schedule.startAfter === 'undefined') {
    job_schedule.startAfter = new Date().toISOString();
  }
  return job_schedule;
}

function validateJobSchedule(config, job_schedule) {
  const jobs = triggers.getJobs(config.applicationId) || {};
  if (job_schedule.jobName && !jobs[job_schedule.jobName]) {
    throw new Parse.Error(
      Parse.Error.INTERNAL_SERVER_ERROR,
      'Cannot Schedule a job that is not deployed'
    );
  }
}

export class CloudCodeRouter extends PromiseRouter {
  mountRoutes() {
    this.route(
      'GET',
      '/cloud_code/jobs',
      middleware.promiseEnforceMasterKeyAccess,
      CloudCodeRouter.getJobs
    );
    this.route(
      'GET',
      '/cloud_code/jobs/data',
      middleware.promiseEnforceMasterKeyAccess,
      CloudCodeRouter.getJobsData
    );
    this.route(
      'POST',
      '/cloud_code/jobs',
      middleware.promiseEnforceMasterKeyAccess,
      CloudCodeRouter.createJob
    );
    this.route(
      'PUT',
      '/cloud_code/jobs/:objectId',
      middleware.promiseEnforceMasterKeyAccess,
      CloudCodeRouter.editJob
    );
    this.route(
      'DELETE',
      '/cloud_code/jobs/:objectId',
      middleware.promiseEnforceMasterKeyAccess,
      CloudCodeRouter.deleteJob
    );
    this.route(
      'GET',
      '/releases/latest',
      middleware.promiseEnforceMasterKeyAccess,
      CloudCodeRouter.getCloudCode
    );
    this.route(
      'GET',
      '/cloud_code/*',
      middleware.promiseEnforceMasterKeyAccess,
      CloudCodeRouter.getCloudCodeFile
    );
  }

  static getJobs(req) {
    return rest.find(req.config, req.auth, '_JobSchedule', {}, {}).then(scheduledJobs => {
      return {
        response: scheduledJobs.results,
      };
    });
  }

  static getJobsData(req) {
    const config = req.config;
    const jobs = triggers.getJobs(config.applicationId) || {};
    return rest.find(req.config, req.auth, '_JobSchedule', {}, {}).then(scheduledJobs => {
      return {
        response: {
          in_use: scheduledJobs.results.map(job => job.jobName),
          jobs: Object.keys(jobs),
        },
      };
    });
  }

  static createJob(req) {
    const { job_schedule } = req.body;
    validateJobSchedule(req.config, job_schedule);
    return rest.create(
      req.config,
      req.auth,
      '_JobSchedule',
      formatJobSchedule(job_schedule),
      req.client,
      req.info.context
    );
  }

  static editJob(req) {
    const { objectId } = req.params;
    const { job_schedule } = req.body;
    validateJobSchedule(req.config, job_schedule);
    return rest
      .update(
        req.config,
        req.auth,
        '_JobSchedule',
        { objectId },
        formatJobSchedule(job_schedule),
        undefined,
        req.info.context
      )
      .then(response => {
        return {
          response,
        };
      });
  }

  static deleteJob(req) {
    const { objectId } = req.params;
    return rest
      .del(req.config, req.auth, '_JobSchedule', objectId, req.info.context)
      .then(response => {
        return {
          response,
        };
      });
  }
  static getCloudCode(req) {
    const config = req.config || {};
    const cloudLocation = path.dirname('' + config.cloud);
    var userFiles = {};
    var checksums = {};
    var sources = {}
    let timestamp = 0;

    function dirLoop(dir) {
      fs.readdirSync(dir).forEach(file => {
        const absolute = path.join(dir, file);
        if (fs.statSync(absolute).isDirectory()) return dirLoop(absolute);
        else {
          timestamp = Math.max(fs.statSync(absolute).ctime, timestamp);
          const relative = absolute.replace(cloudLocation + '/', '')
          userFiles[relative] = 1;
          sources[relative] = fs.readFileSync(absolute, 'utf-8');
          checksums[relative] = crypto.createHash('md5').update(sources[relative]).digest('hex');
          return
        }
      });
    }
    dirLoop(cloudLocation);
    return {
      response: [{
        version:1,
        parseVersion:Parse.CoreManager.get('VERSION'),
        timestamp,
        userFiles:JSON.stringify(userFiles),
        checksums:JSON.stringify(checksums),
        sources:JSON.stringify(sources),
      }]
    };
  }

  static getCloudCodeFile(req) {
    const config = req.config || {};
    const cloudLocation = path.dirname('' + config.cloud);
    const file = path.join(cloudLocation, req.params[0]);
    if (!fs.existsSync(file))
      return {status: 404, text: 'Cloud file does not exist.'};
    return {text: fs.readFileSync(file), headers: {'Content-Type': 'plain/text'}};
  }
}
