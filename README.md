# Ember CLI Deploy Docker

A `ember-cli-deploy` plugin to build and push a docker image.

## Compatibility

* Ember.js v3.16 or above
* Ember CLI v2.13 or above
* Node.js v10 or above

## Installation

```
ember install @summit-electric-supply/ember-cli-deploy-docker
```

## ember-cli-deploy Hooks Implemented

For detailed information on what plugin hooks are and how they work,
please refer to the [Plugin Documentation](http://ember-cli-deploy.com/docs/v1.0.x/pipeline-hooks/).

* `configure`
* `upload`

## Configuration Options

### distDir

The root directory where the files matching filePattern will be searched for. By default,
this option will use the distDir property of the deployment context,
provided by [ember-cli-deploy-build](https://github.com/ember-cli-deploy/ember-cli-deploy-build).

*Default*: `context.distDir`

### dockerfile

The path to the `Dockerfile`, relative to your application root directory.

*Default:* `Dockerfile`

### dockerBuildArgs

Additional arguments array that will be passed to the `docker build` command.

*Default:* `[]`

### dockerPushArgs

Additional arguments array that will be passed to the `docker push` command.

*Default:* `[]`

### dockerDistDirArg

The argument to pass to `docker build` when building, since `context.distDir` is dynamic. This helps
to resolve where to copy files from within the `Dockerfile` itself.

*Default:* `'distDir'`

### tagAsLatest

When building the image, tag the container as `latest` in addition to it's specific version tag.

*Default:* `true`

### name (`required`)

The docker image repository name.

*Default:* `undefined`

## Contributing

See the [Contributing](CONTRIBUTING.md) guide for details.

## License

This project is licensed under the [MIT License](LICENSE.md).
