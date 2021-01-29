'use strict';

const BasePlugin = require('ember-cli-deploy-plugin');
const path = require('path');
const execa = require('execa');

module.exports = {
  name: 'ember-cli-deploy-docker',

  createDeployPlugin(options) {
    const DockerBuildPlugin = BasePlugin.extend({
      name: 'docker',
      execa: options.execa ?? execa,

      defaultConfig: {
        dockerBuildArgs: [],
        dockerfile: 'Dockerfile',
        dockerPushArgs: [],
        tags: ['latest'],
        distDir(context) {
          return `./${context.distDir}/`;
        },
      },

      requiredConfig: ['name'],

      runAfter: 'ember-cli-deploy-build',

      async upload(context) {
        const root              = context.project.root;
        const version           = context.project.pkg.version;
        const distDir           = path.resolve(root, this.readConfig('distDir'));
        const dockerBuildArgs   = this.readConfig('dockerBuildArgs');
        const dockerfile        = path.resolve(root, this.readConfig('dockerfile'));
        const dockerPushArgs    = this.readConfig('dockerPushArgs');
        const name              = this.readConfig('name');
        const tags              = this.readConfig('tags');

        const buildCommand = [
          'build',
          '--file',
          dockerfile,
          ...dockerBuildArgs,
          '-t',
          `${name}:${version}`,
          distDir,
        ];

        const buildTagCommands = tags.map(tag => [
          'tag',
          `${name}:${version}`,
          `${name}:${tag}`,
        ]);

        const pushVersionCommand = [
          'push',
          ...dockerPushArgs,
          `${name}:${version}`,
        ];

        const pushTagCommands = tags.map(tag => [
          'push',
          ...dockerPushArgs,
          `${name}:${tag}`,
        ])

        try {
          this.log(`preparing to run docker ${buildCommand.join(' ')}`, { verbose: true });

          const { stdout } = await this.execa('docker', buildCommand);

          this.log(stdout, { verbose: true });
        } catch (exception) {
          this.log(exception.message, { color: 'red' });

          throw exception;
        }

        for (const buildTagCommand of buildTagCommands) {
          try {
            this.log(`preparing to run docker ${buildTagCommand.join(' ')}`, { verbose: true });

            const { stdout } = await this.execa('docker', buildTagCommand);

            this.log(stdout, { verbose: true });
          } catch (exception) {
            this.log(exception.message, { color: 'red' });

            throw exception;
          }
        }

        try {
          this.log(`preparing to run docker ${pushVersionCommand.join(' ')}`, { verbose: true });

          const { stdout } = await this.execa('docker', pushVersionCommand);

          this.log(stdout, { verbose: true });
        } catch (exception) {
          this.log(exception.message, { color: 'red' });

          throw exception;
        }

        for (const pushTagCommand of pushTagCommands) {
          try {
            this.log(`preparing to run docker ${pushTagCommand.join(' ')}`, { verbose: true });

            const { stdout } = await this.execa('docker', pushTagCommand);

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
