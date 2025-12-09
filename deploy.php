<?php
namespace Deployer;

require 'recipe/laravel.php';
require 'contrib/npm.php';

set('application', 'Fastcili-ti');
set('repository', 'git@github.com:rafiody16/test-fastcili-ti.git');

set('git_tty', false);
set('git_ssh_command', 'ssh -o StrictHostKeyChecking=no');

set('keep_releases', 5);
set('writable_mode', 'chmod');

add('shared_files', ['.env']);
add('shared_dirs', ['storage']);

add('writable_dirs', [
    "bootstrap/cache",
    "storage",
    "storage/app",
    "storage/framework",
    "storage/logs",
]);

set('composer_options', '--verbose --prefer-dist --no-progress --no-interaction --no-dev --optimize-autoloader');

host('production')
    ->setHostname('fortune.jagoanhosting.id')
    ->set('remote_user', 'fascilit')
    ->set('port', 45022)
    ->set('branch', 'main')
    ->set('deploy_path', '/home/fascilit/public_html')
    ->set('ssh_multiplexing', false)
    ->set('ssh_args', ['-o StrictHostKeyChecking=no', '-o UserKnownHostsFile=/dev/null']);

task('deploy:secrets', function () {
    runLocally('scp -P {{port}} -o StrictHostKeyChecking=no .env {{remote_user}}@{{hostname}}:{{deploy_path}}/shared/.env');
});

task('deploy', [
    'deploy:prepare',
    'deploy:secrets',
    'deploy:vendors',
    'deploy:shared',
    'artisan:storage:link',
    'artisan:queue:restart',
    'deploy:publish',
    'deploy:unlock',
]);

after('deploy:failed', 'deploy:unlock');
