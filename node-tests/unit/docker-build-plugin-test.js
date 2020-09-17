const { exists, MockUI } = require('../test-helper');
const { join } = require('path');
const { mkdir, writeFile } = require('fs/promises');
const rmdir = require('del');
const subject = require('../../index');
const test = require('ava');

function mockExeca(assert) {
  return async function(command, args) {
    const stdout = `${command} ${args.join(' ')}`;

    assert.context.commands.push(command, args);

    if (assert.context.forceExecaError === true) {
      throw new Error(stdout)
    }

    return { stdout };
  }
}

test.beforeEach(async assert => {
  assert.context.commands = [];

  assert.context.forceExecaError = false;

  assert.context.plugin = subject.createDeployPlugin({
    name: 'docker',
    execa: mockExeca(assert),
  });

  assert.context.context = {
    distDir: 'tmp/test-dist',
    distFiles: [
      'assets/foo.js',
      'assets/notjs.notjs',
      'assets/ignore.js'
    ],
    ui: new MockUI(),
    project: {
      root: process.cwd(),
      pkg: {
        version: '1.2.3',
      },
      name() {
        return 'test-project';
      },
    },
    config: {
      docker: {
        name: '@foo-bar/test-project',
        dockerBuildArgs: [],
        dockerDistDirArg: 'distDir',
        dockerfile: 'Dockerfile',
        dockerPushArgs: [],
        tagAsLatest: true,
        distDir(context) {
          return context.distDir;
        },
        distFiles(context) {
          return context.distFiles;
        }
      }
    }
  };

  if (!await exists('tmp')) {
    await mkdir('tmp');
  }

  if (!await exists(assert.context.context.distDir)) {
    await mkdir(assert.context.context.distDir);
  }

  if (!await exists(join(assert.context.context.distDir, 'assets'))) {
    await mkdir(join(assert.context.context.distDir, 'assets'));
  }

  await writeFile(join(assert.context.context.distDir, assert.context.context.distFiles[0]),
    'alert("Hello foo world!");', 'utf8');

  await writeFile(join(assert.context.context.distDir, assert.context.context.distFiles[1]),
    'alert("Hello bar world!");', 'utf8');

  await writeFile(join(assert.context.context.distDir, assert.context.context.distFiles[2]),
    'alert("Hello ignore world!");', 'utf8');

  assert.context.plugin.beforeHook(assert.context.context);
});

test.afterEach(async assert => {
  await rmdir(assert.context.context.distDir);
});

test.serial('commands and messages', async assert => {
  await assert.context.plugin.upload(assert.context.context);

  assert.deepEqual(assert.context.commands, [
    'docker',
    [
      'build',
      '--file',
      'Dockerfile',
      '--build-arg',
      'distDir=tmp/test-dist',
      '-t',
      '@foo-bar/test-project:1.2.3',
      '-t',
      '@foo-bar/test-project:latest',
      process.cwd(),
    ],
    'docker',
    [
      'push',
      '@foo-bar/test-project:1.2.3',
    ],
    'docker',
    [
      'push',
      '@foo-bar/test-project:latest',
    ],
  ]);

  const message1 = [
    '- preparing to run docker build --file Dockerfile --build-arg distDir=tmp/test-dist',
    '-t @foo-bar/test-project:1.2.3 -t @foo-bar/test-project:latest',
    process.cwd(),
  ].join(' ');

  const message2 = [
    '- docker build --file Dockerfile --build-arg distDir=tmp/test-dist',
    '-t @foo-bar/test-project:1.2.3 -t @foo-bar/test-project:latest',
    process.cwd(),
  ].join(' ');

  const message3 = [
    '- preparing to run docker push @foo-bar/test-project:1.2.3',
  ].join(' ');

  const message4 = [
    '- docker push @foo-bar/test-project:1.2.3',
  ].join(' ');

  const message5 = [
    '- preparing to run docker push @foo-bar/test-project:latest',
  ].join(' ');

  const message6 = [
    '- docker push @foo-bar/test-project:latest',
  ].join(' ');

  assert.deepEqual(assert.context.context.ui.messages, [
    message1,
    message2,
    message3,
    message4,
    message5,
    message6,
  ]);
});

test.serial('error handling', async assert => {
  assert.context.forceExecaError = true;

  const error = await assert.throwsAsync(async () => {
    await assert.context.plugin.upload(assert.context.context);
  });

  const message = [
    'docker build --file Dockerfile --build-arg distDir=tmp/test-dist',
    '-t @foo-bar/test-project:1.2.3 -t @foo-bar/test-project:latest',
    process.cwd(),
  ].join(' ');

  assert.is(error.message, message);
});
