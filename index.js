'use strict';

const BasePlugin = require('ember-cli-deploy-plugin');
const path = require('path');
const execa = require('execa');

module.exports = {
  name: 'ember-cli-deploy-docker',

  createDeployPlugin(options) {
    const DockerBuildPlugin = BasePlugin.extend({
      name: 'docker',
      _execa: options.execa ?? execa,

      async execa(command, args) {
        try {
          this.info(command, ...args);
          return await this._execa(command, args);
        } catch (error) {
          this.error(error);
          throw error;
        }
      },

      defaultConfig: {
        dockerBuildArgs: [],
        dockerfile: 'Dockerfile',
        dockerPushArgs: [],
        tags: ['latest'],
        distDir(context) {
          return `./${context.distDir}/`;
        },
        version(context) {
          return context.project.pkg.version;
        },
      },

      requiredConfig: ['name'],

      runAfter: 'ember-cli-deploy-build',

      info(...messages) {
        this.log(`✔  ${messages.join(' ')}`, { verbose: true });
      },

      error(error) {
        this.log(error, { color: 'red' });
      },

      async upload(context) {
        const root              = context.project.root;
        const distDir           = path.resolve(root, this.readConfig('distDir'));
        const dockerBuildArgs   = this.readConfig('dockerBuildArgs');
        const dockerfile        = path.resolve(root, this.readConfig('dockerfile'));
        const dockerPushArgs    = this.readConfig('dockerPushArgs');
        const name              = this.readConfig('name');
        const tags              = this.readConfig('tags');
        const version           = this.readConfig('version');

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
          await this.execa('docker', buildCommand);
        } catch (error) {
          throw error;
        }

        for (const buildTagCommand of buildTagCommands) {
          try {
            await this.execa('docker', buildTagCommand);
          } catch (error) {
            throw error;
          }
        }

        try {
          await this.execa('docker', pushVersionCommand);
        } catch (error) {
          throw error;
        }

        for (const pushTagCommand of pushTagCommands) {
          try {
            await this.execa('docker', pushTagCommand);
          } catch (error) {
            throw error;
          }
        }
      },
    });

    return new DockerBuildPlugin();
  }
};
