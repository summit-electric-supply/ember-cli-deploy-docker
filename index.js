'use strict';

const BasePlugin = require('ember-cli-deploy-plugin');
const execa = require('execa');

module.exports = {
  name: 'ember-cli-deploy-docker',

  createDeployPlugin(options) {
    const DockerBuildPlugin = BasePlugin.extend({
      name: 'docker',
      execa: options.execa ?? execa,

      defaultConfig: {
        dockerBuildArgs: [],
        dockerDistDirArg: 'distDir',
        dockerfile: 'Dockerfile',
        dockerPushArgs: [],
        tagAsLatest: true,
        distDir(context) {
          return `./${context.distDir}/`;
        },
      },

      requiredConfig: ['name'],

      runAfter: 'ember-cli-deploy-build',

      async upload(context) {
        const distDir           = this.readConfig('distDir');
        const dockerBuildArgs   = this.readConfig('dockerBuildArgs');
        const dockerDistDirArg  = this.readConfig('dockerDistDirArg');
        const dockerfile        = this.readConfig('dockerfile');
        const dockerPushArgs    = this.readConfig('dockerPushArgs');
        const name              = this.readConfig('name');
        const root              = context.project.root;
        const tagAsLatest       = this.readConfig('tagAsLatest');
        const version           = context.project.pkg.version;
        const tags              = ['-t', `${name}:${version}`];

        if (tagAsLatest) {
          tags.push('-t', `${name}:latest`);
        }

        const buildCommand = [
          'build',
          '--file',
          dockerfile,
          '--build-arg',
          `${dockerDistDirArg}=${distDir}`,
          ...tags,
          ...dockerBuildArgs,
          root,
        ];

        const pushVersionCommand = [
          'push',
          `${name}:${version}`,
          ...dockerPushArgs,
        ];

        const pushLatestCommand = [
          'push',
          `${name}:latest`,
          ...dockerPushArgs,
        ];

        try {
          this.log(`preparing to run docker ${buildCommand.join(' ')}`, { verbose: true });

          const { stdout } = await this.execa('docker', buildCommand);

          this.log(stdout, { verbose: true });
        } catch (exception) {
          this.log(exception.message, { color: 'red' });

          throw exception;
        }

        try {
          this.log(`preparing to run docker ${pushVersionCommand.join(' ')}`, { verbose: true });

          const { stdout } = await this.execa('docker', pushVersionCommand);

          this.log(stdout, { verbose: true });
        } catch (exception) {
          this.log(exception.message, { color: 'red' });

          throw exception;
        }

        if (tagAsLatest) {
          try {
            this.log(`preparing to run docker ${pushLatestCommand.join(' ')}`, { verbose: true });

            const { stdout } = await this.execa('docker', pushLatestCommand);

            this.log(stdout, { verbose: true });
          } catch (exception) {
            this.log(exception.message, { color: 'red' });

            throw exception;
          }
        }
      },
    });

    return new DockerBuildPlugin();
  }
};
