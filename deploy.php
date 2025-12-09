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

set('bin/php', function () {
    return '/opt/alt/php83/usr/bin/php';
});

set('bin/composer', function () {
    return '{{bin/php}} /home/fascilit/composer.phar';
});

set('composer_options', '--verbose --prefer-dist --no-progress --no-interaction --no-dev --optimize-autoloader --ignore-platform-reqs');

host('production')
    ->setHostname('fortune.jagoanhosting.id')
    ->set('remote_user', 'fascilit')
    ->set('port', 45022)
    ->set('branch', 'main')
    ->set('deploy_path', '/home/fascilit/public_html')
    ->set('ssh_multiplexing', false)
    ->set('ssh_args', ['-o StrictHostKeyChecking=no', '-o UserKnownHostsFile=/dev/null']);

task('deploy:secrets', function () {

    $envContent = file_get_contents('.env');
    
    $encoded = base64_encode($envContent);

    run('mkdir -p {{deploy_path}}/shared');

    run("echo '$encoded' | base64 -d > {{deploy_path}}/shared/.env");
});

task('permissions', function () {
    run('chmod -R 775 {{release_path}}/storage');
    run('chmod -R 775 {{deploy_path}}/shared/storage');
    run('chmod -R 775 {{release_path}}/public');
});

task('artisan:storage:link', function () {
    run('{{bin/php}} {{release_path}}/artisan storage:link');
});

task('deploy', [
    'deploy:prepare',
    'deploy:secrets',
    'deploy:vendors',
    'deploy:shared',
    'permissions',
    'artisan:storage:link',
    'artisan:queue:restart',
    'deploy:publish',
]);

after('deploy:failed', 'deploy:unlock');
