import PromiseRouter from '../PromiseRouter';
import Parse from 'parse/node';
import rest from '../rest';
import fs from 'fs';
import path from 'path';

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
    var cloudFiles = [];

    function dirLoop(dir) {
      fs.readdirSync(dir).forEach(file => {
        const absolute = path.join(dir, file);
        if (fs.statSync(absolute).isDirectory()) return dirLoop(absolute);
        else return cloudFiles.push(absolute);
      });
    }

    dirLoop(cloudLocation);
    return {response: cloudFiles.map(i => i.replace(cloudLocation + '/', ''))};
  }

  static getCloudCodeFile(req) {
    const config = req.config || {};
    const cloudLocation = path.dirname('' + config.cloud);
    return {text: fs.readFileSync(path.join(cloudLocation, 'main.js')), headers: {'Content-Type': 'plain/text'}};
  }
}
